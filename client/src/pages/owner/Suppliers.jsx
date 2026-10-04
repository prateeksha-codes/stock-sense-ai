import React, { useState, useEffect } from 'react';
import { supplierAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await supplierAPI.getAll();
      setSuppliers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await supplierAPI.update(editingSupplier.id, formData);
        toast.success('Supplier updated successfully');
      } else {
        await supplierAPI.create(formData);
        toast.success('Supplier added successfully');
      }
      setShowModal(false);
      setEditingSupplier(null);
      setFormData({
        name: '',
        companyName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        notes: '',
      });
      fetchSuppliers();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Supplier', render: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-xs text-gray-500">{row.company_name}</p>
      </div>
    )},
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'product_count', label: 'Products' },
    { key: 'on_time_percentage', label: 'On-Time %', render: (row) => (
      <span className={row.on_time_percentage >= 80 ? 'text-green-600' : 'text-yellow-600'}>
        {row.on_time_percentage}%
      </span>
    )},
    { key: 'performance_score', label: 'Score', render: (row) => (
      <span className="font-medium">{row.performance_score}/5</span>
    )},
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
        <Button onClick={() => {
          setEditingSupplier(null);
          setShowModal(true);
        }}>
          + Add Supplier
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={suppliers} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Supplier Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength="10"
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
            <Input
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
            />
            <Input
              label="Pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              maxLength="6"
            />
          </div>
          <Input
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSupplier ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Suppliers;