import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { productApi } from '../api/product.api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import Price from '../components/ui/Price';
import Rating from '../components/ui/Rating';
import Spinner from '../components/ui/Spinner';
import ProductGrid from '../components/product/ProductGrid';
import ReviewSection from '../components/product/ReviewSection';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    setLoading(true);
    setActiveImage(0);
    setQuantity(1);
    productApi
      .getBySlug(slug)
      .then((res) => {
        const p = res.data.data.product;
        setProduct(p);
        return productApi.related(p._id);
      })
      .then((res) => setRelated(res?.data?.data || []))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={32} /></div>;
  }

  if (!product) {
    return (
      <div className="container-page py-20 text-center">
        <p className="font-display text-xl">Product not found</p>
        <Link to="/products" className="btn-primary mt-4 inline-flex">Browse products</Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [{ url: product.primaryImage }];
  const wishlisted = isAuthenticated && isWishlisted(product._id);
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (!isAuthenticated) return toast.error('Sign in to add items to your cart');
    addItem(product._id, quantity);
  };

  return (
    <div className="container-page py-8">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square animate-scale-in overflow-hidden rounded-xl2 bg-sand shadow-card">
            {images[activeImage]?.url && (
              <img src={images[activeImage].url} alt={product.title} className="h-full w-full object-cover" />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${activeImage === i ? 'border-teal-600' : 'border-transparent'}`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="animate-fade-up [animation-delay:100ms]">
          {product.brand && <p className="eyebrow">{product.brand}</p>}
          <h1 className="mt-1 font-display text-3xl font-semibold">{product.title}</h1>
          <div className="mt-2"><Rating value={product.ratingAverage} count={product.reviewCount} /></div>
          <div className="mt-4"><Price value={product.price} compareAt={product.compareAtPrice} size="lg" /></div>

          {product.shortDescription && <p className="mt-4 text-sm text-ink/70">{product.shortDescription}</p>}

          <div className="mt-3">
            {outOfStock ? (
              <span className="text-sm font-semibold text-maroon-600">Out of stock</span>
            ) : product.stock <= 5 ? (
              <span className="text-sm font-semibold text-marigold-700">Only {product.stock} left in stock</span>
            ) : (
              <span className="text-sm font-semibold text-teal-700">In stock</span>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-ink/15">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2.5"><Minus size={14} /></button>
              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="p-2.5"><Plus size={14} /></button>
            </div>
            <button onClick={handleAdd} disabled={outOfStock} className="btn-primary flex-1">
              {outOfStock ? 'Out of stock' : 'Add to cart'}
            </button>
            <button
              onClick={() => (isAuthenticated ? toggleWishlist(product._id) : toast.error('Sign in to save items'))}
              className="rounded-full border border-ink/15 p-3"
            >
              <Heart size={18} className={wishlisted ? 'fill-maroon-600 text-maroon-600' : 'text-ink/60'} />
            </button>
          </div>

          <div className="mt-8 space-y-3 border-t border-ink/10 pt-6">
            <div className="flex items-center gap-3 text-sm text-ink/65">
              <Truck size={16} className="text-teal-700" /> Free shipping on orders above ₹999
            </div>
            <div className="flex items-center gap-3 text-sm text-ink/65">
              <ShieldCheck size={16} className="text-teal-700" /> 7-day easy returns
            </div>
          </div>

          {product.features?.length > 0 && (
            <div className="mt-6 border-t border-ink/10 pt-6">
              <p className="mb-2 text-sm font-semibold">Highlights</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-ink/70">
                {product.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {product.description && (
            <div className="mt-6 border-t border-ink/10 pt-6">
              <p className="mb-2 text-sm font-semibold">Description</p>
              <p className="whitespace-pre-line text-sm text-ink/70">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="container-page mt-14"><div className="kantha-divider" /></div>
      <div className="pt-10">
        <ReviewSection productId={product._id} />
      </div>

      {related.length > 0 && (
        <div className="mt-4"><div className="kantha-divider mb-10" /><h2 className="mb-6 font-display text-2xl font-semibold">You may also like</h2><ProductGrid products={related} /></div>
      )}
    </div>
  );
}
