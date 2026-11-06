import { useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  ArrowsClockwise,
  CheckCircle,
  CaretRight,
  DownloadSimple,
  Drop,
  EnvelopeSimple,
  Flask,
  Lightning,
  LinkSimple,
  Package,
  Plus,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  WarningCircle,
  Wrench,
  UsersThree,
  FlowArrow,
  Clock,
  PaperPlaneTilt,
  Copy,
  TrendUp,
  SealCheck,
  Database,
  LockKey,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  CreateButton,
  Drawer,
  Empty,
  Heading,
  MetricStrip,
  SearchInput,
  SectionTitle,
  Status,
  Table,
} from "./ui";
import {
  customerForm,
  inventoryForm,
  readingForm,
  salesForm,
  workflowForm,
  invoiceForm,
  jobForm,
  options,
} from "./forms";
import { invoiceTotal, match, money, dateLabel, time, crews } from "./types";
import type { Context, Row, Page } from "./types";
import { api } from "./api";
import { Routes } from "./Dispatch";
import { ImportCenter } from "./ImportCenter";

export function Pages({ ctx, page }: { ctx: Context; page: Page }) {
  if (page === "Customers") return <Customers ctx={ctx} />;
  if (page === "Work orders") return <WorkOrders ctx={ctx} />;
  if (page === "Routes")
    return (
      <>
        <Heading
          title="Routes"
          sub="The right crew. The next stop. A smoother day."
          action={
            <CreateButton onClick={() => ctx.edit(jobForm(ctx))}>
              Schedule job
            </CreateButton>
          }
        />
        <Routes ctx={ctx} />
      </>
    );
  if (page === "Water care") return <WaterCare ctx={ctx} />;
  if (page === "Sales") return <Sales ctx={ctx} />;
  if (page === "Inventory") return <Inventory ctx={ctx} />;
  if (page === "Billing") return <Billing ctx={ctx} />;
  if (page === "Inbox") return <Inbox ctx={ctx} />;
  if (page === "Workflows") return <Workflows ctx={ctx} />;
  if (page === "Import center") return <ImportCenter ctx={ctx} />;
  if (page === "Portal") return <PortalManager ctx={ctx} />;
  if (page === "Reports") return <Reports ctx={ctx} />;
  return <Settings ctx={ctx} />;
}
function Customers({ ctx }: { ctx: Context }) {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("All plans");
  const [sort, setSort] = useState("name");
  const rows = ctx.data.customers
    .filter(
      (c) =>
        match(c, query + " " + ctx.search) &&
        (plan === "All plans" || c.plan === plan),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : a.plan.localeCompare(b.plan),
    );
  return (
    <>
      <Heading
        title="Customers"
        sub="The people, properties, and spas you take care of."
        action={
          <CreateButton onClick={() => ctx.edit(customerForm())}>
            New customer
          </CreateButton>
        }
      />
      <MetricStrip
        items={[
          { label: "CUSTOMERS", value: ctx.data.customers.length },
          {
            label: "RECURRING CARE",
            value: ctx.data.customers.filter((c) => c.plan !== "On demand")
              .length,
          },
          {
            label: "HOT TUBS ON FILE",
            value: ctx.data.customers.reduce((n, c) => n + c.tubs.length, 0),
          },
        ]}
      />
      <section className="panel">
        <div className="table-toolbar">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Find a customer…"
          />
          <div className="spacer" />
          <select
            aria-label="Filter service plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            {["All plans", "Weekly care", "Monthly care", "On demand"].map(
              (p) => (
                <option key={p}>{p}</option>
              ),
            )}
          </select>
          <Button onClick={() => setSort(sort === "name" ? "plan" : "name")}>
            <ArrowDown size={15} />
            Sort by {sort}
          </Button>
        </div>
        {rows.length ? (
          <Table
            headers={[
              "Customer",
              "Contact",
              "Service address",
              "Plan",
              "Hot tubs",
              "",
            ]}
          >
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <button
                    className="customer-name"
                    onClick={() => ctx.openCustomer(c)}
                  >
                    <span className="customer-avatar">
                      {c.name
                        .split(" ")
                        .map((p: string) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <strong>{c.name}</strong>
                  </button>
                </td>
                <td>
                  <span>{c.email || "—"}</span>
                  <small>{c.phone}</small>
                </td>
                <td className="address-cell">{c.address || "—"}</td>
                <td>
                  <Badge tone={c.plan === "On demand" ? "" : "blue"}>
                    {c.plan}
                  </Badge>
                </td>
                <td>{c.tubs.length}</td>
                <td>
                  <button
                    className="text-button"
                    aria-label={`Open ${c.name}`}
                    onClick={() => ctx.openCustomer(c)}
                  >
                    <ArrowUpRight />
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="No matching customers"
            text="Try a different search or add a customer."
          />
        )}
        <div className="table-footer">
          {rows.length} customers <div className="spacer" />
          <button
            className="text-button"
            onClick={() => ctx.navigate("Import center")}
          >
            Bring your customer list
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </>
  );
}
function WorkOrders({ ctx }: { ctx: Context }) {
  const [filter, setFilter] = useState("All work");
  const jobs = ctx.data.jobs
    .filter(
      (j) =>
        (filter === "All work" || j.status === filter) &&
        match(
          {
            ...j,
            customer: ctx.data.customers.find((c) => c.id === j.customerId)
              ?.name,
          },
          ctx.search,
        ),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  return (
    <>
      <Heading
        title="Work orders"
        sub="Every visit, every repair, every detail."
        action={
          <CreateButton onClick={() => ctx.edit(jobForm(ctx))}>
            New work order
          </CreateButton>
        }
      />
      <div className="tabs">
        {[
          "All work",
          "Unassigned",
          "Scheduled",
          "On site",
          "Completed",
          "Cancelled",
        ].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
            <Badge>
              {f === "All work"
                ? ctx.data.jobs.length
                : ctx.data.jobs.filter((j) => j.status === f).length}
            </Badge>
          </button>
        ))}
      </div>
      <section className="panel">
        {jobs.length ? (
          <Table
            headers={[
              "Work order",
              "Customer",
              "Visit",
              "Crew",
              "Status",
              "Value",
              "",
            ]}
          >
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>
                  <button className="table-link" onClick={() => ctx.openJob(j)}>
                    {j.title}
                  </button>
                  <small>
                    {j.type} ·{" "}
                    {j.recurrence === "None" ? "One-time" : j.recurrence}
                  </small>
                </td>
                <td>
                  {ctx.data.customers.find((c) => c.id === j.customerId)?.name}
                </td>
                <td>
                  {dateLabel(j.date, true)}
                  <small>
                    {time(j.start)} · {j.duration} min
                  </small>
                </td>
                <td>
                  {crews.find((c) => c.id === j.crew)?.name || "Unassigned"}
                </td>
                <td>
                  <Status value={j.status} />
                </td>
                <td>{money(j.priceCents)}</td>
                <td>
                  <button
                    className="text-button"
                    onClick={() => ctx.openJob(j)}
                    aria-label={`Open ${j.title}`}
                  >
                    <ArrowUpRight />
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="No work orders here"
            text="Change your filter or schedule a job."
          />
        )}
      </section>
    </>
  );
}
function Inventory({ ctx }: { ctx: Context }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All stock");
  const [low, setLow] = useState(false);
  const rows = ctx.data.inventory.filter(
    (p) =>
      match(p, query + " " + ctx.search) &&
      (category === "All stock" || p.category === category) &&
      (!low || p.stock <= p.reorderAt),
  );
  return (
    <>
      <Heading
        title="Inventory"
        sub="From the showroom floor to the back of the service van."
        action={
          <CreateButton onClick={() => ctx.edit(inventoryForm())}>
            Add item
          </CreateButton>
        }
      />
      <MetricStrip
        items={[
          {
            label: "STOCK VALUE AT COST",
            value: money(
              ctx.data.inventory.reduce((n, p) => n + p.stock * p.costCents, 0),
            ),
          },
          {
            label: "LOW STOCK",
            value: ctx.data.inventory.filter((p) => p.stock <= p.reorderAt)
              .length,
            detail: "At or below reorder point",
          },
          {
            label: "TUBS IN STOCK",
            value: ctx.data.inventory
              .filter((p) => p.category === "Hot tubs")
              .reduce((n, p) => n + p.stock, 0),
          },
        ]}
      />
      <section className="panel">
        <div className="table-toolbar">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search name or SKU…"
          />
          <div className="spacer" />
          <select
            aria-label="Inventory category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {[
              "All stock",
              "Chemicals",
              "Filters",
              "Parts",
              "Hot tubs",
              "Water testing",
              "Accessories",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            className={`button ${low ? "selected-button" : ""}`}
            onClick={() => setLow(!low)}
          >
            <WarningCircle />
            Low stock
          </button>
        </div>
        <Table
          headers={[
            "Item",
            "Category",
            "Location",
            "On hand",
            "Retail price",
            "",
          ]}
        >
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <span className="product-name">
                  <span
                    className={`product-icon ${p.category === "Hot tubs" ? "tub" : ""}`}
                  >
                    {p.category === "Chemicals" ||
                    p.category === "Water testing" ? (
                      <Flask />
                    ) : p.category === "Parts" ? (
                      <Wrench />
                    ) : p.category === "Hot tubs" ? (
                      <Drop />
                    ) : (
                      <Package />
                    )}
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.sku}</small>
                  </span>
                </span>
              </td>
              <td>{p.category}</td>
              <td>{p.location}</td>
              <td>
                <b className={p.stock <= p.reorderAt ? "amber-text" : ""}>
                  {p.stock}
                </b>
                <small>
                  {p.stock <= p.reorderAt
                    ? "Reorder recommended"
                    : `Reorder at ${p.reorderAt}`}
                </small>
              </td>
              <td>{money(p.priceCents)}</td>
              <td>
                <button
                  className="text-button"
                  onClick={() => ctx.edit(inventoryForm(p))}
                >
                  Adjust
                  <ArrowUpRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </Table>
        {!rows.length && (
          <Empty
            title="No matching items"
            text="Adjust your filters or add an item."
          />
        )}
        <div className="table-footer">
          {rows.length} items · Stock changes are saved to the audit trail.
        </div>
      </section>
    </>
  );
}
function WaterCare({ ctx }: { ctx: Context }) {
  const rows = ctx.data.readings
    .filter((r) =>
      match(
        {
          ...r,
          customer: ctx.data.customers.find((c) => c.id === r.customerId)?.name,
        },
        ctx.search,
      ),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <Heading
        title="Water care"
        sub="A clear record of every test and treatment."
        action={
          <CreateButton onClick={() => ctx.edit(readingForm(ctx))}>
            Log water test
          </CreateButton>
        }
      />
      <div className="info-note">
        <Flask />
        Reference ranges shown: pH 7.2–7.8, free chlorine 3–5 ppm, alkalinity
        80–120 ppm. Follow the tub manufacturer’s instructions and your
        sanitizer system; these flags are not dosing advice.
      </div>
      <section className="panel">
        <Table
          headers={[
            "Customer",
            "Test date",
            "pH",
            "Free chlorine",
            "Alkalinity",
            "Temperature",
            "Visit notes",
          ]}
        >
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <button
                  className="table-link"
                  onClick={() =>
                    ctx.openCustomer(
                      ctx.data.customers.find((c) => c.id === r.customerId)!,
                    )
                  }
                >
                  {ctx.data.customers.find((c) => c.id === r.customerId)?.name}
                </button>
              </td>
              <td>{dateLabel(r.date, true)}</td>
              <td>
                <Badge tone={r.ph >= 7.2 && r.ph <= 7.8 ? "mint" : "amber"}>
                  {r.ph}
                </Badge>
              </td>
              <td>
                <Badge
                  tone={r.chlorine >= 3 && r.chlorine <= 5 ? "mint" : "amber"}
                >
                  {r.chlorine} ppm
                </Badge>
              </td>
              <td>
                <Badge
                  tone={
                    r.alkalinity >= 80 && r.alkalinity <= 120 ? "mint" : "amber"
                  }
                >
                  {r.alkalinity} ppm
                </Badge>
              </td>
              <td>{r.temperature}°F</td>
              <td className="address-cell">{r.notes || "—"}</td>
            </tr>
          ))}
        </Table>
        {!rows.length && (
          <Empty
            title="Your water history starts here"
            text="Log the first test for one of your customers."
          />
        )}
      </section>
    </>
  );
}
function Sales({ ctx }: { ctx: Context }) {
  const stages = ["New lead", "Consultation", "Quote sent", "Won", "Lost"];
  const [busy, setBusy] = useState(false);
  const open = ctx.data.sales.filter((s) => !["Won", "Lost"].includes(s.stage));
  return (
    <>
      <Heading
        title="Sales pipeline"
        sub="Turn a little interest into someone’s favorite place to unwind."
        action={
          <CreateButton onClick={() => ctx.edit(salesForm(ctx))}>
            New opportunity
          </CreateButton>
        }
      />
      <MetricStrip
        items={[
          {
            label: "OPEN PIPELINE",
            value: money(open.reduce((n, s) => n + s.valueCents, 0)),
          },
          { label: "ACTIVE OPPORTUNITIES", value: open.length },
          {
            label: "WON VALUE",
            value: money(
              ctx.data.sales
                .filter((s) => s.stage === "Won")
                .reduce((n, s) => n + s.valueCents, 0),
            ),
          },
        ]}
      />
      <div className="pipeline">
        {stages.map((stage) => {
          const rows = ctx.data.sales.filter(
            (s) => s.stage === stage && match(s, ctx.search),
          );
          return (
            <section className="pipeline-column" key={stage}>
              <header>
                <span
                  className={`stage-dot stage-${stage.split(" ")[0].toLowerCase()}`}
                />
                <h2>{stage}</h2>
                <Badge>{rows.length}</Badge>
              </header>
              <span className="column-value">
                {money(rows.reduce((n, r) => n + r.valueCents, 0))}
              </span>
              {rows.map((s) => (
                <article className="opportunity" key={s.id}>
                  <span className="eyebrow">
                    {
                      ctx.data.customers.find((c) => c.id === s.customerId)
                        ?.name
                    }
                  </span>
                  <button
                    className="table-link"
                    onClick={() => ctx.edit(salesForm(ctx, s))}
                  >
                    {s.title}
                  </button>
                  <strong className="opportunity-value">
                    {money(s.valueCents)}
                  </strong>
                  <p>{s.nextStep || "Add a next step"}</p>
                  <select
                    aria-label={`Stage for ${s.title}`}
                    value={s.stage}
                    disabled={busy}
                    onChange={async (e) => {
                      setBusy(true);
                      try {
                        await ctx.save(
                          "sales",
                          { ...s, stage: e.target.value },
                          s,
                        );
                        ctx.notify("Opportunity moved.");
                      } catch (err) {
                        ctx.notify((err as Error).message, true);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {stages.map((st) => (
                      <option key={st}>{st}</option>
                    ))}
                  </select>
                </article>
              ))}
              {!rows.length && (
                <div className="pipeline-empty">
                  Room for the next opportunity.
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
function Billing({ ctx }: { ctx: Context }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("All invoices");
  const rows = ctx.data.invoices.filter(
    (i) =>
      (filter === "All invoices" || i.status === filter) &&
      match(
        {
          ...i,
          customer: ctx.data.customers.find((c) => c.id === i.customerId)?.name,
        },
        ctx.search,
      ),
  );
  const inv = ctx.data.invoices.find((i) => i.id === selected);
  const outstanding = ctx.data.invoices.filter(
    (i) => i.status === "Awaiting payment",
  );
  return (
    <>
      <Heading
        title="Billing"
        sub="Clear invoices. Fewer loose ends."
        action={
          <CreateButton onClick={() => ctx.edit(invoiceForm(ctx))}>
            Create invoice
          </CreateButton>
        }
      />
      <MetricStrip
        items={[
          {
            label: "AWAITING PAYMENT",
            value: money(outstanding.reduce((n, i) => n + invoiceTotal(i), 0)),
          },
          {
            label: "DRAFT INVOICES",
            value: ctx.data.invoices.filter((i) => i.status === "Draft").length,
          },
          {
            label: "RECORDED AS PAID",
            value: money(
              ctx.data.invoices
                .filter((i) => i.status === "Paid")
                .reduce((n, i) => n + invoiceTotal(i), 0),
            ),
          },
        ]}
      />
      <div className="tabs">
        {["All invoices", "Draft", "Awaiting payment", "Paid"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <section className="panel">
        <Table
          headers={["Invoice", "Customer", "Due date", "Status", "Amount", ""]}
        >
          {rows.map((i) => (
            <tr key={i.id}>
              <td>
                <button
                  className="table-link"
                  onClick={() => setSelected(i.id)}
                >
                  {i.number}
                </button>
              </td>
              <td>
                {ctx.data.customers.find((c) => c.id === i.customerId)?.name}
              </td>
              <td>{dateLabel(i.dueDate, true)}</td>
              <td>
                <Status value={i.status} />
              </td>
              <td className="number-cell">{money(invoiceTotal(i))}</td>
              <td>
                <button
                  className="text-button"
                  onClick={() => setSelected(i.id)}
                  aria-label={`View ${i.number}`}
                >
                  <ArrowUpRight />
                </button>
              </td>
            </tr>
          ))}
        </Table>
        {!rows.length && (
          <Empty
            title="No invoices in this view"
            text="Create an invoice or change the filter."
          />
        )}
      </section>
      <div className="integration-strip">
        <ShieldCheck size={22} />
        <div>
          <strong>Authorize.net</strong>
          <small>
            Not connected · No card details are collected or stored.
          </small>
        </div>
        <div className="spacer" />
        <Button onClick={() => ctx.navigate("Settings")}>
          Connection details
          <ArrowUpRight size={16} />
        </Button>
      </div>
      {inv && (
        <InvoiceDetail ctx={ctx} inv={inv} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
function InvoiceDetail({
  ctx,
  inv,
  onClose,
}: {
  ctx: Context;
  inv: Row;
  onClose: () => void;
}) {
  const [reference, setReference] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const customer = ctx.data.customers.find((c) => c.id === inv.customerId);
  const update = async (patch: Record<string, any>) => {
    setBusy(true);
    try {
      await ctx.save("invoices", { ...inv, ...patch }, inv);
      ctx.notify("Invoice updated.");
      setRecording(false);
    } catch (e) {
      ctx.notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Drawer title={inv.number} sub={customer?.name} onClose={onClose} wide>
      <div className="detail-body invoice-document">
        <div className="invoice-top">
          <span className="wordmark">CURRENT</span>
          <Status value={inv.status} />
        </div>
        <h2>Invoice</h2>
        <dl className="detail-facts">
          <div>
            <dt>Billed to</dt>
            <dd>
              {customer?.name}
              <br />
              {customer?.address}
            </dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{dateLabel(inv.dueDate)}</dd>
          </div>
        </dl>
        <Table headers={["Description", "Qty", "Unit price", "Amount"]}>
          {inv.items.map((i: any, n: number) => (
            <tr key={n}>
              <td>{i.description}</td>
              <td>{i.quantity}</td>
              <td>{money(i.unitCents)}</td>
              <td>{money(i.quantity * i.unitCents)}</td>
            </tr>
          ))}
        </Table>
        <div className="invoice-totals">
          <p>
            Tax ({inv.taxBps / 100}%){" "}
            <span>
              {money(
                invoiceTotal(inv) -
                  inv.items.reduce(
                    (n: number, i: any) => n + i.quantity * i.unitCents,
                    0,
                  ),
              )}
            </span>
          </p>
          <h2>
            Total <span>{money(invoiceTotal(inv))}</span>
          </h2>
        </div>
        {inv.notes && <p className="muted">{inv.notes}</p>}
        {inv.paymentReference && (
          <div className="success-note">
            <CheckCircle />
            External payment reference: {inv.paymentReference}
          </div>
        )}
        <div className="info-note">
          Online payments and invoice emails are not connected. Approving an
          invoice makes it visible in the customer’s portal; it does not email
          it.
        </div>
        <div className="inline-actions">
          <Button onClick={() => window.print()}>
            Print / save PDF
            <DownloadSimple />
          </Button>
          {inv.status === "Draft" && (
            <Button
              primary
              disabled={busy}
              onClick={() => void update({ status: "Awaiting payment" })}
            >
              Approve invoice
              <CheckCircle />
            </Button>
          )}
          {inv.status === "Awaiting payment" && (
            <Button primary onClick={() => setRecording(!recording)}>
              Record external payment
            </Button>
          )}
        </div>
        {recording && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void update({ status: "Paid", paymentReference: reference });
            }}
          >
            <label className="field">
              <span>
                Reference for full payment of {money(invoiceTotal(inv))}
              </span>
              <input
                required
                minLength={5}
                maxLength={300}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Check number or external transaction ID"
              />
              <small>
                This records a payment you already received elsewhere. It does
                not charge a card.
              </small>
            </label>
            <Button primary type="submit" disabled={busy}>
              Record payment received
            </Button>
          </form>
        )}
      </div>
    </Drawer>
  );
}
function Inbox({ ctx }: { ctx: Context }) {
  const [selected, setSelected] = useState(ctx.data.messages[0]?.id);
  const [filter, setFilter] = useState("All messages");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const rows = ctx.data.messages
    .filter(
      (m) =>
        (filter === "All messages" || m.status === filter) &&
        match(m, ctx.search),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const current = ctx.data.messages.find((m) => m.id === selected) || rows[0];
  const customer =
    current && ctx.data.customers.find((c) => c.id === current.customerId);
  return (
    <>
      <Heading
        title="Inbox"
        sub="One conversation, with the whole customer story close by."
        action={
          <CreateButton
            onClick={() =>
              ctx.edit({
                title: "Compose a message draft",
                entity: "messages",
                values: {
                  customerId: ctx.data.customers[0]?.id || "",
                  channel: "SMS",
                  direction: "outbound",
                  status: "Draft",
                  body: "",
                  createdAt: new Date().toISOString(),
                },
                fields: [
                  {
                    key: "customerId",
                    label: "Customer",
                    type: "select",
                    options: ctx.data.customers.map((c) => ({
                      value: c.id,
                      label: c.name,
                    })),
                  },
                  {
                    key: "channel",
                    label: "Channel",
                    type: "select",
                    options: options(["SMS", "Email"]),
                  },
                  {
                    key: "body",
                    label: "Message",
                    type: "textarea",
                    required: true,
                  },
                ],
              })
            }
          >
            Compose draft
          </CreateButton>
        }
      />
      <div className="info-note">
        <EnvelopeSimple />
        SMS and email are not connected. Drafts are saved here. Portal requests
        arrive in this inbox.
      </div>
      <div className="inbox-layout panel">
        <section className="conversation-list">
          <div className="table-toolbar">
            <select
              aria-label="Filter messages"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {["All messages", "Draft", "Received"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          {rows.map((m) => (
            <button
              className={`conversation ${current?.id === m.id ? "active" : ""}`}
              key={m.id}
              onClick={() => setSelected(m.id)}
            >
              <div className="conversation-top">
                <strong>
                  {ctx.data.customers.find((c) => c.id === m.customerId)?.name}
                </strong>
                <Badge tone={m.status === "Received" ? "blue" : ""}>
                  {m.channel}
                </Badge>
              </div>
              <p>{m.body}</p>
              <small>
                {m.status} · {new Date(m.createdAt).toLocaleDateString()}
              </small>
            </button>
          ))}
          {!rows.length && (
            <Empty
              title="No messages here"
              text="Draft a message or wait for a portal request."
            />
          )}
        </section>
        <section className="conversation-detail">
          {current && customer ? (
            <>
              <header>
                <span className="customer-avatar">
                  {customer.name
                    .split(" ")
                    .map((p: string) => p[0])
                    .join("")}
                </span>
                <div>
                  <h2>{customer.name}</h2>
                  <small>
                    {current.channel} ·{" "}
                    {current.direction === "inbound"
                      ? "From customer"
                      : "Outgoing draft"}
                  </small>
                </div>
                <div className="spacer" />
                <Button onClick={() => ctx.openCustomer(customer)}>
                  Customer
                  <ArrowUpRight />
                </Button>
              </header>
              <div
                className={`message-bubble ${current.direction === "inbound" ? "inbound" : ""}`}
              >
                <span className="eyebrow">{current.status.toUpperCase()}</span>
                <p>{current.body}</p>
                <small>{new Date(current.createdAt).toLocaleString()}</small>
              </div>
              <div className="message-composer">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    try {
                      await ctx.save("messages", {
                        customerId: customer.id,
                        channel:
                          current.channel === "Portal"
                            ? "Email"
                            : current.channel,
                        direction: "outbound",
                        status: "Draft",
                        body: reply,
                        createdAt: new Date().toISOString(),
                      });
                      setReply("");
                      ctx.notify("Reply saved as a draft.");
                    } catch (err) {
                      ctx.notify((err as Error).message, true);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label className="field">
                    <span>Reply draft</span>
                    <textarea
                      required
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a thoughtful reply…"
                    />
                  </label>
                  <div className="form-actions">
                    <span className="muted">
                      <LockKey />
                      Provider connection required to send
                    </span>
                    <Button primary type="submit" disabled={busy}>
                      Save draft
                      <PaperPlaneTilt />
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <Empty
              title="A quieter inbox"
              text="Select a conversation to see the full story."
            />
          )}
        </section>
      </div>
    </>
  );
}
function Workflows({ ctx }: { ctx: Context }) {
  const [preview, setPreview] = useState<{ text: string; name: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const triggerLabel: Record<string, string> = {
    "job.created": "A job is scheduled",
    "job.completed": "A visit is completed",
    "invoice.created": "An invoice is created",
  };
  const actionLabel: Record<string, string> = {
    draft_sms: "Create SMS draft",
    draft_email: "Create email draft",
    create_task: "Create follow-up task",
  };
  return (
    <>
      <Heading
        title="Workflows"
        sub="Build a better way to work. Then let it run."
        action={
          <CreateButton onClick={() => ctx.edit(workflowForm())}>
            Create workflow
          </CreateButton>
        }
      />
      <div className="workflow-intro">
        <span className="workflow-symbol">
          <Lightning size={28} weight="fill" />
        </span>
        <div>
          <h2>The little things, already handled.</h2>
          <p>
            Choose a trigger, choose an action, and make it yours. Enabled rules
            run when the event happens.
          </p>
        </div>
        <Badge tone="blue">Event-driven</Badge>
      </div>
      <section className="workflow-list">
        {ctx.data.workflows
          .filter((w) => match(w, ctx.search))
          .map((w) => (
            <article className="panel workflow-row" key={w.id}>
              <div className="workflow-info">
                <h3>{w.name}</h3>
                <button
                  className="text-button"
                  onClick={() => ctx.edit(workflowForm(w))}
                >
                  Edit workflow
                  <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="workflow-chain">
                <span>
                  <CalendarTrigger />
                  {triggerLabel[w.trigger]}
                </span>
                <ArrowRight size={20} />
                <span>
                  <Lightning size={17} />
                  {actionLabel[w.action]}
                </span>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const p = await api(
                      `/workflows/${w.id}/preview`,
                      "POST",
                      {},
                    );
                    setPreview({ text: p.preview, name: w.name });
                  } catch (e) {
                    ctx.notify((e as Error).message, true);
                  }
                }}
              >
                Preview
              </Button>
              <button
                className={`toggle ${w.enabled ? "on" : ""}`}
                role="switch"
                aria-checked={w.enabled}
                aria-label={`Enable ${w.name}`}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await ctx.save(
                      "workflows",
                      { ...w, enabled: !w.enabled },
                      w,
                    );
                    ctx.notify(
                      w.enabled ? "Workflow paused." : "Workflow enabled.",
                    );
                  } catch (e) {
                    ctx.notify((e as Error).message, true);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <span />
              </button>
            </article>
          ))}
      </section>
      <div className="info-note">
        <ShieldCheck />
        Message actions create drafts. Scheduled reminders, delivery retries,
        and automatic sending need a connected provider and background
        processing.
      </div>
      <section className="panel">
        <SectionTitle
          meta={`${ctx.data.tasks.filter((t) => t.status === "Open").length} open`}
        >
          Office follow-ups
        </SectionTitle>
        {ctx.data.tasks.length ? (
          ctx.data.tasks.map((t) => (
            <div className="task-row" key={t.id}>
              <button
                className="task-toggle"
                aria-label={`Mark ${t.title} ${t.status === "Done" ? "open" : "done"}`}
                onClick={async () => {
                  try {
                    await ctx.save(
                      "tasks",
                      { ...t, status: t.status === "Done" ? "Open" : "Done" },
                      t,
                    );
                  } catch (e) {
                    ctx.notify((e as Error).message, true);
                  }
                }}
              >
                <CheckCircle
                  size={21}
                  weight={t.status === "Done" ? "fill" : "regular"}
                />
              </button>
              <span className={t.status === "Done" ? "struck" : ""}>
                {t.title}
              </span>
              <div className="spacer" />
              <Status value={t.status} />
            </div>
          ))
        ) : (
          <Empty
            title="Nothing slipping through the cracks"
            text="Workflow-created follow-up tasks appear here."
          />
        )}
      </section>
      {preview && (
        <Drawer
          title="Workflow preview"
          sub={preview.name}
          onClose={() => setPreview(null)}
        >
          <div className="detail-body">
            <div className="message-bubble">
              <p>{preview.text}</p>
            </div>
            <div className="info-note">
              Sample data only. No message was sent and no task was created.
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
}
function CalendarTrigger() {
  return <ArrowsClockwise size={17} />;
}
function PortalManager({ ctx }: { ctx: Context }) {
  return (
    <>
      <Heading
        title="Client portal"
        sub="Give your customers a clearer view of their care."
      />
      <div className="portal-feature water-header">
        <span className="eyebrow">A BETTER CUSTOMER EXPERIENCE</span>
        <h2>
          Less back-and-forth.
          <br />
          More peace of mind.
        </h2>
        <p>
          Appointments, water test history, invoices, and a direct line to your
          office.
        </p>
        <Badge tone="blue">
          <ShieldCheck />
          Private, customer-specific links
        </Badge>
      </div>
      <section className="panel">
        <SectionTitle>Customer access</SectionTitle>
        <Table
          headers={["Customer", "Hot tubs", "Service plan", "Portal access"]}
        >
          {ctx.data.customers
            .filter((c) => match(c, ctx.search))
            .map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  <small>{c.email}</small>
                </td>
                <td>{c.tubs.length}</td>
                <td>{c.plan}</td>
                <td>
                  <button
                    className="text-button"
                    onClick={() => ctx.openCustomer(c)}
                  >
                    Create / renew private link
                    <LinkSimple />
                  </button>
                </td>
              </tr>
            ))}
        </Table>
      </section>
      <div className="info-note">
        <LockKey />
        Links expire after seven days. Renewing a link revokes the old one. This
        first version uses private bearer links; individual customer accounts
        and online payment setup remain to be added.
      </div>
    </>
  );
}
function Reports({ ctx }: { ctx: Context }) {
  const done = ctx.data.jobs.filter((j) => j.status === "Completed");
  const paid = ctx.data.invoices.filter((i) => i.status === "Paid");
  return (
    <>
      <Heading
        title="Business pulse"
        sub="A clear view of the work behind the numbers."
      />
      <MetricStrip
        items={[
          { label: "COMPLETED VISITS", value: done.length },
          {
            label: "COMPLETED SERVICE VALUE",
            value: money(done.reduce((n, j) => n + j.priceCents, 0)),
            detail: "Service prices; not collected revenue",
          },
          {
            label: "PAYMENTS RECORDED",
            value: money(paid.reduce((n, i) => n + invoiceTotal(i), 0)),
            detail: "Manually recorded external payments",
          },
          {
            label: "OPEN SALES PIPELINE",
            value: money(
              ctx.data.sales
                .filter((s) => !["Won", "Lost"].includes(s.stage))
                .reduce((n, s) => n + s.valueCents, 0),
            ),
          },
        ]}
      />
      <div className="reports-grid">
        <section className="panel">
          <SectionTitle>Crew completion</SectionTitle>
          {crews.map((c) => {
            const jobs = ctx.data.jobs.filter(
              (j) => j.crew === c.id && j.status !== "Cancelled",
            );
            const completed = jobs.filter((j) => j.status === "Completed");
            return (
              <div className="report-bar-row" key={c.id}>
                <div>
                  <strong>{c.name}</strong>
                  <span>
                    {completed.length} / {jobs.length} visits
                  </span>
                </div>
                <progress value={completed.length} max={jobs.length || 1} />
              </div>
            );
          })}
        </section>
        <section className="panel">
          <SectionTitle>Inventory to watch</SectionTitle>
          {ctx.data.inventory
            .filter((i) => i.stock <= i.reorderAt)
            .map((i) => (
              <div className="attention-row" key={i.id}>
                <WarningCircle />
                <div>
                  <strong>{i.name}</strong>
                  <small>
                    {i.stock} remaining · Reorder point {i.reorderAt}
                  </small>
                </div>
                <button
                  className="text-button"
                  onClick={() => ctx.edit(inventoryForm(i))}
                >
                  Review
                  <ArrowUpRight />
                </button>
              </div>
            ))}
        </section>
      </div>
      <section className="panel">
        <SectionTitle>Service mix</SectionTitle>
        <Table
          headers={["Service type", "Visits", "Completed", "Scheduled value"]}
        >
          {["Cleaning", "Repair", "Delivery"].map((type) => {
            const jobs = ctx.data.jobs.filter(
              (j) => j.type === type && j.status !== "Cancelled",
            );
            return (
              <tr key={type}>
                <td>
                  <Badge tone={type === "Repair" ? "lilac" : "mint"}>
                    {type}
                  </Badge>
                </td>
                <td>{jobs.length}</td>
                <td>{jobs.filter((j) => j.status === "Completed").length}</td>
                <td>{money(jobs.reduce((n, j) => n + j.priceCents, 0))}</td>
              </tr>
            );
          })}
        </Table>
      </section>
      <small className="muted">
        Workspace totals across all stored dates. These figures are operational
        summaries, not accounting statements.
      </small>
    </>
  );
}
function Settings({ ctx }: { ctx: Context }) {
  const [audit, setAudit] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const exportData = async () => {
    setBusy(true);
    try {
      const result = await api("/export");
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `current-workspace-${ctx.today}.json`;
      a.click();
      URL.revokeObjectURL(url);
      ctx.notify("Workspace export downloaded.");
    } catch (e) {
      ctx.notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Heading
        title="Workspace settings"
        sub="Your business. Your way of working."
      />
      <section className="panel">
        <SectionTitle>Connections</SectionTitle>
        {[
          {
            name: "Authorize.net",
            sub: "Hosted checkout, transaction webhooks, and payment reconciliation.",
            icon: Receipt,
          },
          {
            name: "SMS provider",
            sub: "Two-way messaging, consent, appointment reminders, and delivery status.",
            icon: EnvelopeSimple,
          },
          {
            name: "Email provider",
            sub: "Verified sender, confirmation emails, invoices, and bounce handling.",
            icon: PaperPlaneTilt,
          },
          {
            name: "Maps & routing",
            sub: "Geocoding, travel times, traffic, and route optimization.",
            icon: ArrowUpRight,
          },
        ].map((i) => (
          <div className="connection-row" key={i.name}>
            <span className="connection-icon">
              <i.icon size={24} />
            </span>
            <div>
              <strong>{i.name}</strong>
              <p>{i.sub}</p>
            </div>
            <Badge tone="amber">Not connected</Badge>
          </div>
        ))}
        <div className="info-note">
          Provider credentials belong on the server, never in the browser.
          Connections and transaction handling must be implemented and tested in
          sandbox accounts before live use.
        </div>
      </section>
      <div className="reports-grid">
        <section className="panel">
          <SectionTitle>Data ownership</SectionTitle>
          <p className="muted">
            Export your customers, jobs, invoices, stock, readings, and
            workflows as JSON. Private portal links and session secrets are
            excluded.
          </p>
          <Button onClick={() => void exportData()} disabled={busy}>
            <DownloadSimple />
            Export workspace
          </Button>
          <button
            className="text-button standalone"
            onClick={() => ctx.navigate("Import center")}
          >
            Open import center
            <ArrowRight />
          </button>
        </section>
        <section className="panel">
          <SectionTitle>Audit trail</SectionTitle>
          <p className="muted">
            Review record changes, imports, portal-link creation, and workflow
            execution.
          </p>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                setAudit(await api("/audit"));
              } catch (e) {
                ctx.notify((e as Error).message, true);
              } finally {
                setBusy(false);
              }
            }}
          >
            <ShieldCheck />
            View recent activity
          </Button>
        </section>
      </div>
      {audit && (
        <section className="panel">
          <SectionTitle meta="Most recent 100 events">Activity</SectionTitle>
          <Table headers={["Action", "Record type", "When"]}>
            {audit.map((a) => (
              <tr key={a.id}>
                <td>{a.event}</td>
                <td>{a.entity}</td>
                <td>{new Date(a.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </Table>
          {!audit.length && (
            <Empty
              title="No changes yet"
              text="Activity appears as you use the workspace."
            />
          )}
        </section>
      )}
    </>
  );
}
