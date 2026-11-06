import {
  ArrowUpRight,
  EnvelopeSimple,
  LockKey,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { useState } from "react";
import { options } from "../forms";
import type { Context } from "../types";
import { match } from "../types";
import { Badge, Button, CreateButton, Empty, Heading } from "../ui";

export function Inbox({ ctx }: { ctx: Context }) {
  const [selected, setSelected] = useState(ctx.data.messages[0]?.id);
  const [filter, setFilter] = useState("All messages");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const rows = ctx.data.messages
    .filter(
      (m) =>
        (filter === "All messages" || m.status === filter) &&
        match(m, ctx.search),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const current = ctx.data.messages.find((m) => m.id === selected) || rows[0];
  const customer =
    current && ctx.data.customers.find((c) => c.id === current.customerId);
  return (
    <>
      <Heading
        title="Inbox"
        sub="One conversation, with the whole customer story close by."
        action={
          <CreateButton
            onClick={() =>
              ctx.edit({
                title: "Compose a message draft",
                entity: "messages",
                values: {
                  customerId: ctx.data.customers[0]?.id || "",
                  channel: "SMS",
                  direction: "outbound",
                  status: "Draft",
                  body: "",
                  createdAt: new Date().toISOString(),
                },
                fields: [
                  {
                    key: "customerId",
                    label: "Customer",
                    type: "select",
                    options: ctx.data.customers.map((c) => ({
                      value: c.id,
                      label: c.name,
                    })),
                  },
                  {
                    key: "channel",
                    label: "Channel",
                    type: "select",
                    options: options(["SMS", "Email"]),
                  },
                  {
                    key: "body",
                    label: "Message",
                    type: "textarea",
                    required: true,
                  },
                ],
              })
            }
          >
            Compose draft
          </CreateButton>
        }
      />
      <div className="info-note">
        <EnvelopeSimple />
        SMS and email are not connected. Drafts are saved here. Portal requests
        arrive in this inbox.
      </div>
      <div className="inbox-layout panel">
        <section className="conversation-list">
          <div className="table-toolbar">
            <select
              aria-label="Filter messages"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {["All messages", "Draft", "Received"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          {rows.map((m) => (
            <button
              className={`conversation ${current?.id === m.id ? "active" : ""}`}
              key={m.id}
              onClick={() => setSelected(m.id)}
            >
              <div className="conversation-top">
                <strong>
                  {ctx.data.customers.find((c) => c.id === m.customerId)?.name}
                </strong>
                <Badge tone={m.status === "Received" ? "blue" : ""}>
                  {m.channel}
                </Badge>
              </div>
              <p>{m.body}</p>
              <small>
                {m.status} · {new Date(m.createdAt).toLocaleDateString()}
              </small>
            </button>
          ))}
          {!rows.length && (
            <Empty
              title="No messages here"
              text="Draft a message or wait for a portal request."
            />
          )}
        </section>
        <section className="conversation-detail">
          {current && customer ? (
            <>
              <header>
                <span className="customer-avatar">
                  {customer.name
                    .split(" ")
                    .map((p: string) => p[0])
                    .join("")}
                </span>
                <div>
                  <h2>{customer.name}</h2>
                  <small>
                    {current.channel} ·{" "}
                    {current.direction === "inbound"
                      ? "From customer"
                      : "Outgoing draft"}
                  </small>
                </div>
                <div className="spacer" />
                <Button onClick={() => ctx.openCustomer(customer)}>
                  Customer
                  <ArrowUpRight />
                </Button>
              </header>
              <div
                className={`message-bubble ${current.direction === "inbound" ? "inbound" : ""}`}
              >
                <span className="eyebrow">{current.status.toUpperCase()}</span>
                <p>{current.body}</p>
                <small>{new Date(current.createdAt).toLocaleString()}</small>
              </div>
              <div className="message-composer">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    try {
                      await ctx.save("messages", {
                        customerId: customer.id,
                        channel:
                          current.channel === "Portal"
                            ? "Email"
                            : current.channel,
                        direction: "outbound",
                        status: "Draft",
                        body: reply,
                        createdAt: new Date().toISOString(),
                      });
                      setReply("");
                      ctx.notify("Reply saved as a draft.");
                    } catch (err) {
                      ctx.notify((err as Error).message, true);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label className="field">
                    <span>Reply draft</span>
                    <textarea
                      required
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a thoughtful reply…"
                    />
                  </label>
                  <div className="form-actions">
                    <span className="muted">
                      <LockKey />
                      Provider connection required to send
                    </span>
                    <Button primary type="submit" disabled={busy}>
                      Save draft
                      <PaperPlaneTilt />
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <Empty
              title="A quieter inbox"
              text="Select a conversation to see the full story."
            />
          )}
        </section>
      </div>
    </>
  );
}
