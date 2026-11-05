import 'server-only';
import Knock, { signUserToken } from '@knocklabs/node';
import { buildDemoOrder } from '@/lib/order';
import { env, requireEnv } from '../env';

function client() {
  return new Knock({ apiKey: requireEnv('KNOCK_API_KEY') });
}

// Enhanced security: a short-lived JWT for this user's feed, signed with the
// signing key. signUserToken reads KNOCK_SIGNING_KEY from the environment.
export async function knockSession(subscriberId: string) {
  requireEnv('KNOCK_SIGNING_KEY');
  const userToken = await signUserToken(subscriberId, { expiresInSeconds: 60 * 60 });
  return { userToken };
}

// The workflow (in-app, delay, email if unread, optional agent step) is built
// in the Knock dashboard. See docs/SETUP.md.
export async function triggerKnock(subscriberId: string, email: string | null) {
  const order = buildDemoOrder(subscriberId);
  const workflowKey = env('KNOCK_WORKFLOW_KEY') ?? 'order-shipped';

  const result = await client().workflows.trigger(workflowKey, {
    // Inline identification: Knock creates or updates the user before the run.
    recipients: [
      {
        id: subscriberId,
        name: order.customerName,
        ...(email ? { email } : {}),
      },
    ],
    data: order,
  });

  return { id: result.workflow_run_id ?? null };
}
