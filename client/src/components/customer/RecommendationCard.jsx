import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recommendationAPI } from '../../services/api';
import StockBadge from '../common/StockBadge';
import LoadingSpinner from '../common/LoadingSpinner';

// Shows AI-assisted recommendations for a given product.
// Fetches from backend, which uses rule-based + Gemini explanation.
// Gemini never invents prices/stock — the DB is the source of truth.
const RecommendationCard = ({ productId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await recommendationAPI.getForProduct(productId);
        if (!cancelled) setData(res.data.data);
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">🤖 Loading AI recommendations...</p>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error || !data || (data.recommendations || []).length === 0) {
    return null; // Hide quietly if nothing available
  }

  const recommendations = data.recommendations;

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h3 className="font-semibold text-gray-900">You may also like</h3>
        {!data.ai_available && (
          <span className="text-xs text-gray-500 ml-auto">
            rule-based
          </span>
        )}
      </div>

      {recommendations[0]?.ai_explanation && (
        <p className="text-sm text-gray-700 mb-3 italic">
          "{recommendations[0].ai_explanation}"
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.map((r) => (
          <Link
            key={r.id}
            to={`/customer/business/${r.business_id}`}
            className="block bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-400 hover:shadow transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{r.name}</p>
                <p className="text-xs text-gray-500">
                  {r.category}
                  {r.brand ? ` • ${r.brand}` : ''}
                </p>
              </div>
              <StockBadge
                stock={r.stock_quantity}
                minStock={r.min_stock_level}
                unit={r.unit}
              />
            </div>
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-lg font-bold text-blue-600">₹{r.price}</p>
                <p className="text-xs text-gray-500">per {r.unit}</p>
              </div>
              <p className="text-xs text-gray-500 text-right">
                {r.business_name}
                <br />
                📍 {r.city}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecommendationCard;