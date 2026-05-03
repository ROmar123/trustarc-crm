export default function Card({ title, action, children }) {
  return (
    <div className="card">
      {(title || action) && (
        <div className="cardHead">
          {title && <div className="cardTitle">{title}</div>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}