import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Sparkles, Star } from 'lucide-react';
import { productApi } from '../api/product.api';
import { categoryApi } from '../api/category.api';
import { bannerApi } from '../api/banner.api';
import ProductCarousel from '../components/product/ProductCarousel';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      productApi.featured(),
      productApi.trending(),
      productApi.bestsellers(),
      categoryApi.list(),
      bannerApi.list('hero'),
    ]).then(([f, t, bs, c, b]) => {
      if (f.status === 'fulfilled') setFeatured(f.value.data.data || []);
      if (t.status === 'fulfilled') setTrending(t.value.data.data || []);
      if (bs.status === 'fulfilled') setBestsellers(bs.value.data.data || []);
      if (c.status === 'fulfilled') {
        const all = c.value.data.data.categories || [];
        setCategories(all.filter((cat) => !cat.parentCategory));
      }
      if (b.status === 'fulfilled') setBanner((b.value.data.data.banners || b.value.data.data || [])[0]);
      setLoading(false);
    });
  }, []);

  const heroProducts = featured.slice(0, 3);

  return (
    <div>
      {/* Hero — asymmetric, gradient mesh + grain texture + product collage */}
      <section className="grain-overlay relative overflow-hidden bg-teal-900">
        <div className="absolute inset-0 bg-mesh-hero" />
        <div className="container-page relative z-10 grid gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-marigold-400 ring-1 ring-ivory/15">
              <Sparkles size={12} /> New season, handpicked
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-ivory sm:text-6xl lg:text-7xl">
              Everyday
              <br />
              <span className="italic text-marigold-400">elegance,</span>
              <br />
              rooted in India.
            </h1>
            <p className="mt-6 max-w-md text-base text-teal-50/75">
              {banner?.subheadline || 'Curated home, fashion, and lifestyle essentials — crafted with care, delivered with pride.'}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/products" className="btn-accent px-7 py-3 text-base">
                Shop the collection <ArrowRight size={17} />
              </Link>
              <Link to="/products?bestseller=true" className="btn px-7 py-3 text-base text-ivory ring-1 ring-ivory/30 hover:bg-ivory/10">
                Bestsellers
              </Link>
            </div>
          </div>

          {/* Product collage — 2-3 featured products layered, so the hero
              always shows real catalog items rather than one lottery photo. */}
          <div className="relative mx-auto h-[26rem] w-full max-w-md">
            {heroProducts[0] && (
              <Link
                to={`/products/${heroProducts[0].slug}`}
                className="absolute left-0 top-0 z-10 w-[62%] animate-scale-in overflow-hidden rounded-[1.5rem] ring-1 ring-ivory/20 shadow-glow transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[3/4] bg-teal-700/40">
                  <img
                    src={heroProducts[0].primaryImage || heroProducts[0].images?.[0]?.url}
                    alt={heroProducts[0].title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3">
                  <p className="truncate text-xs font-semibold text-ivory">{heroProducts[0].title}</p>
                </div>
              </Link>
            )}
            {heroProducts[1] && (
              <Link
                to={`/products/${heroProducts[1].slug}`}
                className="absolute bottom-6 right-0 z-20 w-[52%] animate-scale-in overflow-hidden rounded-[1.5rem] ring-1 ring-ivory/20 shadow-glow transition-transform duration-300 hover:-translate-y-1 [animation-delay:150ms]"
              >
                <div className="aspect-square bg-marigold-600/30">
                  <img
                    src={heroProducts[1].primaryImage || heroProducts[1].images?.[0]?.url}
                    alt={heroProducts[1].title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3">
                  <p className="truncate text-xs font-semibold text-ivory">{heroProducts[1].title}</p>
                </div>
              </Link>
            )}
            {heroProducts[2] && (
              <div className="absolute right-2 top-6 z-30 flex animate-float-slow items-center gap-1.5 rounded-full bg-marigold-600 px-3 py-1.5 text-xs font-bold text-ink shadow-lg [animation-delay:300ms]">
                <Star size={12} className="fill-ink" /> {heroProducts[2].ratingAverage?.toFixed(1) || '4.8'} rated
              </div>
            )}
            {heroProducts.length === 0 && (
              <div className="flex h-full items-center justify-center rounded-[1.5rem] bg-teal-700/40 font-display text-2xl text-teal-100/60 ring-1 ring-ivory/20">
                ZestMart
              </div>
            )}
          </div>
        </div>
        <svg className="absolute -bottom-1 left-0 w-full text-ivory" viewBox="0 0 1440 60" fill="currentColor">
          <path d="M0 40 C 360 0 1080 0 1440 40 L1440 60 L0 60 Z" />
        </svg>
      </section>

      {/* Trust strip */}
      <section className="container-page grid grid-cols-1 gap-4 py-10 sm:grid-cols-3">
        {[
          { icon: Truck, title: 'Free shipping', desc: 'On orders above ₹999' },
          { icon: RotateCcw, title: 'Easy returns', desc: '7-day return window' },
          { icon: ShieldCheck, title: 'Secure payments', desc: 'UPI, cards & COD' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            style={{ animationDelay: `${i * 100}ms` }}
            className="stagger-item flex animate-fade-up items-center gap-3 rounded-xl2 border border-ink/10 bg-paper p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-teal-700">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-ink/55">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="container-page"><div className="kantha-divider" /></div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-page py-12">
          <h2 className="font-display text-2xl font-semibold">Shop by category</h2>
          <div className="mt-6 flex gap-5 overflow-x-auto pb-3">
            {categories.map((c, i) => (
              <Link
                key={c._id}
                to={`/products?category=${c._id}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="stagger-item group flex w-32 shrink-0 animate-fade-up flex-col items-center gap-3 text-center"
              >
                <div className="h-24 w-24 overflow-hidden rounded-full bg-sand ring-2 ring-transparent transition-all duration-300 group-hover:scale-105 group-hover:ring-marigold-500">
                  {c.image && <img src={c.image} alt={c.name} className="h-full w-full object-cover" />}
                </div>
                <span className="text-sm font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured — moving carousel */}
      <section className="py-12">
        <div className="container-page mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow">Handpicked</p>
            <h2 className="font-display text-2xl font-semibold">Featured products</h2>
          </div>
          <Link to="/products?featured=true" className="nav-underline text-sm font-semibold text-teal-700">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="container-page grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5.6] rounded-xl2" />)}
          </div>
        ) : (
          <ProductCarousel products={featured} />
        )}
      </section>

      <div className="container-page"><div className="kantha-divider" /></div>

      {/* Trending — moving carousel */}
      <section className="py-12">
        <div className="container-page mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow">Right now</p>
            <h2 className="font-display text-2xl font-semibold">Trending</h2>
          </div>
          <Link to="/products?trending=true" className="nav-underline text-sm font-semibold text-teal-700">
            View all
          </Link>
        </div>
        {!loading && <ProductCarousel products={trending} reverse />}
      </section>

      {bestsellers.length > 0 && (
        <>
          <div className="container-page"><div className="kantha-divider" /></div>
          <section className="py-12">
            <div className="container-page mb-6 flex items-end justify-between">
              <div>
                <p className="eyebrow">Loved by many</p>
                <h2 className="font-display text-2xl font-semibold">Bestsellers</h2>
              </div>
              <Link to="/products?bestseller=true" className="nav-underline text-sm font-semibold text-teal-700">
                View all
              </Link>
            </div>
            <ProductCarousel products={bestsellers} />
          </section>
        </>
      )}
    </div>
  );
}