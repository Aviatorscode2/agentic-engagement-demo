// The frame for each of the three steps on a vendor tab.
export function StepCard({
  n,
  label,
  title,
  hint,
  children,
}: {
  n: number;
  label: string;
  title: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <header className="card-head">
        <span className="step-num">{n}</span>
        <div>
          <span className="step-label">{label}</span>
          <h3>{title}</h3>
        </div>
      </header>
      {hint && <p className="card-hint">{hint}</p>}
      <div className="card-body">{children}</div>
    </section>
  );
}
