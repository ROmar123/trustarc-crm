import TrustArcApp from "./v2/TrustArcApp.jsx";

// TrustArc 2.0 is the replacement application entry point on the isolated preview branch.
// Legacy CRM pages remain intact until safe data migration and role-level access tests pass.
export default function App() {
  return <TrustArcApp />;
}
