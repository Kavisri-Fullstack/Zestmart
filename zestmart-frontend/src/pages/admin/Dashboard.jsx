import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminApi } from '../../api/admin.api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([adminApi.dashboard(), adminApi.salesAnalytics()]).then(([s, sa]) => {
      if (s.status === 'fulfilled') setSummary(s.value.data.data);
      if (sa.status === 'fulfilled') setSales(sa.value.data.data.series || sa.value.data.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;

  const cards = [
    { label: 'Total revenue', value: `₹${(summary?.totalRevenue || summary?.revenue || 0).toLocaleString('en-IN')}`, icon: IndianRupee },
    { label: 'Total orders', value: summary?.totalOrders ?? summary?.orders ?? 0, icon: ShoppingCart },
    { label: 'Total users', value: summary?.totalUsers ?? summary?.users ?? 0, icon: Users },
    { label: 'Low stock items', value: summary?.lowStockCount ?? summary?.lowStock?.length ?? 0, icon: AlertTriangle },
  ];

  return (
    <div>
      <h1 className="mb-6 animate-fade-up font-display text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="stagger-item animate-fade-up rounded-xl2 border border-ink/10 bg-paper p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-sand text-teal-700">
              <Icon size={16} />
            </div>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-xs text-ink/55">{label}</p>
          </div>
        ))}
      </div>

      {sales.length > 0 && (
        <div className="mt-8 rounded-xl2 border border-ink/10 bg-paper p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Sales trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21201d1a" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#0F4C4C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {summary?.recentOrders?.length > 0 && (
        <div className="mt-8 rounded-xl2 border border-ink/10 bg-paper p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-teal-700 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-ink/50">
                  <th className="py-2 font-medium">Order</th>
                  <th className="py-2 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentOrders.map((o) => (
                  <tr key={o._id} className="border-b border-ink/5">
                    <td className="py-2.5">{o.orderNumber}</td>
                    <td className="py-2.5">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5"><Badge>{o.orderStatus}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
