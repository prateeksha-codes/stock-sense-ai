import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    unit: 'piece',
    sku: '',
    description: '',
    price: '',
    costPrice: '',
    stockQuantity: '0',
    minStockLevel: '0',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch products');
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
      if (editingProduct) {
        await productAPI.update(editingProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        await productAPI.create(formData);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        brand: '',
        unit: 'piece',
        sku: '',
        description: '',
        price: '',
        costPrice: '',
        stockQuantity: '0',
        minStockLevel: '0',
      });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      brand: product.brand || '',
      unit: product.unit || 'piece',
      sku: product.sku || '',
      description: product.description || '',
      price: product.price,
      costPrice: product.cost_price || '',
      stockQuantity: product.stock_quantity,
      minStockLevel: product.min_stock_level,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    { key: 'name', label: 'Product', render: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-xs text-gray-500">{row.brand}</p>
      </div>
    )},
    { key: 'category', label: 'Category' },
    { key: 'sku', label: 'SKU' },
    { key: 'price', label: 'Price', render: (row) => `₹${row.price}` },
    { key: 'stock_quantity', label: 'Stock', render: (row) => (
      <span className={`font-medium ${
        row.stock_quantity === 0 ? 'text-red-600' :
        row.stock_quantity <= row.min_stock_level ? 'text-yellow-600' : 'text-green-600'
      }`}>
        {row.stock_quantity}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex space-x-2">
        <Button variant="secondary" size="sm" onClick={() => handleEdit(row)}>
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
          Delete
        </Button>
      </div>
    )},
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <Button onClick={() => {
          setEditingProduct(null);
          setShowModal(true);
        }}>
          + Add Product
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          options={categories.map(c => ({ value: c, label: c }))}
          className="w-48"
        />
      </div>

      <Card>
        <Table columns={columns} data={filteredProducts} />
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
            <Input
              label="Brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
            />
            <Input
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
            />
          </div>
          <Input
               label="Description"
               name="description"
               value={formData.description}
               onChange={handleChange}
               type="textarea"
               />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹)"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <Input
              label="Cost Price (₹)"
              type="number"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock Quantity"
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
            />
            <Input
              label="Min Stock Level"
              type="number"
              name="minStockLevel"
              value={formData.minStockLevel}
              onChange={handleChange}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;