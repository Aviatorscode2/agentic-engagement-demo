import { NextResponse } from 'next/server';
import { clientIp, ownerEmail, parseSubscriberId } from '@/lib/server/demo-request';
import { MissingConfigError } from '@/lib/server/env';
import { allow } from '@/lib/server/rate-limit';
import { triggerNovu } from '@/lib/server/vendors/novu';
import { triggerKnock } from '@/lib/server/vendors/knock';
import { triggerCourier } from '@/lib/server/vendors/courier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const triggers = {
  novu: triggerNovu,
  knock: triggerKnock,
  courier: triggerCourier,
} as const;

type Vendor = keyof typeof triggers;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ vendor: string }> },
) {
  const { vendor } = await params;
  if (!(vendor in triggers)) {
    return NextResponse.json({ error: 'Unknown vendor' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const subscriberId = parseSubscriberId(body?.subscriberId);
  if (!subscriberId) {
    return NextResponse.json({ error: 'Invalid subscriberId' }, { status: 400 });
  }

  const email = ownerEmail(body?.ownerToken);
  // The owner is exempt so testing isn't throttled.
  if (!email && !allow(`${vendor}:${clientIp(request.headers)}`)) {
    return NextResponse.json(
      { error: 'Too many triggers. Try again in a few minutes.' },
      { status: 429 },
    );
  }

  const started = Date.now();
  try {
    const { id } = await triggers[vendor as Vendor](subscriberId, email);
    return NextResponse.json({
      ok: true,
      vendor,
      runId: id,
      emailFallback: Boolean(email),
      apiMs: Date.now() - started,
    });
  } catch (error) {
    if (error instanceof MissingConfigError) {
      return NextResponse.json(
        { error: `Not configured (${error.variable})` },
        { status: 503 },
      );
    }
    console.error(`[${vendor}] trigger failed`, error);
    return NextResponse.json(
      { error: 'Trigger failed. Check the server logs.' },
      { status: 502 },
    );
  }
}
