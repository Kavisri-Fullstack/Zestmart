import { useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

export default function ProductCarousel({ products, reverse = false }) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const rafRef = useRef(null);
  const resumeTimeoutRef = useRef(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !products || products.length === 0) return undefined;

    const SPEED = 0.35; // px per frame (~21px/sec at 60fps) — calm, readable pace
    const direction = reverse ? -1 : 1;

    // Start mid-way for reverse rows so there's room to scroll left into.
    if (reverse) el.scrollLeft = el.scrollWidth / 2;

    const step = () => {
      if (!pausedRef.current && el) {
        const half = el.scrollWidth / 2;
        el.scrollLeft += SPEED * direction;
        if (direction > 0 && el.scrollLeft >= half) {
          el.scrollLeft -= half;
        } else if (direction < 0 && el.scrollLeft <= 0) {
          el.scrollLeft += half;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resumeTimeoutRef.current);
    };
  }, [products, reverse]);

  if (!products || products.length === 0) return null;
  const looped = [...products, ...products];

  const pause = () => {
    clearTimeout(resumeTimeoutRef.current);
    pausedRef.current = true;
  };

  // Small delay before resuming so native touch-scroll momentum settles
  // first — otherwise the auto-scroll and the browser's own inertia can
  // fight over scrollLeft for a moment.
  const resume = () => {
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 400);
  };

  return (
    <div
      ref={trackRef}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      onTouchCancel={resume}
      className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      {looped.map((p, i) => (
        <div key={`${p._id}-${i}`} className="w-48 shrink-0 sm:w-56">
          <ProductCard product={p} index={i % products.length} />
        </div>
      ))}
    </div>
  );
}