import NavBar from "./NavBar.jsx";

export default function AppShell({ view, setView, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="containerWide">
          <div className="topbarInner">
            <NavBar view={view} setView={setView} />
          </div>
        </div>
      </header>

      <main className="app-content">
        <div className="containerWide">{children}</div>
      </main>
    </div>
  );
}