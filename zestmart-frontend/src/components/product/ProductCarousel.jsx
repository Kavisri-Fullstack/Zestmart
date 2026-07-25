import ProductCard from './ProductCard';

export default function ProductCarousel({ products, reverse = false }) {
  if (!products || products.length === 0) return null;

  // Duplicate the list so the marquee loop is seamless (translateX(-50%)
  // lines up exactly with the start of the second copy).
  const looped = [...products, ...products];

  return (
    <div className="group/marquee -mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div
        className="flex w-max animate-marquee gap-4 [animation-duration:55s] group-hover/marquee:[animation-play-state:paused]"
        style={reverse ? { animationDirection: 'reverse' } : undefined}
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