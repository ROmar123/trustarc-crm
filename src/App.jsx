import TrustArcV2 from "./v2/TrustArcV2.jsx";

// The old CRM pages remain in source for controlled data/workflow migration.
// The V2 shell is the replacement entry point on this development branch.
export default function App() {
  return <TrustArcV2 />;
}
