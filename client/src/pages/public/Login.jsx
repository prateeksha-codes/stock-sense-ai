import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      toast.success('Login successful!');
      
      // Redirect based on role
      if (user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/customer/home');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Login</h2>
          <p className="mt-2 text-gray-600">Welcome back to StockSense AI</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Login
          </Button>
        </form>
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register/owner" className="text-blue-600 hover:text-blue-700">
              Register Business
            </Link>
            {' '}or{' '}
            <Link to="/register/customer" className="text-blue-600 hover:text-blue-700">
              Register as Customer
            </Link>
          </p>
        </div>
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-semibold text-gray-700 mb-2">Demo Accounts:</p>
          <p className="text-xs text-gray-600">Admin: admin@stocksense.com / admin123</p>
          <p className="text-xs text-gray-600">Owner: rajesh@freshmart.com / owner123</p>
          <p className="text-xs text-gray-600">Customer: arun@email.com / customer123</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;