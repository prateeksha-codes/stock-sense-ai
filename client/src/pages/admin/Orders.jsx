import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await adminAPI.getAllOrders();
      setOrders(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = ['All', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  const filteredOrders = orders.filter(order =>
    filterStatus === 'All' || order.order_status === filterStatus
  );

  const columns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'business_name', label: 'Business' },
    { key: 'total_amount', label: 'Amount', render: (row) => `₹${row.total_amount}` },
    { key: 'payment_method', label: 'Payment', render: (row) => row.payment_method?.toUpperCase() },
    { key: 'order_status', label: 'Status', render: (row) => (
      <span className={`px-2 py-1 text-xs rounded ${
        row.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
        row.order_status === 'cancelled' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {row.order_status}
      </span>
    )},
    { key: 'order_date', label: 'Date', render: (row) => 
      new Date(row.order_date).toLocaleDateString()
    },
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Orders</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        <Table columns={columns} data={filteredOrders} />
      </Card>
    </div>
  );
};

export default Orders;