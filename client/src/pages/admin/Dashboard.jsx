import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const stats = dashboardData?.stats || {};
  const businessTypes = dashboardData?.businessTypes || [];
  const recentBusinesses = dashboardData?.recentBusinesses || [];
  const recentOrders = dashboardData?.recentOrders || [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Super Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="text-3xl mr-4">🏢</div>
            <div>
              <p className="text-sm text-gray-500">Total Businesses</p>
              <p className="text-2xl font-bold">{stats.total_businesses || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="text-3xl mr-4">✅</div>
            <div>
              <p className="text-sm text-gray-500">Active Businesses</p>
              <p className="text-2xl font-bold">{stats.active_businesses || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="text-3xl mr-4">👥</div>
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold">{stats.total_customers || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="text-3xl mr-4">💰</div>
            <div>
              <p className="text-sm text-gray-500">Platform Sales</p>
              <p className="text-2xl font-bold">₹{stats.platform_sales || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <p className="text-sm text-gray-500">Total Owners</p>
          <p className="text-2xl font-bold">{stats.total_owners || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold">{stats.total_products || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{stats.total_orders || 0}</p>
        </Card>
      </div>

      {/* Business Type Distribution */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Business Type Distribution</h2>
        <div className="space-y-3">
          {businessTypes.map((type) => (
            <div key={type.type} className="flex items-center">
              <span className="w-32 text-sm text-gray-600">{type.type}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${(type.count / businessTypes.reduce((a, b) => a + b.count, 0)) * 100}%` }}
                />
              </div>
              <span className="ml-3 text-sm font-medium">{type.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Registrations */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Business Registrations</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Business</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Owner</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">City</th>
              </tr>
            </thead>
            <tbody>
              {recentBusinesses.map((business) => (
                <tr key={business.id} className="border-t">
                  <td className="px-4 py-2">{business.name}</td>
                  <td className="px-4 py-2">{business.type}</td>
                  <td className="px-4 py-2">{business.owner_name}</td>
                  <td className="px-4 py-2">{business.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Orders */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order #</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Business</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-2">{order.order_number}</td>
                  <td className="px-4 py-2">{order.customer_name}</td>
                  <td className="px-4 py-2">{order.business_name}</td>
                  <td className="px-4 py-2">₹{order.total_amount}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.order_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.order_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;