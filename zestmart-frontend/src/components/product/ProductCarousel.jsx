import { useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

export default function ProductCarousel({ products, reverse = false }) {
  const trackRef = useRef(null);
  const interactingRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    const SPEED = 0.4; // px per frame (~24px/sec at 60fps) — calm, readable pace
    const direction = reverse ? -1 : 1;

    const step = () => {
      if (!interactingRef.current && el.scrollWidth > 0) {
        const half = el.scrollWidth / 2;
        // Compute the wrapped value in a plain variable first — assigning
        // a negative value directly to el.scrollLeft gets silently clamped
        // to 0 by the browser before our own wrap-around check can run,
        // which is what made reverse-direction rows get stuck at 0.
        let next = el.scrollLeft + SPEED * direction;
        if (next >= half) next -= half;
        if (next < 0) next += half;
        el.scrollLeft = next;
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
    interactingRef.current = true;
  };

  // Small delay before resuming so native scroll momentum settles first —
  // otherwise the auto-scroll and the browser's own inertia briefly fight
  // over scrollLeft.
  const scheduleResume = () => {
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      interactingRef.current = false;
    }, 500);
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={pause}
      onPointerUp={scheduleResume}
      onPointerCancel={scheduleResume}
      onPointerLeave={scheduleResume}
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