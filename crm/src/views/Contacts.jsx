import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "../store.jsx";
import { Modal, EntityForm, Empty } from "../ui.jsx";
import Timeline from "../Timeline.jsx";

const STATUSES = ["Lead", "Customer", "Inactive"];

export default function Contacts({ search }) {
  const { state, save, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState("");
  const co = (id) => state.companies.find((c) => c.id === id)?.name || "";
  const q = search.toLowerCase();
  const rows = state.contacts.filter(
    (c) =>
      (!status || c.status === status) &&
      (!q || [c.name, c.email, c.phone, c.title, co(c.companyId)].some((x) => (x || "").toLowerCase().includes(q)))
  );

  const fields = [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "title", label: "Job title" },
    { key: "companyId", label: "Company", options: state.companies.map((c) => ({ value: c.id, label: c.name })) },
    { key: "status", label: "Status", options: STATUSES.map((s) => ({ value: s, label: s })), noBlank: true },
  ];

  return (
    <>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="grow" />
        <button className="btn primary" onClick={() => setEditing({ name: "", email: "", phone: "", title: "", companyId: "", status: "Lead" })}>
          <Plus size={16} /> New contact
        </button>
      </div>
      <div className="card flush">
        <table>
          <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} onClick={() => setEditing(c)}>
                <td><strong>{c.name}</strong><small>{c.title}</small></td>
                <td>{co(c.companyId) || "—"}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td><span className={"pill " + c.status}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty>No contacts match.</Empty>}
      </div>
      {editing && (
        <Modal wide title={editing.id ? editing.name : "New contact"} onClose={() => setEditing(null)}>
          <EntityForm
            fields={fields}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={(v) => { save("contacts", v); setEditing(null); }}
            onDelete={editing.id ? () => { if (confirm("Delete this contact and their tasks and activity?")) { remove("contacts", editing.id); setEditing(null); } } : null}
          />
          {editing.id && <Timeline contactId={editing.id} />}
        </Modal>
      )}
    </>
  );
}
