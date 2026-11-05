'use client';

import { KnockFeedProvider, KnockProvider, NotificationFeed } from '@knocklabs/react';
import '@knocklabs/react/dist/index.css';
import { TriggerCard } from '@/components/TriggerCard';
import { StepCard } from '@/components/StepCard';
import { NotAvailable } from '@/components/NotAvailable';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY ?? '';
const FEED_ID = process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID ?? '';

export default function KnockPanel({
  subscriberId,
  userToken,
  ownerToken,
}: {
  subscriberId: string;
  userToken: string;
  ownerToken: string | null;
}) {
  if (!PUBLIC_KEY || !FEED_ID) {
    return (
      <div className="notice warn">
        Knock isn&apos;t configured (NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY, NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID).
      </div>
    );
  }

  return (
    <div className="grid">
      <TriggerCard
        vendor="knock"
        subscriberId={subscriberId}
        ownerToken={ownerToken}
        flow={[
          { kind: 'ai', title: 'Agent step', detail: 'Writes a personal line. Knock-hosted model, uses AI credits.' },
          { kind: 'inapp', title: 'In-app message', detail: 'Delivered to the Knock feed.' },
          { kind: 'wait', title: 'Wait 2 minutes', detail: 'Gives the customer time to read it.' },
          { kind: 'email', title: 'Email if unread', detail: 'Message status condition on the in-app step.' },
        ]}
        source="Workflow built in the Knock dashboard. The CLI and Management API also work."
      />

      <StepCard n={2} label="Receive" title="In-app feed" hint="Mark the message read to cancel the email.">
        <div className="inbox-frame knock-frame">
          <KnockProvider apiKey={PUBLIC_KEY} user={{ id: subscriberId }} userToken={userToken}>
            <KnockFeedProvider feedId={FEED_ID} colorMode="dark">
              <NotificationFeed />
            </KnockFeedProvider>
          </KnockProvider>
        </div>
      </StepCard>

      <StepCard n={3} label="Reply" title="Ask the support agent">
        <NotAvailable
          title="No end-user conversations found"
          checked="October 2026"
          sources={[
            { label: 'Knock agent', href: 'https://docs.knock.app/ai/agent' },
            { label: 'Replying to chat messages', href: 'https://docs.knock.app/integrations/chat/replying-to-chat-messages' },
          ]}
        >
          Knock&apos;s agents build and run your messaging, and workflows can reply into
          existing Slack, Teams, and Discord threads. We didn&apos;t find a documented way for a
          customer&apos;s reply to reach an agent. To build this you&apos;d host your own
          inbound webhook, thread matching, and conversation store.
        </NotAvailable>
      </StepCard>
    </div>
  );
}
