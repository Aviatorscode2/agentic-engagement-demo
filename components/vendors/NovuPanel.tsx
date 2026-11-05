'use client';

import { FormEvent, useEffect, useRef } from 'react';
import { Inbox, InboxContent } from '@novu/nextjs';
import { NovuProvider, useWebChat } from '@novu/react';
import ReactMarkdown from 'react-markdown';
import { TriggerCard } from '@/components/TriggerCard';
import { StepCard } from '@/components/StepCard';

const APP_ID = process.env.NEXT_PUBLIC_NOVU_APP_ID ?? '';
const AGENT_ID = process.env.NEXT_PUBLIC_NOVU_AGENT_ID ?? 'parcelly-support';

const SUGGESTIONS = ['Where is my order?', 'Can I change the delivery address?'];

export default function NovuPanel({
  subscriberId,
  subscriberHash,
  agentHash,
  ownerToken,
}: {
  subscriberId: string;
  subscriberHash: string;
  agentHash: string;
  ownerToken: string | null;
}) {
  if (!APP_ID) {
    return <div className="notice warn">Novu isn&apos;t configured (NEXT_PUBLIC_NOVU_APP_ID).</div>;
  }

  return (
    <div className="grid">
      <TriggerCard
        vendor="novu"
        subscriberId={subscriberId}
        ownerToken={ownerToken}
        flow={[
          { kind: 'ai', title: 'AI step', detail: 'Writes a personal line. Runs in your code with your model key.' },
          { kind: 'inapp', title: 'In-app message', detail: 'Delivered to the Novu Inbox.' },
          { kind: 'wait', title: 'Wait 2 minutes', detail: 'Gives the customer time to read it.' },
          { kind: 'email', title: 'Email if unread', detail: 'Skipped when the in-app message was read.' },
        ]}
        source={
          <>
            Workflow in code: <code>novu/workflows/order-shipped.ts</code>
          </>
        }
      />

      <StepCard n={2} label="Receive" title="In-app inbox" hint="Mark the message read to cancel the email.">
        <div className="inbox-frame">
          <Inbox
            applicationIdentifier={APP_ID}
            subscriber={subscriberId}
            subscriberHash={subscriberHash}
            appearance={{
              variables: {
                colorPrimary: '#e5307f',
                colorBackground: '#15151f',
                colorForeground: '#ededf5',
                colorNeutral: '#8b8ba3',
                colorSecondary: '#1d1d2a',
                borderRadius: '10px',
              },
            }}
          >
            <InboxContent />
          </Inbox>
        </div>
      </StepCard>

      <StepCard n={3} label="Reply" title="Ask the support agent" hint="A Novu Connect agent with a tool that looks up your order.">
        <NovuProvider applicationIdentifier={APP_ID} subscriber={subscriberId} subscriberHash={subscriberHash}>
          <AgentChat agentHash={agentHash} />
        </NovuProvider>
      </StepCard>
    </div>
  );
}

function AgentChat({ agentHash }: { agentHash: string }) {
  const { messages, sendMessage, isRunning, isLoading, error } = useWebChat({
    agentId: AGENT_ID,
    agentHash,
  });
  const busy = isRunning || isLoading;
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isRunning]);

  // The hook reports failures through `error`. Catching here stops a request cut
  // off by switching tabs mid-reply from surfacing as an unhandled rejection.
  function send(text: string) {
    Promise.resolve(sendMessage(text)).catch(() => {});
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('text') as HTMLInputElement;
    const text = input.value.trim();
    if (!text) return;
    send(text);
    form.reset();
  }

  return (
    <div className="chat">
      <div className="messages" ref={scroller}>
        {messages.length === 0 && !isRunning && (
          <div className="chat-empty">
            <p>Ask about order status, delivery, or changes.</p>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" disabled={busy} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role === 'user' ? 'user' : 'assistant'}`}>
            {m.parts.map((part, i) =>
              part.type !== 'text' ? null : m.role === 'user' ? (
                <span key={i}>{part.text}</span>
              ) : (
                // Agent replies are Markdown (links, emphasis, the "Powered by" line).
                // react-markdown ignores raw HTML, so agent output can't inject markup.
                <ReactMarkdown key={i} components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}>
                  {part.text}
                </ReactMarkdown>
              ),
            )}
          </div>
        ))}
        {isRunning && (
          <div className="msg assistant typing" aria-label="Agent is typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      {error && <div className="notice warn">{error.message}</div>}
      <form onSubmit={onSubmit}>
        <input name="text" placeholder="Ask about your order" disabled={busy} maxLength={300} autoComplete="off" />
        <button className="btn icon" type="submit" disabled={busy} aria-label="Send">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}
