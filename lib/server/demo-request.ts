import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { env } from './env';

// Readers get a random ID like "demo-k3j9x2m1q8". Anything else is rejected,
// so nobody can target real users or other vendors' records through the demo.
const SUBSCRIBER_ID = /^demo-[a-z0-9]{10}$/;

export function parseSubscriberId(value: unknown): string | null {
  return typeof value === 'string' && SUBSCRIBER_ID.test(value) ? value : null;
}

// Owner mode adds a real email address so the email fallback sends.
// Readers never trigger email.
export function ownerEmail(ownerToken: unknown): string | null {
  const expected = env('DEMO_OWNER_TOKEN');
  const target = env('DEMO_EMAIL_TO');
  if (!expected || !target || typeof ownerToken !== 'string') return null;

  const a = Buffer.from(ownerToken);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? target : null;
}

export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
