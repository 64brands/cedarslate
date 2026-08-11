const ALLOWED_ORIGINS = new Set([
  "https://cedarslate.com.au",
  "https://www.cedarslate.com.au",
  "https://signature-studio.pages.dev",
  "https://fruitsalad.email",
  "https://www.fruitsalad.email",
]);

const ALLOWED_RETURN_ORIGINS = new Set([
  "https://signature-studio.pages.dev",
  "https://fruitsalad.email",
  "https://www.fruitsalad.email",
]);

export function json(body, status = 200, origin = "") {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["access-control-allow-origin"] = origin;
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export function corsPreflight(origin) {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type",
    },
  });
}

export function getProductConfig(env, product) {
  const products = {
    "fruit-salad": {
      priceId: env.FRUITSALAD_STRIPE_PRICE_ID || env.STRIPE_PRICE_ID,
      displayPrice: env.FRUITSALAD_DISPLAY_PRICE || env.STRIPE_DISPLAY_PRICE || "",
    },
  };
  return products[product] || null;
}

export function isAllowedReturnUrl(returnUrl) {
  try {
    const url = new URL(returnUrl);
    return ALLOWED_RETURN_ORIGINS.has(url.origin);
  } catch {
    return false;
  }
}

export async function stripeRequest(secretKey, path, params) {
  const body = new URLSearchParams();
  flattenParams(params, body, "");

  const res = await fetch(`https://api.stripe.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (data.error) {
    const error = new Error(data.error.message || "Stripe request failed");
    error.status = data.error.status || 400;
    throw error;
  }
  return data;
}

function flattenParams(obj, params, prefix) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          flattenParams(item, params, `${fullKey}[${index}]`);
        } else {
          params.append(`${fullKey}[${index}]`, String(item));
        }
      });
    } else if (typeof value === "object" && value !== null) {
      flattenParams(value, params, fullKey);
    } else {
      params.append(fullKey, String(value));
    }
  }
}
