import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "./store.jsx";
import { Modal, EntityForm, Empty } from "./ui.jsx";

// A searchable table with a create/edit/delete modal for one collection.
// config: { kind, noun, columns:[{h, r:(row,state)=>node}], fields:(state)=>[], blank, match:(row,q,state)=>bool,
//           prepare?:(values)=>values, extra?:(row,state)=>node, filters?:node, filter?:(row)=>bool, actions?:node }
export default function DataPage({ config, search }) {
  const { state, save, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const q = search.toLowerCase();
  const rows = state[config.kind].filter((r) => (!config.filter || config.filter(r, state)) && (!q || config.match(r, q, state)));

  function onDelete() {
    if (!confirm(`Delete this ${config.noun}?`)) return;
    const why = remove(config.kind, editing.id);
    if (why) alert(`Can't delete: ${why}.`);
    else setEditing(null);
  }

  return (
    <>
      <div className="toolbar">
        {config.filters}
        <span className="grow" />
        {config.actions}
        <button className="btn primary" onClick={() => setEditing({ ...config.blank })}>
          <Plus size={16} /> New {config.noun}
        </button>
      </div>
      <div className="card flush">
        <table>
          <thead><tr>{config.columns.map((c) => <th key={c.h} className={c.num ? "num" : ""}>{c.h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => setEditing(r)}>
                {config.columns.map((c) => <td key={c.h} className={c.num ? "num" : ""}>{c.r(r, state)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty>No {config.noun}s found.</Empty>}
      </div>
      {editing && (
        <Modal wide={!!config.extra} title={editing.id ? `Edit ${config.noun}` : `New ${config.noun}`} onClose={() => setEditing(null)}>
          <EntityForm
            fields={config.fields(state)}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={(v) => { save(config.kind, config.prepare ? config.prepare(v, state) : v); setEditing(null); }}
            onDelete={editing.id ? onDelete : null}
          >
            {editing.id && config.extra?.(editing, state)}
          </EntityForm>
        </Modal>
      )}
    </>
  );
}
