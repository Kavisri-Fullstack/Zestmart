/**
 * ZestMart catalog seed script.
 *
 * Populates categories (with sub-categories), a realistic product catalog,
 * and a ready-to-use admin account — so the storefront/admin dashboard have
 * real data to render against instead of an empty DB.
 *
 * Product images come from the Pexels API (https://www.pexels.com/api/) —
 * free, official, and explicitly licensed for this kind of use (no
 * attribution required). Each product searches Pexels using its own
 * (cleaned) title first, falling back to a broader category search, and
 * finally to a branded placeholder if nothing is found — so results stay
 * as relevant as possible and the seed never breaks.
 *
 * Set PEXELS_API_KEY in your .env to enable real photos.
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Category, Product, User, Banner, Notification } = require('../models');
const dns = require('dns');
dns.setServers(["1.1.1.1", "8.8.8.8"]);

/**
 * Branded placeholder images (via placehold.co) — solid brand-color
 * background with the product/category name printed on it. Used as the
 * last-resort fallback so the seed always produces something reliable
 * and correctly labeled.
 */
const BRAND_SWATCHES = [
  { bg: '0F4C4C', fg: 'FAF6EC' }, // teal
  { bg: 'E8A33D', fg: '211D1A' }, // marigold
  { bg: '7A1F3D', fg: 'FAF6EC' }, // maroon
  { bg: 'EFE6D6', fg: '211D1A' }, // sand
];

const img = (label, swatchIndex = 0, w = 900, h = 1125) => {
  const { bg, fg } = BRAND_SWATCHES[swatchIndex % BRAND_SWATCHES.length];
  const text = encodeURIComponent(label.length > 28 ? label.slice(0, 28) + '…' : label);
  return `https://placehold.co/${w}x${h}/${bg}/${fg}.png?text=${text}&font=playfair-display`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches real photo URLs from Pexels for a search query. Returns an empty
 * array (never throws) if no API key is set or the request fails, so
 * callers can transparently fall back to a broader query or a placeholder.
 */
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
async function fetchPexelsPhotos(query, count = 3, isRetry = false) {
  if (!PEXELS_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (res.status === 429 && !isRetry) {
      // Rate-limited — back off and retry once rather than silently
      // falling through to a placeholder / duplicate fallback photo.
      await sleep(3000);
      return fetchPexelsPhotos(query, count, true);
    }
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).map((p) => p.src.large);
  } catch {
    return [];
  }
}

/** Strips a " — Variant" / "(Pack of N)" suffix so the search query stays tight. */
const coreTitle = (title) => title.split('—')[0].replace(/\s*\([^)]*\)\s*$/, '').trim();

