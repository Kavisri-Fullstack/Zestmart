import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationApi } from '../../api/notification.api';

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = () => {
    notificationApi.list({ page: 1, limit: 6 }).then((res) => {
      setItems(res.data.data.notifications || res.data.data || []);
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-full p-2 text-ink/70 hover:bg-sand" aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-maroon-600 text-[10px] font-bold text-ivory">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl2 border border-ink/10 bg-paper py-2 shadow-card">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 pb-2">
            <p className="text-sm font-semibold">Notifications</p>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink/45">Nothing new right now.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <div key={n._id} className={`border-b border-ink/5 px-4 py-2.5 ${!n.isRead ? 'bg-teal-50/50' : ''}`}>
                  <p className="text-xs font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-xs text-ink/60">{n.message}</p>
                </div>
              ))}
            </div>
          )}
          <Link to="/notifications" onClick={() => setOpen(false)} className="block px-4 pt-2 text-center text-xs font-semibold text-teal-700 hover:underline">
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
