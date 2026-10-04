import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Smart Inventory Management for MSMEs
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              AI-powered inventory and logistics management platform for small and medium businesses
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/register/owner"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50"
              >
                Register Your Business
              </Link>
              <Link
                to="/businesses"
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400"
              >
                Browse Businesses
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Why StockSense AI?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
            <p className="text-gray-600">
              Get intelligent stock predictions, reorder recommendations, and demand analysis
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
            <p className="text-gray-600">
              Track stock levels, manage suppliers, and automate purchase orders
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Analytics & Reports</h3>
            <p className="text-gray-600">
              Real-time dashboards, sales analytics, and supplier performance tracking
            </p>
          </div>
        </div>
      </div>

      {/* Business Types Section */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Supported Business Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Grocery', 'Hardware', 'Textile', 'Electronics', 'Pharmacy', 'Furniture', 'Stationery', 'Cosmetics'].map((type) => (
              <div key={type} className="bg-white p-4 rounded-lg text-center shadow-sm">
                <p className="font-medium text-gray-700">{type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;