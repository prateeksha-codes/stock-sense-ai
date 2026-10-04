import React, { useState, useEffect } from 'react';
import { productAPI, inventoryAPI, orderAPI, analyticsAPI, aiAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    products: [],
    inventoryOverview: {},
    orders: [],
    salesAnalytics: {},
    aiInsights: [],
    alerts: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, inventoryRes, ordersRes, salesRes, alertsRes] = await Promise.all([
        productAPI.getAll(),
        inventoryAPI.getOverview(),
        orderAPI.getAll(),
        analyticsAPI.getSales(),
        inventoryAPI.getAlerts()
      ]);

      setDashboardData({
        products: productsRes.data.data || [],
        inventoryOverview: inventoryRes.data.data || {},
        orders: ordersRes.data.data || [],
        salesAnalytics: salesRes.data.data || {},
        alerts: alertsRes.data.data || []
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const { products, inventoryOverview, orders, alerts } = dashboardData;
  
  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level);
  const todayOrders = orders.filter(o => new Date(o.order_date).toDateString() === new Date().toDateString());
  const pendingOrders = orders.filter(o => o.order_status === 'pending' || o.order_status === 'placed');

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Welcome, {user?.businessName || 'Business Owner'}!
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="text-3xl mr-4">📦</div>
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="text-3xl mr-4">💰</div>
            <div>
              <p className="text-sm text-gray-500">Inventory Value</p>
              <p className="text-2xl font-bold">₹{inventoryOverview.inventory_value || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="text-3xl mr-4">⚠️</div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold">{lowStockProducts.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="text-3xl mr-4">🛒</div>
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold">{pendingOrders.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="mb-8 bg-yellow-50">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">⚠️ Stock Alerts</h2>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start">
                <span className="mr-2">🔔</span>
                <div>
                  <p className="text-sm text-yellow-800">{alert.message}</p>
                  <p className="text-xs text-yellow-600">{new Date(alert.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Low Stock Products */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Low Stock Products</h2>
        {lowStockProducts.length === 0 ? (
          <p className="text-gray-500">No low stock products 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Current Stock</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Min Level</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">{product.stock_quantity}</td>
                    <td className="px-4 py-2">{product.min_stock_level}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        product.stock_quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Orders */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-gray-500">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="px-4 py-2">{order.order_number}</td>
                    <td className="px-4 py-2">{order.customer_name}</td>
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
        )}
      </Card>
    </div>
  );
};

export default Dashboard;