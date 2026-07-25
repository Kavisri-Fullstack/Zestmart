import ProductCard from './ProductCard';
import EmptyState from '../ui/EmptyState';
import { PackageSearch } from 'lucide-react';

export default function ProductGrid({ products, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/5.6] rounded-xl2" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return <EmptyState icon={PackageSearch} title="No products found" description="Try adjusting your filters or search terms." />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p._id} product={p} index={i} />
      ))}
    </div>
  );
}
