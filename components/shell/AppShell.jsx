import NavBar from "./NavBar.jsx";
import MobileNav from "./MobileNav.jsx";

export default function AppShell({ view, setView, children }) {
  return (
    <div className="app-shell">
      <NavBar view={view} setView={setView} />
      <main className="app-content">{children}</main>
      <MobileNav view={view} setView={setView} />
    </div>
  );
}