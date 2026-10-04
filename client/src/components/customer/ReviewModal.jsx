import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import StarRating from '../common/StarRating';
import { reviewAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Modal for rating a delivered order.
// Props:
//  - isOpen, onClose
//  - order: { order_id, order_number, business_id, business_name }
//  - onSubmitted: callback after successful submit
const ReviewModal = ({ isOpen, onClose, order, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await reviewAPI.create({
        orderId: order.order_id,
        rating,
        review: review.trim() || null,
      });
      toast.success('Thanks for your review!');
      onSubmitted && onSubmitted();
      handleClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    onClose();
  };

  if (!order) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Rate Your Experience">
      <div className="space-y-5">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Order:</span> #{order.order_number}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Business:</span> {order.business_name}
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-2">
            How was your experience?
          </p>
          <div className="flex justify-center">
            <StarRating
              value={rating}
              onChange={setRating}
              size="lg"
            />
          </div>
          {rating > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              You selected {rating} star{rating > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Write a review (optional)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Tell others about your experience..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {review.length}/2000
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Submit Review
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewModal;