import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { iso } from "./store.jsx";

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={"modal" + (wide ? " wide" : "")}>
        <header>
          <h3>{title}</h3>
          <button className="icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="body">{children}</div>
      </div>
    </div>
  );
}

// fields: [{ key, label, type?, options?: [{value,label}], required?, full?, noBlank? }]
export function EntityForm({ fields, initial, onSave, onDelete, onCancel, children }) {
  const [v, setV] = useState(initial);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(v); }}>
      <div className="grid2">
        {fields.map((f) => (
          <label key={f.key} className={f.full ? "full" : ""}>
            <span>{f.label}</span>
            {f.options ? (
              <select value={v[f.key] ?? ""} required={f.required} onChange={(e) => set(f.key, e.target.value)}>
                {!f.noBlank && <option value="">—</option>}
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.type === "checkbox" ? (
              <input type="checkbox" checked={!!v[f.key]} onChange={(e) => set(f.key, e.target.checked)} />
            ) : (
              <input
                type={f.type || "text"}
                required={f.required}
                min={f.type === "number" ? 0 : undefined}
                step={f.type === "number" ? "any" : undefined}
                value={v[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </label>
        ))}
      </div>
      {children}
      <div className="actions">
        {onDelete && <button type="button" className="btn danger" onClick={onDelete}>Delete</button>}
        <span className="grow" />
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary">Save</button>
      </div>
    </form>
  );
}

export const Empty = ({ children }) => <div className="empty">{children}</div>;
export const Pill = ({ v }) => <span className={"pill " + v}>{v}</span>;
export const today = () => iso(new Date());
export const fmtDate = (d) =>
  d ? new Date(d.length === 10 ? d + "T00:00" : d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const opts = (list, label) => list.map((x) => ({ value: x.id, label: label(x) }));
