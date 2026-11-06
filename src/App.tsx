import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDots,
  CaretDown,
  ChartBar,
  CheckCircle,
  CircleNotch,
  Cube,
  Drop,
  EnvelopeSimple,
  FlowArrow,
  GearSix,
  House,
  List,
  LockKey,
  MagnifyingGlass,
  Moon,
  Path,
  Receipt,
  SignOut,
  Sun,
  Tag,
  UploadSimple,
  UserCircle,
  UsersThree,
  WarningCircle,
  Waves,
  Wrench,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { CustomerDetail, JobDetail } from "./Details";
import { Dispatch } from "./Dispatch";
import { prepareValues } from "./forms";
import { Pages } from "./Pages";
import { Portal } from "./Portal";
import type { Context, Data, Edit, Entity, Page, Row } from "./types";
import { dateLabel, emptyData, match } from "./types";
import { Badge, Button, Drawer, Editor, Empty, SearchInput } from "./ui";

const groups = [
  {
    label: "OPERATIONS",
    items: [
      { name: "Dispatch", icon: CalendarDots },
      { name: "Customers", icon: UsersThree },
      { name: "Work orders", icon: Wrench },
      { name: "Routes", icon: Path },
      { name: "Water care", icon: Drop },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { name: "Sales", icon: Tag },
      { name: "Inventory", icon: Cube },
      { name: "Billing", icon: Receipt },
      { name: "Reports", icon: ChartBar },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { name: "Inbox", icon: EnvelopeSimple },
      { name: "Workflows", icon: FlowArrow },
      { name: "Import center", icon: UploadSimple },
      { name: "Portal", icon: ArrowUpRight },
    ],
  },
];
export function App() {
  const token = location.pathname.match(/^\/portal\/([a-f0-9]{64})$/)?.[1];
  return token ? <Portal token={token} /> : <Workspace />;
}
function Workspace() {
  const [session, setSession] = useState<any>(null);
  const [data, setData] = useState<Data>(emptyData);
  const [page, setPage] = useState<Page>("Dispatch");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [job, setJob] = useState<string | null>(null);
  const [customer, setCustomer] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("current-theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [profile, setProfile] = useState(false);
  const [workspaceMenu, setWorkspaceMenu] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((message: string, error = false) => {
    setToast({ message, error });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 6500);
  }, []);
  const refresh = useCallback(async () => {
    const result = await api("/data");
    setData(result);
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const s = await api("/session");
      setSession(s);
      if (s.signedIn) await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [refresh]);
  useEffect(() => {
    void load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("current-theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    if (!session?.signedIn) return;
    const update = () => {
      if (document.visibilityState === "visible") {
        void refresh().catch((e) => notify(e.message, true));
      }
    };
    window.addEventListener("focus", update);
    const timer = setInterval(update, 60000);
    return () => {
      window.removeEventListener("focus", update);
      clearInterval(timer);
    };
  }, [session?.signedIn, refresh, notify]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setProfile(false);
        setWorkspaceMenu(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const navigate = (p: Page) => {
    setPage(p);
    setMobileNav(false);
    setSearch("");
    setProfile(false);
    setWorkspaceMenu(false);
  };
  const save = async (
    entity: Entity,
    values: Record<string, any>,
    record?: Row,
  ) => {
    const clean = { ...values };
    delete clean.id;
    delete clean.version;
    const result = await api(
      "/" + entity + (record ? "/" + record.id : ""),
      record ? "PATCH" : "POST",
      record ? { ...clean, version: record.version } : clean,
    );
    await refresh();
    return result;
  };
  const ctx: Context = {
    data,
    today: session?.today || new Date().toISOString().slice(0, 10),
    save,
    refresh,
    notify,
    edit: setEdit,
    openJob: (j) => {
      setCustomer(null);
      setJob(j.id);
    },
    openCustomer: (c) => {
      setJob(null);
      setCustomer(c.id);
    },
    navigate,
    search,
  };
  const editorSave = async (values: Record<string, any>) => {
    if (!edit) return;
    if (edit.title === "Add a hot tub" && edit.record) {
      await save(
        "customers",
        {
          ...edit.record,
          tubs: [...edit.record.tubs, { id: crypto.randomUUID(), ...values }],
        },
        edit.record,
      );
    } else await save(edit.entity, prepareValues(edit, values), edit.record);
    notify("Changes saved.");
  };
  if (loading)
    return (
      <div className="loading-screen">
        <Waves size={48} />
        <span className="wordmark">CURRENT</span>
        <p>
          <CircleNotch className="spin" />
          Opening your workspace…
        </p>
      </div>
    );
  if (error)
    return (
      <div className="loading-screen">
        <WarningCircle size={40} />
        <h1>We couldn’t open the workspace.</h1>
        <p>{error}</p>
        <Button primary onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  if (!session?.signedIn) return <Login onSuccess={() => void load()} />;
  const badgeCount = data.messages.filter(
    (m) => m.status === "Received",
  ).length;
  const searchResults = search.trim()
    ? [
        ...data.customers
          .filter((c) => match(c, search))
          .map((c) => ({
            type: "Customer",
            label: c.name,
            sub: c.address,
            action: () => ctx.openCustomer(c),
          })),
        ...data.jobs
          .filter((j) =>
            match(
              {
                ...j,
                name: data.customers.find((c) => c.id === j.customerId)?.name,
              },
              search,
            ),
          )
          .map((j) => ({
            type: "Work order",
            label: j.title,
            sub: data.customers.find((c) => c.id === j.customerId)?.name,
            action: () => ctx.openJob(j),
          })),
        ...data.inventory
          .filter((p) => match(p, search))
          .map((p) => ({
            type: "Stock",
            label: p.name,
            sub: p.sku,
            action: () => navigate("Inventory"),
          })),
      ].slice(0, 20)
    : [];
  return (
    <div className="app-shell">
      <nav className="icon-rail" aria-label="Workspace shortcuts">
        <button
          className="brand-icon"
          aria-label="Current home"
          onClick={() => navigate("Dispatch")}
        >
          <Waves size={34} weight="bold" />
        </button>
        <div className="rail-top">
          {[
            { page: "Dispatch", icon: CalendarDots },
            { page: "Customers", icon: UsersThree },
            { page: "Work orders", icon: Wrench },
            { page: "Sales", icon: Tag },
            { page: "Inventory", icon: Cube },
            { page: "Billing", icon: Receipt },
            { page: "Inbox", icon: EnvelopeSimple },
            { page: "Workflows", icon: FlowArrow },
            { page: "Import center", icon: UploadSimple },
          ].map((i) => (
            <button
              aria-label={i.page}
              title={i.page}
              key={i.page}
              className={page === i.page ? "active" : ""}
              onClick={() => navigate(i.page as Page)}
            >
              <i.icon
                size={23}
                weight={page === i.page ? "duotone" : "regular"}
              />
            </button>
          ))}
        </div>
        <div className="rail-bottom">
          <div className="theme-toggle" role="group" aria-label="Color theme">
            <button
              className={theme === "dark" ? "active" : ""}
              aria-label="Use dark theme"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              <Moon size={17} weight="fill" />
            </button>
            <button
              className={theme === "light" ? "active" : ""}
              aria-label="Use light theme"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              <Sun size={17} />
            </button>
          </div>
          <button
            className={page === "Settings" ? "active" : ""}
            aria-label="Workspace settings"
            title="Settings"
            onClick={() => navigate("Settings")}
          >
            <GearSix size={22} />
          </button>
        </div>
      </nav>
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="wordmark">CURRENT</span>
          <button
            className="mobile-close icon-button"
            aria-label="Close navigation"
            onClick={() => setMobileNav(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace-select-wrap">
          <button
            className="workspace-select"
            onClick={() => setWorkspaceMenu(!workspaceMenu)}
            aria-expanded={workspaceMenu}
          >
            <span className="workspace-mini">
              <Drop size={15} weight="duotone" />
            </span>
            Spa operations
            <CaretDown size={13} />
          </button>
          {workspaceMenu && (
            <div className="workspace-dropdown">
              <span className="eyebrow">CURRENT WORKSPACE</span>
              <strong>Spa operations</strong>
              <small>One store. One connected team.</small>
              <button onClick={() => navigate("Settings")}>
                Workspace settings
                <ArrowUpRight />
              </button>
            </div>
          )}
        </div>
        <div className="sidebar-scroll">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map((item) => (
                <button
                  key={item.name}
                  className={`nav-item ${page === item.name ? "active" : ""}`}
                  onClick={() => navigate(item.name as Page)}
                >
                  <item.icon
                    size={18}
                    weight={page === item.name ? "duotone" : "regular"}
                  />
                  {item.name}
                  {item.name === "Inbox" && badgeCount > 0 && (
                    <span className="nav-count">{badgeCount}</span>
                  )}
                  {item.name === "Workflows" && <span className="nav-dot" />}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="sidebar-foot">
          <span className="avatar">AL</span>
          <div>
            <strong>Store workspace</strong>
            <small>{session.demo ? "Sample data mode" : "Office access"}</small>
          </div>
          <button
            className="icon-button"
            aria-label="Open settings"
            onClick={() => navigate("Settings")}
          >
            <GearSix size={17} />
          </button>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar water-header">
          <button
            className="mobile-menu icon-button"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <List size={22} />
          </button>
          <div className="breadcrumb">
            <button aria-label="Home" onClick={() => navigate("Dispatch")}>
              <House size={17} />
            </button>
            <span>/</span>
            <span>
              {groups
                .find((g) => g.items.some((i) => i.name === page))
                ?.label.toLowerCase() || "Workspace"}
            </span>
            <span>/</span>
            <strong>{page}</strong>
          </div>
          <div className="spacer" />
          <label className="global-search">
            <MagnifyingGlass size={17} />
            <input
              ref={input}
              placeholder="Search or jump to…"
              aria-label="Search customers, work orders, and inventory"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearchOpen(true);
              }}
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="top-team">
            <button
              className="avatar lilac"
              aria-label="View North crew route"
              onClick={() => navigate("Routes")}
            >
              EV
            </button>
            <button
              className="avatar mint"
              aria-label="View Lake crew route"
              onClick={() => navigate("Routes")}
            >
              MT
            </button>
            <button
              className="avatar sand"
              aria-label="View South crew route"
              onClick={() => navigate("Routes")}
            >
              CH
            </button>
          </div>
          <button
            className="top-notification"
            aria-label={`Inbox, ${badgeCount} new portal requests`}
            onClick={() => navigate("Inbox")}
          >
            <Bell size={20} />
            {badgeCount > 0 && <b />}
          </button>
          <div className="profile-wrap">
            <button
              className="profile-button"
              aria-label="Account menu"
              onClick={() => setProfile(!profile)}
              aria-expanded={profile}
            >
              <UserCircle size={27} />
            </button>
            {profile && (
              <div className="profile-menu">
                <strong>Current office</strong>
                <small>
                  {session.demo
                    ? "Demo · sample records"
                    : "Password protected"}
                </small>
                <button onClick={() => navigate("Settings")}>
                  <GearSix />
                  Workspace settings
                </button>
                {!session.demo && (
                  <button
                    onClick={async () => {
                      await api("/logout", "POST", {});
                      setData(emptyData);
                      setSession({ ...session, signedIn: false });
                    }}
                  >
                    <SignOut />
                    Sign out
                  </button>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="workspace-main" id="main-content">
          <div className="context-bar">
            <span className="context-label">
              <span className="status-dot" />
              SPA OPERATIONS
            </span>
            <div className="spacer" />
            <span className="context-date">{dateLabel(ctx.today)}</span>
            {session.demo && (
              <Badge tone="blue">Demo workspace · sample records</Badge>
            )}
          </div>
          {page === "Dispatch" ? (
            <Dispatch ctx={ctx} />
          ) : (
            <Pages ctx={ctx} page={page} />
          )}
        </main>
      </div>
      {edit && (
        <Editor
          key={edit.title + (edit.record?.id || "")}
          edit={edit}
          onSave={editorSave}
          onClose={() => setEdit(null)}
        />
      )}
      {job && data.jobs.some((j) => j.id === job) && (
        <JobDetail
          key={job}
          ctx={ctx}
          jobId={job}
          onClose={() => setJob(null)}
        />
      )}
      {customer && data.customers.some((c) => c.id === customer) && (
        <CustomerDetail
          key={customer}
          ctx={ctx}
          customerId={customer}
          onClose={() => setCustomer(null)}
        />
      )}
      {searchOpen && (
        <Drawer
          title="Search the workspace"
          sub={`Results for “${search}”`}
          onClose={() => setSearchOpen(false)}
        >
          <div className="search-results">
            <div className="table-toolbar">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Customer, job, or SKU…"
              />
            </div>
            {searchResults.length ? (
              searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearchOpen(false);
                    setSearch("");
                    r.action();
                  }}
                >
                  <span className="search-result-icon">
                    {r.type === "Customer" ? (
                      <UsersThree />
                    ) : r.type === "Stock" ? (
                      <Cube />
                    ) : (
                      <Wrench />
                    )}
                  </span>
                  <div>
                    <small>{r.type}</small>
                    <strong>{r.label}</strong>
                    <span>{r.sub}</span>
                  </div>
                  <ArrowUpRight />
                </button>
              ))
            ) : (
              <Empty
                title="No results"
                text="Try a customer name, job description, or SKU."
              />
            )}
          </div>
        </Drawer>
      )}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? (
            <WarningCircle size={20} />
          ) : (
            <CheckCircle size={20} weight="fill" />
          )}
          <span>{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="login-shell water-header">
      <div className="login-card panel">
        <Waves size={44} />
        <span className="wordmark">CURRENT</span>
        <h1>
          A clearer kind
          <br />
          of workday.
        </h1>
        <p>Sign in to your store’s workspace.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("/login", "POST", { password });
              onSuccess();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            <span>Workspace password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          <Button type="submit" primary disabled={busy}>
            {busy ? "Signing in…" : "Enter workspace"}
            <ArrowRight />
          </Button>
        </form>
        <small>
          <LockKey size={13} />A private space for your business.
        </small>
      </div>
    </div>
  );
}
