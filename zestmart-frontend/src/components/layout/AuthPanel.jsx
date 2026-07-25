import { Sparkles, Star } from 'lucide-react';

/** Decorative left-hand panel shared across Login/Register/Forgot-password. */
export default function AuthPanel() {
  return (
    <div className="grain-overlay relative hidden overflow-hidden bg-teal-900 lg:block">
      <div className="absolute inset-0 bg-mesh-hero" />
      <div className="relative z-10 flex h-full flex-col justify-between p-10">
        <span className="font-display text-2xl font-semibold text-ivory">
          Zest<span className="text-marigold-400">Mart</span>
        </span>

        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-marigold-400 ring-1 ring-ivory/15">
            <Sparkles size={12} /> Premium Indian lifestyle
          </span>
          <p className="mt-5 max-w-sm font-display text-3xl font-medium leading-snug text-ivory">
            "Every piece here carries a story — handcrafted, honest, and made to last."
          </p>
          <div className="mt-5 flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} size={14} className="fill-marigold-400 text-marigold-400" />
            ))}
            <span className="ml-2 text-xs text-teal-50/70">Loved by 50,000+ shoppers</span>
          </div>
        </div>

        <p className="text-xs text-teal-50/50">© {new Date().getFullYear()} ZestMart. All rights reserved.</p>
      </div>
    </div>
  );
}
