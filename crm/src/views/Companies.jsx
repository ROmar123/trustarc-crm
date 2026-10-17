import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore, money } from "../store.jsx";
import { Modal, EntityForm, Empty } from "../ui.jsx";

const fields = [
  { key: "name", label: "Company name", required: true, full: true },
  { key: "industry", label: "Industry" },
  { key: "website", label: "Website" },
];

export default function Companies({ search }) {
  const { state, save, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const q = search.toLowerCase();
  const rows = state.companies.filter((c) => !q || [c.name, c.industry, c.website].some((x) => (x || "").toLowerCase().includes(q)));

  return (
    <>
      <div className="toolbar">
        <span className="grow" />
        <button className="btn primary" onClick={() => setEditing({ name: "", industry: "", website: "" })}>
          <Plus size={16} /> New company
        </button>
      </div>
      <div className="card flush">
        <table>
          <thead><tr><th>Company</th><th>Industry</th><th>Website</th><th>Contacts</th><th>Open deals</th></tr></thead>
          <tbody>
            {rows.map((c) => {
              const open = state.deals.filter((d) => d.companyId === c.id && !["Won", "Lost"].includes(d.stage));
              return (
                <tr key={c.id} onClick={() => setEditing(c)}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.industry}</td>
                  <td>{c.website}</td>
                  <td>{state.contacts.filter((x) => x.companyId === c.id).length}</td>
                  <td>{open.length} · {money(open.reduce((s, d) => s + (Number(d.value) || 0), 0))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <Empty>No companies match.</Empty>}
      </div>
      {editing && (
        <Modal title={editing.id ? "Edit company" : "New company"} onClose={() => setEditing(null)}>
          <EntityForm
            fields={fields}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={(v) => { save("companies", v); setEditing(null); }}
            onDelete={editing.id ? () => { if (confirm("Delete this company? Contacts and deals are kept.")) { remove("companies", editing.id); setEditing(null); } } : null}
          />
        </Modal>
      )}
    </>
  );
}
