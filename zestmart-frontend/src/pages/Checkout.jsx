import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { addressApi } from '../api/address.api';
import { couponApi } from '../api/coupon.api';
import { orderApi } from '../api/order.api';
import { paymentApi } from '../api/payment.api';
import { extractError } from '../api/client';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const { cart, total, refreshCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: 'Home', fullName: '', phone: '', line1: '', city: '', state: '', postalCode: '', country: 'India',
  });

  const loadAddresses = () => {
    addressApi
      .list()
      .then((res) => {
        const list = res.data.data.addresses || [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddress(def._id);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadAddresses, []);

  const saveAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await addressApi.create(addrForm);
      toast.success('Address added');
      setShowAddressModal(false);
      setAddresses((prev) => [...prev, res.data.data.address]);
      setSelectedAddress(res.data.data.address._id);
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const subtotal = cart.subtotal || 0;
      const res = await couponApi.validate(couponCode.trim(), subtotal);
      setDiscount(res.data.data.discountAmount || 0);
      toast.success('Coupon applied');
    } catch (err) {
      setDiscount(0);
      toast.error(extractError(err));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const finalTotal = Math.max((cart.subtotal || 0) - discount, 0) + (cart.shippingEstimate || 0);

  const placeOrder = async () => {
    if (!selectedAddress) return toast.error('Please select a delivery address');
    setPlacing(true);
    try {
      if (paymentMethod === 'cod') {
        const res = await orderApi.place({
          addressId: selectedAddress,
          paymentMethod: 'cod',
          couponCode: discount > 0 ? couponCode.trim() : undefined,
        });
        await refreshCart();
        toast.success('Order placed successfully!');
        navigate(`/orders/${res.data.data.order._id}`);
        return;
      }

      // Razorpay flow
      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error('Could not load payment gateway. Check your connection.');
        setPlacing(false);
        return;
      }
      const rpOrderRes = await paymentApi.createOrder();
      const rpOrder = rpOrderRes.data.data;

      const rzp = new window.Razorpay({
        key: rpOrder.keyId || rpOrder.key,
        amount: rpOrder.amount,
        currency: rpOrder.currency || 'INR',
        order_id: rpOrder.id || rpOrder.razorpayOrderId,
        name: 'ZestMart',
        handler: async (response) => {
          try {
            const res = await orderApi.place({
              addressId: selectedAddress,
              paymentMethod: 'razorpay',
              couponCode: discount > 0 ? couponCode.trim() : undefined,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await refreshCart();
            toast.success('Payment successful! Order placed.');
            navigate(`/orders/${res.data.data.order._id}`);
          } catch (err) {
            toast.error(extractError(err));
          } finally {
            setPlacing(false);
          }
        },
        modal: { ondismiss: () => setPlacing(false) },
        theme: { color: '#0F4C4C' },
      });
      rzp.open();
    } catch (err) {
      toast.error(extractError(err));
      setPlacing(false);
    }
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <p className="font-display text-xl">Your cart is empty</p>
        <Link to="/products" className="btn-primary mt-4 inline-flex">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 animate-fade-up font-display text-2xl font-semibold">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Address */}
          <div className="animate-fade-up rounded-xl2 border border-ink/10 bg-paper p-5 shadow-card transition-shadow duration-300 hover:shadow-glass">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Delivery address</h2>
              <button onClick={() => setShowAddressModal(true)} className="btn-outline py-1.5 text-xs">
                <Plus size={14} /> Add new
              </button>
            </div>
            {addresses.length === 0 ? (
              <p className="text-sm text-ink/50">No saved addresses. Add one to continue.</p>
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label key={a._id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${selectedAddress === a._id ? 'border-teal-600 bg-teal-50' : 'border-ink/10'}`}>
                    <input type="radio" name="address" className="mt-1" checked={selectedAddress === a._id} onChange={() => setSelectedAddress(a._id)} />
                    <div className="text-sm">
                      <p className="font-semibold">{a.fullName} <span className="ml-1 rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold uppercase">{a.label}</span></p>
                      <p className="text-ink/60">{a.line1}, {a.city}, {a.state} {a.postalCode}</p>
                      <p className="text-ink/60">{a.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="animate-fade-up rounded-xl2 border border-ink/10 bg-paper p-5 shadow-card transition-shadow duration-300 hover:shadow-glass">
            <h2 className="mb-4 font-display text-lg font-semibold">Payment method</h2>
            <div className="space-y-2">
              <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${paymentMethod === 'cod' ? 'border-teal-600 bg-teal-50' : 'border-ink/10'}`}>
                <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <span className="text-sm font-medium">Cash on delivery</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${paymentMethod === 'razorpay' ? 'border-teal-600 bg-teal-50' : 'border-ink/10'}`}>
                <input type="radio" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                <span className="text-sm font-medium">Pay online (UPI / Card / Netbanking)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="h-fit animate-fade-up rounded-xl2 border border-ink/10 bg-paper p-5 shadow-card [animation-delay:150ms]">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <div className="mt-4 flex gap-2">
            <input className="input" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            <button onClick={applyCoupon} className="btn-outline shrink-0" disabled={applyingCoupon}>Apply</button>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink/70"><span>Subtotal</span><span>₹{(cart.subtotal || 0).toLocaleString('en-IN')}</span></div>
            {discount > 0 && <div className="flex justify-between text-teal-700"><span>Discount</span><span>−₹{discount.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between text-ink/70"><span>Shipping</span><span>{cart.shippingEstimate ? `₹${cart.shippingEstimate}` : 'Free'}</span></div>
            <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-base font-semibold"><span>Total</span><span>₹{finalTotal.toLocaleString('en-IN')}</span></div>
          </div>
          <button onClick={placeOrder} disabled={placing || !selectedAddress} className="btn-primary mt-5 w-full">
            {placing ? 'Placing order…' : paymentMethod === 'cod' ? 'Place order' : 'Pay & place order'}
          </button>
        </div>
      </div>

      <Modal open={showAddressModal} onClose={() => setShowAddressModal(false)} title="Add delivery address" wide>
        <form onSubmit={saveAddress} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Label</label>
            <select className="input" value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}>
              <option>Home</option><option>Work</option><option>Other</option>
            </select>
          </div>
          <div><label className="label">Full name</label><input required className="input" value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} /></div>
          <div><label className="label">Phone</label><input required className="input" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Address line</label><input required className="input" value={addrForm.line1} onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })} /></div>
          <div><label className="label">City</label><input required className="input" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} /></div>
          <div><label className="label">State</label><input required className="input" value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} /></div>
          <div><label className="label">Postal code</label><input required className="input" value={addrForm.postalCode} onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })} /></div>
          <div><label className="label">Country</label><input required className="input" value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} /></div>
          <button className="btn-primary sm:col-span-2 mt-1">Save address</button>
        </form>
      </Modal>
    </div>
  );
}
