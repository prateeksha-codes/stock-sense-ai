import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/customer/home', label: 'Home', icon: '🏠' },
    { path: '/customer/nearby', label: 'Nearby', icon: '📍' },
    { path: '/customer/search', label: 'Search', icon: '🔍' },
    { path: '/customer/orders', label: 'My Orders', icon: '📦' },
    { path: '/customer/cart', label: 'Cart', icon: '🛒' },
    { path: '/customer/addresses', label: 'Addresses', icon: '📮' },
    { path: '/customer/profile', label: 'Profile', icon: '👤' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/customer/home" className="flex items-center">
                <span className="text-2xl">📦</span>
                <span className="ml-2 text-xl font-bold text-blue-600">
                  StockSense AI
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {/* Notification Bell */}
              <div className="ml-2">
                <NotificationBell />
              </div>

              {/* User */}
              <div className="ml-3 flex items-center gap-2 border-l pl-3">
                <span className="text-sm text-gray-700">
                  {user?.fullName || user?.full_name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile toggle */}
            <div className="flex md:hidden items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="p-2 text-gray-700"
                aria-label="Menu"
              >
                <span className="text-2xl">{mobileOpen ? '✕' : '☰'}</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden py-3 border-t">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;