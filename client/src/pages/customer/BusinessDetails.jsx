import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { businessAPI, productAPI } from '../../services/api';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import StockBadge from '../../components/common/StockBadge';
import StarRating from '../../components/common/StarRating';
import RecommendationCard from '../../components/customer/RecommendationCard';
import toast from 'react-hot-toast';

const BusinessDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [businessRes, productsRes] = await Promise.all([
        businessAPI.getById(id),
        productAPI.getByBusiness(id),
      ]);
      setBusiness(businessRes.data.data);
      setProducts(productsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch business details:', error);
      toast.error('Failed to fetch business details');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '{}');
    const businessId = id;

    if (!existingCart[businessId]) {
      existingCart[businessId] = [];
    }

    const existingItem = existingCart[businessId].find(
      (item) => item.productId === product.id
    );

    const stockAvailable = parseFloat(product.stock_quantity);

    if (existingItem) {
      if (existingItem.quantity + 1 > stockAvailable) {
        toast.error(`Only ${stockAvailable} available`);
        return;
      }
      existingItem.quantity += 1;
    } else {
      existingCart[businessId].push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        unit: product.unit,
        businessName: business?.name,
        stockAvailable,
        image_url: product.image_url || null,
      });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    toast.success(`${product.name} added to cart`);
  };

  const toggleRecommendations = (productId) => {
    setExpandedProduct((prev) => (prev === productId ? null : productId));
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      {/* Business Info */}
      <Card className="mb-8">
        <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
          {business?.logo_url && (
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-full md:w-32 h-32 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">
              {business?.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                {business?.type}
              </span>
              <div className="flex items-center gap-1">
                <StarRating
                  value={parseFloat(business?.avg_rating || 0)}
                  size="sm"
                  showNumber
                />
                <span className="text-xs text-gray-500 ml-1">
                  ({business?.review_count || 0} reviews)
                </span>
              </div>
            </div>
            <p className="mt-4 text-gray-600">{business?.description}</p>
            <div className="mt-4 space-y-2 text-sm text-gray-500">
              <p>
                📍 {business?.address}, {business?.city}, {business?.state} -{' '}
                {business?.pincode}
              </p>
              <p>📞 {business?.contact}</p>
              <p>📦 {business?.available_products || 0} products in stock</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Products Grid */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Products ({products.length})
      </h2>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-gray-600">
            No products available for this business
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const stockAvailable = parseFloat(product.stock_quantity);
            const isExpanded = expandedProduct === product.id;

            return (
              <Card
                key={product.id}
                className={`flex flex-col ${
                  isExpanded ? 'lg:col-span-3 md:col-span-2' : ''
                }`}
              >
                {/* Product Image */}
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-lg mb-3 border border-gray-100"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}

                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.category}
                        {product.brand ? ` • ${product.brand}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <StockBadge
                      stock={product.stock_quantity}
                      minStock={product.min_stock_level}
                      unit={product.unit}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{product.price}
                    </p>
                    <p className="text-xs text-gray-500">
                      per {product.unit}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={stockAvailable === 0}
                      size="sm"
                    >
                      {stockAvailable === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                    <button
                      onClick={() => toggleRecommendations(product.id)}
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                    >
                      {isExpanded
                        ? '▲ Hide recommendations'
                        : '🤖 See recommendations'}
                    </button>
                  </div>
                </div>

                {/* AI Recommendations — expandable */}
                {isExpanded && (
                  <div className="mt-4 md:col-span-2 lg:col-span-3">
                    <RecommendationCard productId={product.id} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BusinessDetails;