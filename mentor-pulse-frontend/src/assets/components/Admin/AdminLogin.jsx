import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaLock, FaUser, FaArrowLeft, FaShieldAlt, FaMagic } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AdminLogin.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the regular login endpoint (NOT admin/login)
     const response = await axios.post('http://localhost:5000/api/auth/admin/login', formData);

      
      // Check if user is admin
      if (response.data.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('isAdmin', 'true');

      
      toast.success('Admin login successful! 🎉');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Admin login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // EMERGENCY ADMIN SETUP FUNCTION
  const setupAdminAccount = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/setup-admin');
      toast.success('Admin account created! Check console for credentials.');
      console.log('Admin setup response:', response.data);
      
      // Auto-fill the form with the created credentials
      setFormData({
        email: 'admin@mentorship.com',
        password: 'admin123'
      });
      
    } catch (error) {
      console.error('Setup admin error:', error);
      toast.error('Failed to setup admin account');
    } finally {
      setLoading(false);
    }
  };

  const goToMainSite = () => {
    navigate('/');
  };

  return (
    <div className="admin-login-container">
      <Container fluid className="h-100">
        <Row className="h-100 justify-content-center align-items-center">
          <Col xs={12} sm={8} md={6} lg={4}>
            {/* Back to Main Site */}
            <Button 
              variant="outline-light" 
              className="mb-4" 
              onClick={goToMainSite}
              size="sm"
            >
              <FaArrowLeft className="me-2" />
              Back to Main Site
            </Button>

            <Card className="admin-login-card shadow-lg">
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="admin-icon-container mb-3">
                    <FaShieldAlt className="admin-icon" />
                  </div>
                  <h2 className="admin-login-title">Admin Portal</h2>
                  <p className="text-muted">Secure access to platform administration</p>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                {/* Emergency Setup Button */}
                <Alert variant="info" className="mb-3">
                  <div className="text-center">
                    <small>Don't have admin access?</small>
                    <br />
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      onClick={setupAdminAccount}
                      disabled={loading}
                      className="mt-1"
                    >
                      <FaMagic className="me-1" />
                      Setup Admin Account
                    </Button>
                  </div>
                </Alert>

                {/* Login Form */}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">
                      <FaUser className="me-2" />
                      Admin Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="admin@mentorship.com"
                      required
                      className="form-control-custom"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="form-label">
                      <FaLock className="me-2" />
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="admin123"
                      required
                      className="form-control-custom"
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 admin-login-btn"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <FaShieldAlt className="me-2" />
                        Access Admin Panel
                      </>
                    )}
                  </Button>
                </Form>

                {/* Default Credentials */}
                <div className="text-center mt-3">
                  <small className="text-muted">
                    Default credentials after setup:
                    <br />
                    <strong>Email:</strong> admin@mentorship.com
                    <br />
                    <strong>Password:</strong> admin123
                  </small>
                </div>

                {/* Security Notice */}
                <div className="text-center mt-4">
                  <small className="text-muted security-notice">
                    <FaLock className="me-1" />
                    Restricted access. Authorized personnel only.
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLogin;