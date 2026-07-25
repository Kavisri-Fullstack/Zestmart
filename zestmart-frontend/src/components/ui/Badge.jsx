export default function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-sand text-ink/70',
    success: 'bg-teal-50 text-teal-700',
    warning: 'bg-marigold-50 text-marigold-700',
    danger: 'bg-maroon-600/10 text-maroon-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
