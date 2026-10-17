import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore, money, STAGES } from "../store.jsx";
import { Modal, EntityForm } from "../ui.jsx";
import Timeline from "../Timeline.jsx";
import { fmtDate } from "../ui.jsx";

export default function Deals({ search }) {
  const { state, save, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const [over, setOver] = useState("");

  const name = (list, id) => list.find((x) => x.id === id)?.name || "";
  const q = search.toLowerCase();
  const deals = state.deals.filter(
    (d) => !q || d.title.toLowerCase().includes(q) || name(state.companies, d.companyId).toLowerCase().includes(q)
  );

  const fields = [
    { key: "title", label: "Title", required: true, full: true },
    { key: "value", label: "Value (USD)", type: "number" },
    { key: "closeDate", label: "Expected close", type: "date" },
    { key: "stage", label: "Stage", options: STAGES.map((s) => ({ value: s, label: s })), noBlank: true },
    { key: "contactId", label: "Contact", options: state.contacts.map((c) => ({ value: c.id, label: c.name })) },
    { key: "companyId", label: "Company", options: state.companies.map((c) => ({ value: c.id, label: c.name })) },
  ];

  function drop(e, stage) {
    e.preventDefault();
    setOver("");
    const id = e.dataTransfer.getData("text/plain");
    const d = state.deals.find((x) => x.id === id);
    if (d && d.stage !== stage) save("deals", { ...d, stage });
  }

  return (
    <>
      <div className="toolbar">
        <button className="btn primary" onClick={() => setEditing({ title: "", value: "", stage: "Lead", contactId: "", companyId: "", closeDate: "" })}>
          <Plus size={16} /> New deal
        </button>
      </div>
      <div className="kanban">
        {STAGES.map((s) => {
          const col = deals.filter((d) => d.stage === s);
          return (
            <div
              key={s}
              className={"column" + (over === s ? " over" : "")}
              onDragOver={(e) => { e.preventDefault(); setOver(s); }}
              onDragLeave={() => setOver("")}
              onDrop={(e) => drop(e, s)}
            >
              <header>
                <span><i className={"dot st-" + s} /> {s} <small>{col.length}</small></span>
                <b>{money(col.reduce((t, d) => t + (Number(d.value) || 0), 0))}</b>
              </header>
              {col.map((d) => (
                <article
                  key={d.id}
                  className="deal"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
                  onClick={() => setEditing(d)}
                >
                  <strong>{d.title}</strong>
                  <div>{money(d.value)}</div>
                  <small>{name(state.companies, d.companyId) || name(state.contacts, d.contactId) || "—"}</small>
                  {d.closeDate && <small>Close {fmtDate(d.closeDate)}</small>}
                </article>
              ))}
            </div>
          );
        })}
      </div>
      {editing && (
        <Modal wide title={editing.id ? "Edit deal" : "New deal"} onClose={() => setEditing(null)}>
          <EntityForm
            fields={fields}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={(v) => { save("deals", { ...v, value: Number(v.value) || 0 }); setEditing(null); }}
            onDelete={editing.id ? () => { if (confirm("Delete this deal?")) { remove("deals", editing.id); setEditing(null); } } : null}
          />
          {editing.id && <Timeline dealId={editing.id} contactId={editing.contactId} />}
        </Modal>
      )}
    </>
  );
}
