// ============================================
// Discovery Controller
// Features:
//  1. Nearby MSME businesses by lat/lng (Swiggy-style distance labels)
//  2. Smart product search across all businesses
// ============================================

const pool = require('../config/database');

// Haversine distance in km between two lat/lng points
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
};

// Friendly distance label (Swiggy/Zomato style)
// Examples: "150 m away", "1.3 km away", "12 km away"
const formatDistance = (km) => {
  if (km == null || Number.isNaN(km)) return '';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    // Round to nearest 10 m below 100m, nearest 50 m above
    let rounded;
    if (meters < 100) rounded = Math.round(meters / 10) * 10;
    else rounded = Math.round(meters / 50) * 50;
    return `${rounded} m away`;
  }
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
};

// Compute stock status from stock_quantity and min_stock_level
const stockStatusOf = (stock, minStock) => {
  const s = parseFloat(stock);
  const m = parseFloat(minStock);
  if (s <= 0) return 'out_of_stock';
  if (s <= m) return 'low_stock';
  return 'in_stock';
};

// ============================================
// FEATURE 1: Nearby businesses
// GET /api/discovery/nearby?lat=&lng=&radius=&type=&q=
// Public route
// - radius: any number in km, or "any" for no limit
// ============================================
const getNearbyBusinesses = async (req, res) => {
  try {
    const { lat, lng, radius, type, q } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'lat and lng query parameters are required',
      });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return res.status(400).json({
        success: false,
        message: 'lat and lng must be valid numbers',
      });
    }

    // Handle radius:
    //   - "any" or missing value → no upper limit
    //   - number → use as km limit
    const radiusStr = String(radius || '50').toLowerCase().trim();
    const radiusIsAny = radiusStr === 'any';
    const radiusNum = radiusIsAny ? Number.POSITIVE_INFINITY : parseFloat(radiusStr);
    const effectiveRadius = radiusIsAny
      ? Number.POSITIVE_INFINITY
      : Number.isNaN(radiusNum)
        ? 50
        : radiusNum;

    let query = `
      SELECT 
        b.id, b.name, b.type, b.description, b.address, b.city, b.state,
        b.pincode, b.contact, b.logo_url, b.latitude, b.longitude,
        COALESCE(v.avg_rating, 0) AS avg_rating,
        COALESCE(v.review_count, 0) AS review_count,
        (SELECT COUNT(*) FROM products p 
          WHERE p.business_id = b.id 
            AND p.is_active = TRUE 
            AND p.stock_quantity > 0) AS available_products
      FROM businesses b
      LEFT JOIN v_business_ratings v ON b.id = v.business_id
      WHERE b.is_active = TRUE
        AND b.latitude IS NOT NULL
        AND b.longitude IS NOT NULL
    `;
    const params = [];

    if (type && type !== 'All') {
      query += ' AND b.type = ?';
      params.push(type);
    }

    if (q && q.trim()) {
      query += ' AND (b.name LIKE ? OR b.city LIKE ? OR b.description LIKE ?)';
      const like = `%${q.trim()}%`;
      params.push(like, like, like);
    }

    const [rows] = await pool.query(query, params);

    // Compute distance + label + filter
    const withDistance = rows
      .map((b) => {
        const distance = haversineKm(
          latNum,
          lngNum,
          parseFloat(b.latitude),
          parseFloat(b.longitude)
        );
        const roundedKm = Math.round(distance * 100) / 100;
        return {
          ...b,
          distance_km: roundedKm,
          distance_label: formatDistance(roundedKm),
        };
      })
      .filter((b) => {
        if (effectiveRadius === Number.POSITIVE_INFINITY) return true;
        return b.distance_km <= effectiveRadius;
      })
      .sort((a, b) => a.distance_km - b.distance_km);

    res.json({
      success: true,
      data: withDistance,
      count: withDistance.length,
      radius: radiusIsAny ? 'any' : effectiveRadius,
    });
  } catch (error) {
    console.error('getNearbyBusinesses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby businesses',
      error: error.message,
    });
  }
};
// ============================================
// FEATURE 2: Smart product search across businesses
// GET /api/discovery/search-products?q=&category=&type=&minPrice=&maxPrice=&inStock=&lat=&lng=
// Public route
// ============================================
const searchProducts = async (req, res) => {
  try {
    const {
      q,
      category,
      type,
      minPrice,
      maxPrice,
      inStock,
      lat,
      lng,
      limit = 50,
    } = req.query;

    let query = `
      SELECT 
        p.id, p.name, p.category, p.brand, p.sku, p.unit,
        p.price, p.cost_price, p.stock_quantity, p.min_stock_level,
        p.image_url, p.description,
        b.id AS business_id, b.name AS business_name, b.type AS business_type,
        b.city, b.state, b.latitude, b.longitude,
        COALESCE(v.avg_rating, 0) AS business_rating,
        COALESCE(v.review_count, 0) AS business_review_count
      FROM products p
      INNER JOIN businesses b ON p.business_id = b.id
      LEFT JOIN v_business_ratings v ON b.id = v.business_id
      WHERE p.is_active = TRUE AND b.is_active = TRUE
    `;
    const params = [];

    if (q && q.trim()) {
      query += ' AND (p.name LIKE ? OR p.category LIKE ? OR p.brand LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
      const like = `%${q.trim()}%`;
      params.push(like, like, like, like, like);
    }
    if (category && category !== 'All') {
      query += ' AND p.category = ?';
      params.push(category);
    }
    if (type && type !== 'All') {
      query += ' AND b.type = ?';
      params.push(type);
    }
    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }
    if (inStock === 'true') {
      query += ' AND p.stock_quantity > 0';
    }

    query += ' ORDER BY p.stock_quantity DESC, p.price ASC LIMIT ?';
    params.push(parseInt(limit) || 50);

    const [rows] = await pool.query(query, params);

    const latNum = lat ? parseFloat(lat) : null;
    const lngNum = lng ? parseFloat(lng) : null;

    const results = rows.map((row) => {
      const item = {
        ...row,
        stock_status: stockStatusOf(row.stock_quantity, row.min_stock_level),
      };

      if (
        latNum !== null &&
        lngNum !== null &&
        row.latitude != null &&
        row.longitude != null &&
        !Number.isNaN(latNum) &&
        !Number.isNaN(lngNum)
      ) {
        const d =
          Math.round(
            haversineKm(latNum, lngNum, parseFloat(row.latitude), parseFloat(row.longitude)) * 100
          ) / 100;
        item.distance_km = d;
        item.distance_label = formatDistance(d);
      }

      return item;
    });

    if (latNum !== null && lngNum !== null) {
      results.sort((a, b) => {
        const da = a.distance_km ?? Infinity;
        const db = b.distance_km ?? Infinity;
        return da - db;
      });
    }

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('searchProducts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message,
    });
  }
};

