import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin.api';
import { extractError } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [q, setQ] = useState('');

  const load = () => {
    setLoading(true);
    adminApi.listUsers({ page, q: q || undefined }).then((res) => {
      setUsers(res.data.data.users || res.data.data || []);
      setMeta(res.data.meta || {});
    }).finally(() => setLoading(false));
  };
  useEffect(load, [page]);

  const toggleStatus = async (u) => {
    const nextStatus = u.status === 'active' ? 'blocked' : 'active';
    if (!window.confirm(`${nextStatus === 'blocked' ? 'Block' : 'Unblock'} ${u.name}?`)) return;
    try {
      await adminApi.updateUserStatus(u._id, nextStatus);
      toast.success('User updated');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const search = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Users</h1>
        <form onSubmit={search} className="flex gap-2">
          <input className="input w-56" placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-outline">Search</button>
        </form>
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl2 border border-ink/10 bg-paper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-sand/50 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3"><Badge tone={u.status === 'active' ? 'success' : 'danger'}>{u.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'admin' && (
                      <button onClick={() => toggleStatus(u)} className="text-xs font-semibold text-teal-700 hover:underline">
                        {u.status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                    )}
                  </td>
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
