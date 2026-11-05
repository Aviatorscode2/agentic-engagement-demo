import 'server-only';
import { Novu } from '@novu/api';
import { DEMO_EVENT, buildDemoOrder } from '@/lib/order';
import { env, requireEnv } from '../env';
import { novuHmac } from '../hmac';

function client() {
  return new Novu({
    secretKey: requireEnv('NOVU_SECRET_KEY'),
    serverURL: env('NOVU_API_URL') ?? undefined,
  });
}

// Hashes the browser needs when HMAC security is on. Computed here so the
// secret key never leaves the server.
export function novuSession(subscriberId: string) {
  const secret = requireEnv('NOVU_SECRET_KEY');
  const agentId = env('NEXT_PUBLIC_NOVU_AGENT_ID') ?? 'parcelly-support';

  return {
    subscriberHash: novuHmac(secret, subscriberId),
    agentHash: novuHmac(secret, agentId),
  };
}

// Same event, same payload as Knock and Courier. The workflow itself lives in
// code: novu/workflows/order-shipped.ts.
export async function triggerNovu(subscriberId: string, email: string | null) {
  const order = buildDemoOrder(subscriberId);

  const result = await client().trigger({
    workflowId: DEMO_EVENT,
    to: {
      subscriberId,
      firstName: order.customerName,
      ...(email ? { email } : {}),
    },
    payload: order,
  });

  return { id: result.result?.transactionId ?? null };
}
