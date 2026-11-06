import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { resolve } from "node:path";
import { z } from "zod";
import { createStore, entities, today } from "./store.mjs";
import {
  schemas,
  validateLinks,
  invoiceTotal,
  nextVisitDate,
  customerIdentity,
} from "./schema.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const fail = (message, status = 422) => {
  throw Object.assign(new Error(message), { status });
};
const MAX_BODY = 2 * 1024 * 1024;
async function body(req) {
  let result = "";
  for await (const chunk of req) {
    result += chunk;
    if (Buffer.byteLength(result) > MAX_BODY)
      fail("Request is too large. Maximum 2 MB.", 413);
  }
  try {
    return JSON.parse(result || "{}");
  } catch {
    fail("Invalid JSON.", 400);
  }
}
function dispatchWorkflow(store, trigger, record) {
  const customer = store.get("customers", record.customerId);
  for (const rule of store
    .list("workflows")
    .filter((w) => w.enabled && w.trigger === trigger)) {
    const content = rule.template
      .replaceAll("{{customer}}", customer?.name || "Customer")
      .replaceAll("{{service}}", record.title || "service")
      .replaceAll("{{date}}", record.date || today());
    if (rule.action === "create_task")
      store.insert("tasks", {
        customerId: record.customerId,
        title: content,
        status: "Open",
        createdAt: new Date().toISOString(),
      });
    else
      store.insert("messages", {
        customerId: record.customerId,
        channel: rule.action === "draft_sms" ? "SMS" : "Email",
        direction: "outbound",
        status: "Draft",
        body: content,
        createdAt: new Date().toISOString(),
      });
    store.audit("workflow.executed", "workflows", rule.id);
  }
}
export function createApp(options = {}) {
  const password = options.password ?? process.env.CURRENT_ADMIN_PASSWORD;
  if (password && password.length < 16)
    throw new Error("CURRENT_ADMIN_PASSWORD must be at least 16 characters.");
  const demo = !password;
  const store =
    options.store ||
    createStore(
      process.env.CURRENT_DB || resolve("data/current.sqlite"),
      options.seed ?? demo,
    );
  const salt = randomBytes(32);
  const passwordHash = password ? scryptSync(password, salt, 64) : null;
  if (password) store.db.prepare("DELETE FROM sessions").run();
  const attempts = new Map();
  const secure = process.env.CURRENT_COOKIE_SECURE === "true";
  const handler = async (req, res) => {
    const send = (data, status = 200) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(data));
    };
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "same-origin");
    try {
      const url = new URL(req.url, "http://local");
      const path = url.pathname.replace(/^\/api(?=\/|$)/, "");
      const method = req.method || "GET";
      if (!["GET", "POST", "PATCH"].includes(method))
        return send({ error: "Method not allowed." }, 405);
      if (method !== "GET") {
        if (req.headers["sec-fetch-site"] === "cross-site")
          fail("Cross-site requests are not allowed.", 403);
        const origin = req.headers.origin;
        if (origin) {
          let host;
          try {
            host = new URL(origin).host;
          } catch {
            fail("Invalid request origin.", 403);
          }
          if (host !== req.headers.host)
            fail("Cross-site requests are not allowed.", 403);
        }
        if (!(req.headers["content-type"] || "").startsWith("application/json"))
          fail("Use application/json.", 415);
      }
      const sessionToken = (req.headers.cookie || "").match(
        /(?:^|;\s*)current_session=([a-f0-9]{64})/,
      )?.[1];
      const signedIn =
        demo ||
        !!(
          sessionToken &&
          store.db
            .prepare("SELECT 1 FROM sessions WHERE hash=? AND expires_at>?")
            .get(hash(sessionToken), Date.now())
        );
      if (path === "/session" && method === "GET")
        return send({
          signedIn,
          demo,
          today: today(),
          integrations: {
            sms: false,
            email: false,
            payments: false,
            maps: false,
          },
        });
      if (path === "/login" && method === "POST") {
        if (demo) return send({ signedIn: true, demo: true });
        const key = req.socket.remoteAddress || "local";
        const now = Date.now();
        const attempt = attempts.get(key) || { count: 0, since: now };
        if (now - attempt.since > 900000) {
          attempt.count = 0;
          attempt.since = now;
        }
        if (attempt.count >= 8)
          fail("Too many login attempts. Try again in 15 minutes.", 429);
        attempt.count++;
        attempts.set(key, attempt);
        if (attempts.size > 1000)
          for (const [k, v] of attempts)
            if (now - v.since > 900000) attempts.delete(k);
        const input = z
          .object({ password: z.string().max(1000) })
          .parse(await body(req));
        const check = scryptSync(input.password, salt, 64);
        if (!timingSafeEqual(check, passwordHash))
          fail("The password is incorrect.", 401);
        attempts.delete(key);
        const token = randomBytes(32).toString("hex");
        store.db.prepare("DELETE FROM sessions WHERE expires_at<=?").run(now);
        store.db
          .prepare("INSERT INTO sessions(hash,expires_at) VALUES(?,?)")
          .run(hash(token), now + 43200000);
        res.setHeader(
          "Set-Cookie",
          `current_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure ? "; Secure" : ""}`,
        );
        return send({ signedIn: true, demo: false });
      }
      if (path === "/logout" && method === "POST") {
        if (sessionToken)
          store.db
            .prepare("DELETE FROM sessions WHERE hash=?")
            .run(hash(sessionToken));
        res.setHeader(
          "Set-Cookie",
          `current_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? "; Secure" : ""}`,
        );
        return send({ ok: true });
      }
      if (path.startsWith("/portal/")) {
        const token = path.split("/")[2];
        if (!/^[a-f0-9]{64}$/.test(token))
          fail("This portal link is invalid or expired.", 404);
        const permission = store.db
          .prepare(
            "SELECT customer_id FROM portal_tokens WHERE hash=? AND expires_at>?",
          )
          .get(hash(token), Date.now());
        if (!permission) fail("This portal link is invalid or expired.", 404);
        const customerId = permission.customer_id;
        if (method === "POST" && path === `/portal/${token}/confirm`) {
          const { jobId } = z
            .object({ jobId: z.string().min(1).max(100) })
            .parse(await body(req));
          const job = store.get("jobs", jobId);
          if (!job || job.customerId !== customerId)
            fail("Appointment not found.", 404);
          if (["Completed", "Cancelled"].includes(job.status))
            fail(
              "This appointment is no longer available for confirmation.",
              409,
            );
          const { version, ...data } = job;
          store.transaction(() => {
            store.update(
              "jobs",
              jobId,
              { ...data, confirmation: "Confirmed" },
              version,
            );
            store.audit("portal.appointment_confirmed", "jobs", jobId);
          });
          return send({ ok: true });
        }
        if (method === "POST" && path.endsWith("/request")) {
          const { message } = z
            .object({ message: z.string().trim().min(5).max(3000) })
            .parse(await body(req));
          store.insert("messages", {
            customerId,
            channel: "Portal",
            direction: "inbound",
            status: "Received",
            body: message,
            createdAt: new Date().toISOString(),
          });
          return send({ ok: true }, 201);
        }
        if (method !== "GET") fail("Not found.", 404);
        const customer = store.get("customers", customerId);
        return send({
          customer: {
            name: customer.name,
            tubs: customer.tubs.map((t) => ({ model: t.model })),
          },
          jobs: store
            .list("jobs")
            .filter((j) => j.customerId === customerId)
            .map((j) => ({
              id: j.id,
              title: j.title,
              date: j.date,
              start: j.start,
              duration: j.duration,
              status: j.status,
              confirmation: j.confirmation,
            })),
          invoices: store
            .list("invoices")
            .filter((i) => i.customerId === customerId && i.status !== "Draft")
            .map((i) => ({
              id: i.id,
              number: i.number,
              status: i.status,
              dueDate: i.dueDate,
              totalCents: invoiceTotal(i),
            })),
          readings: store
            .list("readings")
            .filter((r) => r.customerId === customerId)
            .map((r) => ({
              date: r.date,
              ph: r.ph,
              chlorine: r.chlorine,
              alkalinity: r.alkalinity,
              temperature: r.temperature,
            })),
          paymentsConnected: false,
        });
      }
      if (!signedIn) fail("Sign in to continue.", 401);
      if (path === "/data" && method === "GET")
        return send(
          Object.fromEntries(entities.map((e) => [e, store.list(e)])),
        );
      if (path === "/audit" && method === "GET")
        return send(
          store.db
            .prepare("SELECT * FROM audit ORDER BY id DESC LIMIT 100")
            .all(),
        );
      if (path === "/export" && method === "GET")
        return send({
          exportedAt: new Date().toISOString(),
          formatVersion: 1,
          ...Object.fromEntries(entities.map((e) => [e, store.list(e)])),
        });
      if (path === "/import/customers" && method === "POST") {
        const { rows } = z
          .object({ rows: z.array(schemas.customers).min(1).max(1000) })
          .parse(await body(req));
        const seen = new Set(
          store
            .list("customers")
            .filter((c) => c.email)
            .map((c) => c.email.toLowerCase()),
        );
        const identities = new Set(
          store.list("customers").map(customerIdentity).filter(Boolean),
        );
        const duplicates = [];
        for (const [i, row] of rows.entries()) {
          let duplicate = false;
          if (row.email) {
            const key = row.email.toLowerCase();
            if (seen.has(key)) duplicate = true;
            seen.add(key);
          }
          const identity = customerIdentity(row);
          if (identity) {
            if (identities.has(identity)) duplicate = true;
            identities.add(identity);
          }
          if (duplicate) duplicates.push(i + 1);
        }
        if (duplicates.length)
          fail(
            `Duplicate customer in row(s) ${duplicates.slice(0, 20).join(", ")}. Review matching emails or name/address pairs before importing.`,
            409,
          );
        const result = store.transaction(() => {
          const records = rows.map((r) => store.insert("customers", r));
          store.audit("customers.imported", "customers");
          return records;
        });
        return send({ imported: result.length }, 201);
      }
      const parts = path.split("/").filter(Boolean);
      if (
        parts[0] === "customers" &&
        parts[2] === "portal" &&
        method === "POST"
      ) {
        if (!store.get("customers", parts[1])) fail("Customer not found.", 404);
        const token = randomBytes(32).toString("hex");
        store.db
          .prepare("DELETE FROM portal_tokens WHERE customer_id=?")
          .run(parts[1]);
        store.db
          .prepare(
            "INSERT INTO portal_tokens(hash,customer_id,expires_at) VALUES(?,?,?)",
          )
          .run(hash(token), parts[1], Date.now() + 604800000);
        store.audit("portal.link_created", "customers", parts[1]);
        return send({
          path: `/portal/${token}`,
          expiresAt: new Date(Date.now() + 604800000).toISOString(),
        });
      }
      if (
        parts[0] === "workflows" &&
        parts[2] === "preview" &&
        method === "POST"
      ) {
        const rule = store.get("workflows", parts[1]);
        if (!rule) fail("Workflow not found.", 404);
        return send({
          preview: rule.template
            .replaceAll("{{customer}}", "Marissa Cole")
            .replaceAll("{{service}}", "weekly spa care")
            .replaceAll("{{date}}", today()),
          action: rule.action,
          note: "Preview only. No message was sent.",
        });
      }
      if (parts[0] === "messages" && parts[2] === "send" && method === "POST")
        fail("Messaging is not connected. This message remains a draft.", 503);
      const entity = parts[0];
      const recordId = parts[1];
      if (!entities.includes(entity) || parts.length > 2)
        fail("Not found.", 404);
      if (method === "POST" && !recordId) {
        const data = schemas[entity].parse(await body(req));
        validateLinks(store, entity, data);
        if (
          entity === "messages" &&
          (data.direction !== "outbound" || data.status !== "Draft")
        )
          fail("Only outgoing drafts can be created here.");
        if (entity === "jobs" && data.status === "Completed")
          fail("Create the job first, then complete its checklist.");
        if (entity === "invoices" && data.status === "Paid")
          fail("Create an invoice before recording payment.");
        if (entity === "invoices") {
          const last = store
            .list("invoices")
            .map((i) => Number(i.number.replace("INV-", "")) || 1000);
          data.number = `INV-${Math.max(1000, ...last) + 1}`;
        }
        const record = store.transaction(() => {
          const r = store.insert(entity, data);
          store.audit("created", entity, r.id);
          if (entity === "jobs") dispatchWorkflow(store, "job.created", r);
          if (entity === "invoices")
            dispatchWorkflow(store, "invoice.created", r);
          return r;
        });
        return send(record, 201);
      }
      if (method === "PATCH" && recordId) {
        const previous = store.get(entity, recordId);
        if (!previous) fail("Record not found.", 404);
        const input = await body(req);
        const version = z.number().int().positive().parse(input.version);
        const { version: _, id: __, ...old } = previous;
        const patch = schemas[entity]
          .partial()
          .strict()
          .parse(
            Object.fromEntries(
              Object.entries(input).filter(([k]) => k !== "version"),
            ),
          );
        const data = schemas[entity].parse({ ...old, ...patch });
        validateLinks(store, entity, data, recordId);
        if (
          entity === "jobs" &&
          previous.status === "Completed" &&
          JSON.stringify(data) !== JSON.stringify(schemas.jobs.parse(old))
        )
          fail(
            "Completed visits are locked to preserve service and stock history. Create a follow-up job.",
          );
        if (entity === "invoices" && previous.status === "Paid")
          fail("Paid invoices are locked. Use a separate adjustment process.");
        if (
          entity === "invoices" &&
          data.status === "Paid" &&
          (!data.paymentReference || data.paymentReference.trim().length < 5)
        )
          fail("Add a reference for the payment recorded outside Current.");
        if (
          entity === "messages" &&
          (data.status !== "Draft" || data.direction !== "outbound")
        )
          fail("Received messages are read-only.");
        const record = store.transaction(() => {
          if (
            entity === "jobs" &&
            data.status === "Completed" &&
            previous.status !== "Completed"
          ) {
            if (!data.checklist.every(Boolean))
              fail(
                "Finish all three checklist items before completing the visit.",
              );
            const quantities = new Map();
            for (const part of data.partsUsed)
              quantities.set(
                part.inventoryId,
                (quantities.get(part.inventoryId) || 0) + part.quantity,
              );
            for (const [id, quantity] of quantities) {
              const item = store.get("inventory", id);
              if (!item || item.stock < quantity)
                fail("Not enough inventory to complete this visit.", 409);
              const { version: v, ...p } = item;
              store.update(
                "inventory",
                id,
                { ...p, stock: p.stock - quantity },
                v,
              );
            }
          }
          const r = store.update(entity, recordId, data, version);
          store.audit("updated", entity, recordId);
          if (
            entity === "jobs" &&
            data.status === "Completed" &&
            previous.status !== "Completed"
          )
            dispatchWorkflow(store, "job.completed", r);
          if (
            entity === "jobs" &&
            data.status === "Completed" &&
            previous.status !== "Completed"
          ) {
            const next = nextVisitDate(data.date, data.recurrence);
            if (next) {
              const nextJob = store.insert("jobs", {
                ...data,
                id: undefined,
                date: next,
                crew: "unassigned",
                status: "Unassigned",
                confirmation: "Pending",
                checklist: [false, false, false],
                partsUsed: [],
                notes: "",
              });
              store.audit("recurring_visit.created", "jobs", nextJob.id);
              dispatchWorkflow(store, "job.created", nextJob);
            }
          }
          return r;
        });
        return send(record);
      }
      fail("Not found.", 404);
    } catch (error) {
      if (error instanceof z.ZodError)
        return send(
          {
            error: error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; "),
          },
          422,
        );
      if (error.status) return send({ error: error.message }, error.status);
      console.error("Current request failed:", error.name);
      return send(
        { error: "Something went wrong. Your change was not saved." },
        500,
      );
    }
  };
  handler.store = store;
  handler.demo = demo;
  return handler;
}
