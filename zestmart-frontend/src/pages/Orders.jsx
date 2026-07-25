import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { orderApi } from '../api/order.api';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';

const statusTone = {
  pending: 'warning', confirmed: 'default', processing: 'default',
  shipped: 'default', delivered: 'success', cancelled: 'danger',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });

  useEffect(() => {
    setLoading(true);
    orderApi.list({ page })
      .then((res) => { setOrders(res.data.data || []); setMeta(res.data.meta || {}); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;

  if (orders.length === 0) {
    return (
      <div className="container-page py-8">
        <EmptyState icon={Package} title="No orders yet" description="Your placed orders will show up here."
          action={<Link to="/products" className="btn-primary mt-2">Start shopping</Link>} />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 animate-fade-up font-display text-2xl font-semibold">Your orders</h1>
      <div className="space-y-3">
        {orders.map((o, i) => (
          <Link key={o._id} to={`/orders/${o._id}`} style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }} className="stagger-item flex animate-fade-up items-center justify-between rounded-xl2 border border-ink/10 bg-paper p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-600 hover:shadow-card">
            <div>
              <p className="text-sm font-semibold">{o.orderNumber}</p>
              <p className="text-xs text-ink/50">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.items?.length || 0} item(s)</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold">₹{o.totalAmount?.toLocaleString('en-IN')}</p>
              <Badge tone={statusTone[o.orderStatus] || 'default'}>{o.orderStatus}</Badge>
            </div>
          </Link>
        ))}
      </div>
      <Pagination page={page} totalPages={meta.totalPages} onChange={setPage} />
    </div>
  );
}
