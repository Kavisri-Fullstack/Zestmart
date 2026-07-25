import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Star, Trash2 } from 'lucide-react';
import { reviewApi } from '../../api/review.api';
import { extractError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

export default function ReviewSection({ productId }) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    reviewApi
      .listForProduct(productId)
      .then((res) => setReviews(res.data.data.reviews || res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [productId]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewApi.create(productId, { rating, comment });
      toast.success('Review submitted');
      setComment('');
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    try {
      await reviewApi.remove(id);
      toast.success('Review deleted');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div>
      <h3 className="font-display text-xl font-semibold">Reviews</h3>

      {isAuthenticated && (
        <form onSubmit={submit} className="mt-4 rounded-xl2 border border-ink/10 p-4">
          <label className="label">Your rating</label>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)}>
                <Star size={22} className={n <= rating ? 'fill-marigold-600 text-marigold-600' : 'text-ink/20'} />
              </button>
            ))}
          </div>
          <textarea
            className="input"
            rows={3}
            placeholder="Share your experience with this product…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn-primary mt-3" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-5">
        {loading && <Spinner />}
        {!loading && reviews.length === 0 && <p className="text-sm text-ink/50">No reviews yet. Be the first to review!</p>}
        {reviews.map((r) => (
          <div key={r._id} className="border-b border-ink/10 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{r.user?.name || 'Anonymous'}</p>
                <div className="mt-1 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} className={n <= r.rating ? 'fill-marigold-600 text-marigold-600' : 'text-ink/15'} />
                  ))}
                </div>
              </div>
              {user?._id === (r.user?._id || r.user) && (
                <button onClick={() => remove(r._id)} className="text-ink/40 hover:text-maroon-600">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            {r.comment && <p className="mt-2 text-sm text-ink/70">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
