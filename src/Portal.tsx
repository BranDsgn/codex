import {
  ArrowRight,
  CalendarDots,
  CheckCircle,
  Drop,
  EnvelopeSimple,
  Receipt,
  WarningCircle,
  Waves,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { api } from "./api";
import { dateLabel, money, time } from "./types";
import { Badge, Button, Empty, Status } from "./ui";
export function Portal({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    api("/portal/" + token)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);
  if (error)
    return (
      <div className="portal-shell">
        <div className="portal-brand">
          <Waves />
          CURRENT
        </div>
        <div className="panel">
          <Empty title="This link is unavailable" text={error} />
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="loading-screen">
        <Waves size={40} />
        <p>Opening your spa care portal…</p>
      </div>
    );
  const upcoming = data.jobs.filter(
    (j: any) => !["Completed", "Cancelled"].includes(j.status),
  );
  return (
    <div className="portal-shell">
      <header className="portal-top water-header">
        <div className="portal-brand">
          <Waves size={34} />
          CURRENT<span>YOUR SPA, TAKEN CARE OF.</span>
        </div>
        <Badge tone="blue">Client portal</Badge>
      </header>
      <div className="portal-intro">
        <span className="eyebrow">A LITTLE PEACE OF MIND</span>
        <h1>Hi, {data.customer.name.split(" ")[0]}.</h1>
        <p>Everything your spa needs. All in one place.</p>
      </div>
      {actionError && (
        <div className="error-box" role="alert">
          <WarningCircle />
          {actionError}
        </div>
      )}
      <div className="portal-grid">
        <section className="panel">
          <div className="section-title">
            <CalendarDots />
            <h2>Your appointments</h2>
          </div>
          {upcoming.length ? (
            upcoming.map((j: any) => (
              <div className="portal-appointment" key={j.id}>
                <div className="date-tile">
                  <span>
                    {new Date(j.date + "T12:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short" },
                    )}
                  </span>
                  <b>{Number(j.date.slice(-2))}</b>
                </div>
                <div>
                  <h3>{j.title}</h3>
                  <p>
                    {dateLabel(j.date)} · {time(j.start)}
                  </p>
                  <Status value={j.confirmation} />
                  {j.confirmation === "Pending" && (
                    <Button
                      primary
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setActionError("");
                        try {
                          await api(`/portal/${token}/confirm`, "POST", {
                            jobId: j.id,
                          });
                          setData(await api(`/portal/${token}`));
                        } catch (e) {
                          setActionError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Confirm appointment
                      <CheckCircle />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="Nothing on the calendar"
              text="Send us a service request below."
            />
          )}
        </section>
        <section className="panel">
          <div className="section-title">
            <Receipt />
            <h2>Your invoices</h2>
          </div>
          {data.invoices.length ? (
            data.invoices.map((i: any) => (
              <div className="portal-invoice" key={i.id}>
                <div>
                  <strong>{i.number}</strong>
                  <small>Due {dateLabel(i.dueDate, true)}</small>
                </div>
                <b>{money(i.totalCents)}</b>
                <Status value={i.status} />
              </div>
            ))
          ) : (
            <p className="muted">No invoices to display.</p>
          )}
          <div className="info-note">
            Online payment isn’t connected yet. Contact the store to arrange
            payment.
          </div>
        </section>
        <section className="panel">
          <div className="section-title">
            <Drop />
            <h2>Your water care</h2>
          </div>
          {data.readings.length ? (
            data.readings.map((r: any, i: number) => (
              <div key={i}>
                <small className="muted">
                  Tested {dateLabel(r.date, true)}
                </small>
                <div className="reading-strip">
                  <div>
                    <small>pH</small>
                    <b>{r.ph}</b>
                  </div>
                  <div>
                    <small>Chlorine</small>
                    <b>{r.chlorine} ppm</b>
                  </div>
                  <div>
                    <small>Alkalinity</small>
                    <b>{r.alkalinity} ppm</b>
                  </div>
                  <div>
                    <small>Temperature</small>
                    <b>{r.temperature}°F</b>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">
              Your technician’s water readings will appear here.
            </p>
          )}
        </section>
        <section className="panel">
          <div className="section-title">
            <EnvelopeSimple />
            <h2>How can we help?</h2>
          </div>
          {sent ? (
            <div className="success-note">
              <CheckCircle size={28} />
              <h3>Your request is with the office.</h3>
              <p>They’ll follow up to arrange the next step.</p>
              <Button onClick={() => setSent(false)}>
                Send another request
              </Button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await api("/portal/" + token + "/request", "POST", {
                    message,
                  });
                  setSent(true);
                  setMessage("");
                } catch (e) {
                  setActionError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="field">
                <span>Service request or question</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={5}
                  maxLength={3000}
                  placeholder="Tell us what your spa needs…"
                />
              </label>
              <Button primary type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send to the office"}
                <ArrowRight />
              </Button>
            </form>
          )}
        </section>
      </div>
      <footer className="portal-footer">
        <Waves size={20} />
        Thoughtful care. Clear water. Current.
      </footer>
    </div>
  );
}
