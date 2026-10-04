import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Owners = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const response = await adminAPI.getOwners();
      setOwners(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch owners');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'full_name', label: 'Name', render: (row) => (
      <div>
        <p className="font-medium">{row.full_name}</p>
      </div>
    )},
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'business_name', label: 'Business', render: (row) => row.business_name || 'N/A' },
    { key: 'business_type', label: 'Business Type', render: (row) => row.business_type || 'N/A' },
    { key: 'is_active', label: 'Status', render: (row) => (
      <span className={`px-2 py-1 text-xs rounded ${
        row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {row.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'created_at', label: 'Registered', render: (row) => 
      new Date(row.created_at).toLocaleDateString()
    },
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">MSME Owners</h1>
      <Card>
        <Table columns={columns} data={owners} />
      </Card>
    </div>
  );
};

export default Owners;