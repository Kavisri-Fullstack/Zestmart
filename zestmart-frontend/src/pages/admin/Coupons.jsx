import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { extractError } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

const emptyForm = { code: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscountAmount: '', usageLimit: '', expiresAt: '', isActive: true };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.listCoupons().then((res) => setCoupons(res.data.data.coupons || res.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code, type: c.type, value: c.value, minOrderAmount: c.minOrderAmount || '',
      maxDiscountAmount: c.maxDiscountAmount || '', usageLimit: c.usageLimit || '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '', isActive: c.isActive !== false,
    });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await adminApi.updateCoupon(editing._id, form);
      else await adminApi.createCoupon(form);
      toast.success(editing ? 'Coupon updated' : 'Coupon created');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Disable this coupon?')) return;
    try {
      await adminApi.deleteCoupon(id);
      toast.success('Coupon disabled');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Coupons</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Add coupon</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl2 border border-ink/10 bg-paper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-sand/50 text-left">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-semibold">{c.code}</td>
                  <td className="px-4 py-3 capitalize">{c.type}</td>
                  <td className="px-4 py-3">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="px-4 py-3">{c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td className="px-4 py-3"><Badge tone={c.isActive ? 'success' : 'default'}>{c.isActive ? 'Active' : 'Disabled'}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="mr-2 rounded-full p-1.5 hover:bg-sand"><Pencil size={14} /></button>
                    <button onClick={() => remove(c._id)} className="rounded-full p-1.5 text-maroon-600 hover:bg-sand"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit coupon' : 'Add coupon'} wide>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Code</label><input required className="input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percentage">Percentage</option>
              <option value="flat">Flat</option>
            </select>
          </div>
          <div><label className="label">Value</label><input required type="number" className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
          <div><label className="label">Min order amount</label><input type="number" className="input" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} /></div>
          <div><label className="label">Max discount amount</label><input type="number" className="input" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} /></div>
          <div><label className="label">Usage limit</label><input type="number" className="input" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></div>
          <div><label className="label">Expires at</label><input type="date" className="input" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <button className="btn-primary sm:col-span-2 mt-1" disabled={saving}>{saving ? 'Saving…' : 'Save coupon'}</button>
        </form>
      </Modal>
    </div>
  );
}
