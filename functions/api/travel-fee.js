/*
  Travel fee estimate for in-home lessons.

  Runs on Cloudflare (Pages Functions), not in the visitor's browser, so the
  studio address is never sent to the page. It is read from the private
  Cloudflare setting STUDIO_ADDRESS. The response only names the fee tier,
  never the distance, so the studio location can't be worked out from it.
*/

const EARTH_RADIUS_MILES = 3958.8;
const USER_AGENT = "MissBethanysPianoStudio/1.0 (https://missbethany.studio)";

const TIERS = [
  { maxMiles: 5, fee: 30, label: "within 5 miles of the studio" },
  { maxMiles: 10, fee: 50, label: "5 to 10 miles from the studio" },
  { maxMiles: Infinity, fee: 75, label: "more than 10 miles from the studio" }
];

let studioCache = null;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

function milesBetween(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

async function geocodeCensus(address) {
  const url =
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress" +
    "?benchmark=Public_AR_Current&format=json&address=" +
    encodeURIComponent(address);
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  const match = data && data.result && data.result.addressMatches && data.result.addressMatches[0];
  if (!match) return null;
  return { lat: match.coordinates.y, lon: match.coordinates.x };
}

async function geocodeOsm(address) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=" +
    encodeURIComponent(address);
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || !data[0]) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function geocode(address) {
  try {
    const census = await geocodeCensus(address);
    if (census) return census;
  } catch (e) {}
  try {
    return await geocodeOsm(address);
  } catch (e) {
    return null;
  }
}

export function tierFor(miles) {
  return TIERS.find((t) => miles <= t.maxMiles);
}

export async function onRequestPost({ request, env }) {
  if (!env.STUDIO_ADDRESS) return json({ error: "not_configured" }, 503);

  let address = "";
  try {
    const body = await request.json();
    address = String(body.address || "").trim().slice(0, 200);
  } catch (e) {}
  if (address.length < 5) return json({ error: "address_required" }, 400);

  if (!studioCache) studioCache = await geocode(env.STUDIO_ADDRESS);
  if (!studioCache) return json({ error: "unavailable" }, 502);

  const home = await geocode(address);
  if (!home) return json({ error: "not_found" }, 404);

  const tier = tierFor(milesBetween(studioCache, home));
  return json({ fee: tier.fee, label: tier.label });
}

export { milesBetween };
