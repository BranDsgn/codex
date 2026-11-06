import {
  ArrowRight,
  ArrowsClockwise,
  ArrowUpRight,
  CheckCircle,
  Lightning,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useState } from "react";
import { api } from "../api";
import { workflowForm } from "../forms";
import type { Context } from "../types";
import { match } from "../types";
import {
  Badge,
  Button,
  CreateButton,
  Drawer,
  Empty,
  Heading,
  SectionTitle,
  Status,
} from "../ui";

export function Workflows({ ctx }: { ctx: Context }) {
  const [preview, setPreview] = useState<{ text: string; name: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const triggerLabel: Record<string, string> = {
    "job.created": "A job is scheduled",
    "job.completed": "A visit is completed",
    "invoice.created": "An invoice is created",
  };
  const actionLabel: Record<string, string> = {
    draft_sms: "Create SMS draft",
    draft_email: "Create email draft",
    create_task: "Create follow-up task",
  };
  return (
    <>
      <Heading
        title="Workflows"
        sub="Build a better way to work. Then let it run."
        action={
          <CreateButton onClick={() => ctx.edit(workflowForm())}>
            Create workflow
          </CreateButton>
        }
      />
      <div className="workflow-intro">
        <span className="workflow-symbol">
          <Lightning size={28} weight="fill" />
        </span>
        <div>
          <h2>The little things, already handled.</h2>
          <p>
            Choose a trigger, choose an action, and make it yours. Enabled rules
            run when the event happens.
          </p>
        </div>
        <Badge tone="blue">Event-driven</Badge>
      </div>
      <section className="workflow-list">
        {ctx.data.workflows
          .filter((w) => match(w, ctx.search))
          .map((w) => (
            <article className="panel workflow-row" key={w.id}>
              <div className="workflow-info">
                <h3>{w.name}</h3>
                <button
                  className="text-button"
                  onClick={() => ctx.edit(workflowForm(w))}
                >
                  Edit workflow
                  <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="workflow-chain">
                <span>
                  <CalendarTrigger />
                  {triggerLabel[w.trigger]}
                </span>
                <ArrowRight size={20} />
                <span>
                  <Lightning size={17} />
                  {actionLabel[w.action]}
                </span>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const p = await api(
                      `/workflows/${w.id}/preview`,
                      "POST",
                      {},
                    );
                    setPreview({ text: p.preview, name: w.name });
                  } catch (e) {
                    ctx.notify((e as Error).message, true);
                  }
                }}
              >
                Preview
              </Button>
              <button
                className={`toggle ${w.enabled ? "on" : ""}`}
                role="switch"
                aria-checked={w.enabled}
                aria-label={`Enable ${w.name}`}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await ctx.save(
                      "workflows",
                      { ...w, enabled: !w.enabled },
                      w,
                    );
                    ctx.notify(
                      w.enabled ? "Workflow paused." : "Workflow enabled.",
                    );
                  } catch (e) {
                    ctx.notify((e as Error).message, true);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <span />
              </button>
            </article>
          ))}
      </section>
      <div className="info-note">
        <ShieldCheck />
        Message actions create drafts. Scheduled reminders, delivery retries,
        and automatic sending need a connected provider and background
        processing.
      </div>
      <section className="panel">
        <SectionTitle
          meta={`${ctx.data.tasks.filter((t) => t.status === "Open").length} open`}
        >
          Office follow-ups
        </SectionTitle>
        {ctx.data.tasks.length ? (
          ctx.data.tasks.map((t) => (
            <div className="task-row" key={t.id}>
              <button
                className="task-toggle"
                aria-label={`Mark ${t.title} ${t.status === "Done" ? "open" : "done"}`}
                onClick={async () => {
                  try {
                    await ctx.save(
                      "tasks",
                      { ...t, status: t.status === "Done" ? "Open" : "Done" },
                      t,
                    );
                  } catch (e) {
                    ctx.notify((e as Error).message, true);
                  }
                }}
              >
                <CheckCircle
                  size={21}
                  weight={t.status === "Done" ? "fill" : "regular"}
                />
              </button>
              <span className={t.status === "Done" ? "struck" : ""}>
                {t.title}
              </span>
              <div className="spacer" />
              <Status value={t.status} />
            </div>
          ))
        ) : (
          <Empty
            title="Nothing slipping through the cracks"
            text="Workflow-created follow-up tasks appear here."
          />
        )}
      </section>
      {preview && (
        <Drawer
          title="Workflow preview"
          sub={preview.name}
          onClose={() => setPreview(null)}
        >
          <div className="detail-body">
            <div className="message-bubble">
              <p>{preview.text}</p>
            </div>
            <div className="info-note">
              Sample data only. No message was sent and no task was created.
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
}

function CalendarTrigger() {
  return <ArrowsClockwise size={17} />;
}
