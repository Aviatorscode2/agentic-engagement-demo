import 'server-only';
import Courier from '@trycourier/courier';
import { buildDemoOrder } from '@/lib/order';
import { requireEnv } from '../env';

function client() {
  return new Courier({ apiKey: requireEnv('COURIER_API_KEY') });
}

// Inbox auth: a JWT scoped to this user's inbox only, with an expiry.
// Courier warns that omitting expires_in mints a token that never expires.
export async function courierSession(subscriberId: string) {
  const { token } = await client().auth.issueToken({
    scope: `user_id:${subscriberId} inbox:read:messages inbox:write:events`,
    expires_in: '1 hour',
  });
  return { jwt: token };
}

// The flow (inbox send, delay, email, optional AI node) is a Journey built in
// the Courier dashboard. See docs/SETUP.md.
export async function triggerCourier(subscriberId: string, email: string | null) {
  const order = buildDemoOrder(subscriberId);
  // The journey's UUID; Courier doesn't resolve journeys by name.
  const journeyId = requireEnv('COURIER_JOURNEY_ID');

  const result = await client().journeys.invoke(journeyId, {
    user_id: subscriberId,
    profile: email ? { email } : {},
    data: order,
  });

  return { id: result.runId ?? null };
}
