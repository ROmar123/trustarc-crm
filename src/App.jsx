import { useState } from "react";
import AppShell from "./components/shell/AppShell";

import Overview from "./pages/Overview";
import Customers from "./pages/Customers";
import Routes from "./pages/Routes";
import Subscriptions from "./pages/Subscriptions";
import Billing from "./pages/Billing";

export default function App() {
  const [view, setView] = useState("overview");

  return (
    <AppShell view={view} setView={setView}>
      {view === "overview" && <Overview />}
      {view === "customers" && <Customers />}
      {view === "routes" && <Routes />}
      {view === "subscriptions" && <Subscriptions />}
      {view === "billing" && <Billing />}
    </AppShell>
  );
}