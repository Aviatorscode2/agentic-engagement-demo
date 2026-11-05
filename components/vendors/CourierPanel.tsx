'use client';

import { useEffect } from 'react';
import { CourierInbox, useCourier } from '@trycourier/courier-react';
import { TriggerCard } from '@/components/TriggerCard';
import { StepCard } from '@/components/StepCard';
import { NotAvailable } from '@/components/NotAvailable';

export default function CourierPanel({
  subscriberId,
  jwt,
  ownerToken,
}: {
  subscriberId: string;
  jwt: string;
  ownerToken: string | null;
}) {
  return (
    <div className="grid">
      <TriggerCard
        vendor="courier"
        subscriberId={subscriberId}
        ownerToken={ownerToken}
        flow={[
          { kind: 'ai', title: 'AI node', detail: 'Writes a personal line. Business plan plus AI credits.' },
          { kind: 'inapp', title: 'In-app message', detail: 'Delivered to the Courier Inbox.' },
          { kind: 'wait', title: 'Wait 2 minutes', detail: 'Gives the customer time to read it.' },
          {
            kind: 'email',
            title: 'Email if not opened',
            detail: 'Send status condition. Courier marks the Inbox message opened when it’s shown, not when it’s read.',
            caveat: true,
          },
        ]}
        source="Journey built in the Courier dashboard."
      />

      <StepCard n={2} label="Receive" title="In-app inbox" hint="Messages appear here after shipping.">
        <CourierInboxSignedIn userId={subscriberId} jwt={jwt} />
      </StepCard>

      <StepCard n={3} label="Reply" title="Ask the support agent">
        <NotAvailable
          title="No end-user conversations found"
          checked="October 2026"
          sources={[
            { label: 'Docs index', href: 'https://www.courier.com/docs/llms.txt' },
            { label: 'Send from an AI agent', href: 'https://www.courier.com/docs/guides/send-from-an-ai-agent' },
          ]}
        >
          Courier lets agents send messages through its MCP server and run AI nodes inside
          Journeys. Inbound webhooks can start a Journey, but we didn&apos;t find a documented way
          for a customer&apos;s reply to reach an agent on the same thread. You&apos;d build the
          conversation layer yourself.
        </NotAvailable>
      </StepCard>
    </div>
  );
}

// Matches Courier's dark inbox to the page palette (see app/globals.css).
const INBOX_THEME = {
  inbox: {
    header: {
      backgroundColor: '#15151f',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      feeds: { button: { unreadCountIndicator: { backgroundColor: '#ff7a45' } } },
    },
    list: {
      backgroundColor: '#15151f',
      item: {
        backgroundColor: '#15151f',
        hoverBackgroundColor: '#1b1b27',
        unreadIndicatorColor: '#ff7a45',
        divider: '1px solid rgba(255, 255, 255, 0.06)',
      },
    },
  },
};

function CourierInboxSignedIn({ userId, jwt }: { userId: string; jwt: string }) {
  const courier = useCourier();

  useEffect(() => {
    courier.shared.signIn({ userId, jwt });
    // Sign out on unmount so switching tabs doesn't leave a stale socket open.
    return () => {
      courier.shared.signOut();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, jwt]);

  return (
    <div className="inbox-frame">
      <CourierInbox mode="dark" height="100%" darkTheme={INBOX_THEME} />
    </div>
  );
}
