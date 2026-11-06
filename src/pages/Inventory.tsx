import {
  ArrowUpRight,
  Drop,
  Flask,
  Package,
  WarningCircle,
  Wrench,
} from "@phosphor-icons/react";
import { useState } from "react";
import { inventoryForm } from "../forms";
import type { Context } from "../types";
import { match, money } from "../types";
import {
  CreateButton,
  Empty,
  Heading,
  MetricStrip,
  SearchInput,
  Table,
} from "../ui";

export function Inventory({ ctx }: { ctx: Context }) {
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
