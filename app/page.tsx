import { Demo } from '@/components/Demo';

export default function Page() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
                <path d="m3 8 9 5 9-5M12 13v8" />
              </svg>
            </span>
            <span className="brand-name">Parcelly</span>
            <span className="brand-tag">Demo store</span>
          </div>
          <a className="topbar-link" href="https://github.com/novuhq/agentic-engagement-demo">
            View the code
          </a>
        </div>
      </header>

      <main className="page">
        <section className="hero">
          <p className="eyebrow">Novu · Knock · Courier</p>
          <h1>One customer engagement system, built three times</h1>
          <p className="lede">
            Ship the same order on each platform and compare delivery, escalation, and replies.
          </p>
        </section>
        <Demo />
      </main>
    </>
  );
}
