import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'mentee'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, role } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const body = JSON.stringify({ name, email, password, role });

      const res = await axios.post('https://mentorpulse.onrender.com/api/auth/register', body, config);
      
      // DEBUG: Check response structure
      console.log('Register API Response:', res.data);
      
      // Store token and user data
      localStorage.setItem('token', res.data.token);
      
      // Handle different response structures
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else if (res.data.data) {
        localStorage.setItem('user', JSON.stringify(res.data.data));
      } else {
        // If user data is directly in response
        const userData = { ...res.data };
        delete userData.token; // Remove token from user data
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      toast.success('Registration successful! 🎉');
      navigate('/dashboard');
      
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="text-center mb-4 text-primary">
                Create Your Account
              </h2>

              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={name}
                    onChange={onChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                    placeholder="Create a password"
                    minLength="6"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    required
                    placeholder="Confirm your password"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">I want to join as a</label>
                  <select
                    className="form-select"
                    name="role"
                    value={role}
                    onChange={onChange}
                  >
                    <option value="mentee">Mentee</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Register'
                  )}
                </button>
              </form>

              <div className="text-center mt-4">
                <p className="mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-decoration-none">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

