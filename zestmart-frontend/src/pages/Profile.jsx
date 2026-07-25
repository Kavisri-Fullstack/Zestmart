import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2, Star, User, Bell, Sparkles, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addressApi } from '../api/address.api';
import { extractError } from '../api/client';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';

export default function Profile() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ label: 'Home', fullName: '', phone: '', line1: '', city: '', state: '', postalCode: '', country: 'India' });

  const load = () => {
    setLoading(true);
    addressApi.list().then((res) => setAddresses(res.data.data.addresses || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await addressApi.create(form);
      toast.success('Address added');
      setShowModal(false);
      setForm({ label: 'Home', fullName: '', phone: '', line1: '', city: '', state: '', postalCode: '', country: 'India' });
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressApi.remove(id);
      toast.success('Address deleted');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const makeDefault = async (id) => {
    try {
      await addressApi.setDefault(id);
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 animate-fade-up font-display text-2xl font-semibold">Profile</h1>

      <div className="mb-8 flex animate-fade-up items-center gap-4 rounded-xl2 border border-ink/10 bg-paper p-5 shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-xl font-semibold text-ivory">
          {user?.name?.[0]?.toUpperCase() || <User size={20} />}
        </div>
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-ink/55">{user?.email}</p>
          {user?.phone && <p className="text-sm text-ink/55">{user.phone}</p>}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <Link to="/notifications" className="flex items-center gap-2 rounded-xl2 border border-ink/10 p-3.5 text-sm font-medium hover:border-teal-600">
          <Bell size={16} className="text-teal-700" /> Notifications
        </Link>
        <Link to="/discover" className="flex items-center gap-2 rounded-xl2 border border-ink/10 p-3.5 text-sm font-medium hover:border-teal-600">
          <Sparkles size={16} className="text-marigold-600" /> For you
        </Link>
        <Link to="/sessions" className="flex items-center gap-2 rounded-xl2 border border-ink/10 p-3.5 text-sm font-medium hover:border-teal-600">
          <Monitor size={16} className="text-teal-700" /> Sessions
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Saved addresses</h2>
        <button onClick={() => setShowModal(true)} className="btn-outline py-1.5 text-xs"><Plus size={14} /> Add address</button>
      </div>

      {loading ? (
        <Spinner />
      ) : addresses.length === 0 ? (
        <p className="text-sm text-ink/50">No saved addresses yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a, i) => (
            <div key={a._id} style={{ animationDelay: `${i * 60}ms` }} className="stagger-item animate-fade-up rounded-xl2 border border-ink/10 bg-paper p-4 transition-shadow duration-300 hover:shadow-card">
              <div className="mb-1 flex items-center justify-between">
                <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold uppercase">{a.label}</span>
                <div className="flex items-center gap-2">
                  {a.isDefault ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-marigold-700"><Star size={12} className="fill-marigold-600" /> Default</span>
                  ) : (
                    <button onClick={() => makeDefault(a._id)} className="text-xs font-semibold text-teal-700 hover:underline">Set default</button>
                  )}
                  <button onClick={() => remove(a._id)} className="text-ink/40 hover:text-maroon-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm font-semibold">{a.fullName}</p>
              <p className="text-sm text-ink/60">{a.line1}, {a.city}, {a.state} {a.postalCode}</p>
              <p className="text-sm text-ink/60">{a.phone}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add address" wide>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Label</label>
            <select className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}>
              <option>Home</option><option>Work</option><option>Other</option>
            </select>
          </div>
          <div><label className="label">Full name</label><input required className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div><label className="label">Phone</label><input required className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Address line</label><input required className="input" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></div>
          <div><label className="label">City</label><input required className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">State</label><input required className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div><label className="label">Postal code</label><input required className="input" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></div>
          <div><label className="label">Country</label><input required className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
          <button className="btn-primary sm:col-span-2 mt-1">Save address</button>
        </form>
      </Modal>
    </div>
  );
}
