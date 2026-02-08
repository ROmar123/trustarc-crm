import { useState } from "react";
import AppShell from "./components/shell/AppShell.jsx";

import Overview from "./pages/Overview.jsx";
import Customers from "./pages/Customers.jsx";
import CustomerDetail from "./pages/CustomerDetail.jsx";
import Routes from "./pages/Routes.jsx";
import RouteDetails from "./pages/RouteDetails.jsx";
import Subscriptions from "./pages/Subscriptions.jsx";
import SubscriptionDetails from "./pages/SubscriptionDetails.jsx";
import Billing from "./pages/Billing.jsx";
import InvoiceView from "./pages/InvoiceView.jsx";

export default function App() {
  const [view, setView] = useState("overview");
  const [context, setContext] = useState({});

  return (
    <AppShell view={view} setView={setView}>
      {view === "overview" && <Overview setView={setView} setContext={setContext} />}

      {view === "customers" && (
        <Customers setView={setView} setContext={setContext} context={context} />
      )}

      {view === "customer_detail" && (
        <CustomerDetail setView={setView} setContext={setContext} context={context} />
      )}

      {view === "routes" && (
        <Routes setView={setView} setContext={setContext} context={context} />
      )}

      {view === "route_details" && (
        <RouteDetails setView={setView} setContext={setContext} context={context} />
      )}

      {view === "subscriptions" && (
        <Subscriptions setView={setView} setContext={setContext} context={context} />
      )}

      {view === "subscription_details" && (
        <SubscriptionDetails setView={setView} setContext={setContext} context={context} />
      )}

      {view === "billing" && (
        <Billing setView={setView} setContext={setContext} context={context} />
      )}

      {view === "invoice" && (
        <InvoiceView setView={setView} setContext={setContext} context={context} />
      )}

      {/* fallback */}
      {![
        "overview",
        "customers",
        "customer_detail",
        "routes",
        "route_details",
        "subscriptions",
        "subscription_details",
        "billing",
        "invoice",
      ].includes(view) && <Overview setView={setView} setContext={setContext} />}
    </AppShell>
  );
}