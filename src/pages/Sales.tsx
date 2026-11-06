import { useState } from "react";
import { salesForm } from "../forms";
import type { Context } from "../types";
import { match, money } from "../types";
import { Badge, CreateButton, Heading, MetricStrip } from "../ui";

export function Sales({ ctx }: { ctx: Context }) {
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
