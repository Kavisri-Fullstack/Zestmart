import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { extractError } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

const emptyForm = { name: '', description: '', isActive: true, sortOrder: 0 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.listCategories().then((res) => setCategories(res.data.data.categories || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setImage(null); setShowModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name || '', description: c.description || '', isActive: c.isActive !== false, sortOrder: c.sortOrder || 0 });
    setImage(null);
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminApi.updateCategory(editing._id, form);
        toast.success('Category updated');
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (image) fd.append('image', image);
        await adminApi.createCategory(fd);
        toast.success('Category created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await adminApi.deleteCategory(id);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Categories</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Add category</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c._id} className="rounded-xl2 border border-ink/10 bg-paper p-4">
              <div className="mb-3 h-28 w-full overflow-hidden rounded-lg bg-sand">
                {c.image && <img src={c.image} className="h-full w-full object-cover" alt="" />}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{c.name}</p>
                <Badge tone={c.isActive ? 'success' : 'default'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-ink/55">{c.description}</p>
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => openEdit(c)} className="rounded-full p-1.5 hover:bg-sand"><Pencil size={14} /></button>
                <button onClick={() => remove(c._id)} className="rounded-full p-1.5 text-maroon-600 hover:bg-sand"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit category' : 'Add category'}>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Name</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="label">Sort order</label><input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
          {!editing && (
            <div><label className="label">Image</label><input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="input" /></div>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button>
        </form>
      </Modal>
    </div>
  );
}
