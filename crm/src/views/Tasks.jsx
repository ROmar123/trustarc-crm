import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "../store.jsx";
import { Modal, EntityForm, Empty, fmtDate, today } from "../ui.jsx";

export default function Tasks({ search }) {
  const { state, save, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("open");
  const q = search.toLowerCase();
  const contact = (id) => state.contacts.find((c) => c.id === id)?.name || "";
  const rows = state.tasks
    .filter((t) => (filter === "all" || (filter === "open" ? !t.done : t.done)) && (!q || t.title.toLowerCase().includes(q)))
    .sort((a, b) => (a.due || "9").localeCompare(b.due || "9"));

  const fields = [
    { key: "title", label: "Task", required: true, full: true },
    { key: "due", label: "Due date", type: "date" },
    { key: "contactId", label: "Contact", options: state.contacts.map((c) => ({ value: c.id, label: c.name })) },
    { key: "dealId", label: "Deal", options: state.deals.map((d) => ({ value: d.id, label: d.title })), full: true },
  ];

  return (
    <>
      <div className="toolbar">
        {["open", "done", "all"].map((f) => (
          <button key={f} className={"chip" + (filter === f ? " on" : "")} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <span className="grow" />
        <button className="btn primary" onClick={() => setEditing({ title: "", due: today(), done: false, contactId: "", dealId: "" })}>
          <Plus size={16} /> New task
        </button>
      </div>
      <div className="card flush">
        {rows.map((t) => (
          <div className={"task" + (t.done ? " done" : "")} key={t.id}>
            <input type="checkbox" checked={t.done} onChange={() => save("tasks", { ...t, done: !t.done })} aria-label="Done" />
            <div className="grow" onClick={() => setEditing(t)}>
              <div>{t.title}</div>
              <small>{contact(t.contactId)}</small>
            </div>
            <small className={!t.done && t.due && t.due < today() ? "late" : ""}>{fmtDate(t.due)}</small>
            <button className="icon" onClick={() => remove("tasks", t.id)} aria-label="Delete task"><Trash2 size={15} /></button>
          </div>
        ))}
        {!rows.length && <Empty>Nothing here.</Empty>}
      </div>
      {editing && (
        <Modal title={editing.id ? "Edit task" : "New task"} onClose={() => setEditing(null)}>
          <EntityForm
            fields={fields}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={(v) => { save("tasks", v); setEditing(null); }}
          />
        </Modal>
      )}
    </>
  );
}
