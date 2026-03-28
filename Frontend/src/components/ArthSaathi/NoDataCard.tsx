/** Shared empty-state for report sections when data is missing or insufficient. */
export function NoDataCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card-arth p-6 text-center">
      <p className="section-label">{title}</p>
      <p
        className="font-syne text-sm mt-2"
        style={{ color: "hsl(var(--text-tertiary))" }}
      >
        {description}
      </p>
    </div>
  );
}
