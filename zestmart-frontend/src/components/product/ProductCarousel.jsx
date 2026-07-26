import { useState } from 'react';
import ProductCard from './ProductCard';

export default function ProductCarousel({ products, reverse = false }) {
  const [paused, setPaused] = useState(false);

  if (!products || products.length === 0) return null;
  const looped = [...products, ...products];

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  return (
    <div
      className="-mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      onTouchCancel={resume}
    >
      <div
        className="flex w-max animate-marquee gap-4 [animation-duration:55s]"
        style={{
          animationDirection: reverse ? 'reverse' : 'normal',
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {looped.map((p, i) => (
          <div key={`${p._id}-${i}`} className="w-48 shrink-0 sm:w-56">
            <ProductCard product={p} index={i % products.length} />
          </div>
        ))}
      </div>
    </div>
  );
}