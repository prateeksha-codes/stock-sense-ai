import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      setOrders(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, { status });
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const statusOptions = ['All', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  const filteredOrders = orders.filter(order => 
    filterStatus === 'All' || order.order_status === filterStatus
  );

  const columns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'total_amount', label: 'Amount', render: (row) => `₹${row.total_amount}` },
    { key: 'payment_method', label: 'Payment', render: (row) => (
      <span className="uppercase">{row.payment_method}</span>
    )},
    { key: 'payment_status', label: 'Payment Status', render: (row) => (
      <span className={`px-2 py-1 text-xs rounded ${
        row.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {row.payment_status}
      </span>
    )},
    { key: 'order_status', label: 'Order Status', render: (row) => (
      <span className={`px-2 py-1 text-xs rounded ${
        row.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
        row.order_status === 'cancelled' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {row.order_status}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(row)}>
        View
      </Button>
    )},
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders</h1>

      <div className="flex gap-4 mb-6">
        {statusOptions.map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === status 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        <Table columns={columns} data={filteredOrders} />
      </Card>

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.order_number || ''}`}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Customer Details</h3>
              <p><span className="font-medium">Name:</span> {selectedOrder.customer_name}</p>
              <p><span className="font-medium">Email:</span> {selectedOrder.customer_email}</p>
              <p><span className="font-medium">Phone:</span> {selectedOrder.customer_mobile}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order Details</h3>
              <p><span className="font-medium">Total Amount:</span> ₹{selectedOrder.total_amount}</p>
              <p><span className="font-medium">Payment Method:</span> {selectedOrder.payment_method.toUpperCase()}</p>
              <p><span className="font-medium">Payment Status:</span> {selectedOrder.payment_status}</p>
              <p><span className="font-medium">Order Status:</span> {selectedOrder.order_status}</p>
              <p><span className="font-medium">Order Date:</span> {new Date(selectedOrder.order_date).toLocaleString()}</p>
            </div>

            {selectedOrder.shipping_address_snapshot && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <p>{JSON.parse(selectedOrder.shipping_address_snapshot).address_line}</p>
                <p>{JSON.parse(selectedOrder.shipping_address_snapshot).city}, {JSON.parse(selectedOrder.shipping_address_snapshot).state} - {JSON.parse(selectedOrder.shipping_address_snapshot).pincode}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Update Order Status</h3>
              <div className="flex flex-wrap gap-2">
                {['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                  <Button
                    key={status}
                    variant={selectedOrder.order_status === status ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;