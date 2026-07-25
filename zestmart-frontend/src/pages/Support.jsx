import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supportTicketApi } from '../api/supportTicket.api';
import { extractError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

export default function Support() {
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: '', category: 'general', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!isAuthenticated) return setLoading(false);
    supportTicketApi.list().then((res) => setTickets(res.data.data.tickets || res.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, [isAuthenticated]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supportTicketApi.create(form);
      toast.success('Ticket submitted — we\'ll get back to you soon');
      setForm({ subject: '', category: 'general', message: '' });
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 animate-fade-up font-display text-2xl font-semibold">Support</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl2 border border-ink/10 p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Raise a ticket</h2>
          {isAuthenticated ? (
            <form onSubmit={submit} className="space-y-3">
              <div><label className="label">Subject</label><input required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="general">General</option>
                  <option value="order">Order issue</option>
                  <option value="payment">Payment</option>
                  <option value="product">Product</option>
                </select>
              </div>
              <div><label className="label">Message</label><textarea required rows={4} className="input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
              <button className="btn-primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit ticket'}</button>
            </form>
          ) : (
            <p className="text-sm text-ink/60">Please sign in to raise a support ticket.</p>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-display text-lg font-semibold">Your tickets</h2>
          {loading ? <Spinner /> : tickets.length === 0 ? (
            <p className="text-sm text-ink/50">No tickets yet.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t._id} className="rounded-xl2 border border-ink/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{t.subject}</p>
                    <Badge>{t.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink/50">{t.category}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
