import 'server-only';
import { createHmac } from 'node:crypto';

// Novu: HMAC-SHA256(secretKey, value), lowercase hex.
// Used for subscriberHash (value = subscriberId) and agentHash (value = agent identifier).
export function novuHmac(secretKey: string, value: string): string {
  return createHmac('sha256', secretKey).update(value).digest('hex');
}
