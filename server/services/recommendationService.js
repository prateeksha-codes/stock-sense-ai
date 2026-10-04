// ============================================
// Recommendation Service
// Rule-based product recommendations with
// optional Gemini AI enhancement.
//
// CRITICAL RULES:
//  - Only recommend products that actually exist
//  - Only recommend in-stock products
//  - Never let AI invent prices or stock
// ============================================

const pool = require('../config/database');
const { getGeminiModel, isGeminiAvailable } = require('../config/gemini');

/**
 * Get similar products: same category or brand,
 * in stock, from any business (excluding source product).
 */
const getSimilarProducts = async (productId, limit = 10) => {
  const [products] = await pool.query(
    `SELECT 
        p.id, p.name, p.category, p.brand, p.price, p.unit,
        p.stock_quantity, p.min_stock_level,
        b.id AS business_id, b.name AS business_name, b.city
     FROM products p
     INNER JOIN businesses b ON p.business_id = b.id
     WHERE p.id != ?
       AND p.is_active = TRUE
       AND p.stock_quantity > 0
       AND b.is_active = TRUE
       AND (
         p.category = (SELECT category FROM products WHERE id = ?)
         OR p.brand = (SELECT brand FROM products WHERE id = ?)
       )
     ORDER BY 
       CASE WHEN p.category = (SELECT category FROM products WHERE id = ?) THEN 0 ELSE 1 END,
       p.stock_quantity DESC
     LIMIT ?`,
    [productId, productId, productId, productId, limit]
  );
  return products;
};

/**
 * Get products frequently bought together with the given product.
 * Uses existing order_items history.
 */
const getFrequentlyBoughtTogether = async (productId, limit = 5) => {
  const [products] = await pool.query(
    `SELECT 
        p.id, p.name, p.category, p.brand, p.price, p.unit,
        p.stock_quantity, p.min_stock_level,
        b.id AS business_id, b.name AS business_name, b.city,
        COUNT(*) AS co_purchase_count
     FROM order_items oi1
     INNER JOIN order_items oi2 ON oi1.order_id = oi2.order_id
     INNER JOIN products p ON oi2.product_id = p.id
     INNER JOIN businesses b ON p.business_id = b.id
     WHERE oi1.product_id = ?
       AND oi2.product_id != ?
       AND p.is_active = TRUE
       AND p.stock_quantity > 0
       AND b.is_active = TRUE
     GROUP BY p.id, p.name, p.category, p.brand, p.price, p.unit,
              p.stock_quantity, p.min_stock_level, b.id, b.name, b.city
     ORDER BY co_purchase_count DESC
     LIMIT ?`,
    [productId, productId, limit]
  );
  return products;
};

/**
 * Get top-rated products in the same category.
 */
const getTopRatedInCategory = async (category, excludeId, limit = 5) => {
  const [products] = await pool.query(
    `SELECT 
        p.id, p.name, p.category, p.brand, p.price, p.unit,
        p.stock_quantity, p.min_stock_level,
        b.id AS business_id, b.name AS business_name, b.city
     FROM products p
     INNER JOIN businesses b ON p.business_id = b.id
     WHERE p.category = ?
       AND p.id != ?
       AND p.is_active = TRUE
       AND p.stock_quantity > 0
       AND b.is_active = TRUE
     ORDER BY p.stock_quantity DESC
     LIMIT ?`,
    [category, excludeId, limit]
  );
  return products;
};

/**
 * Base rule-based recommendation pipeline.
 * Combines frequently-bought + same category + same brand.
 * Deduplicates and returns top N.
 */
const getBaseRecommendations = async (productId, limit = 6) => {
  const [baseProducts] = await pool.query(
    'SELECT id, category, brand FROM products WHERE id = ?',
    [productId]
  );
  if (baseProducts.length === 0) return [];

  const { category, brand } = baseProducts[0];

  const [fbt, similar, topRated] = await Promise.all([
    getFrequentlyBoughtTogether(productId, 3),
    getSimilarProducts(productId, 6),
    getTopRatedInCategory(category, productId, 4),
  ]);

  // Merge with priority: FBT > similar > top-rated
  const seen = new Set([productId]);
  const result = [];

  const push = (list) => {
    for (const p of list) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      result.push(p);
      if (result.length >= limit) break;
    }
  };

  push(fbt);
  push(similar);
  push(topRated);

  return result.slice(0, limit);
};

/**
 * Enhance recommendations with a short Gemini-generated
 * explanation. Gemini NEVER adds new products or prices.
 * It only explains why the given products are relevant.
 */
const enhanceWithGemini = async (baseProduct, recommendations) => {
  if (!isGeminiAvailable() || recommendations.length === 0) {
    return recommendations;
  }

  try {
    const model = getGeminiModel();

    const recSummary = recommendations
      .map((p, i) => `${i + 1}. ${p.name} (${p.category}, ₹${p.price}, ${p.business_name})`)
      .join('\n');

    const prompt = `
You are a helpful retail assistant. A customer is viewing this product:

Product: ${baseProduct.name}
Category: ${baseProduct.category}
Brand: ${baseProduct.brand || 'N/A'}

The following related products are available and in stock:
${recSummary}

Write a short, friendly 1-2 sentence explanation telling the customer why these recommendations may be useful. Do NOT invent new products, prices, or stock. Only mention the products listed above.
`.trim();

    const result = await model.generateContent(prompt);
    const explanation = result.response.text().trim();

    // Attach explanation to each recommendation
    return recommendations.map((p) => ({ ...p, ai_explanation: explanation }));
  } catch (error) {
    console.error('Gemini enhancement error:', error.message);
    return recommendations; // fallback: return base without explanation
  }
};

/**
 * Main entry: get recommendations for a product with optional AI explanation.
 */
const getRecommendationsForProduct = async (productId, limit = 6) => {
  const [baseProducts] = await pool.query(
    'SELECT id, name, category, brand FROM products WHERE id = ? AND is_active = TRUE',
    [productId]
  );
  if (baseProducts.length === 0) return { recommendations: [], ai_available: false };

  const baseProduct = baseProducts[0];
  const recommendations = await getBaseRecommendations(productId, limit);

  const enhanced = await enhanceWithGemini(baseProduct, recommendations);

  return {
    recommendations: enhanced,
    ai_available: isGeminiAvailable(),
  };
};

/**
 * Get recommendations based on multiple product IDs (used for cart).
 */
const getRecommendationsForCart = async (productIds, limit = 6) => {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];

  const seen = new Set(productIds);
  const results = [];

  for (const pid of productIds) {
    const [baseProducts] = await pool.query(
      'SELECT id, name, category, brand FROM products WHERE id = ? AND is_active = TRUE',
      [pid]
    );
    if (baseProducts.length === 0) continue;

    const recs = await getBaseRecommendations(pid, 3);
    for (const r of recs) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      results.push(r);
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }

  return results;
};

module.exports = {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getTopRatedInCategory,
  getBaseRecommendations,
  getRecommendationsForProduct,
  getRecommendationsForCart,
};