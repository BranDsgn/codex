import {
  ArrowRight,
  ArrowUpRight,
  DownloadSimple,
  EnvelopeSimple,
  PaperPlaneTilt,
  Receipt,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useState } from "react";
import { api } from "../api";
import type { Context } from "../types";
import { Badge, Button, Empty, Heading, SectionTitle, Table } from "../ui";

export function Settings({ ctx }: { ctx: Context }) {
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
