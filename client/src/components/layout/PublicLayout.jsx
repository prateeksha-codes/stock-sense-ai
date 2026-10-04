import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (user?.role === 'super_admin') return '/admin/dashboard';
    if (user?.role === 'owner') return '/owner/dashboard';
    if (user?.role === 'customer') return '/customer/home';
    return '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-2xl">📦</span>
                <span className="ml-2 text-xl font-bold text-blue-600">StockSense AI</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/businesses" className="text-gray-700 hover:text-blue-600">
                Browse Businesses
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to={getDashboardLink()} className="text-gray-700 hover:text-blue-600">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-blue-600">
                    Login
                  </Link>
                  <Link
                    to="/register/owner"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Register Business
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p className="text-lg font-semibold">StockSense AI</p>
            <p className="mt-2">Smart Inventory & Logistics Management for MSMEs</p>
            <p className="mt-4 text-sm">© 2024 StockSense AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;