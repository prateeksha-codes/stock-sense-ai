import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';

const OwnerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/owner/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/owner/products', label: 'Products', icon: '📦' },
    { path: '/owner/inventory', label: 'Inventory', icon: '📋' },
    { path: '/owner/orders', label: 'Orders', icon: '🛒' },
    { path: '/owner/suppliers', label: 'Suppliers', icon: '🏢' },
    { path: '/owner/purchase-orders', label: 'Purchase Orders', icon: '📑' },
    { path: '/owner/ai-insights', label: 'AI Insights', icon: '🤖' },
    { path: '/owner/reviews', label: 'Reviews', icon: '⭐' },
    { path: '/owner/notifications', label: 'Notifications', icon: '🔔' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div
        className={`w-64 bg-white shadow-lg flex flex-col fixed md:static inset-y-0 left-0 z-50 transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-600">StockSense AI</h2>
            <p className="text-sm text-gray-500 mt-1">
              {user?.businessName || 'Business Panel'}
            </p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-2xl text-gray-700"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 mt-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {user?.fullName || user?.full_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium shrink-0 ml-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-2xl text-gray-700"
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="hidden md:block" />
          <NotificationBell />
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
};

export default OwnerLayout;