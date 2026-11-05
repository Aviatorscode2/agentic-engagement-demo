import 'server-only';
import { env } from './env';

// Best-effort, in-memory limiter. On serverless hosts each instance keeps its
// own counts, so treat this as a speed bump, not a guarantee. For a heavily
// shared demo, swap in Upstash Redis or Vercel KV.
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

export function allow(key: string): boolean {
  const limit = Number(env('DEMO_RATE_LIMIT') ?? '5');
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);
  return true;
}
