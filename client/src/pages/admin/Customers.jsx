import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await adminAPI.getCustomers();
      setCustomers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'city', label: 'City', render: (row) => row.city || 'N/A' },
    { key: 'order_count', label: 'Total Orders' },
    { key: 'total_spent', label: 'Total Spent', render: (row) => `₹${row.total_spent || 0}` },
    { key: 'created_at', label: 'Registered', render: (row) => 
      new Date(row.created_at).toLocaleDateString()
    },
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Customers</h1>
      <Card>
        <Table columns={columns} data={customers} />
      </Card>
    </div>
  );
};

export default Customers;