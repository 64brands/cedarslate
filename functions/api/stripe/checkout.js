import {
  corsPreflight,
  getProductConfig,
  isAllowedReturnUrl,
  json,
  stripeRequest,
} from "./_shared.js";

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin") || "";

  try {
    const type = request.headers.get("content-type") || "";
    if (!type.includes("application/json")) {
      return json({ error: "Invalid request." }, 415, origin);
    }

    const body = await request.json();
    const product = String(body.product || "").trim();
    const returnUrl = String(body.returnUrl || "").trim().replace(/\/$/, "");

    if (!product || !returnUrl) {
      return json({ error: "Missing product or return URL." }, 400, origin);
    }

    if (!isAllowedReturnUrl(returnUrl)) {
      return json({ error: "Invalid return URL." }, 403, origin);
    }

    const config = getProductConfig(env, product);
    if (!config?.priceId) {
      return json({ error: "Unknown product." }, 404, origin);
    }

    const sessionParams = {
      mode: "subscription",
      line_items: [{ price: config.priceId, quantity: 1 }],
      success_url: `${returnUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}/#upgrade`,
      client_reference_id: product,
      metadata: { product },
    };

    if (env.STRIPE_AUTOMATIC_TAX === "true") {
      sessionParams.automatic_tax = { enabled: true };
    }

    const session = await stripeRequest(
      env.STRIPE_SECRET_KEY,
      "/v1/checkout/sessions",
      sessionParams,
    );

    return json({ url: session.url }, 200, origin);
  } catch (error) {
    console.error("Checkout error", error);
    return json(
      { error: error.message || "Checkout unavailable." },
      error.status || 500,
      origin,
    );
  }
}

export async function onRequestOptions({ request }) {
  return corsPreflight(request.headers.get("origin") || "");
}

export function onRequest() {
  return json({ error: "Method not allowed." }, 405);
}
