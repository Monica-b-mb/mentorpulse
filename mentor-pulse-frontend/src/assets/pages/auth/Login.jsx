import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAdminLogin = () => {
    setShowAdminLogin(!showAdminLogin);
    setFormData({ email: '', password: '' });
  };

  // Secure admin setup function
  const setupAdminAccount = async () => {
    setSetupLoading(true);
    try {
      const res = await axios.post('https://mentorpulse.onrender.com/api/auth/setup-admin');
      
      toast.success(
        <div>
          <strong>Admin account created successfully!</strong>
          <br />
          <small>Email: {res.data.credentials.email}</small>
          <br />
          <small>Password: {res.data.credentials.password}</small>
        </div>,
        { autoClose: 8000 }
      );
    } catch (error) {
      if (error.response?.data?.message) {
        toast.info(error.response.data.message);
      } else {
        toast.error('Setup failed. Please check server connection.');
      }
    } finally {
      setSetupLoading(false);
    }
  };


  const onSubmit = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    toast.error('Please fill in all fields');
    return;
  }

  setLoading(true);

  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ email, password });

    // ✅ Use admin login endpoint for admin mode
    const endpoint = showAdminLogin
      ? 'https://mentorpulse.onrender.com/api/auth/admin/login'
      : 'https://mentorpulse.onrender.com/api/auth/login';

    const res = await axios.post(endpoint, body, config);
    console.log('Login API Response:', res.data);

    let userData = {};
    let token = '';

    if (res.data.token) {
      token = res.data.token;

      if (res.data.user) {
        userData = res.data.user;
      } else if (res.data.data) {
        userData = res.data.data;
      } else {
        userData = { ...res.data };
        delete userData.token;
      }
    } else {
      throw new Error('No authentication token received');
    }

    // 🔐 Admin validation — demo-safe
    if (showAdminLogin) {
      if (userData.role !== 'admin') {
        toast.error('🔐 Access Denied: Administrator privileges required');
        setLoading(false);
        return;
      }

      // 🚫 Remove isActive gate for demo
      // const isActive = userData?.isActive ?? true;
      // if (!isActive) {
      //   toast.error('Account deactivated. Please contact system administrator.');
      //   setLoading(false);
      //   return;
      // }
    }

    const loginResult = login(userData, token);

    if (loginResult.success) {
      if (showAdminLogin) {
        toast.success('🔐 Admin authentication successful! Redirecting to admin dashboard...');
        setTimeout(() => navigate('/admin/dashboard'), 800);
      } else {
        toast.success('🎉 Login successful! Welcome back.');
        navigate('/dashboard');
      }
    } else {
      toast.error(loginResult.error || 'Authentication failed');
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Login failed';

    if (showAdminLogin) {
      if (error.response?.status === 403) {
        toast.error('🔐 Administrative Access Required: This portal is for authorized administrators only.');
      } else {
        toast.error(`Admin authentication failed: ${message}`);
      }
    } else {
      toast.error(`Authentication failed: ${message}`);
    }
    console.error('Login error:', error);
  } finally {
    setLoading(false);
  }
};

