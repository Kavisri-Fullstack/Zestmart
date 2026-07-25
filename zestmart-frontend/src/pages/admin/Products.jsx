import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { extractError } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';

const emptyForm = {
  title: '', description: '', shortDescription: '', price: '', compareAtPrice: '', stock: '',
  sku: '', category: '', brand: '', isFeatured: false, isTrending: false, isBestSeller: false,
  isNewArrival: false, isActive: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.listProducts({ page }).then((res) => {
      setProducts(res.data.data || []);
      setMeta(res.data.meta || {});
    }).finally(() => setLoading(false));
  };

  useEffect(load, [page]);
  useEffect(() => { adminApi.listCategories().then((res) => setCategories(res.data.data.categories || [])); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImages([]);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title || '', description: p.description || '', shortDescription: p.shortDescription || '',
      price: p.price || '', compareAtPrice: p.compareAtPrice || '', stock: p.stock ?? '', sku: p.sku || '',
      category: p.category?._id || p.category || '', brand: p.brand || '',
      isFeatured: !!p.isFeatured, isTrending: !!p.isTrending, isBestSeller: !!p.isBestSeller,
      isNewArrival: !!p.isNewArrival, isActive: p.isActive !== false,
    });
    setImages([]);
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminApi.updateProduct(editing._id, form);
        toast.success('Product updated');
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        images.forEach((img) => fd.append('images', img));
        await adminApi.createProduct(fd);
        toast.success('Product created');
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
    if (!window.confirm('Delete this product?')) return;
    try {
      await adminApi.deleteProduct(id);
      toast.success('Product deleted');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Products</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Add product</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl2 border border-ink/10 bg-paper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-sand/50 text-left">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b border-ink/5">
                  <td className="flex items-center gap-3 px-4 py-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-sand">
                      {(p.primaryImage || p.images?.[0]?.url) && <img src={p.primaryImage || p.images[0].url} className="h-full w-full object-cover" alt="" />}
                    </div>
                    <span className="font-medium">{p.title}</span>
                  </td>
                  <td className="px-4 py-3">₹{p.price?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3"><Badge tone={p.isActive ? 'success' : 'default'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="mr-2 rounded-full p-1.5 hover:bg-sand"><Pencil size={14} /></button>
                    <button onClick={() => remove(p._id)} className="rounded-full p-1.5 text-maroon-600 hover:bg-sand"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={meta.totalPages} onChange={setPage} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit product' : 'Add product'} wide>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Title</label><input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Short description</label><input className="input" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="label">Price</label><input required type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div><label className="label">Compare-at price</label><input type="number" className="input" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} /></div>
          <div><label className="label">Stock</label><input required type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          <div><label className="label">SKU</label><input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          <div>
            <label className="label">Category</label>
            <select required className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Brand</label><input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>

          {!editing && (
            <div className="sm:col-span-2">
              <label className="label">Images (up to 10)</label>
              <input type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} className="input" />
            </div>
          )}

          <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
            {['isFeatured', 'isTrending', 'isBestSeller', 'isNewArrival', 'isActive'].map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} />
                {k.replace('is', '')}
              </label>
            ))}
          </div>

          <button className="btn-primary sm:col-span-2 mt-1" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
        </form>
      </Modal>
    </div>
  );
}
