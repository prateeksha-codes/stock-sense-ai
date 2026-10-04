import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { businessAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';

const BusinessDirectory = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await businessAPI.getAll();
      setBusinesses(response.data.data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = ['All', ...new Set(businesses.map(b => b.type))];

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || business.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Browse Businesses</h1>
        <p className="mt-2 text-gray-600">Find products from trusted MSMEs near you</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by business name or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {businessTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Business Grid */}
      {filteredBusinesses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-2xl mb-4">🏪</p>
          <p className="text-gray-600">No businesses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{business.name}</h3>
                  <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {business.type}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-gray-600 text-sm line-clamp-2">{business.description}</p>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <p>📍 {business.address}, {business.city}, {business.state} - {business.pincode}</p>
                <p>📞 {business.contact}</p>
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

export default BusinessDirectory;