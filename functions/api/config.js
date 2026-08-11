import { getProductConfig, json } from "./stripe/_shared.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const product = String(url.searchParams.get("product") || "").trim();
  const origin = request.headers.get("origin") || "";

  if (!product) {
    return json({ error: "Missing product." }, 400, origin);
  }

  const config = getProductConfig(env, product);
  if (!config) {
    return json({ error: "Unknown product." }, 404, origin);
  }

  return json({ displayPrice: config.displayPrice }, 200, origin);
}

export function onRequest() {
  return json({ error: "Method not allowed." }, 405);
}
