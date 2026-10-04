import React, { useState, useEffect } from 'react';
import { reviewAPI } from '../../services/api';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StarRating from '../../components/common/StarRating';
import toast from 'react-hot-toast';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('All');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await reviewAPI.getOwnerReviews();
      setReviews(res.data.data.reviews || []);
      setSummary(res.data.data.summary || null);
    } catch (e) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const filtered = reviews.filter((r) =>
    filterRating === 'All' ? true : r.rating === parseInt(filterRating)
  );

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Customer Reviews</h1>

      {/* Summary Card */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-900">
              {summary?.avg_rating ?? '0.00'}
            </p>
            <div className="mt-1 flex justify-center">
              <StarRating value={parseFloat(summary?.avg_rating || 0)} size="sm" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {summary?.review_count ?? 0} review
              {(summary?.review_count ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 w-full">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary?.[`${['one', 'two', 'three', 'four', 'five'][star - 1]}_star`] ?? 0;
              const total = summary?.review_count || 1;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-xs w-8">{star}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['All', '5', '4', '3', '2', '1'].map((r) => (
          <button
            key={r}
            onClick={() => setFilterRating(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filterRating === r
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {r === 'All' ? 'All' : `${r}★`}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">⭐</p>
            <p className="text-gray-600">No reviews yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{r.customer_name}</p>
                  <StarRating value={r.rating} size="sm" />
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              {r.review && (
                <p className="text-sm text-gray-700 mt-3">{r.review}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Order #{r.order_number}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;