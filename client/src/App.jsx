import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import OwnerLayout from './components/layout/OwnerLayout';
import CustomerLayout from './components/layout/CustomerLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import Login from './pages/public/Login';
import OwnerRegister from './pages/public/OwnerRegister';
import CustomerRegister from './pages/public/CustomerRegister';
import BusinessDirectory from './pages/public/BusinessDirectory';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminBusinesses from './pages/admin/Businesses';
import AdminOwners from './pages/admin/Owners';
import AdminCustomers from './pages/admin/Customers';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';

// Owner Pages
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerProducts from './pages/owner/Products';
import OwnerInventory from './pages/owner/Inventory';
import OwnerOrders from './pages/owner/Orders';
import OwnerSuppliers from './pages/owner/Suppliers';
import OwnerPurchaseOrders from './pages/owner/PurchaseOrders';
import OwnerAIInsights from './pages/owner/AIInsights';
import OwnerReviews from './pages/owner/Reviews';
import OwnerNotifications from './pages/owner/Notifications';

// Customer Pages
import CustomerHome from './pages/customer/Home';
import BusinessDetails from './pages/customer/BusinessDetails';
import Cart from './pages/customer/Cart';
import MyOrders from './pages/customer/MyOrders';
import CustomerProfile from './pages/customer/Profile';
import CustomerAddresses from './pages/customer/Addresses';
import NearbyBusinesses from './pages/customer/NearbyBusinesses';
import ProductSearch from './pages/customer/ProductSearch';
import CustomerNotifications from './pages/customer/Notifications';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<Login />} />
        <Route path="register/owner" element={<OwnerRegister />} />
        <Route path="register/customer" element={<CustomerRegister />} />
        <Route path="businesses" element={<BusinessDirectory />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="businesses" element={<AdminBusinesses />} />
        <Route path="owners" element={<AdminOwners />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
      </Route>

      {/* Owner Routes */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute roles={['owner']}>
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/owner/dashboard" />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="products" element={<OwnerProducts />} />
        <Route path="inventory" element={<OwnerInventory />} />
        <Route path="orders" element={<OwnerOrders />} />
        <Route path="suppliers" element={<OwnerSuppliers />} />
        <Route path="purchase-orders" element={<OwnerPurchaseOrders />} />
        <Route path="ai-insights" element={<OwnerAIInsights />} />
        <Route path="reviews" element={<OwnerReviews />} />
        <Route path="notifications" element={<OwnerNotifications />} />
      </Route>

      {/* Customer Routes */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute roles={['customer']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/customer/home" />} />
        <Route path="home" element={<CustomerHome />} />
        <Route path="nearby" element={<NearbyBusinesses />} />
        <Route path="search" element={<ProductSearch />} />
        <Route path="business/:id" element={<BusinessDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="addresses" element={<CustomerAddresses />} />
        <Route path="notifications" element={<CustomerNotifications />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;