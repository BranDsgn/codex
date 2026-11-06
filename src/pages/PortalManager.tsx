import { LinkSimple, LockKey, ShieldCheck } from "@phosphor-icons/react";
import type { Context } from "../types";
import { match } from "../types";
import { Badge, Heading, SectionTitle, Table } from "../ui";

export function PortalManager({ ctx }: { ctx: Context }) {
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
