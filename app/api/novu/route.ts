import { serve } from '@novu/framework/next';
import { orderShipped } from '@/novu/workflows/order-shipped';
import { supportAgent } from '@/novu/agents/support-agent';

// The Novu bridge. Novu calls this endpoint to run workflow steps and to hand
// inbound agent messages to your handler. Register its public URL with
// `npm run novu:sync` after deploying (see docs/SETUP.md).
export const { GET, POST, OPTIONS } = serve({
  workflows: [orderShipped],
  agents: [supportAgent],
});
