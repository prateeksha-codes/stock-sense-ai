import React, { useState, useEffect } from 'react';
import { customerAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
    type: 'shipping',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await customerAPI.getAddresses();
      setAddresses(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await customerAPI.updateAddress(editingAddress.id, formData);
        toast.success('Address updated successfully');
      } else {
        await customerAPI.addAddress(formData);
        toast.success('Address added successfully');
      }
      setShowModal(false);
      setEditingAddress(null);
      setFormData({
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
        type: 'shipping',
      });
      fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      addressLine: address.address_line,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.is_default,
      type: address.type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await customerAPI.deleteAddress(id);
        toast.success('Address deleted successfully');
        fetchAddresses();
      } catch (error) {
        toast.error('Failed to delete address');
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const address = addresses.find(a => a.id === id);
      await customerAPI.updateAddress(id, {
        addressLine: address.address_line,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: true,
        type: address.type,
      });
      toast.success('Default address updated');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
        <Button onClick={() => {
          setEditingAddress(null);
          setFormData({
            addressLine: '',
            city: '',
            state: '',
            pincode: '',
            isDefault: false,
            type: 'shipping',
          });
          setShowModal(true);
        }}>
          + Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📍</p>
          <p className="text-xl text-gray-600">No addresses added yet</p>
          <Button className="mt-4" onClick={() => setShowModal(true)}>
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              {address.is_default && (
                <span className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  ✓ Default
                </span>
              )}
              <div className="mb-4">
                <p className="font-medium text-gray-900">{address.address_line}</p>
                <p className="text-gray-600 mt-1">
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="text-xs text-gray-500 mt-2 uppercase">{address.type}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="secondary" size="sm" onClick={() => handleEdit(address)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(address.id)}>
                  Delete
                </Button>
                {!address.is_default && (
                  <Button variant="outline" size="sm" onClick={() => handleSetDefault(address.id)}>
                    Set Default
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Address Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAddress ? 'Edit Address' : 'Add Address'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Address Line"
            name="addressLine"
            value={formData.addressLine}
            onChange={handleChange}
            placeholder="House no, Street, Area"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
            <Input
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>
          <Input
            label="Pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            maxLength="6"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="shipping">Shipping</option>
              <option value="billing">Billing</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Set as default address
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingAddress ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Addresses;