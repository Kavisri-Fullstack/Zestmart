import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { extractError } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

const emptyForm = { title: '', description: '', position: 'home', link: '', isActive: true };

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.listBanners().then((res) => setBanners(res.data.data.banners || res.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!image) return toast.error('Please choose an image');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('image', image);
      await adminApi.createBanner(fd);
      toast.success('Banner created');
      setShowModal(false);
      setForm(emptyForm);
      setImage(null);
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await adminApi.deleteBanner(id);
      toast.success('Banner deleted');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Banners</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Add banner</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => (
            <div key={b._id} className="rounded-xl2 border border-ink/10 bg-paper p-4">
              <div className="mb-3 aspect-video w-full overflow-hidden rounded-lg bg-sand">
                {b.image && <img src={b.image} className="h-full w-full object-cover" alt="" />}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{b.title || b.position}</p>
                <Badge tone={b.isActive ? 'success' : 'default'}>{b.isActive ? 'Live' : 'Off'}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink/50">{b.position}</p>
              <div className="mt-3 flex justify-end">
                <button onClick={() => remove(b._id)} className="rounded-full p-1.5 text-maroon-600 hover:bg-sand"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add banner">
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <label className="label">Position</label>
            <select className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
              <option value="home">Home</option>
              <option value="category">Category</option>
              <option value="sidebar">Sidebar</option>
            </select>
          </div>
          <div><label className="label">Link</label><input className="input" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
          <div><label className="label">Image</label><input required type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="input" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : 'Save banner'}</button>
        </form>
      </Modal>
    </div>
  );
}
