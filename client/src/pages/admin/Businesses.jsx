import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const Businesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await adminAPI.getBusinesses();
      setBusinesses(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await adminAPI.toggleBusiness(id);
      toast.success('Business status updated');
      fetchBusinesses();
    } catch (error) {
      toast.error('Failed to update business');
    }
  };

  const columns = [
    { key: 'name', label: 'Business', render: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-xs text-gray-500">{row.type}</p>
      </div>
    )},
    { key: 'owner_name', label: 'Owner' },
    { key: 'owner_email', label: 'Email' },
    { key: 'city', label: 'City' },
    { key: 'product_count', label: 'Products' },
    { key: 'order_count', label: 'Orders' },
    { key: 'is_active', label: 'Status', render: (row) => (
      <span className={`px-2 py-1 text-xs rounded ${
        row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {row.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <Button
        variant={row.is_active ? 'danger' : 'success'}
        size="sm"
        onClick={() => handleToggle(row.id)}
      >
        {row.is_active ? 'Deactivate' : 'Activate'}
      </Button>
    )},
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Businesses</h1>
      <Card>
        <Table columns={columns} data={businesses} />
      </Card>
    </div>
  );
};

export default Businesses;