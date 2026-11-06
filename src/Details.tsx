import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle,
  ClipboardText,
  Drop,
  EnvelopeSimple,
  NotePencil,
  Plus,
  WarningCircle,
  Wrench,
  LinkSimple,
  Flask,
  Receipt,
} from "@phosphor-icons/react";
import { Button, Drawer, Empty, Status, Table, Badge } from "./ui";
import { money, time, dateLabel, invoiceTotal } from "./types";
import type { Context, Row } from "./types";
import { customerForm, jobForm, readingForm, invoiceForm } from "./forms";
import { api } from "./api";

export function JobDetail({
  ctx,
  jobId,
  onClose,
}: {
  ctx: Context;
  jobId: string;
  onClose: () => void;
}) {
  const job = ctx.data.jobs.find((j) => j.id === jobId)!;
  const customer = ctx.data.customers.find((c) => c.id === job.customerId)!;
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(job.checklist);
  const [notes, setNotes] = useState(job.notes);
  const [part, setPart] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [parts, setParts] = useState<
    { inventoryId: string; quantity: number }[]
  >(job.partsUsed);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const locked = job.status === "Completed" || job.status === "Cancelled";
  const save = async (changes: Record<string, any>) => {
    setBusy(true);
    setError("");
    try {
      await ctx.save(
        "jobs",
        { ...job, checklist: checks, notes, partsUsed: parts, ...changes },
        job,
      );
      ctx.notify(
        changes.status === "Completed"
          ? "Visit completed. Service history and stock updated."
          : "Work order saved.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const invoice = ctx.data.invoices.find((i) => i.jobId === job.id);
  return (
    <Drawer title={customer.name} sub={job.title} onClose={onClose} wide>
      <div className="detail-body">
        <div className="detail-status">
          <Status value={job.status} />
          <Badge tone={job.type === "Repair" ? "lilac" : "mint"}>
            {job.type}
          </Badge>
          <span className="spacer" />
          <span className="muted">WO-{job.id.slice(-5).toUpperCase()}</span>
        </div>
        <div className="job-summary">
          <div>
            <span className="eyebrow">APPOINTMENT</span>
            <strong>{dateLabel(job.date, true)}</strong>
            <p>
              {time(job.start)} – {time(job.start + job.duration)}
            </p>
          </div>
          <div>
            <span className="eyebrow">SERVICE PRICE</span>
            <strong>{money(job.priceCents)}</strong>
            <p>
              {job.recurrence === "None"
                ? "One-time visit"
                : `${job.recurrence} service`}
            </p>
          </div>
        </div>
        <dl className="detail-facts">
          <div>
            <dt>Service address</dt>
            <dd>{customer.address}</dd>
          </div>
          <div>
            <dt>Hot tub</dt>
            <dd>
              {customer.tubs.find((t: any) => t.id === job.tubId)?.model ||
                customer.tubs[0]?.model ||
                "Not recorded"}
            </dd>
          </div>
          <div>
            <dt>Access instructions</dt>
            <dd>{customer.access || "None recorded"}</dd>
          </div>
          <div>
            <dt>Confirmation</dt>
            <dd>
              <Status value={job.confirmation} />
            </dd>
          </div>
        </dl>
        <div className="inline-actions">
          <Button onClick={() => ctx.edit(jobForm(ctx, job))} disabled={locked}>
            <NotePencil />
            Edit / reschedule
          </Button>
          <Button onClick={() => ctx.openCustomer(customer)}>
            Customer history
            <ArrowUpRight />
          </Button>
        </div>
        <div className="detail-section">
          <h3>
            <ClipboardText size={19} />
            Visit checklist
          </h3>
          {[
            "Inspect tub, cover, and equipment",
            "Complete service and check water quality",
            "Leave area clean and record visit notes",
          ].map((text, i) => (
            <label className="checklist-item" key={text}>
              <input
                type="checkbox"
                checked={checks[i]}
                disabled={locked}
                onChange={(e) =>
                  setChecks(
                    checks.map((v, n) => (n === i ? e.target.checked : v)),
                  )
                }
              />
              <span>{text}</span>
            </label>
          ))}
        </div>
        <div className="detail-section">
          <div className="section-title">
            <h3>
              <Flask size={19} />
              Water care
            </h3>
            <div className="spacer" />
            <button
              className="text-button"
              onClick={() => ctx.edit(readingForm(ctx, job))}
            >
              Log test
              <Plus />
            </button>
          </div>
          {ctx.data.readings.filter((r) => r.jobId === job.id).length ? (
            ctx.data.readings
              .filter((r) => r.jobId === job.id)
              .map((r) => (
                <div className="reading-strip" key={r.id}>
                  <div>
                    <small>pH</small>
                    <b>{r.ph}</b>
                  </div>
                  <div>
                    <small>Chlorine</small>
                    <b>
                      {r.chlorine} <small>ppm</small>
                    </b>
                  </div>
                  <div>
                    <small>Alkalinity</small>
                    <b>
                      {r.alkalinity} <small>ppm</small>
                    </b>
                  </div>
                  <div>
                    <small>Temperature</small>
                    <b>{r.temperature}°F</b>
                  </div>
                </div>
              ))
          ) : (
            <p className="muted">No water test logged for this visit.</p>
          )}
        </div>
        <div className="detail-section">
          <h3>
            <Wrench size={19} />
            Parts & chemicals used
          </h3>
          {parts.map((p, i) => (
            <div className="parts-row" key={i}>
              <span>
                {
                  ctx.data.inventory.find((item) => item.id === p.inventoryId)
                    ?.name
                }
              </span>
              <Badge>×{p.quantity}</Badge>
              {!locked && (
                <button
                  className="text-button"
                  onClick={() => setParts(parts.filter((_, n) => n !== i))}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {!locked && (
            <div className="parts-add">
              <select
                aria-label="Inventory item used"
                value={part}
                onChange={(e) => setPart(e.target.value)}
              >
                <option value="">Choose an item…</option>
                {ctx.data.inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.stock} on hand)
                  </option>
                ))}
              </select>
              <input
                aria-label="Quantity used"
                type="number"
                min={1}
                max={999}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <Button
                disabled={!part || quantity < 1 || !Number.isInteger(quantity)}
                onClick={() => {
                  setParts([...parts, { inventoryId: part, quantity }]);
                  setPart("");
                  setQuantity(1);
                }}
              >
                Add
              </Button>
            </div>
          )}
          <small className="muted">
            Stock is deducted once when the visit is completed.
          </small>
        </div>
        <label className="field">
          <span>Visit notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={locked}
            placeholder="What did you find? What did you do?"
          />
        </label>
        {error && (
          <div className="error-box" role="alert">
            <WarningCircle />
            {error}
          </div>
        )}
        <div className="detail-section">
          <h3>
            <Receipt size={19} />
            Billing
          </h3>
          {invoice ? (
            <div className="invoice-link">
              <span>
                {invoice.number} · {money(invoiceTotal(invoice))}
              </span>
              <Status value={invoice.status} />
            </div>
          ) : (
            <Button onClick={() => ctx.edit(invoiceForm(ctx, job))}>
              Create invoice
              <Plus />
            </Button>
          )}
        </div>
        {!locked && (
          <div className="cancel-visit">
            {confirmCancel ? (
              <div className="info-note">
                <span>
                  Cancel this visit? It will leave the active schedule. Any
                  existing invoice stays on file.
                </span>
                <Button onClick={() => setConfirmCancel(false)}>
                  Keep visit
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => void save({ status: "Cancelled" })}
                >
                  Cancel visit
                </Button>
              </div>
            ) : (
              <button
                className="text-button"
                onClick={() => setConfirmCancel(true)}
              >
                Cancel this visit
              </button>
            )}
          </div>
        )}
        {!locked && (
          <div className="sticky-actions">
            <Button disabled={busy} onClick={() => void save({})}>
              Save progress
            </Button>
            {job.status !== "On site" && (
              <Button
                disabled={busy || job.crew === "unassigned"}
                onClick={() => void save({ status: "On site" })}
              >
                Start visit
              </Button>
            )}
            <Button
              primary
              disabled={busy || !checks.every(Boolean)}
              onClick={() => void save({ status: "Completed" })}
            >
              {busy ? "Saving…" : "Complete visit"}
              <CheckCircle />
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export function CustomerDetail({
  ctx,
  customerId,
  onClose,
}: {
  ctx: Context;
  customerId: string;
  onClose: () => void;
}) {
  const c = ctx.data.customers.find((c) => c.id === customerId)!;
  const jobs = ctx.data.jobs.filter((j) => j.customerId === c.id);
  const [portal, setPortal] = useState("");
  const [busy, setBusy] = useState(false);
  const link = async () => {
    setBusy(true);
    try {
      const result = await api(`/customers/${c.id}/portal`, "POST", {});
      setPortal(location.origin + result.path);
      ctx.notify("Private portal link created. It expires in seven days.");
    } catch (e) {
      ctx.notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Drawer title={c.name} sub={c.plan} onClose={onClose} wide>
      <div className="detail-body">
        <div className="contact-card">
          <span className="customer-avatar large">
            {c.name
              .split(" ")
              .map((p: string) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <a href={`mailto:${c.email}`}>{c.email || "No email recorded"}</a>
            <p>{c.phone || "No phone recorded"}</p>
            <span>{c.address}</span>
          </div>
        </div>
        <div className="inline-actions">
          <Button onClick={() => ctx.edit(customerForm(c))}>
            <NotePencil />
            Edit customer
          </Button>
          <Button
            primary
            onClick={() => {
              const f = jobForm(ctx);
              f.values.customerId = c.id;
              ctx.edit(f);
            }}
          >
            <Plus />
            Schedule visit
          </Button>
        </div>
        <dl className="detail-facts">
          <div>
            <dt>SMS consent</dt>
            <dd>
              <Badge tone={c.smsConsent ? "mint" : "amber"}>
                {c.smsConsent ? "Recorded" : "Not recorded"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>{c.access || "None recorded"}</dd>
          </div>
          <div>
            <dt>Office notes</dt>
            <dd>{c.notes || "None"}</dd>
          </div>
        </dl>
        <div className="detail-section">
          <div className="section-title">
            <h3>
              <Drop />
              Hot tubs & equipment
            </h3>
            <div className="spacer" />
            <button
              className="text-button"
              onClick={() => {
                ctx.edit({
                  title: "Add a hot tub",
                  entity: "customers",
                  record: c,
                  values: {
                    model: "",
                    serial: "",
                    gallons: 400,
                    warrantyUntil: "",
                  },
                  fields: [
                    { key: "model", label: "Make / model", required: true },
                    { key: "serial", label: "Serial number" },
                    {
                      key: "gallons",
                      label: "Capacity (gallons)",
                      type: "number",
                      min: 1,
                      max: 10000,
                      required: true,
                    },
                    {
                      key: "warrantyUntil",
                      label: "Warranty expires",
                      type: "date",
                    },
                  ],
                });
              }}
            >
              Add tub
              <Plus />
            </button>
          </div>
          {c.tubs.length ? (
            c.tubs.map((t: any) => (
              <div className="equipment-row" key={t.id}>
                <span className="service-icon cleaning">
                  <Drop size={24} />
                </span>
                <div>
                  <strong>{t.model}</strong>
                  <small>
                    {t.gallons} gallons · Serial {t.serial || "not recorded"}
                  </small>
                  <small>
                    Warranty{" "}
                    {t.warrantyUntil
                      ? dateLabel(t.warrantyUntil, true)
                      : "not recorded"}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">
              No tubs recorded. Add one to start an equipment history.
            </p>
          )}
        </div>
        <div className="detail-section">
          <h3>
            <CalendarIcon />
            Service history
          </h3>
          {jobs.length ? (
            jobs
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((j) => (
                <button
                  className="history-row"
                  key={j.id}
                  onClick={() => ctx.openJob(j)}
                >
                  <div>
                    <strong>{j.title}</strong>
                    <small>
                      {dateLabel(j.date, true)} · {time(j.start)}
                    </small>
                  </div>
                  <Status value={j.status} />
                  <ArrowUpRight />
                </button>
              ))
          ) : (
            <p className="muted">No visits yet.</p>
          )}
        </div>
        <div className="detail-section">
          <h3>
            <LinkSimple />
            Client portal
          </h3>
          <p className="muted">
            A customer-specific view of appointments, service readings, and
            non-draft invoices. Creating a new link revokes the previous link.
          </p>
          <Button onClick={() => void link()} disabled={busy}>
            {busy ? "Creating…" : "Create private portal link"}
            <ArrowUpRight />
          </Button>
          {portal && (
            <div className="portal-link">
              <input
                aria-label="Private customer portal link"
                readOnly
                value={portal}
              />
              <a
                href={portal}
                target="_blank"
                rel="noreferrer"
                className="button"
              >
                Open
              </a>
              <Button
                onClick={() => {
                  void navigator.clipboard
                    .writeText(portal)
                    .then(() => ctx.notify("Portal link copied."))
                    .catch(() =>
                      ctx.notify("Select and copy the link above.", true),
                    );
                }}
              >
                Copy
              </Button>
              <small>
                Keep this link private. Anyone with it can view this customer’s
                portal.
              </small>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
function CalendarIcon() {
  return <ClipboardText size={19} />;
}
