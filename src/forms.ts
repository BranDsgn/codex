import type { Context, Row, Edit, Field } from "./types";
export const options = (values: string[]) =>
  values.map((value) => ({ value, label: value }));
const select = (key: string, label: string, values: string[]): Field => ({
  key,
  label,
  type: "select",
  options: options(values),
});
export function customerForm(record?: Row): Edit {
  return {
    title: record ? "Edit customer" : "New customer",
    entity: "customers",
    record,
    values: record || {
      name: "",
      email: "",
      phone: "",
      address: "",
      plan: "On demand",
      access: "",
      notes: "",
      smsConsent: false,
      tubs: [],
    },
    fields: [
      { key: "name", label: "Full name", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Service address" },
      select("plan", "Service plan", [
        "Weekly care",
        "Monthly care",
        "On demand",
      ]),
      { key: "access", label: "Access instructions", type: "textarea" },
      { key: "notes", label: "Office notes", type: "textarea" },
      {
        key: "smsConsent",
        label: "Customer has given SMS consent",
        type: "checkbox",
        hint: "Record consent before connecting outgoing messaging.",
      },
    ],
  };
}
export function jobForm(ctx: Context, record?: Row): Edit {
  return {
    title: record ? "Reschedule / edit job" : "Schedule a job",
    entity: "jobs",
    record,
    values: record
      ? {
          ...record,
          startTime: `${String(Math.floor(record.start / 60)).padStart(2, "0")}:${String(record.start % 60).padStart(2, "0")}`,
          price: record.priceCents / 100,
        }
      : {
          customerId: ctx.data.customers[0]?.id || "",
          tubId: "",
          title: "Weekly spa care",
          type: "Cleaning",
          crew: "unassigned",
          date: ctx.today,
          startTime: "09:00",
          duration: 60,
          status: "Unassigned",
          confirmation: "Pending",
          recurrence: "None",
          price: 85,
          notes: "",
          checklist: [false, false, false],
          partsUsed: [],
        },
    fields: [
      {
        key: "customerId",
        label: "Customer",
        type: "select",
        required: true,
        options: ctx.data.customers.map((c) => ({
          value: c.id,
          label: c.name,
        })),
      },
      { key: "title", label: "Service", required: true },
      select("type", "Job type", ["Cleaning", "Repair", "Delivery"]),
      {
        key: "crew",
        label: "Assign crew",
        type: "select",
        options: [
          { value: "unassigned", label: "Leave unassigned" },
          { value: "north", label: "North crew · Evan + Jamie" },
          { value: "lake", label: "Lake crew · Marco + Taylor" },
          { value: "south", label: "South crew · Chris" },
        ],
      },
      { key: "date", label: "Visit date", type: "date", required: true },
      { key: "startTime", label: "Start time", type: "time", required: true },
      {
        key: "duration",
        label: "Duration (minutes)",
        type: "number",
        min: 15,
        max: 480,
        step: 15,
        required: true,
      },
      select("recurrence", "Repeat", ["None", "Weekly", "Biweekly", "Monthly"]),
      {
        key: "price",
        label: "Service price ($)",
        type: "number",
        min: 0,
        step: 0.01,
        required: true,
      },
      select("confirmation", "Confirmation", ["Pending", "Confirmed"]),
      { key: "notes", label: "Job notes", type: "textarea" },
    ],
  };
}
export function inventoryForm(record?: Row): Edit {
  return {
    title: record ? "Edit stock item" : "New inventory item",
    entity: "inventory",
    record,
    values: record
      ? {
          ...record,
          cost: record.costCents / 100,
          price: record.priceCents / 100,
        }
      : {
          name: "",
          sku: "",
          category: "Chemicals",
          stock: 0,
          reorderAt: 5,
          cost: 0,
          price: 0,
          location: "",
        },
    fields: [
      { key: "name", label: "Item name", required: true },
      { key: "sku", label: "Unique SKU", required: true },
      select("category", "Category", [
        "Chemicals",
        "Filters",
        "Parts",
        "Hot tubs",
        "Water testing",
        "Accessories",
      ]),
      {
        key: "stock",
        label: "Units on hand",
        type: "number",
        min: 0,
        required: true,
      },
      {
        key: "reorderAt",
        label: "Low-stock threshold",
        type: "number",
        min: 0,
        required: true,
      },
      {
        key: "cost",
        label: "Unit cost ($)",
        type: "number",
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        key: "price",
        label: "Retail price ($)",
        type: "number",
        min: 0,
        step: 0.01,
        required: true,
      },
      { key: "location", label: "Storage location" },
    ],
  };
}
export function readingForm(ctx: Context, job?: Row): Edit {
  return {
    title: "Log water test",
    entity: "readings",
    values: {
      customerId: job?.customerId || ctx.data.customers[0]?.id || "",
      jobId: job?.id || "",
      date: ctx.today,
      ph: 7.4,
      chlorine: 3,
      alkalinity: 100,
      temperature: 101,
      notes: "",
    },
    fields: [
      {
        key: "customerId",
        label: "Customer",
        type: "select",
        required: true,
        options: ctx.data.customers.map((c) => ({
          value: c.id,
          label: c.name,
        })),
      },
      { key: "date", label: "Test date", type: "date", required: true },
      {
        key: "ph",
        label: "pH",
        type: "number",
        min: 0,
        max: 14,
        step: 0.1,
        required: true,
      },
      {
        key: "chlorine",
        label: "Free chlorine (ppm)",
        type: "number",
        min: 0,
        max: 30,
        step: 0.1,
        required: true,
      },
      {
        key: "alkalinity",
        label: "Alkalinity (ppm)",
        type: "number",
        min: 0,
        max: 1000,
        required: true,
      },
      {
        key: "temperature",
        label: "Temperature (°F)",
        type: "number",
        min: 32,
        max: 120,
        required: true,
      },
      { key: "notes", label: "Observations / treatment", type: "textarea" },
    ],
  };
}
export function workflowForm(record?: Row): Edit {
  return {
    title: record ? "Edit workflow" : "Build a workflow",
    entity: "workflows",
    record,
    values: record || {
      name: "",
      trigger: "job.created",
      action: "draft_sms",
      template: "Hi {{customer}}, your {{service}} is scheduled for {{date}}.",
      enabled: false,
    },
    fields: [
      { key: "name", label: "Workflow name", required: true },
      {
        key: "trigger",
        label: "When this happens",
        type: "select",
        options: [
          { value: "job.created", label: "A job is scheduled" },
          { value: "job.completed", label: "A visit is completed" },
          { value: "invoice.created", label: "An invoice is created" },
        ],
      },
      {
        key: "action",
        label: "Then do this",
        type: "select",
        options: [
          { value: "draft_sms", label: "Create an SMS draft" },
          { value: "draft_email", label: "Create an email draft" },
          { value: "create_task", label: "Create an office follow-up task" },
        ],
      },
      {
        key: "template",
        label: "Message / task content",
        type: "textarea",
        required: true,
        hint: "Available fields: {{customer}}, {{service}}, {{date}}",
      },
      {
        key: "enabled",
        label: "Enable this workflow",
        type: "checkbox",
        hint: "Enabled workflows create drafts or tasks when events occur. Nothing is sent externally.",
      },
    ],
  };
}
export function salesForm(ctx: Context, record?: Row): Edit {
  return {
    title: record ? "Edit opportunity" : "New opportunity",
    entity: "sales",
    record,
    values: record
      ? { ...record, value: record.valueCents / 100 }
      : {
          customerId: ctx.data.customers[0]?.id || "",
          title: "",
          stage: "New lead",
          value: 0,
          nextStep: "",
          notes: "",
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
      { key: "title", label: "Opportunity", required: true },
      select("stage", "Stage", [
        "New lead",
        "Consultation",
        "Quote sent",
        "Won",
        "Lost",
      ]),
      {
        key: "value",
        label: "Value ($)",
        type: "number",
        min: 0,
        step: 0.01,
        required: true,
      },
      { key: "nextStep", label: "Next step" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  };
}
export function invoiceForm(ctx: Context, job?: Row): Edit {
  return {
    title: "Create invoice",
    entity: "invoices",
    values: {
      customerId: job?.customerId || ctx.data.customers[0]?.id || "",
      jobId: job?.id || "",
      number: "",
      status: "Draft",
      dueDate: ctx.today,
      description: job?.title || "Spa service",
      quantity: 1,
      price: (job?.priceCents || 8500) / 100,
      taxPercent: 0,
      notes: "",
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
      { key: "description", label: "Line item description", required: true },
      {
        key: "quantity",
        label: "Quantity",
        type: "number",
        min: 1,
        required: true,
      },
      {
        key: "price",
        label: "Unit price ($)",
        type: "number",
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        key: "taxPercent",
        label: "Sales tax (%)",
        type: "number",
        min: 0,
        max: 30,
        step: 0.01,
        required: true,
      },
      { key: "dueDate", label: "Due date", type: "date", required: true },
      select("status", "Status", ["Draft", "Awaiting payment"]),
      { key: "notes", label: "Invoice notes", type: "textarea" },
    ],
  };
}
export function prepareValues(edit: Edit, values: Record<string, any>) {
  const v = { ...values };
  delete v.id;
  delete v.version;
  if (edit.entity === "jobs") {
    const [h, m] = v.startTime.split(":").map(Number);
    v.start = h * 60 + m;
    delete v.startTime;
    v.priceCents = Math.round(v.price * 100);
    delete v.price;
    if (edit.record && edit.record.customerId !== v.customerId) v.tubId = "";
    if (!edit.record || ["Scheduled", "Unassigned"].includes(v.status))
      v.status = v.crew === "unassigned" ? "Unassigned" : "Scheduled";
  }
  if (edit.entity === "inventory") {
    v.costCents = Math.round(v.cost * 100);
    v.priceCents = Math.round(v.price * 100);
    delete v.cost;
    delete v.price;
  }
  if (edit.entity === "sales") {
    v.valueCents = Math.round(v.value * 100);
    delete v.value;
  }
  if (edit.entity === "invoices") {
    v.items = [
      {
        description: v.description,
        quantity: v.quantity,
        unitCents: Math.round(v.price * 100),
      },
    ];
    v.taxBps = Math.round(v.taxPercent * 100);
    for (const key of ["description", "quantity", "price", "taxPercent"])
      delete v[key];
  }
  return v;
}
