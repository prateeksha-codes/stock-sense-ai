import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Inventory = () => {
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overviewRes, transactionsRes, alertsRes] = await Promise.all([
        inventoryAPI.getOverview(),
        inventoryAPI.getTransactions(),
        inventoryAPI.getAlerts(),
      ]);
      setOverview(overviewRes.data.data);
      setTransactions(transactionsRes.data.data);
      setAlerts(alertsRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'product_name', label: 'Product' },
    { key: 'transaction_type', label: 'Type', render: (row) => (
      <span className={`px-2 py-1 text-xs rounded ${
        row.transaction_type === 'stock_in' ? 'bg-green-100 text-green-800' :
        row.transaction_type === 'stock_out' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {row.transaction_type}
      </span>
    )},
    { key: 'quantity', label: 'Quantity' },
    { key: 'previous_stock', label: 'Previous Stock' },
    { key: 'new_stock', label: 'New Stock' },
    { key: 'created_at', label: 'Date', render: (row) => new Date(row.created_at).toLocaleString() },
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Inventory Management</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold">{overview?.total_products || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Inventory Value</p>
          <p className="text-2xl font-bold">₹{overview?.inventory_value || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-600">{overview?.low_stock_count || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{overview?.out_of_stock_count || 0}</p>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-8 bg-yellow-50">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">⚠️ Active Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-white p-4 rounded-lg">
                <p className="text-sm">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <Table columns={columns} data={transactions} />
      </Card>
    </div>
  );
};

export default Inventory;