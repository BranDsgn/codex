import { ArrowDown, ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { useState } from "react";
import { customerForm } from "../forms";
import type { Context } from "../types";
import { match } from "../types";
import {
  Badge,
  Button,
  CreateButton,
  Empty,
  Heading,
  MetricStrip,
  SearchInput,
  Table,
} from "../ui";

export function Customers({ ctx }: { ctx: Context }) {
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
