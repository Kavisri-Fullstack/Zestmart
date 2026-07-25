import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Price from '../components/ui/Price';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';

export default function Cart() {
  const { cart, loading, updateItem, removeItem, total } = useCart();
  const navigate = useNavigate();
  const items = cart.items || [];

  if (loading && items.length === 0) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet."
          action={<Link to="/products" className="btn-primary mt-2">Start shopping</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-1 font-display text-3xl font-semibold">Your cart</h1>
      <p className="mb-6 text-sm text-ink/50">{items.length} item{items.length > 1 ? 's' : ''} ready for checkout</p>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {items.map((item, i) => (
            <div
              key={item.productId}
              style={{ animationDelay: `${i * 60}ms` }}
              className="stagger-item flex animate-fade-up gap-4 rounded-xl2 border border-ink/10 bg-paper p-4 transition-shadow duration-300 hover:shadow-card"
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-sand">
                {item.image && <img src={item.image} alt={item.title} className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.selectedVariant && <p className="text-xs text-ink/50">{item.selectedVariant}</p>}
                    <div className="mt-1"><Price value={item.price} /></div>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="rounded-full p-1.5 text-ink/40 transition hover:bg-maroon-600/10 hover:text-maroon-600">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink/15">
                    <button onClick={() => updateItem(item.productId, Math.max(1, item.quantity - 1))} className="p-2 transition hover:text-teal-700"><Minus size={13} /></button>
                    <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateItem(item.productId, item.quantity + 1)} className="p-2 transition hover:text-teal-700"><Plus size={13} /></button>
                  </div>
                  <p className="text-sm font-semibold">₹{item.lineTotal?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl2 border border-ink/10 bg-paper p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <div className="kantha-divider my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink/70">
              <span>Subtotal</span>
              <span>₹{(cart.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            {cart.discountAmount > 0 && (
              <div className="flex justify-between text-teal-700">
                <span>Discount</span>
                <span>−₹{cart.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-ink/70">
              <span>Shipping</span>
              <span>{cart.shippingEstimate ? `₹${cart.shippingEstimate}` : 'Free'}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-ink/10 pt-3 text-base font-semibold">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn-primary mt-5 w-full py-3">
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
