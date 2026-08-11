export async function onRequestPost(context) {
  const { request, env } = context;

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await request.text();

  const event = await verifyWebhookSignature(
    body,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );
  if (!event) {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log(
        `Checkout completed: product=${session.metadata?.product || session.client_reference_id}, customer=${session.customer}, subscription=${session.subscription}`,
      );
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      console.log(
        `Subscription updated: id=${subscription.id}, status=${subscription.status}`,
      );
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.log(`Subscription cancelled: id=${subscription.id}`);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifyWebhookSignature(payload, sigHeader, secret) {
  const parts = Object.fromEntries(
    sigHeader.split(",").map((part) => {
      const [k, v] = part.split("=");
      return [k, v];
    }),
  );

  const timestamp = parts["t"];
  const receivedSig = parts["v1"];
  if (!timestamp || !receivedSig) return null;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );

  const expectedSig = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expectedSig !== receivedSig) return null;

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
