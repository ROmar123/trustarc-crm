import test from "node:test";
import assert from "node:assert/strict";
import { normalizePosition, positionHealth, matchVehicleToActiveTrip } from "./tracking.js";

const good = () => ({ vehicleId: "veh-test", provider: "netstar", latitude: -33.9, longitude: 18.48, recordedAt: new Date().toISOString() });

test("normalises supported vehicle telemetry", () => {
  assert.equal(normalizePosition(good()).vehicleId, "veh-test");
  assert.equal(normalizePosition({ ...good(), provider: "cartrack" }).provider, "cartrack");
});
test("rejects invalid coordinates and providers", () => {
  assert.throws(() => normalizePosition({ ...good(), latitude: 999 }), /latitude/);
  assert.throws(() => normalizePosition({ ...good(), provider: "unknown" }), /provider/);
  assert.throws(() => normalizePosition({ ...good(), longitude: Number.NaN }), /longitude/);
});
test("does not treat stale GPS as live", () => {
  const now = Date.parse("2026-11-01T12:00:00Z");
  assert.equal(positionHealth({ recordedAt: "2026-11-01T11:58:00Z" }, now), "stale");
  assert.equal(positionHealth({ recordedAt: "2026-11-01T11:59:30Z" }, now), "live");
  assert.equal(positionHealth(null, now), "unavailable");
});
test("only links an assigned vehicle to active trip instances", () => {
  const t = [{ vehicleId:"veh-test", status:"in_progress" }, {vehicleId:"veh-test", status:"completed"}, {vehicleId:"other", status:"in_progress"}];
  assert.equal(matchVehicleToActiveTrip(t,"veh-test").length, 1);
});