// ---------------------------------------------------------------------------
// Category tree: 9 top-level categories, each with 2 sub-categories.
// ---------------------------------------------------------------------------
const CATEGORY_TREE = [
  {
    slug: 'fashion', name: 'Fashion', description: 'Everyday and occasion wear, rooted in Indian craft.',
    subs: [
      { slug: 'mens-ethnic', name: "Men's Ethnic Wear", description: 'Kurtas, bandhgalas and festive essentials.' },
      { slug: 'womens-ethnic', name: "Women's Ethnic Wear", description: 'Sarees, kurtis and suit sets.' },
    ],
  },
  {
    slug: 'footwear', name: 'Footwear', description: 'Handcrafted and everyday footwear for every occasion.',
    subs: [
      { slug: 'mens-footwear', name: "Men's Footwear", description: 'Juttis, loafers, sneakers and formal shoes.' },
      { slug: 'womens-footwear', name: "Women's Footwear", description: 'Mojaris, heels, flats and casual wear.' },
    ],
  },
  {
    slug: 'home-living', name: 'Home & Living', description: 'Decor and furnishings crafted by Indian artisans.',
    subs: [
      { slug: 'home-decor', name: 'Home Decor', description: 'Wall art, lamps and decorative accents.' },
      { slug: 'furnishings', name: 'Furnishings', description: 'Bedcovers, cushions, curtains and rugs.' },
    ],
  },
  {
    slug: 'kitchen-dining', name: 'Kitchen & Dining', description: 'Traditional cookware and serveware for modern kitchens.',
    subs: [
      { slug: 'cookware', name: 'Cookware', description: 'Cast iron, copper and clay cookware.' },
      { slug: 'dinnerware', name: 'Dinnerware & Serveware', description: 'Hand-painted and artisan tableware.' },
    ],
  },
  {
    slug: 'beauty-wellness', name: 'Beauty & Wellness', description: 'Ayurvedic and natural self-care essentials.',
    subs: [
      { slug: 'skincare', name: 'Skincare', description: 'Face oils, masks and natural skincare.' },
      { slug: 'haircare', name: 'Haircare', description: 'Herbal oils, shampoos and hair treatments.' },
    ],
  },
  {
    slug: 'bags-jewellery', name: 'Bags & Jewellery', description: 'Handcrafted bags and statement jewellery.',
    subs: [
      { slug: 'bags-wallets', name: 'Bags & Wallets', description: 'Totes, slings, clutches and wallets.' },
      { slug: 'jewellery', name: 'Jewellery', description: 'Oxidised silver, kundan and beaded pieces.' },
    ],
  },
  {
    slug: 'electronics-gadgets', name: 'Electronics & Gadgets', description: 'Everyday smart gadgets for modern living.',
    subs: [
      { slug: 'smart-gadgets', name: 'Smart Gadgets', description: 'Audio, wearables and smart home devices.' },
    ],
  },
  {
    slug: 'grocery-gourmet', name: 'Grocery & Gourmet', description: 'Pantry staples and gourmet picks from across India.',
    subs: [
      { slug: 'spices-condiments', name: 'Spices & Condiments', description: 'Whole spices, masalas, oils and pickles.' },
      { slug: 'snacks-beverages', name: 'Snacks & Beverages', description: 'Teas, coffee, and wholesome snacking.' },
    ],
  },
  {
    slug: 'baby-kids', name: 'Baby & Kids', description: 'Comfortable wear and toys for little ones.',
    subs: [
      { slug: 'kids-wear', name: 'Kids Wear', description: 'Everyday and festive clothing for children.' },
      { slug: 'toys-books', name: 'Toys & Books', description: 'Wooden toys, puzzles and picture books.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Products per sub-category slug.
// ---------------------------------------------------------------------------
const PRODUCTS = {
  'mens-ethnic': [
    { title: 'Handloom Cotton Kurta — Indigo', brand: 'Threadcraft', price: 1499, compareAtPrice: 1999, isBestSeller: true },
    { title: 'Nehru Jacket — Charcoal', brand: 'Anokhi', price: 2199, compareAtPrice: 2799 },
    { title: 'Silk Blend Kurta — Maroon', brand: 'Zeenat', price: 2499, compareAtPrice: 3199, isFeatured: true },
    { title: 'Linen Kurta-Pyjama Set — Sand', brand: 'Rooted', price: 2899, compareAtPrice: null },
    { title: 'Bandhgala Blazer — Ivory', brand: 'Nakshatra', price: 4499, compareAtPrice: 5499, isNewArrival: true },
    { title: 'Block Print Kurta — Mustard', brand: 'Anokhi', price: 1699, compareAtPrice: 2099 },
    { title: 'Dhoti & Angavastram Set', brand: 'Rooted', price: 1899, compareAtPrice: 2299 },
    { title: 'Cotton Blend Waistcoat — Beige', brand: 'Nakshatra', price: 1599, compareAtPrice: 1999 },
  ],
  'womens-ethnic': [
    { title: 'Banarasi Silk Saree — Emerald', brand: 'Zeenat', price: 5999, compareAtPrice: 7999, isBestSeller: true, isFeatured: true },
    { title: 'Chikankari Cotton Kurti — White', brand: 'Anokhi', price: 1299, compareAtPrice: 1699 },
    { title: 'Anarkali Suit Set — Rose Pink', brand: 'Nakshatra', price: 3499, compareAtPrice: 4299, isTrending: true },
    { title: 'Handloom Cotton Saree — Ochre', brand: 'Rooted', price: 2199, compareAtPrice: null },
    { title: 'Bandhani Dupatta Set — Fuchsia', brand: 'Threadcraft', price: 899, compareAtPrice: 1199 },
    { title: 'Georgette Kurti — Rose', brand: 'Zeenat', price: 1599, compareAtPrice: 1999, isNewArrival: true },
    { title: 'Lehenga Choli Set — Wine', brand: 'Nakshatra', price: 6499, compareAtPrice: 7999 },
    { title: 'Cotton Palazzo Suit Set', brand: 'Anokhi', price: 1799, compareAtPrice: 2199 },
  ],
  'mens-footwear': [
    { title: 'Leather Juttis — Tan', brand: 'CopperTales', price: 1799, compareAtPrice: 2299, isBestSeller: true },
    { title: 'Canvas Sneakers — Off White', brand: 'Verve', price: 2299, compareAtPrice: 2799 },
    { title: 'Formal Oxford Shoes — Black', brand: 'Ivory Lane', price: 3299, compareAtPrice: 3999 },
    { title: 'Kolhapuri Sandals — Brown', brand: 'CopperTales', price: 1299, compareAtPrice: 1599, isFeatured: true },
    { title: 'Suede Loafers — Navy', brand: 'Verve', price: 2999, compareAtPrice: 3599 },
    { title: 'Running Shoes — Grey', brand: 'Verve', price: 2499, compareAtPrice: null, isTrending: true },
    { title: 'Leather Chelsea Boots — Brown', brand: 'Ivory Lane', price: 3599, compareAtPrice: 4299 },
    { title: 'Casual Flip Flops — Navy', brand: 'Verve', price: 599, compareAtPrice: 799 },
  ],
  'womens-footwear': [
    { title: 'Embroidered Mojaris — Gold', brand: 'CopperTales', price: 1599, compareAtPrice: 1999, isBestSeller: true },
    { title: 'Block Heel Sandals — Tan', brand: 'Ivory Lane', price: 1999, compareAtPrice: 2499 },
    { title: 'Ballet Flats — Blush', brand: 'Verve', price: 1399, compareAtPrice: 1699 },
    { title: 'Ethnic Kolhapuri Flats — Red', brand: 'CopperTales', price: 1299, compareAtPrice: null, isFeatured: true },
    { title: 'Espadrille Wedges — Beige', brand: 'Ivory Lane', price: 2199, compareAtPrice: 2699 },
    { title: 'Casual Slip-ons — White', brand: 'Verve', price: 1099, compareAtPrice: 1399, isNewArrival: true },
    { title: 'Stiletto Heels — Black', brand: 'Ivory Lane', price: 2499, compareAtPrice: 2999 },
    { title: 'Comfort Walking Sandals', brand: 'Verve', price: 1299, compareAtPrice: 1599 },
  ],
  'home-decor': [
    { title: 'Brass Diya Set (Pack of 5)', brand: 'Terra Home', price: 899, compareAtPrice: 1199, isBestSeller: true },
    { title: 'Handwoven Wall Hanging — Ochre', brand: 'Rooted', price: 1799, compareAtPrice: 2299, isFeatured: true },
    { title: 'Terracotta Vase — Earth Tone', brand: 'Terra Home', price: 1299, compareAtPrice: null },
    { title: 'Madhubani Painting Canvas', brand: 'Anokhi', price: 2499, compareAtPrice: 2999, isTrending: true },
    { title: 'Dhokra Art Figurine — Horse', brand: 'Terra Home', price: 1599, compareAtPrice: 1999 },
    { title: 'Rattan Table Lamp', brand: 'WoodWhisper', price: 2199, compareAtPrice: 2799, isNewArrival: true },
    { title: 'Wooden Wall Shelf', brand: 'WoodWhisper', price: 1499, compareAtPrice: 1899 },
    { title: 'Macrame Wall Hanging', brand: 'Rooted', price: 999, compareAtPrice: 1299 },
  ],
  furnishings: [
    { title: 'Kantha Stitch Bedcover — Indigo', brand: 'Threadcraft', price: 2999, compareAtPrice: 3799, isBestSeller: true },
    { title: 'Block Print Cushion Covers (Set of 5)', brand: 'Anokhi', price: 1499, compareAtPrice: 1899, isFeatured: true },
    { title: 'Handloom Table Runner — Rust', brand: 'Rooted', price: 799, compareAtPrice: null },
    { title: 'Ikat Curtains (Set of 2)', brand: 'Threadcraft', price: 2199, compareAtPrice: 2699 },
    { title: 'Cotton Dohar Blanket — Grey', brand: 'Rooted', price: 1799, compareAtPrice: 2199, isTrending: true },
    { title: 'Jute Area Rug — Natural', brand: 'Terra Home', price: 3499, compareAtPrice: 4199 },
    { title: 'Embroidered Bedsheet Set', brand: 'Threadcraft', price: 2299, compareAtPrice: 2799 },
    { title: 'Linen Sofa Throw — Beige', brand: 'Rooted', price: 1299, compareAtPrice: 1599 },
  ],
  cookware: [
    { title: 'Cast Iron Kadai — 10 inch', brand: "Mistry Kitchens", price: 1699, compareAtPrice: 2099, isBestSeller: true },
    { title: 'Copper Bottom Tope Set (3 pc)', brand: "Mistry Kitchens", price: 2299, compareAtPrice: 2799, isFeatured: true },
    { title: 'Non-stick Tawa — 12 inch', brand: "Mistry Kitchens", price: 899, compareAtPrice: null },
    { title: 'Handi Clay Cooking Pot', brand: 'Terra Home', price: 999, compareAtPrice: 1299 },
    { title: 'Brass Serving Bowl Set (4 pc)', brand: 'CopperTales', price: 1899, compareAtPrice: 2299, isNewArrival: true },
    { title: 'Stainless Steel Pressure Cooker — 5L', brand: "Mistry Kitchens", price: 2499, compareAtPrice: 2999, isTrending: true },
    { title: 'Cast Iron Dosa Tawa', brand: "Mistry Kitchens", price: 1199, compareAtPrice: 1499 },
    { title: 'Steel Idli Steamer — 4 Plate', brand: "Mistry Kitchens", price: 799, compareAtPrice: 999 },
  ],
  dinnerware: [
    { title: 'Hand-painted Ceramic Dinner Set (16 pc)', brand: 'Ivory Lane', price: 3999, compareAtPrice: 4999, isBestSeller: true },
    { title: 'Blue Pottery Serving Platter', brand: 'Terra Home', price: 1599, compareAtPrice: 1999, isFeatured: true },
    { title: 'Brass Thali Set', brand: 'CopperTales', price: 1799, compareAtPrice: null },
    { title: 'Wooden Coasters (Set of 6)', brand: 'WoodWhisper', price: 599, compareAtPrice: 799 },
    { title: 'Copper Water Bottle — 1L', brand: 'CopperTales', price: 899, compareAtPrice: 1099, isTrending: true },
    { title: 'Ceramic Tea Set (5 pc)', brand: 'Ivory Lane', price: 1499, compareAtPrice: 1899 },
    { title: 'Glass Serving Bowl Set', brand: 'Ivory Lane', price: 899, compareAtPrice: 1199 },
    { title: 'Wooden Serving Tray', brand: 'WoodWhisper', price: 1099, compareAtPrice: 1399 },
  ],
  skincare: [
    { title: 'Rose Water Face Mist — 200ml', brand: 'GlowRitual', price: 399, compareAtPrice: 499, isBestSeller: true },
    { title: 'Turmeric Glow Face Pack — 150g', brand: 'PureLeaf', price: 349, compareAtPrice: 449, isFeatured: true },
    { title: 'Ayurvedic Face Oil — 30ml', brand: 'GlowRitual', price: 699, compareAtPrice: 899 },
    { title: 'Sandalwood Soap (Pack of 3)', brand: 'PureLeaf', price: 299, compareAtPrice: null },
    { title: 'Kumkumadi Brightening Serum — 20ml', brand: 'GlowRitual', price: 999, compareAtPrice: 1299, isTrending: true },
    { title: 'Multani Mitti Clay Mask — 200g', brand: 'PureLeaf', price: 349, compareAtPrice: 449, isNewArrival: true },
    { title: 'Aloe Vera Gel — 300ml', brand: 'PureLeaf', price: 249, compareAtPrice: 349 },
    { title: 'Vitamin C Face Serum — 30ml', brand: 'GlowRitual', price: 799, compareAtPrice: 999 },
  ],
  haircare: [
    { title: 'Cold-Pressed Amla Hair Oil — 200ml', brand: 'PureLeaf', price: 449, compareAtPrice: 599, isBestSeller: true },
    { title: 'Herbal Shampoo Bar', brand: 'GlowRitual', price: 349, compareAtPrice: 449 },
    { title: 'Onion Hair Growth Serum — 50ml', brand: 'GlowRitual', price: 649, compareAtPrice: 799, isFeatured: true },
    { title: 'Bhringraj Intensive Hair Mask — 200g', brand: 'PureLeaf', price: 499, compareAtPrice: null },
    { title: 'Rosemary Hair Tonic — 100ml', brand: 'GlowRitual', price: 599, compareAtPrice: 749, isTrending: true },
    { title: 'Argan Oil Hair Conditioner — 250ml', brand: 'PureLeaf', price: 449, compareAtPrice: 549 },
    { title: 'Wooden Neem Comb', brand: 'PureLeaf', price: 199, compareAtPrice: 249 },
    { title: 'Hibiscus Hair Cleanser — 200ml', brand: 'GlowRitual', price: 399, compareAtPrice: 499 },
  ],
  'bags-wallets': [
    { title: 'Handwoven Jute Tote Bag', brand: 'Rooted', price: 899, compareAtPrice: 1199, isBestSeller: true },
    { title: 'Leather Sling Bag — Tan', brand: 'Ivory Lane', price: 2199, compareAtPrice: 2799, isFeatured: true },
    { title: 'Banjara Embroidered Clutch', brand: 'Anokhi', price: 1299, compareAtPrice: 1599 },
    { title: 'Canvas Backpack — Olive', brand: 'Verve', price: 1799, compareAtPrice: null, isTrending: true },
    { title: 'Leather Bifold Wallet — Tan', brand: 'Ivory Lane', price: 999, compareAtPrice: 1299 },
    { title: 'Silk Potli Bag — Wine', brand: 'Zeenat', price: 699, compareAtPrice: 899, isNewArrival: true },
    { title: 'Leather Laptop Bag — Brown', brand: 'Ivory Lane', price: 3299, compareAtPrice: 3999 },
    { title: 'Embroidered Sling Pouch', brand: 'Anokhi', price: 799, compareAtPrice: 999 },
  ],
  jewellery: [
    { title: 'Oxidised Silver Jhumkas', brand: 'Nakshatra', price: 599, compareAtPrice: 799, isBestSeller: true },
    { title: 'Kundan Choker Necklace Set', brand: 'Nakshatra', price: 2499, compareAtPrice: 3199, isFeatured: true },
    { title: 'Beaded Statement Necklace', brand: 'Anokhi', price: 899, compareAtPrice: 1199 },
    { title: 'Silver Toe Rings (Pair)', brand: 'Nakshatra', price: 399, compareAtPrice: null },
    { title: 'Meenakari Bangles (Set of 4)', brand: 'Nakshatra', price: 1199, compareAtPrice: 1499, isTrending: true },
    { title: 'Pearl Drop Earrings', brand: 'Zeenat', price: 799, compareAtPrice: 999 },
    { title: 'Temple Jewellery Necklace Set', brand: 'Nakshatra', price: 2999, compareAtPrice: 3799 },
    { title: 'Silver Anklets (Pair)', brand: 'Nakshatra', price: 699, compareAtPrice: 899 },
  ],
  'smart-gadgets': [
    { title: 'Wireless Earbuds — Pro', brand: 'Lumen', price: 2499, compareAtPrice: 3299, isBestSeller: true, isTrending: true },
    { title: 'Portable Bluetooth Speaker', brand: 'Lumen', price: 1899, compareAtPrice: 2499, isFeatured: true },
    { title: 'Smart Fitness Band', brand: 'Lumen', price: 1699, compareAtPrice: 2199 },
    { title: 'Smart LED Desk Lamp', brand: 'Lumen', price: 1299, compareAtPrice: null, isNewArrival: true },
    { title: 'Wireless Charging Pad', brand: 'Lumen', price: 899, compareAtPrice: 1199 },
    { title: 'Smart Home Plug (Pack of 2)', brand: 'Lumen', price: 999, compareAtPrice: 1299 },
    { title: 'Noise Cancelling Headphones', brand: 'Lumen', price: 3499, compareAtPrice: 4299 },
    { title: 'Smart Digital Photo Frame', brand: 'Lumen', price: 2799, compareAtPrice: 3499 },
  ],
  'spices-condiments': [
    { title: 'Organic Turmeric Powder — 200g', brand: 'PureLeaf', price: 199, compareAtPrice: 249, isBestSeller: true },
    { title: 'Kashmiri Red Chilli Powder — 200g', brand: 'PureLeaf', price: 229, compareAtPrice: 279 },
    { title: 'Cold-Pressed Coconut Oil — 500ml', brand: 'PureLeaf', price: 349, compareAtPrice: 429, isFeatured: true },
    { title: 'Assorted Pickle Combo (3 Jars)', brand: 'Rooted', price: 499, compareAtPrice: 599 },
    { title: 'Garam Masala Blend — 100g', brand: 'PureLeaf', price: 179, compareAtPrice: 219, isTrending: true },
    { title: 'Rock Salt (Sendha Namak) — 500g', brand: 'PureLeaf', price: 99, compareAtPrice: 129 },
  ],
  'snacks-beverages': [
    { title: 'Masala Chai Blend — 250g', brand: 'Rooted', price: 249, compareAtPrice: 299, isBestSeller: true },
    { title: 'Roasted Makhana (Fox Nuts) — 150g', brand: 'PureLeaf', price: 199, compareAtPrice: 249, isFeatured: true },
    { title: 'South Indian Filter Coffee Powder — 200g', brand: 'Rooted', price: 279, compareAtPrice: 329 },
    { title: 'Millet Cookies — 200g', brand: 'PureLeaf', price: 149, compareAtPrice: 179 },
    { title: 'Handmade Chikki Assortment — 300g', brand: 'Rooted', price: 249, compareAtPrice: 299, isNewArrival: true },
    { title: 'Herbal Immunity Kadha Mix — 100g', brand: 'PureLeaf', price: 199, compareAtPrice: 249 },
  ],
  'kids-wear': [
    { title: 'Cotton Dungaree Set', brand: 'Threadcraft', price: 899, compareAtPrice: 1099, isBestSeller: true },
    { title: 'Printed Kurta Set — Boys', brand: 'Anokhi', price: 799, compareAtPrice: 999 },
    { title: 'Frock Dress — Girls', brand: 'Zeenat', price: 899, compareAtPrice: 1099, isFeatured: true },
    { title: 'Organic Cotton Rompers (Pack of 2)', brand: 'Rooted', price: 699, compareAtPrice: 849 },
    { title: 'Ethnic Jacket — Kids', brand: 'Nakshatra', price: 1199, compareAtPrice: 1499, isNewArrival: true },
    { title: 'Cotton Nightwear Set — Kids', brand: 'Threadcraft', price: 599, compareAtPrice: 749 },
  ],
  'toys-books': [
    { title: 'Wooden Stacking Toy', brand: 'WoodWhisper', price: 599, compareAtPrice: 749, isBestSeller: true },
    { title: 'Illustrated Panchatantra Tales', brand: 'Rooted', price: 399, compareAtPrice: 499 },
    { title: 'Handcrafted Puppet Set', brand: 'WoodWhisper', price: 699, compareAtPrice: 849, isFeatured: true },
    { title: 'Wooden Building Blocks Set', brand: 'WoodWhisper', price: 899, compareAtPrice: 1099, isTrending: true },
    { title: 'Cloth Picture Book — Animals', brand: 'Rooted', price: 349, compareAtPrice: 429 },
    { title: 'Wooden Jigsaw Puzzle Set', brand: 'WoodWhisper', price: 499, compareAtPrice: 599 },
  ],
};

// ---------------------------------------------------------------------------
// Expand the hand-written catalog above with extra generated variants, so
// every sub-category has a fuller shelf. Each sub-category has a small word
// bank (adjective + noun + colour); combinations are generated at random
// until we hit EXTRA_PER_SUBCATEGORY new, non-duplicate titles. Price stays
// within that sub-category's existing range, and brand is reused from its
// existing products, so generated items still feel consistent.
// ---------------------------------------------------------------------------
const EXTRA_PER_SUBCATEGORY = 16;

const WORD_BANKS = {
  'mens-ethnic': { adjectives: ['Handloom', 'Cotton', 'Silk Blend', 'Linen', 'Khadi', 'Block Print'], nouns: ['Kurta', 'Nehru Jacket', 'Waistcoat', 'Angavastram Set', 'Kurta Set'], colors: ['Indigo', 'Charcoal', 'Maroon', 'Sand', 'Ivory', 'Mustard', 'Olive', 'Wine'] },
  'womens-ethnic': { adjectives: ['Banarasi Silk', 'Chikankari', 'Handloom Cotton', 'Georgette', 'Bandhani', 'Cotton'], nouns: ['Saree', 'Kurti', 'Suit Set', 'Dupatta Set', 'Palazzo Set'], colors: ['Emerald', 'Rose Pink', 'Ochre', 'Fuchsia', 'Wine', 'Teal', 'Mustard', 'Ivory'] },
  'mens-footwear': { adjectives: ['Leather', 'Suede', 'Canvas', 'Handcrafted'], nouns: ['Juttis', 'Loafers', 'Sneakers', 'Sandals', 'Derby Shoes'], colors: ['Tan', 'Black', 'Brown', 'Navy', 'Grey', 'Off White'] },
  'womens-footwear': { adjectives: ['Embroidered', 'Block Heel', 'Handcrafted', 'Comfort'], nouns: ['Mojaris', 'Sandals', 'Flats', 'Wedges', 'Juttis'], colors: ['Gold', 'Tan', 'Blush', 'Red', 'Beige', 'Black'] },
  'home-decor': { adjectives: ['Handwoven', 'Brass', 'Terracotta', 'Dhokra', 'Wooden'], nouns: ['Wall Hanging', 'Vase', 'Figurine', 'Table Lamp', 'Wall Plate'], colors: ['Earth Tone', 'Antique Gold', 'Natural', 'Charcoal', 'Ivory'] },
  furnishings: { adjectives: ['Kantha Stitch', 'Block Print', 'Handloom', 'Ikat', 'Cotton'], nouns: ['Cushion Cover', 'Table Runner', 'Bedcover', 'Curtain Set', 'Throw'], colors: ['Indigo', 'Rust', 'Grey', 'Mustard', 'Natural', 'Teal'] },
  cookware: { adjectives: ['Cast Iron', 'Copper', 'Clay', 'Stainless Steel', 'Brass'], nouns: ['Kadai', 'Tawa', 'Cooking Pot', 'Serving Bowl Set', 'Pressure Cooker'], colors: [] },
  dinnerware: { adjectives: ['Hand-painted Ceramic', 'Blue Pottery', 'Brass', 'Wooden', 'Copper'], nouns: ['Dinner Set', 'Serving Platter', 'Thali Set', 'Coasters', 'Tea Set'], colors: [] },
  skincare: { adjectives: ['Rose Water', 'Turmeric', 'Ayurvedic', 'Sandalwood', 'Vitamin C'], nouns: ['Face Mist', 'Face Pack', 'Face Oil', 'Serum', 'Clay Mask'], colors: [] },
  haircare: { adjectives: ['Cold-Pressed Amla', 'Herbal', 'Onion', 'Bhringraj', 'Rosemary'], nouns: ['Hair Oil', 'Shampoo Bar', 'Hair Serum', 'Hair Mask', 'Conditioner'], colors: [] },
  'bags-wallets': { adjectives: ['Handwoven Jute', 'Leather', 'Banjara Embroidered', 'Canvas', 'Silk'], nouns: ['Tote Bag', 'Sling Bag', 'Clutch', 'Backpack', 'Wallet'], colors: ['Tan', 'Olive', 'Wine', 'Black', 'Brown'] },
  jewellery: { adjectives: ['Oxidised Silver', 'Kundan', 'Beaded', 'Meenakari', 'Pearl'], nouns: ['Jhumkas', 'Necklace Set', 'Bangles', 'Earrings', 'Anklets'], colors: [] },
  'smart-gadgets': { adjectives: ['Wireless', 'Portable', 'Smart', 'Compact'], nouns: ['Earbuds', 'Bluetooth Speaker', 'Fitness Band', 'Desk Lamp', 'Charging Pad'], colors: [] },
  'spices-condiments': { adjectives: ['Organic', 'Kashmiri', 'Cold-Pressed', 'Stone-Ground'], nouns: ['Turmeric Powder', 'Chilli Powder', 'Masala Blend', 'Pickle Jar', 'Cooking Oil'], colors: [] },
  'snacks-beverages': { adjectives: ['Masala', 'Roasted', 'Handmade', 'Herbal'], nouns: ['Chai Blend', 'Makhana', 'Coffee Powder', 'Cookies', 'Chikki'], colors: [] },
  'kids-wear': { adjectives: ['Cotton', 'Printed', 'Organic Cotton', 'Ethnic'], nouns: ['Dungaree Set', 'Kurta Set', 'Frock', 'Rompers', 'Nightwear Set'], colors: ['Blue', 'Pink', 'Yellow', 'White'] },
  'toys-books': { adjectives: ['Wooden', 'Handcrafted', 'Illustrated', 'Cloth'], nouns: ['Stacking Toy', 'Puzzle Set', 'Puppet Set', 'Building Blocks', 'Picture Book'], colors: [] },
};

for (const [subSlug, bank] of Object.entries(WORD_BANKS)) {
  const existing = PRODUCTS[subSlug];
  if (!existing || !existing.length) continue;

  const existingTitles = new Set(existing.map((p) => p.title));
  const prices = existing.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const brands = [...new Set(existing.map((p) => p.brand))];

  let added = 0;
  let attempts = 0;
  while (added < EXTRA_PER_SUBCATEGORY && attempts < 300) {
    attempts++;
    const adj = bank.adjectives[Math.floor(Math.random() * bank.adjectives.length)];
    const noun = bank.nouns[Math.floor(Math.random() * bank.nouns.length)];
    const color = bank.colors.length ? bank.colors[Math.floor(Math.random() * bank.colors.length)] : null;
    const title = color ? `${adj} ${noun} — ${color}` : `${adj} ${noun}`;
    if (existingTitles.has(title)) continue;
    existingTitles.add(title);

    const price = Math.round(((minPrice + Math.random() * (maxPrice - minPrice)) / 10)) * 10;
    const hasDiscount = Math.random() > 0.35;
    const compareAtPrice = hasDiscount ? Math.round((price * (1.15 + Math.random() * 0.25)) / 10) * 10 : null;

    existing.push({
      title,
      brand: brands[Math.floor(Math.random() * brands.length)],
      price,
      compareAtPrice,
      isNewArrival: Math.random() < 0.12,
    });
    added++;
  }
}

// Shared copy templates per sub-category — used for description/features and
// as the fallback photo search when a product-specific search finds nothing.
const TEMPLATES = {
  'mens-ethnic': { short: 'Handcrafted ethnic wear for everyday and festive occasions.', features: ['100% breathable fabric', 'Hand-finished detailing', 'Machine washable', 'Regular fit'], tags: ['ethnic', 'men', 'festive'], photoQuery: 'indian man kurta traditional', genderHint: 'indian man' },
  'womens-ethnic': { short: 'Traditional weaves and prints, made for the modern wardrobe.', features: ['Handloom fabric', 'Artisan-dyed', 'Dry clean recommended', 'Includes blouse piece where applicable'], tags: ['ethnic', 'women', 'saree'], photoQuery: 'indian woman saree traditional', genderHint: 'indian woman' },
  'mens-footwear': { short: 'Comfort-first footwear crafted with traditional techniques.', features: ['Genuine leather / breathable canvas', 'Cushioned insole', 'Non-slip sole', 'True to size'], tags: ['footwear', 'men'], photoQuery: 'leather sandals mens shoes', genderHint: 'mens' },
  'womens-footwear': { short: 'Everyday comfort meets handcrafted detail.', features: ['Lightweight sole', 'Hand-embroidered detailing', 'Padded footbed', 'True to size'], tags: ['footwear', 'women'], photoQuery: 'womens sandals heels shoes', genderHint: 'womens' },
  'home-decor': { short: 'Artisan-made decor pieces that bring warmth to any room.', features: ['Handcrafted by local artisans', 'Sustainably sourced materials', 'Each piece is one-of-a-kind', 'Easy to clean'], tags: ['decor', 'handcrafted'], photoQuery: 'home decor handicraft interior' },
  furnishings: { short: 'Handloom textiles for a warmer, more textured home.', features: ['100% cotton', 'Pre-shrunk fabric', 'Fade-resistant natural dyes', 'Machine washable on gentle cycle'], tags: ['home', 'textile'], photoQuery: 'cushion covers textile home' },
  cookware: { short: 'Traditional cookware built to last generations.', features: ['Even heat distribution', 'Naturally non-stick with seasoning', 'Hand-wash recommended', 'Induction compatible where noted'], tags: ['kitchen', 'cookware'], photoQuery: 'kitchen cookware pots pans' },
  dinnerware: { short: 'Artisan tableware that turns every meal into an occasion.', features: ['Food-safe glaze', 'Hand-painted detailing', 'Microwave safe', 'Gift-ready packaging'], tags: ['kitchen', 'dinnerware'], photoQuery: 'ceramic plates tableware' },
  skincare: { short: 'Ayurvedic skincare made with cold-pressed, natural ingredients.', features: ['No parabens or sulphates', 'Cruelty-free', 'Cold-pressed / steam-distilled', 'Suitable for all skin types'], tags: ['beauty', 'skincare', 'ayurvedic'], photoQuery: 'skincare cosmetics bottle natural' },
  haircare: { short: 'Herbal haircare rooted in traditional Ayurvedic recipes.', features: ['No sulphates or silicones', 'Cruelty-free', 'Cold-pressed oils', 'Suitable for all hair types'], tags: ['beauty', 'haircare', 'ayurvedic'], photoQuery: 'hair oil bottle haircare natural' },
  'bags-wallets': { short: 'Everyday carry, handcrafted with traditional techniques.', features: ['Genuine leather / handwoven jute', 'Reinforced stitching', 'Multiple compartments', 'Adjustable strap where applicable'], tags: ['bags', 'accessories'], photoQuery: 'leather bag wallet handcrafted' },
  jewellery: { short: 'Statement jewellery inspired by Indian craft traditions.', features: ['Nickel-free', 'Hand-finished', 'Tarnish-resistant coating', 'Comes in a gift box'], tags: ['jewellery', 'accessories'], photoQuery: 'indian jewellery earrings necklace' },
  'smart-gadgets': { short: 'Everyday smart gadgets designed for modern Indian homes.', features: ['Up to 20-hour battery life', 'Bluetooth 5.0', '1-year warranty', 'In-box charging cable'], tags: ['electronics', 'gadgets'], photoQuery: 'wireless earbuds gadget tech' },
  'spices-condiments': { short: 'Pantry staples, stone-ground and small-batch made.', features: ['No artificial preservatives', 'Sourced directly from farms', 'Resealable packaging', 'Lab-tested for purity'], tags: ['grocery', 'spices'], photoQuery: 'indian spices masala' },
  'snacks-beverages': { short: 'Wholesome snacking and traditional beverages.', features: ['No preservatives', 'Small-batch roasted', 'Resealable packaging', 'Vegetarian'], tags: ['grocery', 'snacks'], photoQuery: 'indian tea snacks' },
  'kids-wear': { short: 'Soft, breathable clothing made for everyday play.', features: ['100% cotton', 'Skin-friendly dyes', 'Machine washable', 'Reinforced stitching'], tags: ['kids', 'clothing'], photoQuery: 'kids clothing children fashion' },
  'toys-books': { short: 'Screen-free play, crafted from natural materials.', features: ['Non-toxic paint', 'Sustainably sourced wood', 'Choking-hazard tested', 'Durable construction'], tags: ['kids', 'toys'], photoQuery: 'wooden toys kids' },
};

const randBetween = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

async function seedAdmin() {
  const email = 'admin@zestmart.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists (${email}) — skipping.`);
    return existing;
  }
  const admin = await User.create({
    name: 'ZestMart Admin',
    email,
    password: 'Admin@123',
    role: 'admin',
    status: 'active',
  });
  console.log(`Admin account created → ${email} / Admin@123`);
  return admin;
}

async function seedNotifications(user) {
  if (!user) return;
  await Notification.deleteMany({ user: user._id });

  const samples = [
    { type: 'system', title: 'Welcome to ZestMart', message: 'Your account is all set up. Explore handpicked collections curated just for you.', priority: 'normal' },
    { type: 'order', title: 'Order shipped', message: 'Your recent order has been shipped and is on its way. Track it from the Orders page.', priority: 'high' },
    { type: 'promo', title: 'Weekend sale is live', message: 'Enjoy up to 25% off on Fashion and Home Decor — this weekend only.', priority: 'normal' },
    { type: 'wishlist', title: 'Price drop on a saved item', message: 'An item in your wishlist just got cheaper. Grab it before stock runs out.', priority: 'normal' },
    { type: 'review', title: 'How was your last order?', message: "We'd love to hear your thoughts — leave a review and help other shoppers decide.", priority: 'low' },
    { type: 'order', title: 'Order delivered', message: 'Your order was delivered successfully. Thanks for shopping with ZestMart!', priority: 'normal' },
  ];

  await Notification.insertMany(samples.map((s) => ({ ...s, user: user._id })));
  console.log(`Seeded ${samples.length} sample notifications for ${user.email}.`);
}

/** Resolves 1 image URL for a product: product-specific search → category
 * search → branded placeholder. A single well-matched photo beats two
 * mismatched stock photos, since these aren't real product photoshoots —
 * swap in actual multi-angle photography later via the admin panel. */
async function seedBanner() {
  await Banner.deleteMany({});
  const [photo] = PEXELS_API_KEY
    ? await fetchPexelsPhotos('indian fashion lifestyle model saree', 1)
    : [];
  await Banner.create({
    title: 'ZestMart Home Hero',
    headline: 'New season, handpicked',
    subheadline: 'Curated home, fashion, and lifestyle essentials — crafted with care, delivered with pride.',
    image: photo || img('ZestMart', 0, 900, 1125),
    ctaText: 'Shop the collection',
    ctaLink: '/products',
    position: 'hero',
    isActive: true,
  });
  console.log('Home hero banner created.');
}

async function resolveProductImage(p, tpl, index) {
  const query = tpl.genderHint ? `${coreTitle(p.title)} ${tpl.genderHint}` : coreTitle(p.title);
  const candidates = await fetchPexelsPhotos(query, 5);
  let photo = candidates.length ? candidates[index % candidates.length] : null;
  if (!photo) {
    await sleep(200);
    // Pull several category-level candidates and rotate through them by
    // product index, so products that all fall back don't end up with
    // the exact same photo.
    const fallbackPhotos = await fetchPexelsPhotos(tpl.photoQuery, 8);
    photo = fallbackPhotos.length ? fallbackPhotos[index % fallbackPhotos.length] : null;
  }
  await sleep(200);
  return photo || img(p.title, index);
}

async function seedCatalog() {
  await Product.deleteMany({});
  await Category.deleteMany({});

  const usingPexels = !!PEXELS_API_KEY;
  console.log(usingPexels ? 'PEXELS_API_KEY found — fetching real, product-specific photos (this takes a couple of minutes for the full catalog)…' : 'No PEXELS_API_KEY set — using branded placeholder images (see README for how to enable real photos).');

  const categoryMap = {};
  let swatch = 0;

  for (const top of CATEGORY_TREE) {
    const [topPhoto] = usingPexels ? await fetchPexelsPhotos(top.name.toLowerCase(), 1) : [];
    const parent = await Category.create({
      name: top.name,
      description: top.description,
      image: topPhoto || img(top.name, swatch++),
      isActive: true,
    });
    categoryMap[top.slug] = parent;

    for (const sub of top.subs) {
      const subTpl = TEMPLATES[sub.slug];
      const [subPhoto] = usingPexels ? await fetchPexelsPhotos(subTpl?.photoQuery || sub.name.toLowerCase(), 1) : [];
      const child = await Category.create({
        name: sub.name,
        description: sub.description,
        image: subPhoto || img(sub.name, swatch++),
        parentCategory: parent._id,
        isActive: true,
      });
      categoryMap[sub.slug] = child;
    }
  }
  console.log(`Created ${Object.keys(categoryMap).length} categories (${CATEGORY_TREE.length} top-level + ${CATEGORY_TREE.reduce((n, t) => n + t.subs.length, 0)} sub-categories).`);

  let productCount = 0;
  for (const [subSlug, products] of Object.entries(PRODUCTS)) {
    const category = categoryMap[subSlug];
    const tpl = TEMPLATES[subSlug];
    if (!category || !tpl) continue;

    const docs = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const discountPercent = p.compareAtPrice ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
      const image = usingPexels
        ? await resolveProductImage(p, tpl, i)
        : img(p.title, i);

      docs.push({
        title: p.title,
        description: `${p.title} — ${tpl.short} Crafted in small batches by independent Indian makers, this piece blends everyday usability with traditional technique.`,
        shortDescription: tpl.short,
        price: p.price,
        compareAtPrice: p.compareAtPrice || undefined,
        discountPercent,
        stock: Math.floor(randBetween(8, 60)),
        sku: `ZM-${subSlug.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        category: category._id,
        subCategory: category.name,
        brand: p.brand,
        images: [{ url: image, alt: p.title }],
        tags: tpl.tags,
        features: tpl.features,
        ratingAverage: randBetween(3.8, 4.9),
        ratingCount: Math.floor(randBetween(12, 340)),
        reviewCount: Math.floor(randBetween(5, 120)),
        isActive: true,
        isFeatured: !!p.isFeatured,
        isTrending: !!p.isTrending,
        isBestSeller: !!p.isBestSeller,
        isNewArrival: !!p.isNewArrival,
      });
    }

    const created = await Product.create(docs);
    productCount += created.length;
    console.log(`  ${category.name}: ${created.length} products seeded.`);
  }

  console.log(`\nCreated ${productCount} products across ${Object.keys(PRODUCTS).length} sub-categories.`);
}

async function run() {
  await connectDB();
  console.log('Connected to MongoDB. Seeding ZestMart catalog...\n');

  await seedCatalog();
  await seedBanner();
  const admin = await seedAdmin();
  await seedNotifications(admin);

  console.log('\nDone. Start the backend (npm run dev) and the frontend — the storefront and admin dashboard will now have real data.');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});