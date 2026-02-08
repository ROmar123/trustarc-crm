import { useState } from "react";
import AppShell from "./components/shell/AppShell.jsx";

import Overview from "./pages/Overview.jsx";
import Customers from "./pages/Customers.jsx";
import Routes from "./pages/Routes.jsx";
import RouteDetails from "./pages/RouteDetails.jsx";
import Subscriptions from "./pages/Subscriptions.jsx";
import Billing from "./pages/Billing.jsx";
import InvoiceView from "./pages/InvoiceView.jsx";
import "./index.css";
import "./App.css";

export default function App() {
  const [view, setView] = useState("overview");
  const [routeId, setRouteId] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);

  return (
    <AppShell view={view} setView={setView}>
      {view === "overview" && <Overview />}
      {view === "customers" && <Customers />}
      {view === "routes" && <Routes setView={setView} setRouteId={setRouteId} />}
      {view === "routeDetails" && <RouteDetails routeId={routeId} setView={setView} />}
      {view === "subscriptions" && <Subscriptions />}
      {view === "billing" && <Billing setView={setView} setInvoiceId={setInvoiceId} />}
      {view === "invoiceView" && <InvoiceView invoiceId={invoiceId} setView={setView} />}
    </AppShell>
  );
}