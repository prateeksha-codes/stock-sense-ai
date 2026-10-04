import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { businessAPI, discoveryAPI, customerAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LocationBar from '../../components/customer/LocationBar';
import StarRating from '../../components/common/StarRating';

const Home = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      const res = await businessAPI.getAll();
      setBusinesses(res.data.data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = async (lat, lng) => {
    if (lat == null || lng == null) return;
    try {
      const res = await discoveryAPI.getNearby({
        lat,
        lng,
        radius: 25,
      });
      setNearby(res.data.data.slice(0, 6));
    } catch (e) {
      console.error('Nearby fetch failed:', e);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to StockSense AI</h1>
        <p className="mt-2 text-gray-600">Browse businesses and shop from trusted MSMEs</p>
      </div>

      {/* Location Bar */}
      <LocationBar onLocationChange={handleLocationChange} />

      {/* Nearby preview */}
      {nearby.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Nearby Shops</h2>
            <Link
              to="/customer/nearby"
              className="text-sm text-blue-600 hover:underline"
            >
              See all →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearby.map((b) => (
              <Card key={b.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {b.name}
                  </h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap ml-2">
                    {b.distance_label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{b.type}</p>
                <div className="mb-3">
                  <StarRating value={b.avg_rating} size="sm" showNumber />
                </div>
                <Link
                  to={`/customer/business/${b.id}`}
                  className="inline-block w-full text-center bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm"
                >
                  View Shop
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Link to="/customer/nearby">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <p className="text-3xl mb-2">📍</p>
            <p className="font-semibold">Find Nearby Shops</p>
            <p className="text-xs text-gray-500">Discover MSMEs around you</p>
          </Card>
        </Link>
        <Link to="/customer/search">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-semibold">Search Products</p>
            <p className="text-xs text-gray-500">Across all businesses</p>
          </Card>
        </Link>
        <Link to="/customer/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <p className="text-3xl mb-2">📦</p>
            <p className="font-semibold">My Orders</p>
            <p className="text-xs text-gray-500">Track your purchases</p>
          </Card>
        </Link>
      </div>

      {/* Featured Businesses */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Featured Businesses
      </h2>
      {businesses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-2xl mb-4">🏪</p>
          <p className="text-gray-600">No businesses available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <Card
              key={business.id}
              className="hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {business.name}
                </h3>
                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {business.type}
                </span>
                <div className="mt-2">
                  <StarRating value={business.avg_rating} size="sm" showNumber />
                  <span className="text-xs text-gray-500 ml-2">
                    ({business.review_count || 0})
                  </span>
                </div>
                <p className="mt-3 text-gray-600 text-sm line-clamp-2">
                  {business.description}
                </p>
                <div className="mt-3 space-y-1 text-sm text-gray-500">
                  <p>📍 {business.city}</p>
                  <p>📞 {business.contact}</p>
                </div>
              </div>
              <Link
                to={`/customer/business/${business.id}`}
                className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
              >
                View Products →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;