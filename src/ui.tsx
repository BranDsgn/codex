import {
  CheckCircle,
  Clock,
  MagnifyingGlass,
  Plus,
  WarningCircle,
  WaveSine,
  X,
} from "@phosphor-icons/react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Edit } from "./types";

export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone || ""}`}>{children}</span>;
}
export function Status({ value }: { value: string }) {
  const success = ["Completed", "Confirmed", "Paid", "Won", "Done"].includes(
    value,
  );
  const pending = [
    "Pending",
    "Awaiting payment",
    "Draft",
    "Unassigned",
  ].includes(value);
  return (
    <Badge tone={success ? "mint" : pending ? "amber" : "blue"}>
      {success ? (
        <CheckCircle size={13} weight="fill" />
      ) : pending ? (
        <Clock size={13} />
      ) : (
        <span className="status-dot" />
      )}
      {value}
    </Badge>
  );
}
export function Empty({
  title = "Nothing here yet",
  text = "Your next step starts here.",
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <WaveSine size={38} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Button({
  children,
  onClick,
  primary = false,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${primary ? "button primary" : "button"} ${className}`}
    >
      {children}
    </button>
  );
}
export function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function Heading({
  title,
  sub,
  action,
  eyebrow,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
export function SectionTitle({
  children,
  meta,
  action,
}: {
  children: ReactNode;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {meta && <span className="muted">{meta}</span>}
      <div className="spacer" />
      {action}
    </div>
  );
}
export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function Drawer({
  title,
  sub,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    const close = () => onClose();
    el?.addEventListener("cancel", close);
    return () => {
      el?.removeEventListener("cancel", close);
      el?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`drawer ${wide ? "wide" : ""}`}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="drawer-content">
        <header className="drawer-header">
          <div>
            <span className="eyebrow">CURRENT / WORKSPACE</span>
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <IconButton label="Close panel" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function Editor({
  edit,
  onSave,
  onClose,
}: {
  edit: Edit;
  onSave: (values: Record<string, any>) => Promise<void>;
  onClose: () => void;
}) {
  const [values, setValues] = useState(edit.values);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(values);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Drawer
      title={edit.title}
      sub="Changes save to your workspace."
      onClose={onClose}
    >
      <form onSubmit={submit} className="editor-form">
        {edit.fields.map((f) => (
          <label
            className={`field ${f.type === "checkbox" ? "check-field" : ""}`}
            key={f.key}
          >
            <span>
              {f.label}
              {f.required && <b className="required"> *</b>}
            </span>
            {f.type === "select" ? (
              <select
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
                required={f.required}
              >
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                value={values[f.key] ?? ""}
                maxLength={5000}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              />
            ) : f.type === "checkbox" ? (
              <input
                type="checkbox"
                checked={!!values[f.key]}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.checked })
                }
              />
            ) : (
              <input
                type={f.type || "text"}
                value={values[f.key] ?? ""}
                min={f.min}
                max={f.max}
                step={f.step}
                required={f.required}
                maxLength={f.type === "number" ? undefined : 2000}
                onChange={(e) =>
                  setValues({
                    ...values,
                    [f.key]:
                      f.type === "number"
                        ? e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                        : e.target.value,
                  })
                }
              />
            )}{" "}
            {f.hint && <small>{f.hint}</small>}
          </label>
        ))}
        {error && (
          <div className="error-box" role="alert">
            <WarningCircle />
            {error}
          </div>
        )}
        <div className="form-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" primary disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
            <CheckCircle size={17} />
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-input">
      <MagnifyingGlass size={18} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}
export const CreateButton = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => (
  <Button primary onClick={onClick}>
    <Plus size={18} />
    {children}
  </Button>
);
export function MetricStrip({
  items,
}: {
  items: { label: string; value: ReactNode; detail?: string }[];
}) {
  return (
    <div className="metric-strip">
      {items.map((i) => (
        <div key={i.label}>
          <span className="eyebrow">{i.label}</span>
          <strong>{i.value}</strong>
          {i.detail && <small>{i.detail}</small>}
        </div>
      ))}
    </div>
  );
}
