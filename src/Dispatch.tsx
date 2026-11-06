import {
  ArrowUpRight,
  CalendarDots,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Clock,
  Drop,
  MapPin,
  Plus,
  UsersThree,
  Wrench,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { jobForm } from "./forms";
import type { Context, Row } from "./types";
import { addDays, crews, dateLabel, time } from "./types";
import { Badge, Button, Empty, Heading, IconButton, Status } from "./ui";

export function Dispatch({ ctx }: { ctx: Context }) {
  const [date, setDate] = useState(ctx.today);
  const [view, setView] = useState("Day");
  const [filter, setFilter] = useState("All work");
  const [selected, setSelected] = useState<string>("j11");
  const [dragging, setDragging] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const getNow = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(new Date());
    return (
      Number(parts.find((p) => p.type === "hour")?.value) * 60 +
      Number(parts.find((p) => p.type === "minute")?.value)
    );
  };
  const [now, setNow] = useState(getNow);
  useEffect(() => {
    const interval = setInterval(() => setNow(getNow()), 60000);
    return () => clearInterval(interval);
  }, []);
  const all = ctx.data.jobs.filter(
    (j) => j.date === date && j.status !== "Cancelled",
  );
  const jobs = all.filter(
    (j) =>
      (filter === "All work" || j.type === filter) &&
      (!ctx.search ||
        JSON.stringify(j).toLowerCase().includes(ctx.search.toLowerCase()) ||
        ctx.data.customers
          .find((c) => c.id === j.customerId)
          ?.name.toLowerCase()
          .includes(ctx.search.toLowerCase())),
  );
  const unassigned = jobs.filter((j) => j.crew === "unassigned");
  const completed = jobs.filter((j) => j.status === "Completed").length;
  const selectedJob =
    ctx.data.jobs.find((j) => j.id === selected) || unassigned[0] || jobs[0];
  const customer =
    selectedJob &&
    ctx.data.customers.find((c) => c.id === selectedJob.customerId);
  const pick = (job: Row) => setSelected(job.id);
  const drop = async (e: React.DragEvent, crew: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragging;
    setDragging(null);
    const job = ctx.data.jobs.find((j) => j.id === id);
    if (!job || job.status === "Completed") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const start = Math.max(
      480,
      Math.min(
        1020 - job.duration,
        480 +
          Math.round((((e.clientX - rect.left) / rect.width) * 540) / 15) * 15,
      ),
    );
    setBusy(true);
    try {
      await ctx.save(
        "jobs",
        { ...job, crew, date, start, status: "Scheduled" },
        job,
      );
      ctx.notify("Job assigned. Schedule saved.");
    } catch (err) {
      ctx.notify((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Heading
        title="Dispatch"
        sub="A little less managing. A lot more moving."
        eyebrow="YOUR DAY, UNDER CONTROL"
        action={
          <Button
            primary
            onClick={() => ctx.edit({ ...jobForm({ ...ctx, today: date }) })}
          >
            <Plus size={18} />
            Schedule job
          </Button>
        }
      />
      <div className="dispatch-toolbar">
        <div className="segmented" aria-label="Schedule view">
          {["Day", "Week", "Map"].map((v) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              onClick={() => setView(v)}
            >
              {v === "Day" && <CalendarDots size={16} />} {v}
            </button>
          ))}
        </div>
        <span className="toolbar-divider" />
        <div className="date-control">
          <IconButton
            label="Previous day"
            onClick={() => setDate(addDays(date, view === "Week" ? -7 : -1))}
          >
            <CaretLeft />
          </IconButton>
          <Button onClick={() => setDate(ctx.today)}>Today</Button>
          <IconButton
            label="Next day"
            onClick={() => setDate(addDays(date, view === "Week" ? 7 : 1))}
          >
            <CaretRight />
          </IconButton>
          <input
            aria-label="Dispatch date"
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) setDate(e.target.value);
            }}
          />
        </div>
        <div className="spacer" />
        <div className="service-filters">
          {["All work", "Cleaning", "Repair", "Delivery"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f !== "All work" && (
                <span className={`filter-dot ${f.toLowerCase()}`} />
              )}{" "}
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="board-summary">
        <span>
          <b>{jobs.filter((j) => j.crew !== "unassigned").length}</b> scheduled
        </span>
        <span>
          <i className="status-dot" />
          {jobs.filter((j) => j.status === "On site").length} on site
        </span>
        <span>{unassigned.length} unassigned</span>
        <div className="spacer" />
        <span className="muted">
          {dateLabel(date, true)} ·{" "}
          {busy ? "Saving assignment…" : "Drag a visit to reschedule"}
        </span>
      </div>
      {view === "Day" ? (
        <div className="dispatch-layout">
          <section className="timeline-panel panel">
            <div className="timeline-scroll">
              <div className="timeline">
                <div className="time-header">
                  <span>CREW / ROUTE</span>
                  <div className="hour-labels">
                    {Array.from({ length: 10 }, (_, i) => (
                      <span key={i}>
                        {i + 8 > 12 ? i - 4 : i + 8}
                        {i + 8 >= 12 ? "pm" : "am"}
                      </span>
                    ))}
                  </div>
                </div>
                {crews.map((crew) => {
                  const visits = jobs.filter((j) => j.crew === crew.id);
                  const done = visits.filter(
                    (j) => j.status === "Completed",
                  ).length;
                  return (
                    <div className="crew-lane" key={crew.id}>
                      <div className="crew-identity">
                        <div className="crew-icon">
                          <UsersThree size={21} />
                        </div>
                        <h3>{crew.name}</h3>
                        <p>{crew.people}</p>
                        <div className="crew-progress">
                          <span>
                            {done} / {visits.length} complete
                          </span>
                          <progress max={visits.length || 1} value={done} />
                        </div>
                        <span className="route-caption">
                          <MapPin size={12} />
                          {crew.id === "north"
                            ? "Kirkland + Redmond"
                            : crew.id === "lake"
                              ? "Bellevue + Lakeside"
                              : "Issaquah + Sammamish"}
                        </span>
                      </div>
                      <div
                        className={`lane-track ${dragging ? "drop-active" : ""}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => void drop(e, crew.id)}
                      >
                        {visits.map((job) => {
                          const c = ctx.data.customers.find(
                            (c) => c.id === job.customerId,
                          );
                          return (
                            <button
                              key={job.id}
                              className={`visit ${job.type.toLowerCase()} ${selected === job.id ? "selected" : ""} ${job.confirmation === "Pending" ? "pending" : ""}`}
                              style={{
                                left: `${((job.start - 480) / 540) * 100}%`,
                                width: `${(job.duration / 540) * 100}%`,
                              }}
                              onClick={() => pick(job)}
                              onDoubleClick={() => ctx.openJob(job)}
                              draggable={job.status !== "Completed"}
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", job.id);
                                setDragging(job.id);
                              }}
                              onDragEnd={() => setDragging(null)}
                              title={`${c?.name} · ${job.title} · ${time(job.start)}–${time(job.start + job.duration)}. Click for details; double-click to open.`}
                            >
                              <span className="visit-top">
                                <strong>{c?.name}</strong>
                                {job.status === "Completed" ? (
                                  <CheckCircle weight="fill" size={17} />
                                ) : job.confirmation === "Pending" ? (
                                  <Clock size={16} />
                                ) : null}
                              </span>
                              <span className="visit-service">{job.title}</span>
                              <span className="visit-time">
                                {time(job.start)
                                  .replace(" AM", "")
                                  .replace(" PM", "")}
                                –
                                {time(job.start + job.duration)
                                  .replace(" AM", "")
                                  .replace(" PM", "")}
                              </span>
                            </button>
                          );
                        })}
                        {date === ctx.today && now >= 480 && now <= 1020 && (
                          <div
                            className="now-line"
                            style={{ left: `${((now - 480) / 540) * 100}%` }}
                          >
                            <span>{time(now)}</span>
                          </div>
                        )}
                        {visits.length === 0 && (
                          <span className="lane-empty">
                            Drop a job here or schedule a visit
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="timeline-bottom">
                  <CheckCircle size={17} weight="fill" />
                  <b>Today’s completion</b>
                  <progress
                    value={completed}
                    max={
                      jobs.filter((j) => j.crew !== "unassigned").length || 1
                    }
                  />
                  <span>{completed} completed</span>
                </div>
              </div>
            </div>
          </section>
          <aside className="dispatch-aside">
            <section className="panel queue">
              <div className="section-title">
                <h2>Unassigned</h2>
                <Badge>{unassigned.length}</Badge>
              </div>
              {unassigned.length ? (
                unassigned.map((job) => (
                  <button
                    key={job.id}
                    className={`queue-job ${selected === job.id ? "active" : ""}`}
                    onClick={() => pick(job)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", job.id);
                      setDragging(job.id);
                    }}
                    onDragEnd={() => setDragging(null)}
                  >
                    <span className={`service-icon ${job.type.toLowerCase()}`}>
                      {job.type === "Repair" ? (
                        <Wrench size={23} />
                      ) : (
                        <Drop size={23} />
                      )}
                    </span>
                    <span>
                      <strong>
                        {
                          ctx.data.customers.find(
                            (c) => c.id === job.customerId,
                          )?.name
                        }
                      </strong>
                      <small>
                        {job.type} · {job.duration} min
                      </small>
                      <small>
                        <MapPin size={12} />
                        {ctx.data.customers
                          .find((c) => c.id === job.customerId)
                          ?.address.split(",")
                          .at(-1)}
                      </small>
                    </span>
                    <CaretRight size={15} />
                  </button>
                ))
              ) : (
                <Empty
                  title="Everyone has a place"
                  text="All jobs are assigned to a crew."
                />
              )}
            </section>
            {selectedJob && customer ? (
              <section className="panel quick-detail">
                <div className="section-title">
                  <span className="eyebrow">JOB AT A GLANCE</span>
                  <div className="spacer" />
                  <Badge
                    tone={selectedJob.type === "Repair" ? "lilac" : "mint"}
                  >
                    {selectedJob.type}
                  </Badge>
                </div>
                <h2>{customer.name}</h2>
                <p>{selectedJob.title}</p>
                <dl>
                  <div>
                    <dt>
                      <Drop />
                      Hot tub
                    </dt>
                    <dd>
                      {customer.tubs.find(
                        (t: any) => t.id === selectedJob.tubId,
                      )?.model ||
                        customer.tubs[0]?.model ||
                        "Not recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <MapPin />
                      Location
                    </dt>
                    <dd>{customer.address.split(",").at(-1)}</dd>
                  </div>
                  <div>
                    <dt>
                      <Clock />
                      Visit
                    </dt>
                    <dd>
                      {time(selectedJob.start)} · {selectedJob.duration} min
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <UsersThree />
                      Access
                    </dt>
                    <dd>{customer.access || "No instructions"}</dd>
                  </div>
                  <div>
                    <dt>
                      <CalendarDots />
                      Confirmation
                    </dt>
                    <dd>
                      <Status value={selectedJob.confirmation} />
                    </dd>
                  </div>
                </dl>
                <Button primary onClick={() => ctx.openJob(selectedJob)}>
                  Open work order
                  <ArrowUpRight size={18} />
                </Button>
                <button
                  className="text-button"
                  onClick={() => ctx.openCustomer(customer)}
                >
                  View customer history <CaretRight size={14} />
                </button>
              </section>
            ) : (
              <section className="panel">
                <Empty
                  title="A fresh day"
                  text="Schedule a visit to get started."
                />
              </section>
            )}
          </aside>
        </div>
      ) : view === "Week" ? (
        <section className="panel week-panel">
          <div className="week-grid">
            {Array.from({ length: 7 }, (_, i) => addDays(date, i)).map((d) => (
              <div
                className={`week-day ${d === ctx.today ? "is-today" : ""}`}
                key={d}
              >
                <header>
                  <span>
                    {new Date(d + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </span>
                  <strong>{new Date(d + "T12:00:00").getDate()}</strong>
                </header>
                {ctx.data.jobs
                  .filter(
                    (j) =>
                      j.date === d &&
                      j.status !== "Cancelled" &&
                      (filter === "All work" || j.type === filter),
                  )
                  .sort((a, b) => a.start - b.start)
                  .map((j) => (
                    <button
                      className={`week-visit ${j.type.toLowerCase()}`}
                      key={j.id}
                      onClick={() => ctx.openJob(j)}
                    >
                      <small>{time(j.start)}</small>
                      <strong>
                        {
                          ctx.data.customers.find((c) => c.id === j.customerId)
                            ?.name
                        }
                      </strong>
                      <span>{j.title}</span>
                    </button>
                  ))}
                <button
                  className="week-add"
                  aria-label={`Add job on ${d}`}
                  onClick={() => ctx.edit(jobForm({ ...ctx, today: d }))}
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <Routes ctx={ctx} date={date} />
      )}
      <div className="workspace-status">
        <span className="status-dot" /> Workspace records saved on this server
        <span className="spacer" />
        <span>America/Chicago</span>
        <span>·</span>
        <span>{ctx.data.jobs.length} work orders</span>
      </div>
    </>
  );
}

export function Routes({
  ctx,
  date = ctx.today,
}: {
  ctx: Context;
  date?: string;
}) {
  return (
    <div className="routes-grid">
      {crews.map((crew) => {
        const jobs = ctx.data.jobs
          .filter(
            (j) =>
              j.crew === crew.id && j.date === date && j.status !== "Cancelled",
          )
          .sort((a, b) => a.start - b.start);
        const addresses = jobs
          .map(
            (j) =>
              ctx.data.customers.find((c) => c.id === j.customerId)?.address ||
              "",
          )
          .filter(Boolean);
        const url = addresses.length
          ? "https://www.google.com/maps/dir/" +
            addresses.map(encodeURIComponent).join("/")
          : null;
        return (
          <section className="panel route-card" key={crew.id}>
            <div className="route-header">
              <span className="crew-icon">
                <UsersThree size={26} />
              </span>
              <div>
                <h2>{crew.name}</h2>
                <p>{crew.people}</p>
              </div>
              <Badge>{jobs.length} stops</Badge>
            </div>
            <p className="muted">Scheduled order · {dateLabel(date, true)}</p>
            <ol className="route-stops">
              {jobs.map((j, i) => (
                <li key={j.id}>
                  <span
                    className={`stop-number ${j.status === "Completed" ? "done" : ""}`}
                  >
                    {j.status === "Completed" ? <CheckCircle /> : i + 1}
                  </span>
                  <button className="route-stop" onClick={() => ctx.openJob(j)}>
                    <small>{time(j.start)}</small>
                    <strong>
                      {
                        ctx.data.customers.find((c) => c.id === j.customerId)
                          ?.name
                      }
                    </strong>
                    <span>
                      {
                        ctx.data.customers.find((c) => c.id === j.customerId)
                          ?.address
                      }
                    </span>
                    <Status value={j.status} />
                  </button>
                </li>
              ))}
            </ol>
            {!jobs.length && (
              <Empty
                title="No stops scheduled"
                text="Assign jobs from the dispatch board."
              />
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="button primary"
              >
                Open driving route
                <ArrowUpRight size={17} />
              </a>
            )}
            <small className="route-note">
              Opens Google Maps with the listed service addresses. Live traffic
              and route optimization are not connected.
            </small>
          </section>
        );
      })}
    </div>
  );
}
