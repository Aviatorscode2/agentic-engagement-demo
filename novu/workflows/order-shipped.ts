import { workflow } from '@novu/framework';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';

// Scenario 1 (baseline) and Scenario 2 (AI step in the workflow), defined in
// code. Knock and Courier build the same flow in their dashboards.
//
//   personalize (AI) -> in-app -> wait 2 min -> email, only if in-app unread

const payloadSchema = z.object({
  orderId: z.string(),
  customerName: z.string(),
  item: z.string(),
  carrier: z.string(),
  trackingNumber: z.string(),
  trackingUrl: z.string(),
  estimatedDelivery: z.string(),
  shippingAddress: z.string(),
});

export const orderShipped = workflow(
  'order-shipped',
  async ({ step, payload }) => {
    // Novu has no hosted model step, so the model call runs here, in your
    // code, with your key. The result is persisted and reused on retries.
    const personalized = await step.custom(
      'personalize',
      async () => {
        const fallback = `Your ${payload.item} is on its way.`;
        if (!process.env.OPENAI_API_KEY) return { line: fallback };

        try {
          const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt:
              `Write one friendly sentence (max 20 words) telling ${payload.customerName} ` +
              `that their ${payload.item} shipped with ${payload.carrier} and arrives ` +
              `${payload.estimatedDelivery}. No emoji, no greeting.`,
          });
          return { line: text.trim() || fallback };
        } catch {
          return { line: fallback };
        }
      },
      {
        outputSchema: {
          type: 'object',
          properties: { line: { type: 'string' } },
          required: ['line'],
        } as const,
      },
    );

    const inbox = await step.inApp('inbox', async () => ({
      subject: `Order ${payload.orderId} has shipped`,
      body: personalized.line,
      primaryAction: {
        label: 'Track package',
        redirect: { url: payload.trackingUrl, target: '_blank' },
      },
      data: { orderId: payload.orderId },
    }));

    // Short delay so a reader can watch the escalation happen in one sitting.
    await step.delay('wait', async () => ({ unit: 'minutes', amount: 2 }));

    await step.email(
      'email-fallback',
      async () => ({
        subject: `Your order ${payload.orderId} has shipped`,
        body:
          `<p>Hi ${payload.customerName},</p>` +
          `<p>${personalized.line}</p>` +
          `<p>Tracking: <a href="${payload.trackingUrl}">${payload.trackingNumber}</a> ` +
          `(${payload.carrier})</p>`,
      }),
      // Skip the email if the reader already read the in-app message.
      { skip: () => inbox.read === true },
    );
  },
  {
    payloadSchema,
    name: 'Order shipped',
    tags: ['orders'],
  },
);
