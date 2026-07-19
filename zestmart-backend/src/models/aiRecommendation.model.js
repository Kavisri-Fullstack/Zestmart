const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * AIRecommendations collection — matches the "AIRecommendations" section
 * of the spec exactly. Stores a personalized recommendation SNAPSHOT per
 * user, so "Recommended for you" can be served instantly from a cached
 * document instead of recomputing on every page load.
 *
 * The word "AI" in the spec anticipates a real machine-learning model
 * eventually populating this collection. Today, recommendation.service.js
 * generates the snapshot using the same rule-based logic from Phase 6
 * (recently-viewed categories) — the collection and its read path are
 * fully ML-ready; only the generation step is simple for now. Swapping
 * in a real model later means changing ONLY how this collection gets
 * populated, not any of the API surface that reads from it.
 */
const aiRecommendationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sourceType: {
      type: String,
      enum: ['recently_viewed', 'featured_fallback', 'purchase_history'],
      required: true,
    },
    productIds: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },
    contextProductId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    score: { type: Number, default: 0, min: 0, max: 1 },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false }
);

// ---------- Indexes (matching spec) ----------
aiRecommendationSchema.index({ user: 1 });
aiRecommendationSchema.index({ sourceType: 1 });
aiRecommendationSchema.index({ generatedAt: -1 });
// TTL: a stale snapshot is automatically removed once it expires, so
// the next request naturally regenerates a fresh one.
aiRecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AIRecommendation', aiRecommendationSchema);
