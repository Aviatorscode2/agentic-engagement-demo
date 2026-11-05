'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { buildDemoOrder } from '@/lib/order';
import { resetSubscriberId, useDemoSession, useOwnerToken, type Vendor } from '@/lib/client/session';

// Each vendor's UI loads in the browser only: all three inboxes open websockets
// and read browser APIs, so server rendering them gains nothing.
const NovuPanel = dynamic(() => import('./vendors/NovuPanel'), { ssr: false });
const KnockPanel = dynamic(() => import('./vendors/KnockPanel'), { ssr: false });
const CourierPanel = dynamic(() => import('./vendors/CourierPanel'), { ssr: false });

const TABS: { id: Vendor; label: string }[] = [
  { id: 'novu', label: 'Novu' },
  { id: 'knock', label: 'Knock' },
  { id: 'courier', label: 'Courier' },
];

export function Demo() {
  const { session, error } = useDemoSession();
  const ownerToken = useOwnerToken();
  const [active, setActive] = useState<Vendor>('novu');

  if (error) return <div className="notice warn">Couldn&apos;t start the demo: {error}</div>;
  if (!session) return <div className="notice">Creating your demo user…</div>;

  const order = buildDemoOrder(session.subscriberId);
  const vendorSession = session[active];

  return (
    <div className={`demo vendor ${active}`}>
      <div className="toolbar">
        <div className="order-card">
          <span className="order-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
              <path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5" />
            </svg>
          </span>
          <div className="order-main">
            <div className="order-title">
              {order.item}
              <span className="order-id">{order.orderId}</span>
            </div>
            <div className="order-meta">
              <span>{order.carrier}</span>
              <span>Arrives {order.estimatedDelivery}</span>
              <span>To {order.customerName}</span>
            </div>
          </div>
          <div className="order-side">
            {ownerToken && <span className="badge owner">Owner mode · email on</span>}
            <span className="user-id" title="Your private demo user">
              {session.subscriberId}
            </span>
            <button
              className="btn ghost small"
              onClick={() => {
                resetSubscriberId();
                window.location.reload();
              }}
            >
              New demo user
            </button>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Platform">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              className={`tab ${t.id}`}
              onClick={() => setActive(t.id)}
            >
              <span className="tab-dot" aria-hidden />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!vendorSession.ok ? (
        <div className="notice warn">{vendorSession.error}</div>
      ) : active === 'novu' && session.novu.ok ? (
        <NovuPanel
          key="novu"
          subscriberId={session.subscriberId}
          subscriberHash={session.novu.subscriberHash}
          agentHash={session.novu.agentHash}
          ownerToken={ownerToken}
        />
      ) : active === 'knock' && session.knock.ok ? (
        <KnockPanel
          key="knock"
          subscriberId={session.subscriberId}
          userToken={session.knock.userToken}
          ownerToken={ownerToken}
        />
      ) : active === 'courier' && session.courier.ok ? (
        <CourierPanel
          key="courier"
          subscriberId={session.subscriberId}
          jwt={session.courier.jwt}
          ownerToken={ownerToken}
        />
      ) : null}

      <p className="footer-note">
        Same event, same payload, same 2-minute delay on every tab. Email only sends in owner
        mode. Capability claims are dated and link to the docs we checked.
      </p>
    </div>
  );
}
