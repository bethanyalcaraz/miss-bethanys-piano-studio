import { travelFee } from "./travel-fee.js";

// Serves the static site, plus the travel fee estimate at /api/travel-fee.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/travel-fee") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return travelFee(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
