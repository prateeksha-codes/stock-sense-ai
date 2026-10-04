import React, { useState, useEffect } from 'react';
import { purchaseOrderAPI, supplierAPI, productAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [{ productId: '', quantity: '', unitPrice: '' }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [poRes, supRes, prodRes] = await Promise.all([
        purchaseOrderAPI.getAll(),
        supplierAPI.getAll(),
        productAPI.getAll(),
      ]);
      setPurchaseOrders(poRes.data.data);
      setSuppliers(supRes.data.data);
      setProducts(prodRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const items = [...formData.items];
    items[index][field] = value;
    setFormData({ ...formData, items });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: '', unitPrice: '' }],
    });
  };

  const removeItem = (index) => {
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await purchaseOrderAPI.create(formData);
      toast.success('Purchase order created successfully');
      setShowModal(false);
      setFormData({
        supplierId: '',
        expectedDeliveryDate: '',
        notes: '',
        items: [{ productId: '', quantity: '', unitPrice: '' }],
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const handleReceive = async (id) => {
    if (window.confirm('Mark this purchase order as received?')) {
      try {
        await purchaseOrderAPI.receive(id, {});
        toast.success('Purchase order received');
        fetchData();
      } catch (error) {
        toast.error('Failed to receive purchase order');
      }
    }
  };

  const columns = [
    { key: 'order_number', label: 'PO #' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'total_amount', label: 'Amount', render: (row) => `₹${row.total_amount}` },
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`px-2 py-1 text-xs rounded ${
        row.status === 'received' ? 'bg-green-100 text-green-800' :
        row.status === 'cancelled' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {row.status}
      </span>
    )},
    { key: 'expected_delivery_date', label: 'Expected Delivery' },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex space-x-2">
        {row.status !== 'received' && row.status !== 'cancelled' && (
          <Button variant="success" size="sm" onClick={() => handleReceive(row.id)}>
            Receive
          </Button>
        )}
      </div>
    )},
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
        <Button onClick={() => setShowModal(true)}>+ Create Purchase Order</Button>
      </div>

      <Card>
        <Table columns={columns} data={purchaseOrders} />
      </Card>

      {/* Create PO Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Purchase Order"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Supplier"
            value={formData.supplierId}
            onChange={handleChange}
            name="supplierId"
            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
            required
          />
          <Input
            label="Expected Delivery Date"
            type="date"
            name="expectedDeliveryDate"
            value={formData.expectedDeliveryDate}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Select
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  options={products.map(p => ({ value: p.id, label: p.name }))}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="Unit Price"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                  className="w-32"
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  X
                </Button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              + Add Item
            </Button>
          </div>

          <Input
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            type="textarea"
          />

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create PO</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseOrders;