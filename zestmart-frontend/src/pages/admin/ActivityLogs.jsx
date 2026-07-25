import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });

  useEffect(() => {
    setLoading(true);
    adminApi.activityLogs({ page }).then((res) => {
      setLogs(res.data.data.logs || res.data.data || []);
      setMeta(res.data.meta || {});
    }).finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Activity logs</h1>
      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl2 border border-ink/10 bg-paper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-sand/50 text-left">
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-b border-ink/5">
                  <td className="px-4 py-3">{l.admin?.name || l.admin || '—'}</td>
                  <td className="px-4 py-3">{l.action}</td>
                  <td className="px-4 py-3">{l.targetType}{l.targetId ? ` · ${l.targetId}` : ''}</td>
                  <td className="px-4 py-3 text-ink/55">{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={meta.totalPages} onChange={setPage} />
    </div>
  );
}
