import { Star } from 'lucide-react';

export default function Rating({ value = 0, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= Math.round(value) ? 'fill-marigold-600 text-marigold-600' : 'text-ink/15'}
          />
        ))}
      </div>
      {typeof count === 'number' && <span className="text-xs text-ink/50">({count})</span>}
    </div>
  );
}
