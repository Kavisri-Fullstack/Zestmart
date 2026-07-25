const env = require('../config/env');
const { Product } = require('../models');
const ApiError = require('../utils/ApiError');

const MAX_HISTORY_MESSAGES = 12; // bounds token usage per request

const SYSTEM_PROMPT = `You are Zesty, the friendly shopping assistant for ZestMart — an online store for premium Indian lifestyle products (fashion, footwear, home decor, kitchenware, beauty, jewellery, gadgets, and more).

Your job: help shoppers find products, compare options, and answer general store questions.

Rules:
- Whenever the user is looking for a product, a gift idea, or anything purchasable, use the search_products function to look up REAL items from ZestMart's own catalog. Never invent product names, prices, or availability — only mention products the function actually returned.
- If the function returns no results, say so honestly and suggest a broader search instead of making something up.
- Keep replies short and conversational (2-4 sentences), like a helpful in-store assistant, not a wall of text.
- You can answer general policy questions from what you know about ZestMart: free shipping on orders above ₹999, 7-day return window, Cash on Delivery and online payment (UPI/cards) both supported.
- You don't have access to a specific user's order history or account details — if asked about "my order", direct them to the Orders page.
- Stay strictly on ZestMart shopping topics. Politely decline anything unrelated.`;

const SEARCH_PRODUCTS_FUNCTION = {
  name: 'search_products',
  description:
    "Search ZestMart's product catalog. Use this any time the user wants a product recommendation, is browsing for something to buy, or asks what's available in a category.",
  parameters: {
    type: 'OBJECT',
    properties: {
      query: {
        type: 'STRING',
        description: 'Keywords describing what the user wants, e.g. "silk saree", "wireless earbuds", "diwali gift".',
      },
      maxPrice: {
        type: 'NUMBER',
        description: 'Maximum price in INR, only if the user mentioned a budget.',
      },
      limit: {
        type: 'NUMBER',
        description: 'How many results to return. Default 5, max 8.',
      },
    },
    required: ['query'],
  },
};

/** Executes the search_products function against the real catalog. */
async function runProductSearch({ query, maxPrice, limit }) {
  const filter = { isActive: true };
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
      { brand: { $regex: query, $options: 'i' } },
      { subCategory: { $regex: query, $options: 'i' } },
    ];
  }
  if (maxPrice) filter.price = { $lte: maxPrice };

  const safeLimit = Math.min(Math.max(limit || 5, 1), 8);

  const products = await Product.find(filter)
    .sort('-ratingAverage -isFeatured')
    .limit(safeLimit)
    .select('title slug price compareAtPrice primaryImage ratingAverage stock brand');

  return products;
}

async function callGemini(contents) {
  if (!env.gemini.apiKey) {
    throw ApiError.internal(
      'AI assistant is not configured. Set GEMINI_API_KEY in the backend .env to enable it.',
      'AI_NOT_CONFIGURED'
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.gemini.model}:generateContent?key=${env.gemini.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      tools: [{ function_declarations: [SEARCH_PRODUCTS_FUNCTION] }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw ApiError.internal(`AI assistant request failed (${res.status}): ${errBody}`, 'AI_REQUEST_FAILED');
  }

  return res.json();
}

const textFromResponse = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join('\n')
    .trim();
};

const functionCallFromResponse = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.find((p) => p.functionCall)?.functionCall || null;
};

/**
 * Handles one chat turn: sends the conversation to Gemini, executes the
 * search_products function if requested, and returns a natural-language
 * reply plus the (real) products found, if any.
 */
async function chat({ message, history = [] }) {
  const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const contents = [...trimmedHistory, { role: 'user', parts: [{ text: message }] }];

  const first = await callGemini(contents);
  const call = functionCallFromResponse(first);

  if (!call) {
    return { reply: textFromResponse(first) || "Sorry, I didn't quite catch that — could you rephrase?", products: [] };
  }

  const products = await runProductSearch(call.args || {});

  const functionResultPayload = products.length
    ? products.map((p) => ({
        title: p.title,
        price: p.price,
        rating: p.ratingAverage,
        inStock: p.stock > 0,
      }))
    : { message: 'No matching products found.' };

  const second = await callGemini([
    ...contents,
    { role: 'model', parts: [{ functionCall: call }] },
    {
      role: 'user',
      parts: [{ functionResponse: { name: 'search_products', response: { result: functionResultPayload } } }],
    },
  ]);

  return {
    reply: textFromResponse(second) || "Here's what I found for you:",
    products,
  };
}

module.exports = { chat };