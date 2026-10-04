import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, customerAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    setCartItems(cart);
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await customerAPI.getAddresses();
      setAddresses(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedAddress(response.data.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to fetch addresses');
    }
  };

  const updateQuantity = (businessId, productId, newQuantity) => {
    const updatedCart = { ...cartItems };
    const items = updatedCart[businessId];
    const itemIndex = items.findIndex(item => item.productId === productId);
    
    if (newQuantity === 0) {
      items.splice(itemIndex, 1);
      if (items.length === 0) {
        delete updatedCart[businessId];
      }
    } else {
      items[itemIndex].quantity = newQuantity;
    }
    
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async (businessId, items) => {
    setLoading(true);
    try {
      const orderData = {
        businessId: parseInt(businessId),
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        paymentMethod,
        shippingAddressId: parseInt(selectedAddress)
      };

      const response = await orderAPI.create(orderData);
      toast.success('Order placed successfully!');
      
      // Remove items from cart
      const updatedCart = { ...cartItems };
      delete updatedCart[businessId];
      setCartItems(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      
      navigate('/customer/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const businessIds = Object.keys(cartItems);

  if (businessIds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🛒</p>
        <p className="text-xl text-gray-600">Your cart is empty</p>
        <Button className="mt-4" onClick={() => navigate('/customer/home')}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      {/* Address and Payment Selection */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Delivery Address"
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            options={addresses.map(addr => ({
              value: addr.id,
              label: `${addr.address_line}, ${addr.city}`
            }))}
          />
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'cod', label: 'Cash on Delivery' },
              { value: 'online', label: 'Online Payment' },
            ]}
          />
        </div>
      </Card>

      {/* Cart Items by Business */}
      {businessIds.map((businessId) => {
        const items = cartItems[businessId];
        const businessName = items[0]?.businessName || 'Business';
        
        return (
          <Card key={businessId} className="mb-6">
            <h2 className="text-xl font-semibold mb-4">{businessName}</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">₹{item.price} per {item.unit}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(businessId, item.productId, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-lg"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(businessId, item.productId, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-lg"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-semibold">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4">
                <p className="text-lg font-bold">Total: ₹{calculateTotal(items)}</p>
                <Button
                  onClick={() => handleCheckout(businessId, items)}
                  loading={loading}
                  disabled={!selectedAddress}
                >
                  Place Order
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default Cart;