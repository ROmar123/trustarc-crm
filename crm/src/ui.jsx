import { useEffect, useState } from "react";
import { X } from "lucide-react";

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

// fields: [{ key, label, type?, options?: [{value,label}], required? }]
export function EntityForm({ fields, initial, onSave, onDelete, onCancel }) {
  const [v, setV] = useState(initial);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v);
      }}
    >
      <div className="grid2">
        {fields.map((f) => (
          <label key={f.key} className={f.full ? "full" : ""}>
            <span>{f.label}</span>
            {f.options ? (
              <select value={v[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}>
                {!f.noBlank && <option value="">—</option>}
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || "text"}
                required={f.required}
                value={v[f.key] ?? ""}
                onChange={(e) => set(f.key, f.type === "number" ? e.target.value : e.target.value)}
              />
            )}
          </label>
        ))}
      </div>
      <div className="actions">
        {onDelete && (
          <button type="button" className="btn danger" onClick={onDelete}>Delete</button>
        )}
        <span className="grow" />
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary">Save</button>
      </div>
    </form>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export const fmtDate = (d) => (d ? new Date(d.length === 10 ? d + "T00:00" : d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—");
export const today = () => new Date().toISOString().slice(0, 10);
