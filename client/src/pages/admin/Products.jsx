import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await adminAPI.getAllProducts();
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'name', label: 'Product', render: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-xs text-gray-500">{row.brand}</p>
      </div>
    )},
    { key: 'business_name', label: 'Business' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', render: (row) => `₹${row.price}` },
    { key: 'stock_quantity', label: 'Stock', render: (row) => (
      <span className={parseFloat(row.stock_quantity) <= parseFloat(row.min_stock_level) 
        ? 'text-yellow-600 font-medium' 
        : 'text-green-600'
      }>
        {row.stock_quantity}
      </span>
    )},
    { key: 'unit', label: 'Unit' },
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Products</h1>
      
      <div className="mb-6">
        <Input
          placeholder="Search by product or business name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <Table columns={columns} data={filteredProducts} />
      </Card>
    </div>
  );
};

export default Products;