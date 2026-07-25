import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { orderApi } from '../api/order.api';
import { extractError, getAccessToken } from '../api/client';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

const statusTone = {
  pending: 'warning', confirmed: 'default', processing: 'default',
  shipped: 'default', delivered: 'success', cancelled: 'danger',
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    setLoading(true);
    orderApi.getById(id).then((res) => setOrder(res.data.data.order)).catch(() => setOrder(null)).finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      await orderApi.cancel(id);
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setCancelling(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${BASE_URL}/orders/${id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Could not fetch invoice');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.orderNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Could not download invoice');
    }
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;
  if (!order) return <div className="container-page py-20 text-center">Order not found. <Link to="/orders" className="text-teal-700 underline">Back to orders</Link></div>;

  const cancellable = ['pending', 'confirmed'].includes(order.orderStatus);

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-ink/50">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone[order.orderStatus] || 'default'}>{order.orderStatus}</Badge>
          <button onClick={downloadInvoice} className="btn-outline py-1.5 text-xs"><Download size={13} /> Invoice</button>
          {cancellable && (
            <button onClick={cancelOrder} disabled={cancelling} className="btn-danger py-1.5 text-xs">
              {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {order.items?.map((item, i) => (
            <div key={i} style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }} className="stagger-item flex animate-fade-up gap-4 rounded-xl2 border border-ink/10 bg-paper p-4 transition-shadow duration-300 hover:shadow-card">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                {item.image && <img src={item.image} alt={item.title} className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-ink/50">Qty {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                </div>
                <p className="text-sm font-semibold">₹{item.lineTotal?.toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl2 border border-ink/10 p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Payment</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink/70"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
              {order.discountAmount > 0 && <div className="flex justify-between text-teal-700"><span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span><span>−₹{order.discountAmount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-ink/70"><span>Shipping</span><span>{order.shippingFee ? `₹${order.shippingFee}` : 'Free'}</span></div>
              <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-base font-semibold"><span>Total</span><span>₹{order.totalAmount?.toLocaleString('en-IN')}</span></div>
            </div>
            <p className="mt-3 text-xs text-ink/50">
              {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'} · {order.paymentStatus}
            </p>
          </div>

          {order.shippingAddress && (
            <div className="rounded-xl2 border border-ink/10 p-5">
              <h2 className="mb-3 font-display text-lg font-semibold">Delivery address</h2>
              <p className="text-sm font-semibold">{order.shippingAddress.fullName}</p>
              <p className="text-sm text-ink/60">{order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p className="text-sm text-ink/60">{order.shippingAddress.phone}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
