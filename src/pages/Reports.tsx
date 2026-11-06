import { ArrowUpRight, WarningCircle } from "@phosphor-icons/react";
import { inventoryForm } from "../forms";
import type { Context } from "../types";
import { crews, invoiceTotal, money } from "../types";
import { Badge, Heading, MetricStrip, SectionTitle, Table } from "../ui";

export function Reports({ ctx }: { ctx: Context }) {
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
