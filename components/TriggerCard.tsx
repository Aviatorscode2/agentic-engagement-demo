'use client';

import { useState } from 'react';
import type { Vendor } from '@/lib/client/session';
import { StepCard } from '@/components/StepCard';

type Entry = { at: string; text: string; tone: 'ok' | 'err' };

export type FlowStep = {
  kind: 'ai' | 'inapp' | 'wait' | 'email';
  title: string;
  detail: string;
  // Marks a step that doesn't do what the scenario asks, so readers see it at a glance.
  caveat?: boolean;
};

const ICONS: Record<FlowStep['kind'], React.ReactNode> = {
  ai: <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
  inapp: <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9ZM10.3 21a1.9 1.9 0 0 0 3.4 0" />,
  wait: <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  email: <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm17 1-9 7-9-7" />,
};

// Step 1 on every tab: fire the identical order-shipped event.
export function TriggerCard({
  vendor,
  subscriberId,
  ownerToken,
  flow,
  source,
}: {
  vendor: Vendor;
  subscriberId: string;
  ownerToken: string | null;
  flow: FlowStep[];
  source: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Entry[]>([]);

  const add = (text: string, tone: Entry['tone']) =>
    setLog((prev) => [{ at: new Date().toLocaleTimeString(), text, tone }, ...prev].slice(0, 4));

  async function ship() {
    setBusy(true);
    try {
      const res = await fetch(`/api/trigger/${vendor}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscriberId, ownerToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        add(data.error ?? 'Trigger failed', 'err');
        return;
      }
      add(
        `Triggered in ${data.apiMs} ms. ` +
          (data.emailFallback ? 'Email fallback is on.' : 'Email step is skipped (owner mode off).'),
        'ok',
      );
    } catch {
      add('Network error', 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <StepCard n={1} label="Notify" title="Ship the order">
      <ol className="flow">
        {flow.map((s) => (
          <li key={s.kind} className={s.caveat ? 'caveat' : undefined}>
            <span className="flow-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[s.kind]}
              </svg>
            </span>
            <div>
              <strong>{s.title}</strong>
              <span>{s.detail}</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="flow-source">{source}</p>
      <button className="btn block" onClick={ship} disabled={busy}>
        {busy ? 'Shipping…' : 'Ship order'}
      </button>
      {log.length > 0 && (
        <div className="log" aria-live="polite">
          {log.map((e, i) => (
            <div key={i} className={e.tone}>
              <span className="log-time">{e.at}</span>
              {e.text}
            </div>
          ))}
        </div>
      )}
    </StepCard>
  );
}