/*
  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const body = JSON.stringify({ email, password });

      const res = await axios.post('https://mentorpulse.onrender.com/api/auth/login', body, config);
      
      console.log('Login API Response:', res.data);
      
      let userData = {};
      let token = '';
      
      if (res.data.token) {
        token = res.data.token;
        
        if (res.data.user) {
          userData = res.data.user;
        } else if (res.data.data) {
          userData = res.data.data;
        } else {
          userData = { ...res.data };
          delete userData.token;
        }
      } else {
        throw new Error('No authentication token received');
      }

      // 🔐 SECURE ADMIN VALIDATION
      if (showAdminLogin) {
        if (userData.role !== 'admin') {
          toast.error('🔐 Access Denied: Administrator privileges required');
          setLoading(false);
          return;
        }
        
        // Additional security check for admin accounts
        if (!userData.isActive) {
          toast.error('Account deactivated. Please contact system administrator.');
          setLoading(false);
          return;
        }
      }

      const loginResult = login(userData, token);
      
      if (loginResult.success) {
        if (showAdminLogin) {
          toast.success('🔐 Admin authentication successful! Redirecting to admin dashboard...');
          
          // Navigate to admin dashboard after a brief delay
          setTimeout(() => {
            navigate('/admin/dashboard');
          }, 1000);
        } else {
          toast.success('🎉 Login successful! Welcome back.');
          navigate('/dashboard');
        }
      } else {
        toast.error(loginResult.error || 'Authentication failed');
      }
      
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      
      if (showAdminLogin) {
        if (error.response?.status === 403) {
          toast.error('🔐 Administrative Access Required: This portal is for authorized administrators only.');
        } else {
          toast.error(`Admin authentication failed: ${message}`);
        }
      } else {
        toast.error(`Authentication failed: ${message}`);
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
*/
  return (
    <div className="container-fluid vh-100 bg-light">
      <div className="row h-100 justify-content-center align-items-center">
        <div className="col-12 col-md-8 col-lg-6 col-xl-4">
          {/* Main Login Card */}
          <div className="card border-0 shadow-lg rounded-3">
            <div className="card-body p-4 p-md-5">
              
              {/* Header Section */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className={`fas ${showAdminLogin ? 'fa-shield-alt text-warning' : 'fa-user-circle text-primary'} fa-3x`}></i>
                </div>
                <h2 className={`fw-bold ${showAdminLogin ? 'text-warning' : 'text-primary'} mb-2`}>
                  {showAdminLogin ? 'Administrator Portal' : 'Welcome Back'}
                </h2>
                <p className="text-muted mb-3">
                  {showAdminLogin 
                    ? 'Secure administrative access to the mentorship platform' 
                    : 'Sign in to continue your mentorship journey'
                  }
                </p>
                
                {/* Professional Admin Toggle */}
                <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                  <span className={`small fw-medium ${showAdminLogin ? 'text-muted' : 'text-primary'}`}>
                    User Login
                  </span>
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="adminSwitch"
                      checked={showAdminLogin}
                      onChange={toggleAdminLogin}
                      style={{ 
                        transform: 'scale(1.3)',
                        backgroundColor: showAdminLogin ? '#ffc107' : '#6c757d',
                        borderColor: showAdminLogin ? '#ffc107' : '#6c757d'
                      }}
                    />
                  </div>
                  <span className={`small fw-bold ${showAdminLogin ? 'text-warning' : 'text-muted'}`}>
                    Admin Login
                  </span>
                </div>
              </div>

              {/* Admin Setup Section */}
              {showAdminLogin && (
                <div className="text-center mb-4">
                  <div className="border rounded-2 p-3 bg-light">
                    <button 
                      onClick={setupAdminAccount}
                      disabled={setupLoading}
                      className="btn btn-outline-success btn-sm px-3"
                    >
                      {setupLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Setting Up...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-cog me-2"></i>
                          Initialize Admin Account
                        </>
                      )}
                    </button>
                    <small className="d-block text-muted mt-2">
                      One-time setup for system administrator access
                    </small>
                  </div>
                </div>
              )}

              {/* Security Alert for Admin Mode */}
              {showAdminLogin && (
                <div className="alert alert-warning border-warning mb-4">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-shield-alt me-2"></i>
                    <div>
                      <h6 className="alert-heading mb-1">Enhanced Security Mode</h6>
                      <small className="mb-0">
                        This portal requires administrator credentials. All activities are logged and monitored.
                      </small>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={onSubmit} className="mb-4">
                <div className="mb-3">
                  <label className="form-label fw-medium text-dark mb-2">
                    <i className="fas fa-envelope me-2 text-muted"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg border-1"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                    placeholder="Enter your email address"
                    style={{ borderColor: '#e0e0e0' }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium text-dark mb-2">
                    <i className="fas fa-lock me-2 text-muted"></i>
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg border-1"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                    placeholder="Enter your password"
                    style={{ borderColor: '#e0e0e0' }}
                  />
                </div>

                <button
                  type="submit"
                  className={`btn w-100 py-3 fw-bold rounded-2 ${
                    showAdminLogin 
                      ? 'btn-warning text-dark' 
                      : 'btn-primary text-white'
                  }`}
                  disabled={loading}
                  style={{
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {showAdminLogin ? 'Authenticating...' : 'Signing In...'}
                    </>
                  ) : (
                    <>
                      <i className={`fas ${showAdminLogin ? 'fa-shield-alt' : 'fa-sign-in-alt'} me-2`}></i>
                      {showAdminLogin ? 'Access Admin Dashboard' : 'Sign In to Account'}
                    </>
                  )}
                </button>
              </form>

              {/* Additional Links */}
              <div className="text-center">
                {!showAdminLogin ? (
                  <>
                    <p className="mb-3 text-muted">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-primary text-decoration-none fw-medium">
                        Create account here
                      </Link>
                    </p>
                    <div className="border-top pt-3">
                      <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        For administrator access, toggle the switch above
                      </small>
                    </div>
                  </>
                ) : (
                  <div className="border-top pt-3">
                    <small className="text-muted">
                      <i className="fas fa-exclamation-triangle me-1 text-warning"></i>
                      Authorized personnel only. Unauthorized access attempts will be logged.
                    </small>
                  </div>
                )}
              </div>

              {/* Admin Credentials Info */}
              {showAdminLogin && (
                <div className="mt-4 p-3 bg-light rounded-2 border">
                  <h6 className="fw-medium text-dark mb-2">
                    <i className="fas fa-key me-2 text-warning"></i>
                    Default Administrator Credentials
                  </h6>
                  <div className="small text-muted">
                    <div className="mb-1">
                      <strong>Email:</strong> 
                      <code className="ms-2 bg-white px-2 py-1 rounded">admin@mentorship.com</code>
                    </div>
                    <div className="mb-1">
                      <strong>Password:</strong>
                      <code className="ms-2 bg-white px-2 py-1 rounded">admin123</code>
                    </div>
                    <div className="mt-2 text-warning">
                      <i className="fas fa-exclamation-circle me-1"></i>
                      Change default password after first login for security
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <small className="text-muted">
              &copy; 2024 MentorPulse. Secure authentication system.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
