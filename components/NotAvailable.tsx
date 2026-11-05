// Shown where a vendor has no equivalent feature. Keep the wording factual and
// dated, and link the docs that were checked, so readers can verify it.
export function NotAvailable({
  title,
  children,
  checked,
  sources,
}: {
  title: string;
  children: React.ReactNode;
  checked: string;
  sources: { label: string; href: string }[];
}) {
  return (
    <div className="unavailable">
      <span className="unavailable-icon" aria-hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </svg>
      </span>
      <strong>{title}</strong>
      <p>{children}</p>
      <div className="unavailable-sources">
        Checked {checked}:{' '}
        {sources.map((s, i) => (
          <span key={s.href}>
            {i > 0 && ' · '}
            <a href={s.href} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          </span>
        ))}
      </div>
    </div>
  );
}
