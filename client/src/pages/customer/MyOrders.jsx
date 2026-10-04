import React, { useState, useEffect } from 'react';
import { orderAPI, reviewAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ReviewModal from '../../components/customer/ReviewModal';
import StarRating from '../../components/common/StarRating';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [myReviews, setMyReviews] = useState({}); // { order_id: review }
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchMyReviews();
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

  const fetchMyReviews = async () => {
    try {
      const res = await reviewAPI.getMine();
      const map = {};
      for (const r of res.data.data || []) {
        map[r.order_id] = r;
      }
      setMyReviews(map);
    } catch (e) {
      // Reviews not critical; skip silent
    }
  };

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    try {
      const response = await orderAPI.getTracking(order.id);
      setTracking(response.data.data);
    } catch (error) {
      console.error('Failed to fetch tracking');
    }
  };

  const handleRateClick = (order) => {
    setReviewOrder({
      order_id: order.id,
      order_number: order.order_number,
      business_id: order.business_id,
      business_name: order.business_name,
    });
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = async () => {
    await fetchMyReviews();
    setReviewModalOpen(false);
    setReviewOrder(null);
  };

  const columns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'business_name', label: 'Business' },
    { key: 'total_amount', label: 'Amount', render: (row) => `₹${row.total_amount}` },
    { key: 'payment_method', label: 'Payment', render: (row) => row.payment_method.toUpperCase() },
    { key: 'order_status', label: 'Status', render: (row) => (
      <span className={`px-2 py-1 text-xs rounded ${
        row.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
        row.order_status === 'cancelled' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {row.order_status}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => handleViewOrder(row)}>
          View
        </Button>
        {row.order_status === 'delivered' && !myReviews[row.id] && (
          <Button size="sm" onClick={() => handleRateClick(row)}>
            ⭐ Rate
          </Button>
        )}
        {row.order_status === 'delivered' && myReviews[row.id] && (
          <span className="text-xs text-gray-500 self-center">
            Reviewed
          </span>
        )}
      </div>
    )},
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-xl text-gray-600">No orders yet</p>
        </div>
      ) : (
        <Card>
          <Table columns={columns} data={orders} />
        </Card>
      )}

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.order_number || ''}`}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order Details</h3>
              <p><span className="font-medium">Business:</span> {selectedOrder.business_name}</p>
              <p><span className="font-medium">Total Amount:</span> ₹{selectedOrder.total_amount}</p>
              <p><span className="font-medium">Payment Method:</span> {selectedOrder.payment_method.toUpperCase()}</p>
              <p><span className="font-medium">Order Date:</span> {new Date(selectedOrder.order_date).toLocaleString()}</p>
            </div>

            {myReviews[selectedOrder.id] && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Your Review</h3>
                <StarRating value={myReviews[selectedOrder.id].rating} size="sm" showNumber />
                {myReviews[selectedOrder.id].review && (
                  <p className="text-sm text-gray-700 mt-2">
                    {myReviews[selectedOrder.id].review}
                  </p>
                )}
              </div>
            )}

            {tracking.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Tracking History</h3>
                <div className="space-y-2">
                  {tracking.map((track, index) => (
                    <div key={track.id} className="flex items-start">
                      <div className="flex flex-col items-center mr-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                        {index < tracking.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{track.status}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(track.created_at).toLocaleString()}
                        </p>
                        {track.location && (
                          <p className="text-xs text-gray-500">{track.location}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.order_status === 'delivered' && !myReviews[selectedOrder.id] && (
              <Button
                className="w-full"
                onClick={() => {
                  setSelectedOrder(null);
                  handleRateClick(selectedOrder);
                }}
              >
                ⭐ Rate This Business
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        order={reviewOrder}
        onSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default MyOrders;