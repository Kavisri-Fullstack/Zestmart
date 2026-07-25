import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, ShoppingCart, Ticket, Image, Users, ArrowLeft, Settings, ScrollText,
} from 'lucide-react';

const links = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/settings', label: 'Site settings', icon: Settings },
  { to: '/admin/activity-logs', label: 'Activity logs', icon: ScrollText },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-ivory">
      <aside className="hidden w-60 shrink-0 border-r border-ink/10 bg-paper md:block">
        <div className="flex h-16 items-center border-b border-ink/10 px-6">
          <span className="font-display text-xl font-semibold text-teal-700">
            Zest<span className="text-marigold-600">Mart</span>
          </span>
          <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-700">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-teal-600 text-ivory' : 'text-ink/70 hover:bg-sand'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink/10 p-3">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-sand">
            <ArrowLeft size={16} /> Back to store
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="container-page py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
