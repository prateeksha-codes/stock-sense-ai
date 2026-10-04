import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { discoveryAPI, customerAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StarRating from '../../components/common/StarRating';
import LocationBar from '../../components/customer/LocationBar';
import toast from 'react-hot-toast';

const RADIUS_OPTIONS = [
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
  { label: '500 km', value: 500 },
  { label: 'Any distance', value: 'any' },
];

const NearbyBusinesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [radius, setRadius] = useState(25);
  const [filterType, setFilterType] = useState('All');
  const [businessTypes, setBusinessTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const res = await discoveryAPI.getFilters();
      setBusinessTypes(res.data.data.businessTypes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNearby = async (c = coords, r = radius, t = filterType, q = searchTerm) => {
    if (!c) {
      toast.error('Please set your location first');
      return;
    }
    setLoading(true);
    try {
      const res = await discoveryAPI.getNearby({
        lat: c.lat,
        lng: c.lng,
        radius: r,
        type: t !== 'All' ? t : undefined,
        q: q || undefined,
      });
      setBusinesses(res.data.data || []);
    } catch (e) {
      toast.error('Failed to load nearby businesses');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (lat, lng) => {
    const c = { lat, lng };
    setCoords(c);
    fetchNearby(c);
  };

  const handleFilterChange = (newType) => {
    setFilterType(newType);
    if (coords) fetchNearby(coords, radius, newType, searchTerm);
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (coords) fetchNearby(coords, newRadius, filterType, searchTerm);
  };

  const handleSearch = () => {
    if (coords) fetchNearby(coords, radius, filterType, searchTerm);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nearby MSMEs</h1>
        <p className="text-gray-600 mt-1">Discover local businesses around you</p>
      </div>

      {/* Location bar */}
      <LocationBar onLocationChange={handleLocationChange} />

      {/* Controls */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Business name or city..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All</option>
              {businessTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Radius
            </label>
            <select
              value={radius}
              onChange={(e) => {
                const v = e.target.value;
                handleRadiusChange(v === 'any' ? 'any' : parseInt(v));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RADIUS_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button onClick={handleSearch} disabled={!coords}>
            Apply Search
          </Button>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : !coords ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📍</p>
            <p className="text-lg text-gray-700">Set your location first</p>
            <p className="text-sm text-gray-500 mt-2">
              Click "Set Location" above to see shops near you
            </p>
          </div>
        </Card>
      ) : businesses.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🏪</p>
            <p className="text-lg text-gray-700">No nearby businesses found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try increasing the radius or removing filters
            </p>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {businesses.length} shop{businesses.length > 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((b) => (
              <Card
                key={b.id}
                className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden"
              >
                {/* Business logo/image */}
                {b.logo_url && (
                  <img
                    src={b.logo_url}
                    alt={b.name}
                    className="w-full h-32 object-cover rounded-lg mb-3 -mt-1"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}

                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 min-w-0 truncate">
                      {b.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                        b.distance_km < 1
                          ? 'bg-green-100 text-green-800'
                          : b.distance_km < 5
                          ? 'bg-blue-100 text-blue-800'
                          : b.distance_km < 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {b.distance_label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">{b.type}</p>

                  <div className="mt-2">
                    <StarRating value={b.avg_rating} size="sm" showNumber />
                    <span className="ml-2 text-xs text-gray-500">
                      ({b.review_count} reviews)
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {b.description}
                  </p>

                  <p className="text-xs text-gray-500 mt-3">
                    📍 {b.address}, {b.city}
                  </p>
                  <p className="text-xs text-gray-500">
                    🏪 {b.available_products} products available
                  </p>
                </div>

                <Link
                  to={`/customer/business/${b.id}`}
                  className="mt-4 inline-block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  View Products
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NearbyBusinesses;