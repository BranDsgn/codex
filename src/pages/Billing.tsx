import {
  ArrowUpRight,
  CheckCircle,
  DownloadSimple,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useState } from "react";
import { invoiceForm } from "../forms";
import type { Context, Row } from "../types";
import { dateLabel, invoiceTotal, match, money } from "../types";
import {
  Button,
  CreateButton,
  Drawer,
  Empty,
  Heading,
  MetricStrip,
  Status,
  Table,
} from "../ui";

export function Billing({ ctx }: { ctx: Context }) {
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
