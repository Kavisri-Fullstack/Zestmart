import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Laptop, Smartphone, LogOut } from 'lucide-react';
import api from '../api/client';
import { extractError } from '../api/client';
import Spinner from '../components/ui/Spinner';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/sessions').then((res) => setSessions(res.data.data.sessions || res.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const revokeOne = async (id) => {
    try {
      await api.delete(`/sessions/${id}`);
      toast.success('Session revoked');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const revokeOthers = async () => {
    if (!window.confirm('Log out all other devices?')) return;
    try {
      await api.delete('/sessions');
      toast.success('Other sessions revoked');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="animate-fade-up font-display text-2xl font-semibold">Active sessions</h1>
        <button onClick={revokeOthers} className="btn-outline text-xs"><LogOut size={13} /> Log out other devices</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s._id} className="flex items-center justify-between rounded-xl2 border border-ink/10 p-4">
              <div className="flex items-center gap-3">
                {s.deviceType === 'mobile' ? <Smartphone size={18} className="text-teal-700" /> : <Laptop size={18} className="text-teal-700" />}
                <div>
                  <p className="text-sm font-semibold">{s.userAgent || s.device || 'Unknown device'}{s.isCurrent && <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">This device</span>}</p>
                  <p className="text-xs text-ink/50">{s.ipAddress} · Last active {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('en-IN') : '—'}</p>
                </div>
              </div>
              {!s.isCurrent && (
                <button onClick={() => revokeOne(s._id)} className="text-xs font-semibold text-maroon-600 hover:underline">Revoke</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
