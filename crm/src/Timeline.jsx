import { useState } from "react";
import { Phone, Mail, Users, StickyNote, Trash2 } from "lucide-react";
import { useStore } from "./store.jsx";

const ICONS = { note: StickyNote, call: Phone, email: Mail, meeting: Users };

// Activity log for a contact or deal: pass { contactId } or { dealId } (plus the other if known).
export default function Timeline({ contactId = "", dealId = "" }) {
  const { state, save, remove } = useStore();
  const [type, setType] = useState("note");
  const [text, setText] = useState("");
  const items = state.activities
    .filter((a) => (dealId ? a.dealId === dealId : a.contactId === contactId))
    .sort((a, b) => b.at.localeCompare(a.at));

  function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    save("activities", { type, text: text.trim(), contactId, dealId, at: new Date().toISOString() });
    setText("");
  }

  return (
    <section className="timeline">
      <h4>Activity</h4>
      <form onSubmit={add} className="row">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {Object.keys(ICONS).map((t) => <option key={t}>{t}</option>)}
        </select>
        <input placeholder="Log a note, call, email or meeting…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn primary" type="submit">Add</button>
      </form>
      <ul>
        {items.map((a) => {
          const Icon = ICONS[a.type] || StickyNote;
          return (
            <li key={a.id}>
              <Icon size={16} />
              <div className="grow">
                <div>{a.text}</div>
                <small>{a.type} · {new Date(a.at).toLocaleString()}</small>
              </div>
              <button className="icon" onClick={() => remove("activities", a.id)} aria-label="Delete activity"><Trash2 size={14} /></button>
            </li>
          );
        })}
        {!items.length && <li className="muted">No activity yet.</li>}
      </ul>
    </section>
  );
}
