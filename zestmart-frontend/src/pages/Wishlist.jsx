import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import Price from '../components/ui/Price';
import EmptyState from '../components/ui/EmptyState';

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const items = wishlist.items || [];

  if (items.length === 0) {
    return (
      <div className="container-page py-8">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products you love to find them here later."
          action={<Link to="/products" className="btn-primary mt-2">Discover products</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 animate-fade-up font-display text-2xl font-semibold">Your wishlist</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const p = item.productId;
          if (!p || typeof p === 'string') return null;
          return (
            <div key={p._id} style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }} className="card stagger-item flex animate-fade-up gap-3 p-3 transition-shadow duration-300 hover:shadow-card">
              <Link to={`/products/${p.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.title} className="h-full w-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link to={`/products/${p.slug}`} className="text-sm font-semibold hover:text-teal-700">{p.title}</Link>
                  <div className="mt-1"><Price value={p.price} compareAt={p.compareAtPrice} size="sm" /></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => addItem(p._id, 1)} className="btn-outline flex-1 py-1.5 text-xs">
                    <ShoppingBag size={13} /> Add to cart
                  </button>
                  <button onClick={() => toggleWishlist(p._id)} className="rounded-full border border-ink/15 p-2">
                    <Heart size={14} className="fill-maroon-600 text-maroon-600" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
