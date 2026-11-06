import { ArrowUpRight } from "@phosphor-icons/react";
import { useState } from "react";
import { jobForm } from "../forms";
import type { Context } from "../types";
import { crews, dateLabel, match, money, time } from "../types";
import { Badge, CreateButton, Empty, Heading, Status, Table } from "../ui";

export function WorkOrders({ ctx }: { ctx: Context }) {
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
