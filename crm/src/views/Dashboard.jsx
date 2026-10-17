import { useStore, money, STAGES } from "../store.jsx";
import { fmtDate, today } from "../ui.jsx";

export default function Dashboard({ go }) {
  const { state } = useStore();
  const { deals, tasks, contacts } = state;
  const open = deals.filter((d) => !["Won", "Lost"].includes(d.stage));
  const won = deals.filter((d) => d.stage === "Won");
  const lost = deals.filter((d) => d.stage === "Lost");
  const winRate = won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
  const sum = (a) => a.reduce((s, d) => s + (Number(d.value) || 0), 0);
  const overdue = tasks.filter((t) => !t.done && t.due && t.due < today());
  const upcoming = tasks.filter((t) => !t.done).sort((a, b) => (a.due || "9").localeCompare(b.due || "9")).slice(0, 6);
  const max = Math.max(1, ...STAGES.map((s) => sum(deals.filter((d) => d.stage === s))));

  const stats = [
    ["Open pipeline", money(sum(open)), `${open.length} deals`, "deals"],
    ["Won", money(sum(won)), `${won.length} deals`, "deals"],
    ["Win rate", `${winRate}%`, `${won.length} won · ${lost.length} lost`, "deals"],
    ["Contacts", contacts.length, `${contacts.filter((c) => c.status === "Lead").length} leads`, "contacts"],
    ["Overdue tasks", overdue.length, "need attention", "tasks"],
  ];

  return (
    <>
      <div className="stats">
        {stats.map(([l, v, s, to]) => (
          <button key={l} className="stat" onClick={() => go(to)}>
            <small>{l}</small>
            <strong>{v}</strong>
            <span>{s}</span>
          </button>
        ))}
      </div>
      <div className="cols">
        <section className="card">
          <h3>Pipeline by stage</h3>
          {STAGES.map((s) => {
            const v = sum(deals.filter((d) => d.stage === s));
            return (
              <div className="bar" key={s}>
                <span>{s}</span>
                <div><i style={{ width: `${(v / max) * 100}%` }} className={"st-" + s} /></div>
                <b>{money(v)}</b>
              </div>
            );
          })}
        </section>
        <section className="card">
          <h3>Upcoming tasks</h3>
          {upcoming.map((t) => (
            <div className="line" key={t.id}>
              <span>{t.title}</span>
              <small className={t.due && t.due < today() ? "late" : ""}>{fmtDate(t.due)}</small>
            </div>
          ))}
          {!upcoming.length && <p className="muted">All caught up.</p>}
        </section>
      </div>
    </>
  );
}
