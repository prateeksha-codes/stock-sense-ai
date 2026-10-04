import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { discoveryAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StockBadge from '../../components/common/StockBadge';
import StarRating from '../../components/common/StarRating';
import LocationBar from '../../components/customer/LocationBar';
import toast from 'react-hot-toast';

const ProductSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    category: 'All',
    type: 'All',
    minPrice: '',
    maxPrice: '',
    inStock: false,
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    businessTypes: [],
  });
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const res = await discoveryAPI.getFilters();
      setFilterOptions(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLocationChange = (lat, lng) => {
    setCoords({ lat, lng });
    if (hasSearched) {
      handleSearch(null, { lat, lng });
    }
  };

  const handleSearch = async (e, overrideCoords) => {
    if (e) e.preventDefault();
    const c = overrideCoords || coords;
    setLoading(true);
    setHasSearched(true);

    try {
      const params = {
        q: query || undefined,
        category: filters.category !== 'All' ? filters.category : undefined,
        type: filters.type !== 'All' ? filters.type : undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        inStock: filters.inStock ? 'true' : undefined,
        lat: c?.lat,
        lng: c?.lng,
      };
      const res = await discoveryAPI.searchProducts(params);
      setResults(res.data.data || []);
    } catch (e) {
      toast.error('Search failed');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Search Products</h1>
        <p className="text-gray-600 mt-1">
          Find products across all businesses on StockSense AI
        </p>
      </div>

      {/* Location bar */}
      <LocationBar onLocationChange={handleLocationChange} />

      {/* Search Bar */}
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products (e.g., Rice, Medicine, Shirt...)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" loading={loading}>
            Search
          </Button>
        </form>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            >
              <option value="All">All</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Business Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            >
              <option value="All">All</option>
              {filterOptions.businessTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Min ₹</label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) =>
                setFilters({ ...filters, minPrice: e.target.value })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max ₹</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters({ ...filters, maxPrice: e.target.value })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) =>
                  setFilters({ ...filters, inStock: e.target.checked })
                }
              />
              In stock only
            </label>
          </div>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : !hasSearched ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-600">Enter a keyword to search products</p>
          </div>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">😕</p>
            <p className="text-lg text-gray-700">No products found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try different keywords or clear filters
            </p>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {results.length} result{results.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((p) => (
              <Card key={p.id} className="flex flex-col">
                {/* Product Image */}
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-36 object-cover rounded-lg mb-3 border border-gray-100"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}

                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {p.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.category}
                      {p.brand ? ` • ${p.brand}` : ''}
                    </p>
                  </div>
                  <StockBadge
                    stock={p.stock_quantity}
                    minStock={p.min_stock_level}
                    unit={p.unit}
                  />
                </div>

                <div className="mt-3">
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{p.price}
                  </p>
                  <p className="text-xs text-gray-500">per {p.unit}</p>
                </div>

                <div className="mt-3 border-t pt-3 flex-1">
                  <Link
                    to={`/customer/business/${p.business_id}`}
                    className="text-sm font-medium text-gray-800 hover:text-blue-600"
                  >
                    {p.business_name}
                  </Link>
                  <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                    <StarRating value={p.business_rating} size="sm" showNumber />
                    <span className="text-xs text-gray-500">
                      ({p.business_review_count} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-xs text-gray-500">📍 {p.city}</p>
                    {p.distance_label && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {p.distance_label}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to={`/customer/business/${p.business_id}`}
                  className="mt-4 inline-block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  View Business
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductSearch;