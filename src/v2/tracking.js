/**
 * TrustArc V2 tracking provider contract.
 * No provider credentials, GPS device identifiers or raw customer locations belong in the browser.
 * Production ingestion and authorisation MUST happen server-side.
 */
export const TRACKING_PROVIDERS = Object.freeze(["cartrack", "netstar", "partner", "driver_device"]);

export function normalizePosition(event) {
  if (!event || typeof event !== "object") throw new Error("Position event required");
  const { vehicleId, provider, latitude, longitude, recordedAt } = event;
  if (typeof vehicleId !== "string" || !vehicleId.trim()) throw new Error("Missing TrustArc vehicle ID");
  if (!TRACKING_PROVIDERS.includes(provider)) throw new Error("Unsupported tracking provider");
  if (typeof latitude !== "number" || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("Invalid latitude");
  if (typeof longitude !== "number" || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Invalid longitude");
  const timestamp = Date.parse(recordedAt);
  if (typeof recordedAt !== "string" || !Number.isFinite(timestamp)) throw new Error("Invalid recordedAt timestamp");
  if (timestamp > Date.now() + 120000) throw new Error("Position timestamp is in the future");
  const speedKph = event.speedKph == null ? null : Number(event.speedKph);
  if (speedKph !== null && (!Number.isFinite(speedKph) || speedKph < 0 || speedKph > 250)) throw new Error("Invalid speed");
  return Object.freeze({
    vehicleId: vehicleId.trim(),
    provider,
    latitude,
    longitude,
    recordedAt: new Date(timestamp).toISOString(),
    speedKph,
  });
}

export function positionHealth(position, now = Date.now(), staleAfterMs = 90000) {
  if (!position) return "unavailable";
  const recorded = Date.parse(position.recordedAt);
  if (!Number.isFinite(recorded)) return "unavailable";
  const age = now - recorded;
  if (age < -120000) return "invalid";
  return age > staleAfterMs ? "stale" : "live";
}

export function matchVehicleToActiveTrip(trips, vehicleId) {
  return (trips || []).filter(t => t.vehicleId === vehicleId && ["boarding", "in_progress"].includes(t.status));
}