// ============================================
// Distinct categories + business types
// GET /api/discovery/filters
// ============================================
const getFilterOptions = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT DISTINCT category FROM products WHERE is_active = TRUE AND category IS NOT NULL ORDER BY category'
    );
    const [types] = await pool.query(
      'SELECT DISTINCT type FROM businesses WHERE is_active = TRUE AND type IS NOT NULL ORDER BY type'
    );

    res.json({
      success: true,
      data: {
        categories: categories.map((c) => c.category),
        businessTypes: types.map((t) => t.type),
      },
    });
  } catch (error) {
    console.error('getFilterOptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filters',
      error: error.message,
    });
  }
};


// ============================================
// Reverse Geocode: text address → lat/lng
// Uses OpenStreetMap Nominatim (free, no API key)
// GET /api/discovery/geocode?q=address
// ============================================
const geocodeAddress = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Address query (q) is required',
      });
    }

    const query = q.trim();

    // Nominatim requires a User-Agent header
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(
      query
    )}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'StockSenseAI/1.0 (college-project)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: 'Geocoding service unavailable',
      });
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found. Try adding city and pincode.',
      });
    }

    // Return the top result + alternatives
    const best = results[0];
    const alternatives = results.slice(1, 5).map((r) => ({
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      display_name: r.display_name,
    }));

    res.json({
      success: true,
      data: {
        latitude: parseFloat(best.lat),
        longitude: parseFloat(best.lon),
        display_name: best.display_name,
        alternatives,
      },
    });
  } catch (error) {
    console.error('geocodeAddress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to geocode address',
      error: error.message,
    });
  }
};
module.exports = {
  getNearbyBusinesses,
  searchProducts,
  getFilterOptions,
  geocodeAddress,    
};