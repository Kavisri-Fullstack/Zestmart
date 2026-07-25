const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function Price({ value, compareAt, size = 'md' }) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
  };
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`font-semibold ${sizes[size]}`}>{formatter.format(value || 0)}</span>
      {compareAt > value && (
        <span className="text-xs text-ink/40 line-through">{formatter.format(compareAt)}</span>
      )}
    </span>
  );
}
