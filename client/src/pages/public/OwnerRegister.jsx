import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import LocationPicker from '../../components/common/LocationPicker';
import toast from 'react-hot-toast';

const OwnerRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: 'Grocery',
    businessDescription: '',
    businessAddress: '',
    city: '',
    state: '',
    pincode: '',
    businessContact: '',
    gstNumber: '',
    regNumber: '',
  });
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  const businessTypes = [
    'Grocery',
    'Hardware',
    'Textile',
    'Electronics',
    'Pharmacy',
    'Automobile Spare Parts',
    'Furniture',
    'Stationery',
    'Cosmetics',
    'Food Products',
    'Electrical',
    'Other',
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Location is mandatory
    if (location.latitude == null || location.longitude == null) {
      toast.error('Please set your business location before submitting');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...rest } = formData;
      await authAPI.registerOwner({
        ...rest,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Register Your Business</h2>
          <p className="mt-2 text-gray-600">Join StockSense AI and manage your inventory smartly</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
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
              <Input
                label="Mobile Number"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                maxLength="10"
                required
              />
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Business Description"
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  placeholder="Brief description of your business"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Business Address"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  placeholder="Shop number, street, landmark"
                  required
                />
              </div>
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
              <Input
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                maxLength="6"
                required
              />
              <Input
                label="Business Contact Number"
                name="businessContact"
                value={formData.businessContact}
                onChange={handleChange}
                maxLength="10"
                required
              />
              <Input
                label="GST Number (Optional)"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5"
              />
              <Input
                label="Business Registration Number (Optional)"
                name="regNumber"
                value={formData.regNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Business Location (MANDATORY) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Business Location <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Customers will use this to find your shop nearby. Set the exact
              location of your shop.
            </p>
                        <LocationPicker
              value={location}
              onChange={(lat, lng) => setLocation({ latitude: lat, longitude: lng })}
              required={true}
              label="Shop Exact Location"
              addressQuery={[
                formData.businessAddress,
                formData.city,
                formData.state,
                formData.pincode,
              ]
                .filter(Boolean)
                .join(', ')}
            />
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Register Business
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700">
              Login here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default OwnerRegister;