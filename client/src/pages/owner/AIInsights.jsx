import React, { useState, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AIInsights = () => {
  const [loading, setLoading] = useState(false);
  const [stockoutPredictions, setStockoutPredictions] = useState([]);
  const [reorderRecommendations, setReorderRecommendations] = useState([]);
  const [deadStock, setDeadStock] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const fetchAllInsights = async () => {
    setLoading(true);
    try {
      const [stockoutRes, reorderRes, deadStockRes, supplierRes] = await Promise.all([
        aiAPI.predictStockout({}),
        aiAPI.reorderRecommendation({}),
        aiAPI.deadStock({}),
        aiAPI.supplierInsights({}),
      ]);

      console.log('Stockout:', stockoutRes.data);
      console.log('Reorder:', reorderRes.data);
      console.log('DeadStock:', deadStockRes.data);
      console.log('Suppliers:', supplierRes.data);

      setStockoutPredictions(stockoutRes.data.data || []);
      setReorderRecommendations(reorderRes.data.data || []);
      setDeadStock(deadStockRes.data.data || []);
      setSuppliers(supplierRes.data.data?.suppliers || []);
      
      toast.success('AI insights updated!');
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      toast.error('Failed to generate AI insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInsights();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
        <Button onClick={fetchAllInsights}>Refresh Insights</Button>
      </div>

      {/* Stock-out Predictions */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">📊 Stock-out Predictions</h2>
        {stockoutPredictions.length === 0 ? (
          <p className="text-gray-500">No stock-out risks detected</p>
        ) : (
          <div className="space-y-3">
            {stockoutPredictions.map((item) => (
              <div key={item.productId} className={`p-4 rounded-lg ${
                item.riskLevel === 'critical' ? 'bg-red-50' : 'bg-yellow-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Current Stock: {item.currentStock} {item.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      Min Level: {item.minStockLevel} {item.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg Daily Demand: {item.avgDailyDemand.toFixed(2)} {item.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      Days Remaining: {item.daysRemaining} days
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    item.riskLevel === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.riskLevel} risk
                  </span>
                </div>
                {item.reorderQuantity > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    💡 Recommended reorder: {item.reorderQuantity} {item.unit}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reorder Recommendations */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">📦 Reorder Recommendations</h2>
        {reorderRecommendations.length === 0 ? (
          <p className="text-gray-500">No reorder needed currently</p>
        ) : (
          <div className="space-y-3">
            {reorderRecommendations.map((item) => (
              <div key={item.productId} className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Current: {item.currentStock} | Reorder: {item.reorderQuantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      Daily Demand: {item.avgDailyDemand.toFixed(2)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    item.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.priority} priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Dead Stock Detection */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">⚠️ Dead Stock Detection</h2>
        {deadStock.length === 0 ? (
          <p className="text-gray-500">No dead stock detected</p>
        ) : (
          <div className="space-y-3">
            {deadStock.map((item) => (
              <div key={item.id} className="bg-red-50 p-4 rounded-lg">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Stock: {item.stock_quantity} {item.unit}
                </p>
                <p className="text-sm text-gray-600">
                  Last Sale: {item.days_since_last_sale} days ago
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Supplier Performance */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">🏢 Supplier Performance</h2>
        {suppliers.length === 0 ? (
          <p className="text-gray-500">No suppliers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Supplier</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Products</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">On-Time %</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Score</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-t">
                    <td className="px-4 py-2">
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-xs text-gray-500">{supplier.company_name}</p>
                    </td>
                    <td className="px-4 py-2">{supplier.product_count}</td>
                    <td className="px-4 py-2">{supplier.on_time_percentage}%</td>
                    <td className="px-4 py-2">{supplier.performance_score}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AIInsights;