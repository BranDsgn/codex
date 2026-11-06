export type Row = { id: string; version: number; [key: string]: any };
export type Entity =
  | "customers"
  | "jobs"
  | "inventory"
  | "invoices"
  | "readings"
  | "sales"
  | "workflows"
  | "messages"
  | "tasks";
export type Data = Record<Entity, Row[]>;
export type Page =
  | "Dispatch"
  | "Customers"
  | "Work orders"
  | "Routes"
  | "Water care"
  | "Sales"
  | "Inventory"
  | "Billing"
  | "Inbox"
  | "Workflows"
  | "Import center"
  | "Portal"
  | "Reports"
  | "Settings";
export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "number"
    | "date"
    | "time"
    | "select"
    | "textarea"
    | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
};
export type Edit = {
  title: string;
  entity: Entity;
  record?: Row;
  values: Record<string, any>;
  fields: Field[];
};
export type Context = {
  data: Data;
  today: string;
  save: (
    entity: Entity,
    values: Record<string, any>,
    record?: Row,
  ) => Promise<Row>;
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
  edit: (edit: Edit) => void;
  openJob: (job: Row) => void;
  openCustomer: (customer: Row) => void;
  navigate: (page: Page) => void;
  search: string;
};
export const emptyData: Data = {
  customers: [],
  jobs: [],
  inventory: [],
  invoices: [],
  readings: [],
  sales: [],
  workflows: [],
  messages: [],
  tasks: [],
};
export const crews = [
  {
    id: "north",
    name: "North crew",
    people: "Evan + Jamie",
    initials: ["EV", "JL"],
  },
  {
    id: "lake",
    name: "Lake crew",
    people: "Marco + Taylor",
    initials: ["MP", "TM"],
  },
  { id: "south", name: "South crew", people: "Chris", initials: ["CH"] },
];
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
export const time = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  return `${h % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
export const dateLabel = (date: string, short = false) =>
  new Date(date + "T12:00:00").toLocaleDateString(
    "en-US",
    short
      ? { month: "short", day: "numeric" }
      : { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  );
export const addDays = (date: string, days: number) => {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
export const invoiceTotal = (inv: Row) => {
  const subtotal = inv.items.reduce(
    (n: number, i: any) => n + i.quantity * i.unitCents,
    0,
  );
  return subtotal + Math.round((subtotal * inv.taxBps) / 10000);
};
export const match = (row: Row, query: string) => {
  const text = JSON.stringify(row).toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((term) => text.includes(term));
};
