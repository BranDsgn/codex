import { Flask } from "@phosphor-icons/react";
import { readingForm } from "../forms";
import type { Context } from "../types";
import { dateLabel, match } from "../types";
import { Badge, CreateButton, Empty, Heading, Table } from "../ui";

export function WaterCare({ ctx }: { ctx: Context }) {
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
