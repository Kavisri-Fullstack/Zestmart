import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin.api';
import { extractError } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusTone = { pending: 'warning', confirmed: 'default', processing: 'default', shipped: 'default', delivered: 'success', cancelled: 'danger' };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.listOrders({ page, orderStatus: statusFilter || undefined }).then((res) => {
      setOrders(res.data.data || []);
      setMeta(res.data.meta || {});
    }).finally(() => setLoading(false));
  };
  useEffect(load, [page, statusFilter]);

  const openStatusModal = (o) => {
    setEditingOrder(o);
    setNewStatus(o.orderStatus);
    setTrackingNumber(o.trackingNumber || '');
  };

  const saveStatus = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateOrderStatus(editingOrder._id, { orderStatus: newStatus, trackingNumber });
      toast.success('Order updated');
      setEditingOrder(null);
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Orders</h1>
        <select className="input w-48" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl2 border border-ink/10 bg-paper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-sand/50 text-left">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                  <td className="px-4 py-3">{o.user?.name || o.shippingAddress?.fullName || '—'}</td>
                  <td className="px-4 py-3">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><Badge tone={o.paymentStatus === 'paid' ? 'success' : 'default'}>{o.paymentStatus}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={statusTone[o.orderStatus]}>{o.orderStatus}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openStatusModal(o)} className="text-xs font-semibold text-teal-700 hover:underline">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={meta.totalPages} onChange={setPage} />

      <Modal open={!!editingOrder} onClose={() => setEditingOrder(null)} title={`Update ${editingOrder?.orderNumber || ''}`}>
        <form onSubmit={saveStatus} className="space-y-3">
          <div>
            <label className="label">Order status</label>
            <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Tracking number</label><input className="input" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} /></div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>
    </div>
  );
}
