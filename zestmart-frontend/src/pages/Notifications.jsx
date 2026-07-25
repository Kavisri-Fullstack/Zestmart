import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Check, Trash2 } from 'lucide-react';
import { notificationApi } from '../api/notification.api';
import { extractError } from '../api/client';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });

  const load = () => {
    setLoading(true);
    notificationApi.list({ page }).then((res) => {
      setItems(res.data.data.notifications || res.data.data || []);
      setMeta(res.data.meta || {});
    }).finally(() => setLoading(false));
  };
  useEffect(load, [page]);

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const remove = async (id) => {
    try {
      await notificationApi.remove(id);
      setItems((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="animate-fade-up font-display text-2xl font-semibold">Notifications</h1>
        {items.some((n) => !n.isRead) && (
          <button onClick={markAllRead} className="text-sm font-semibold text-teal-700 hover:underline">Mark all as read</button>
        )}
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n._id} className={`flex items-start justify-between gap-3 rounded-xl2 border p-4 ${n.isRead ? 'border-ink/10' : 'border-teal-600 bg-teal-50'}`}>
              <div>
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="mt-0.5 text-sm text-ink/65">{n.message}</p>
                <p className="mt-1 text-xs text-ink/40">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!n.isRead && (
                  <button onClick={() => markRead(n._id)} className="rounded-full p-1.5 text-teal-700 hover:bg-teal-100" aria-label="Mark read"><Check size={15} /></button>
                )}
                <button onClick={() => remove(n._id)} className="rounded-full p-1.5 text-ink/40 hover:bg-sand" aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={meta.totalPages} onChange={setPage} />
    </div>
  );
}
