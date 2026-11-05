import { NextResponse } from 'next/server';
import { parseSubscriberId } from '@/lib/server/demo-request';
import { MissingConfigError } from '@/lib/server/env';
import { novuSession } from '@/lib/server/vendors/novu';
import { knockSession } from '@/lib/server/vendors/knock';
import { courierSession } from '@/lib/server/vendors/courier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns everything each vendor's in-app UI needs to authenticate this
// reader. Each vendor is resolved independently: a missing key for one shows
// "not configured" on that tab only.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const subscriberId = parseSubscriberId(body?.subscriberId);
  if (!subscriberId) {
    return NextResponse.json({ error: 'Invalid subscriberId' }, { status: 400 });
  }

  const [novu, knock, courier] = await Promise.allSettled([
    Promise.resolve().then(() => novuSession(subscriberId)),
    knockSession(subscriberId),
    courierSession(subscriberId),
  ]);

  return NextResponse.json({
    subscriberId,
    novu: settle(novu),
    knock: settle(knock),
    courier: settle(courier),
  });
}

function settle<T>(result: PromiseSettledResult<T>) {
  if (result.status === 'fulfilled') return { ok: true as const, ...result.value };

  const reason = result.reason;
  if (reason instanceof MissingConfigError) {
    return { ok: false as const, error: `Not configured (${reason.variable})` };
  }
  console.error(reason);
  return { ok: false as const, error: 'Could not start a session' };
}
