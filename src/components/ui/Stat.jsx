export default function Stat({ label, value }) {
  return (
    <div className="card">
      <div className="kpiLabel">{label}</div>
      <div className="kpiValue">{value}</div>
    </div>
  );
}