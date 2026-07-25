export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="mt-10 flex items-center justify-center gap-1.5">
      <button
        className="btn-ghost px-3 py-1.5"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>
      {pages.map((p, idx) => (
        <span key={p} className="flex items-center gap-1.5">
          {idx > 0 && pages[idx - 1] !== p - 1 && <span className="px-1 text-ink/30">…</span>}
          <button
            onClick={() => onChange(p)}
            className={`h-9 w-9 rounded-full text-sm font-medium transition ${
              p === page ? 'bg-teal-600 text-ivory' : 'text-ink/70 hover:bg-sand'
            }`}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        className="btn-ghost px-3 py-1.5"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
