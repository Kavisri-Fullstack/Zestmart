import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { siteSettingsApi } from '../../api/siteSettings.api';
import { adminApi } from '../../api/admin.api';
import { extractError } from '../../api/client';
import Spinner from '../../components/ui/Spinner';

export default function AdminSiteSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteSettingsApi.get().then((res) => setForm(res.data.data.settings || res.data.data || {})).finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSiteSettings(form);
      toast.success('Settings updated');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner size={28} /></div>;

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Site settings</h1>
      <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl2 border border-ink/10 bg-paper p-5">
        <div>
          <label className="label">Site name</label>
          <input className="input" value={form.siteName || ''} onChange={(e) => set('siteName', e.target.value)} />
        </div>
        <div>
          <label className="label">Support email</label>
          <input className="input" value={form.supportEmail || ''} onChange={(e) => set('supportEmail', e.target.value)} />
        </div>
        <div>
          <label className="label">Free shipping threshold (₹)</label>
          <input type="number" className="input" value={form.freeShippingThreshold ?? ''} onChange={(e) => set('freeShippingThreshold', e.target.value)} />
        </div>
        <div>
          <label className="label">Flat shipping fee (₹)</label>
          <input type="number" className="input" value={form.flatShippingFee ?? ''} onChange={(e) => set('flatShippingFee', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.maintenanceMode} onChange={(e) => set('maintenanceMode', e.target.checked)} />
          Maintenance mode
        </label>
        <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
      </form>
    </div>
  );
}
