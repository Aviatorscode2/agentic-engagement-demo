import { agent, toModelMessages } from '@novu/framework/ai-sdk';
import { openai } from '@ai-sdk/openai';
import { generateText, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { buildDemoOrder } from '@/lib/order';

// Scenario 3: the customer talks back. Readers chat with this agent through
// Novu Web Chat. In production the same handler also answers on Slack, Teams,
// WhatsApp, Telegram, and email replies to the order-shipped workflow.
//
// The identifier must match the agent identifier in the Novu dashboard.
export const supportAgent = agent(process.env.NEXT_PUBLIC_NOVU_AGENT_ID ?? 'parcelly-support', {
  onMessage: async (_message, ctx) => {
    const subscriberId = ctx.subscriber?.subscriberId ?? 'demo-unknown00';

    return generateText({
      model: openai('gpt-4o-mini'),
      instructions:
        'You are the support agent for Parcelly, a small online store. ' +
        'Answer questions about the customer\'s order in two or three short sentences. ' +
        'Use the getOrder tool for order details. This is a demo: say so if asked to ' +
        'change anything real, and never invent tracking details.',
      // Passing ctx (not ctx.history) also prepends the originating
      // notification when the conversation started from a workflow reply.
      messages: toModelMessages(ctx),
      tools: {
        getOrder: tool({
          description: 'Look up the customer\'s most recent order and its shipping status.',
          inputSchema: z.object({}),
          execute: async () => ({ ...buildDemoOrder(subscriberId), status: 'shipped' }),
        }),
      },
      stopWhen: stepCountIs(4),
    });
  },
  onError: () => 'Sorry, I couldn\'t answer that just now. Please try again.',
});
