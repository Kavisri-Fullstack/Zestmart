import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-sand/60">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold text-teal-700">
            Zest<span className="text-marigold-600">Mart</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-ink/60">
            Premium Indian lifestyle goods — thoughtfully sourced, honestly priced.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-3">Shop</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li><Link to="/products" className="hover:text-teal-700">All products</Link></li>
            <li><Link to="/products?featured=true" className="hover:text-teal-700">Featured</Link></li>
            <li><Link to="/products?bestseller=true" className="hover:text-teal-700">Bestsellers</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-3">Account</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li><Link to="/orders" className="hover:text-teal-700">Track orders</Link></li>
            <li><Link to="/wishlist" className="hover:text-teal-700">Wishlist</Link></li>
            <li><Link to="/profile" className="hover:text-teal-700">Addresses</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-3">Support</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li><Link to="/support" className="hover:text-teal-700">Contact us</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink/10 py-5 text-center text-xs text-ink/45">
        © {new Date().getFullYear()} ZestMart. All rights reserved.
      </div>
    </footer>
  );
}
