import {
  ArrowRight,
  CheckCircle,
  Database,
  DownloadSimple,
  FileCsv,
  ShieldCheck,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { api } from "./api";
import type { Context } from "./types";
import { Badge, Button, Heading, Table } from "./ui";
type ImportRow = Record<string, string>;
const mappings = [
  ["name", "Customer name"],
  ["email", "Email address"],
  ["phone", "Phone"],
  ["address", "Service address"],
] as const;
export function ImportCenter({ ctx }: { ctx: Context }) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const normalized = rows.map((r) => ({
    name: r[mapping.name]?.trim() || "",
    email: r[mapping.email]?.trim() || "",
    phone: r[mapping.phone]?.trim() || "",
    address: r[mapping.address]?.trim() || "",
    plan: "On demand",
    access: "",
    notes: "Imported from reviewed CSV.",
    smsConsent: false,
    tubs: [],
  }));
  const seen = new Set(
    ctx.data.customers.filter((c) => c.email).map((c) => c.email.toLowerCase()),
  );
  const identity = (c: { name: string; address: string }) =>
    c.address.trim()
      ? c.name.trim().toLowerCase().replace(/\s+/g, " ") +
        "|" +
        c.address.trim().toLowerCase().replace(/\s+/g, " ")
      : null;
  const identities = new Set(
    ctx.data.customers
      .map((c) => identity({ name: c.name, address: c.address }))
      .filter(Boolean),
  );
  const issues = normalized.map((r, i) => {
    const result = [];
    if (!r.name) result.push("Customer name is missing");
    if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))
      result.push("Email needs review");
    if (r.email) {
      if (seen.has(r.email.toLowerCase())) result.push("Duplicate email");
      seen.add(r.email.toLowerCase());
    }
    const key = identity(r);
    if (key) {
      if (identities.has(key)) result.push("Matching name/address");
      identities.add(key);
    }
    return { row: i + 1, errors: result };
  });
  const invalid = issues.filter((i) => i.errors.length);
  const load = (file: File) => {
    setError("");
    if (file.size > 2 * 1024 * 1024) {
      setError("Choose a CSV smaller than 2 MB.");
      return;
    }
    Papa.parse<ImportRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().replace(/^\uFEFF/, ""),
      complete: (result) => {
        if (result.errors.length) {
          setError(
            "The CSV has a formatting issue: " + result.errors[0].message,
          );
          return;
        }
        if (!result.data.length || result.data.length > 1000) {
          setError("Use a CSV with 1–1,000 customer rows.");
          return;
        }
        const h = result.meta.fields || [];
        setHeaders(h);
        setRows(result.data);
        const auto: Record<string, string> = {};
        for (const [key, label] of mappings)
          auto[key] =
            h.find((v) =>
              new RegExp(
                key === "name"
                  ? "^(name|customer name|full name|client name)$"
                  : key === "address"
                    ? "^(address|service address|street address)$"
                    : key,
                "i",
              ).test(v),
            ) || "";
        setMapping(auto);
        setStep(2);
      },
      error: (e) => setError(e.message),
    });
  };
  const sample = () => {
    const blob = new Blob(
      [
        'Customer name,Email,Phone,Service address\nTaylor Example,taylor@example.com,(555) 010-9999,"42 Lake Road, Bellevue"\n',
      ],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "current-customer-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <Heading
        title="A fresh start for your data."
        sub="Bring the useful history. Leave the clutter behind."
        eyebrow="IMPORT CENTER"
        action={
          <Button onClick={sample}>
            <DownloadSimple />
            Download CSV template
          </Button>
        }
      />
      <div className="import-steps">
        {["Choose your file", "Map the fields", "Review & import"].map(
          (s, i) => (
            <div className={step >= i + 1 ? "active" : ""} key={s}>
              <span>
                {step > i + 1 ? (
                  <CheckCircle weight="fill" />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <b>{s}</b>
              {i < 2 && <ArrowRight />}
            </div>
          ),
        )}
      </div>
      {error && (
        <div className="error-box" role="alert">
          <WarningCircle />
          {error}
        </div>
      )}
      {done ? (
        <section className="panel import-success">
          <CheckCircle size={52} weight="fill" />
          <h2>{done} customers, a cleaner beginning.</h2>
          <p>Your reviewed customer records are saved.</p>
          <div className="inline-actions">
            <Button primary onClick={() => ctx.navigate("Customers")}>
              View customers
              <ArrowRight />
            </Button>
            <Button
              onClick={() => {
                setDone(0);
                setRows([]);
                setHeaders([]);
                setStep(1);
              }}
            >
              Import another file
            </Button>
          </div>
        </section>
      ) : step === 1 ? (
        <section
          className="panel import-upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) load(f);
          }}
        >
          <span className="upload-icon">
            <FileCsv size={40} />
          </span>
          <h2>Your next chapter starts with a CSV.</h2>
          <p>Drag your customer export here, or choose a file.</p>
          <small>CSV · Up to 1,000 rows · Maximum 2 MB</small>
          <input
            type="file"
            accept=".csv,text/csv"
            ref={ref}
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) load(f);
            }}
          />
          <Button primary onClick={() => ref.current?.click()}>
            <UploadSimple size={18} />
            Choose CSV file
          </Button>
        </section>
      ) : step === 2 ? (
        <section className="panel import-mapping">
          <div className="section-title">
            <h2>Make the connections.</h2>
            <Badge>{rows.length} rows detected</Badge>
          </div>
          <p className="muted">
            Match the columns from your export to Current’s customer fields.
          </p>
          {mappings.map(([key, label]) => (
            <div className="mapping-row" key={key}>
              <div>
                <strong>{label}</strong>
                <small>{key === "name" ? "Required" : "Optional"}</small>
              </div>
              <ArrowRight />
              <select
                aria-label={`CSV column for ${label}`}
                value={mapping[key] || ""}
                onChange={(e) =>
                  setMapping({ ...mapping, [key]: e.target.value })
                }
              >
                <option value="">
                  {key === "name" ? "Choose a column…" : "Do not import"}
                </option>
                {headers.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="form-actions">
            <Button onClick={() => setStep(1)}>Choose another file</Button>
            <Button
              primary
              disabled={!mapping.name}
              onClick={() => {
                setStep(3);
                setError("");
              }}
            >
              Review import
              <ArrowRight />
            </Button>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="table-toolbar">
            <h2>One last look.</h2>
            <Badge tone={invalid.length ? "amber" : "mint"}>
              {invalid.length
                ? `${invalid.length} rows need review`
                : `${rows.length} rows ready`}
            </Badge>
          </div>
          {invalid.length > 0 && (
            <div className="error-box">
              <WarningCircle />
              Fix flagged rows in the source file, then upload it again. No
              records have been imported.
            </div>
          )}
          <Table
            headers={[
              "Row",
              "Customer name",
              "Email",
              "Service address",
              "Review",
            ]}
          >
            {normalized.slice(0, 30).map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{r.name || "—"}</td>
                <td>{r.email || "—"}</td>
                <td>{r.address || "—"}</td>
                <td>
                  <Badge tone={issues[i].errors.length ? "amber" : "mint"}>
                    {issues[i].errors.join(", ") || "Ready"}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
          {rows.length > 30 && (
            <p className="muted table-footer">
              Previewing 30 of {rows.length} rows. All rows are validated.
            </p>
          )}
          <div className="form-actions">
            <Button onClick={() => setStep(2)}>Back to mapping</Button>
            <Button
              primary
              disabled={busy || invalid.length > 0}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = await api("/import/customers", "POST", {
                    rows: normalized,
                  });
                  await ctx.refresh();
                  setDone(result.imported);
                  ctx.notify(`${result.imported} customers imported.`);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Importing…" : `Import ${rows.length} customers`}
              <Database />
            </Button>
          </div>
        </section>
      )}
      <div className="import-notes">
        <div>
          <ShieldCheck />
          <h3>Review before it lands.</h3>
          <p>
            Field mapping and duplicate-email checks run before a transactional
            import.
          </p>
        </div>
        <div>
          <Database />
          <h3>A focused first import.</h3>
          <p>
            This importer handles customer contacts. Tub, property, job,
            invoice, and historical service imports need their own mappings.
          </p>
        </div>
        <div>
          <CheckCircle />
          <h3>Consent stays deliberate.</h3>
          <p>
            Imported customers default to no SMS consent. Confirm it before
            sending any messages.
          </p>
        </div>
      </div>
    </>
  );
}
