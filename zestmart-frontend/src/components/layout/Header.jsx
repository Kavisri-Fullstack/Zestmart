import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, LogOut, LayoutDashboard, Package, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { categoryApi } from '../../api/category.api';
import { searchApi } from '../../api/search.api';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.data.data.categories || [])).catch(() => {});
  }, []);

  // Lock background scroll while the mobile menu drawer is open, so touch
  // scrolling affects the menu itself instead of the page behind it.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const topLevelCategories = categories.filter((c) => !c.parentCategory);
  const childrenOf = (parentId) => categories.filter((c) => c.parentCategory === parentId);

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchApi.suggestions(query.trim())
        .then((res) => setSuggestions(res.data.data.suggestions || res.data.data || []))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const submitSearch = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const pickSuggestion = (text) => {
    setQuery(text);
    setShowSuggestions(false);
    navigate(`/products?q=${encodeURIComponent(text)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-ivory/90 backdrop-blur-lg backdrop-saturate-150 relative">
      <div className="kantha-divider absolute inset-x-0 bottom-0" />
      <div className="container-page flex h-16 items-center gap-4">
        <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="group shrink-0 font-display text-2xl font-semibold tracking-tight text-teal-700">
          Zest<span className="text-marigold-600 transition-transform duration-300 inline-block group-hover:rotate-6">Mart</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {topLevelCategories.slice(0, 6).map((c) => {
            const children = childrenOf(c._id);
            return (
              <div key={c._id} className="group/nav relative">
                <Link to={`/products?category=${c._id}`} className="nav-underline text-sm font-medium text-ink/70 hover:text-teal-700">
                  {c.name}
                </Link>
                {children.length > 0 && (
                  <div className="invisible absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover/nav:visible group-hover/nav:opacity-100">
                    <div className="rounded-xl2 border border-ink/10 bg-paper py-2 shadow-card">
                      {children.map((child) => (
                        <Link
                          key={child._id}
                          to={`/products?category=${child._id}`}
                          className="block px-4 py-2 text-sm text-ink/70 hover:bg-sand hover:text-teal-700"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {isAuthenticated && (
            <Link to="/discover" className="nav-underline flex items-center gap-1 text-sm font-medium text-marigold-700 hover:text-marigold-600">
              <Sparkles size={14} /> For you
            </Link>
          )}
        </nav>

        <div ref={searchRef} className="relative ml-auto hidden flex-1 max-w-md sm:block">
          <form onSubmit={submitSearch} className="flex items-center">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for products…"
                className="input pl-9"
              />
            </div>
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-xl2 border border-ink/10 bg-paper py-1 shadow-card">
              {suggestions.map((s, i) => {
                const text = typeof s === 'string' ? s : s.text || s.title;
                return (
                  <button
                    key={i}
                    onClick={() => pickSuggestion(text)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-sand"
                  >
                    <Search size={13} className="text-ink/30" /> {text}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          {isAuthenticated && <NotificationBell />}
          <Link to="/wishlist" className="relative rounded-full p-2 text-ink/70 transition-all duration-200 hover:bg-sand hover:scale-110 active:scale-95" aria-label="Wishlist">
            <Heart size={20} />
          </Link>
          <Link to="/cart" className="relative rounded-full p-2 text-ink/70 transition-all duration-200 hover:bg-sand hover:scale-110 active:scale-95" aria-label="Cart">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span key={itemCount} className="absolute -right-0.5 -top-0.5 flex h-4 w-4 animate-pulse-soft items-center justify-center rounded-full bg-marigold-600 text-[10px] font-bold text-ink">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-ivory"
              >
                {user?.name?.[0]?.toUpperCase() || <User size={16} />}
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl2 border border-ink/10 bg-paper py-2 shadow-card">
                  <div className="border-b border-ink/10 px-4 pb-2">
                    <p className="truncate text-sm font-semibold">{user?.name}</p>
                    <p className="truncate text-xs text-ink/50">{user?.email}</p>
                  </div>
                  <Link to="/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-sand">
                    <Package size={15} /> My orders
                  </Link>
                  <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-sand">
                    <User size={15} /> Profile & addresses
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-sand">
                      <LayoutDashboard size={15} /> Admin dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { setProfileOpen(false); logout(); navigate('/'); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-maroon-600 hover:bg-sand"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary hidden sm:inline-flex">Sign in</Link>
          )}
        </div>
      </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-ivory px-4 py-3 md:hidden">
          <form onSubmit={submitSearch} className="mb-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="input" />
          </form>
          <div className="flex flex-col gap-1 pb-8">
            {topLevelCategories.map((c) => (
              <div key={c._id}>
                <Link to={`/products?category=${c._id}`} onClick={() => setMenuOpen(false)} className="block py-1.5 text-sm font-semibold">
                  {c.name}
                </Link>
                {childrenOf(c._id).map((child) => (
                  <Link key={child._id} to={`/products?category=${child._id}`} onClick={() => setMenuOpen(false)} className="block py-1 pl-3 text-sm text-ink/60">
                    {child.name}
                  </Link>
                ))}
              </div>
            ))}
            {isAuthenticated && (
              <Link to="/discover" onClick={() => setMenuOpen(false)} className="py-1.5 text-sm font-medium text-marigold-700">
                For you
              </Link>
            )}
            {!isAuthenticated && (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary mt-2 justify-center">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}