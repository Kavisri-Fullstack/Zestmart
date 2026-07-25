import { useEffect, useState } from 'react';
import { Sparkles, History } from 'lucide-react';
import { searchApi } from '../api/search.api';
import ProductGrid from '../components/product/ProductGrid';

export default function Discover() {
  const [recommended, setRecommended] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [basis, setBasis] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([searchApi.recommendations(), searchApi.recentlyViewed()]).then(([rec, rv]) => {
      if (rec.status === 'fulfilled') {
        setRecommended(rec.value.data.data.products || rec.value.data.data || []);
        setBasis(rec.value.data.data.basis || '');
      }
      if (rv.status === 'fulfilled') setRecentlyViewed(rv.value.data.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-marigold-600" />
          <h1 className="animate-fade-up font-display text-2xl font-semibold">Picked for you</h1>
        </div>
        {basis && <p className="mt-1 text-sm text-ink/50">Based on {basis}</p>}
        <div className="mt-5">
          <ProductGrid products={recommended} loading={loading} />
        </div>
      </div>

      {(loading || recentlyViewed.length > 0) && (
        <div className="mt-12 border-t border-ink/10 pt-10">
          <div className="flex items-center gap-2">
            <History size={18} className="text-teal-700" />
            <h2 className="font-display text-2xl font-semibold">Recently viewed</h2>
          </div>
          <div className="mt-5">
            <ProductGrid products={recentlyViewed} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
}
