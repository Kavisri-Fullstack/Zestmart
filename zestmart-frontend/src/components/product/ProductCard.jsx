import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import Price from '../ui/Price';
import Rating from '../ui/Rating';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product, index = 0 }) {
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const image = product.primaryImage || product.images?.[0]?.url;
  const wishlisted = isAuthenticated && isWishlisted(product._id);

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Sign in to save items');
    toggleWishlist(product._id);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Sign in to add items to your cart');
    addItem(product._id, 1);
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className="card stagger-item group block animate-fade-up overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glass"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        {image ? (
          <img src={image} alt={product.title} className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-110" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink/30">No image</div>
        )}

        {/* Glass gradient overlay on hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {product.discountPercent > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-maroon-600 px-2.5 py-1 text-xs font-bold text-ivory shadow-sm">
            {product.discountPercent}% OFF
          </span>
        )}
        <button
          onClick={handleWishlist}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 shadow-sm backdrop-blur transition-transform duration-200 hover:scale-110 active:scale-90"
          aria-label="Toggle wishlist"
        >
          <Heart size={15} className={wishlisted ? 'fill-maroon-600 text-maroon-600' : 'text-ink/60'} />
        </button>
        <button
          onClick={handleAdd}
          className="absolute inset-x-3 bottom-3 flex translate-y-12 items-center justify-center gap-1.5 rounded-full bg-teal-700 py-2.5 text-xs font-semibold text-ivory opacity-0 shadow-lg transition-all duration-300 ease-bounce-soft group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingBag size={13} /> Add to cart
        </button>
      </div>
      <div className="p-3.5">
        <p className="truncate text-sm font-medium text-ink/90">{product.title}</p>
        <div className="mt-1.5">
          <Rating value={product.ratingAverage} count={product.reviewCount} />
        </div>
        <div className="mt-1.5">
          <Price value={product.price} compareAt={product.compareAtPrice} />
        </div>
      </div>
    </Link>
  );
}
