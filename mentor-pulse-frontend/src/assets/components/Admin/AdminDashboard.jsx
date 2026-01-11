import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, ProgressBar, Badge, Button, Alert, Spinner, Nav, Navbar, Container } from 'react-bootstrap';
import { 
  FaUsers, FaCalendarAlt, FaChartLine, FaUserCheck,
  FaUserFriends, FaExclamationTriangle, FaServer,
  FaDatabase, FaShieldAlt, FaBell, FaSync,
  FaArrowUp, FaArrowDown, FaSignOutAlt
} from 'react-icons/fa';
import AdminService from '../../services/adminService';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [loading, setLoading] = useState({ stats: false, activity: false, system: false });
  const [error, setError] = useState('');

  // Loaders
  const loadStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const response = await AdminService.getDashboardStats();
      if (response.success) setStats(response.data);
      else setError('Failed to load dashboard stats');
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Error loading dashboard statistics');
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  const loadRecentActivity = useCallback(async () => {
    setLoading(prev => ({ ...prev, activity: true }));
    try {
      const response = await AdminService.getRecentActivity();
      if (response.success) setRecentActivities(response.data);
    } catch (err) {
      console.error('Error loading recent activity:', err);
    } finally {
      setLoading(prev => ({ ...prev, activity: false }));
    }
  }, []);

  const loadSystemStatus = useCallback(async () => {
    setLoading(prev => ({ ...prev, system: true }));
    try {
      const response = await AdminService.getSystemStatus();
      if (response.success) setSystemStatus(response.data);
    } catch (err) {
      console.error('Error loading system status:', err);
    } finally {
      setLoading(prev => ({ ...prev, system: false }));
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    setError('');
    await Promise.all([loadStats(), loadRecentActivity(), loadSystemStatus()]);
  }, [loadStats, loadRecentActivity, loadSystemStatus]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  // Helpers
  const StatCard = ({ title, value, icon, change, changeType, subtitle, loading, trend }) => (
    <Card className="h-100 shadow-sm border-0">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <h6 className="text-muted mb-2">{title}</h6>
            {loading ? (
              <Spinner animation="border" size="sm" className="mb-2" />
            ) : (
              <>
                <h3 className="mb-1">{value}</h3>
                {subtitle && <small className="text-muted">{subtitle}</small>}
                {typeof change === 'number' && (
                  <div className="d-flex align-items-center mt-2">
                    <span className={changeType === 'positive' ? 'text-success' : 'text-danger'}>
                      {changeType === 'positive' ? <FaArrowUp /> : <FaArrowDown />} 
                      {Math.abs(Math.round(change * 10) / 10)}%
                    </span>
                    <small className="text-muted ms-1">{trend}</small>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="text-primary" style={{ fontSize: '2rem', opacity: 0.8 }}>
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration': return <FaUserCheck className="text-success" />;
      case 'session_completed': return <FaCalendarAlt className="text-primary" />;
      case 'session_scheduled': return <FaCalendarAlt className="text-warning" />;
      case 'session_cancelled': return <FaExclamationTriangle className="text-danger" />;
      default: return <FaUsers className="text-info" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_registration': return 'success';
      case 'session_completed': return 'primary';
      case 'session_scheduled': return 'warning';
      case 'session_cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getServiceIcon = (service) => {
    switch (service) {
      case 'api': return <FaServer />;
      case 'database': return <FaDatabase />;
      case 'authentication': return <FaShieldAlt />;
      case 'payments': return <FaUserFriends />;
      case 'notifications': return <FaBell />;
      default: return <FaServer />;
    }
  };

  const getServiceStatusVariant = (status) => {
    switch (status) {
      case 'operational': return 'success';
      case 'degraded': return 'warning';
      case 'down': return 'danger';
      default: return 'secondary';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getGrowthTrend = (growthRate) => {
    if (growthRate > 0) return 'vs last period';
    if (growthRate < 0) return 'vs last period';
    return 'no change';
  };

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ✅ Render UI
  return (
    <>
      {/* Top Navigation */}
      <Navbar bg="light" expand="lg" className="mb-4 shadow-sm">
        <Container fluid>
          <Navbar.Brand className="fw-bold">MentorPulse Admin</Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-nav" />
          <Navbar.Collapse id="admin-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => navigate('/admin/dashboard')}>Dashboard</Nav.Link>
              <Nav.Link onClick={() => navigate('/admin/users')}>Users</Nav.Link>
              <Nav.Link onClick={() => navigate('/admin/sessions')}>Sessions</Nav.Link>
              <Nav.Link onClick={() => navigate('/admin/analytics')}>Analytics</Nav.Link>
            </Nav>
            <div className="d-flex align-items-center">
              <span className="me-3 text-muted">Admin User</span>
              <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                <FaSignOutAlt className="me-1" /> Logout
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-0 text-gray-800">Admin Dashboard</h1>
            <p className="text-muted">Real-time overview of your platform</p>
          </div>
          <Button 
            variant="outline-primary" 
            onClick={loadDashboardData} 
            disabled={loading.stats || loading.activity || loading.system}
          >
            <FaSync className={loading.stats ? 'fa-spin' : ''} /> 
            {loading.stats ? ' Refreshing...' : ' Refresh Data'}
          </Button>
        </div>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col xl={3} md={6} className="mb-4">
            <StatCard 
              title="Total Users" 
              value={stats.totalUsers?.toLocaleString() || '0'} 
              icon={<FaUsers />}
              change={stats.growthRate}
              changeType={stats.growthRate >= 0 ? 'positive' : 'negative'}
              subtitle={`${stats.activeUsers || 0} active users`}
              loading={loading.stats}
              trend={getGrowthTrend(stats.growthRate)}
            />
          </Col>
          <Col xl={3} md={6} className="mb-4">
            <StatCard 
              title="Active Sessions" 
              value={stats.activeSessions || '0'} 
              icon={<FaCalendarAlt />}
              subtitle={`${stats.completedSessions || 0} completed this month`}
              loading={loading.stats}
            />
          </Col>
          <Col xl={3} md={6} className="mb-4">
            <StatCard 
              title="New Users" 
              value={stats.last30DaysUsers?.toLocaleString() || '0'} 
              icon={<FaUserFriends />}
              change={stats.growthRate}
              changeType={stats.growthRate >= 0 ? 'positive' : 'negative'}
              subtitle="Last 30 days"
              loading={loading.stats}
              trend={getGrowthTrend(stats.growthRate)}
            />
          </Col>
          <Col xl={3} md={6} className="mb-4">
            <StatCard 
              title="Growth Rate" 
              value={`${stats.growthRate > 0 ? '+' : ''}${(Math.round((stats.growthRate || 0) * 10) / 10)}%`} 
              icon={<FaChartLine />}
              change={stats.growthRate}
              changeType={stats.growthRate >= 0 ? 'positive' : 'negative'}
              subtitle="User growth (30 days)"
              loading={loading.stats}
              trend={getGrowthTrend(stats.growthRate)}
            />
          </Col>
        </Row>

        {/* Today's Activity Summary */}
        {stats.todayActivities && (
          <Row className="mb-4">
            <Col lg={12}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white border-0">
                  <h6 className="m-0 font-weight-bold text-primary">Today's Activity</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3} className="text-center">
                      <div className="border-end">
                        <h4 className="text-primary mb-1">{stats.todayActivities.newUsers || 0}</h4>
                        <p className="text-muted mb-0">New Users</p>
                      </div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div className="border-end">
                        <h4 className="text-success mb-1">{stats.todayActivities.newSessions || 0}</h4>
                        <p className="text-muted mb-0">New Sessions</p>
                      </div>
                    </Col>
                    <Col md={3} className="text-center">
                      <div className="border-end">
                        <h4 className="text-info mb-1">{stats.todayActivities.completedSessions || 0}</h4>
                        <p className="text-muted mb-0">Completed</p>
                      </div>
                    </Col>
                    <Col md={3} className="text-center">
                      <h4 className="text-warning mb-1">
                        {(stats.todayActivities.newUsers || 0) + (stats.todayActivities.newSessions || 0)}
                      </h4>
                      <p className="text-muted mb-0">Total Activities</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <Row>
          {/* Recent Activity */}
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
                <h6 className="m-0 font-weight-bold text-primary">Recent Activity</h6>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={loadRecentActivity}
                  disabled={loading.activity}
                >
                  <FaSync className={loading.activity ? 'fa-spin' : ''} />
                </Button>
              </Card.Header>
              <Card.Body style={{ padding: '0' }}>
                {loading.activity ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Loading activities...</p>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <FaCalendarAlt size={32} className="mb-2 opacity-50" />
                    <p>No recent activity</p>
                    <small>Activities will appear here as users interact with the platform</small>
                  </div>
                ) : (
                  <div className="list-group list-group-flush" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {recentActivities.map((activity, index) => (
                      <div key={activity.id || index} className="list-group-item border-0">
                        <div className="d-flex align-items-start">
                          <div className="me-3 mt-1">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                                {activity.title}
                              </span>
                              <Badge bg={getActivityColor(activity.type)} className="text-capitalize">
                                {capitalize(activity.type.replace('_', ' '))}
                              </Badge>
                            </div>
                            <p className="mb-1 text-muted small">{activity.description}</p>
                            <small className="text-muted">
                              {formatTimeAgo(activity.timestamp)}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* System Status */}
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
                <h6 className="m-0 font-weight-bold text-primary">System Status</h6>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={loadSystemStatus}
                  disabled={loading.system}
                >
                  <FaSync className={loading.system ? 'fa-spin' : ''} />
                </Button>
              </Card.Header>
              <Card.Body>
                {loading.system ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Loading system status...</p>
                  </div>
                ) : (
                  <>
                    {/* Services Status */}
                    {systemStatus.services && (
                      <div className="mb-4">
                        <h6 className="text-muted mb-3">Services Status</h6>
                        {Object.entries(systemStatus.services).map(([service, status]) => (
                          <div key={service} className="d-flex justify-content-between align-items-center py-2">
                            <div className="d-flex align-items-center">
                              <span className="me-2 text-primary">{getServiceIcon(service)}</span>
                              <span className="text-capitalize">{capitalize(service)}</span>
                            </div>
                            <Badge bg={getServiceStatusVariant(status)}>{status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* System Metrics */}
                    {systemStatus.metrics && (
                      <>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>System Health</span>
                            <span>{Math.round((systemStatus.metrics.systemHealth || 0) * 10) / 10}%</span>
                          </div>
                          <ProgressBar 
                            now={systemStatus.metrics.systemHealth || 0} 
                            variant={
                              (systemStatus.metrics.systemHealth || 0) > 90 ? 'success' :
                              (systemStatus.metrics.systemHealth || 0) > 70 ? 'warning' : 'danger'
                            } 
                          />
                        </div>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Active Users</span>
                            <span>{systemStatus.metrics.activeUsers || 0}</span>
                          </div>
                          <ProgressBar 
                            now={Math.min(((systemStatus.metrics.activeUsers || 0) / 1000) * 100, 100)} 
                            variant="info" 
                          />
                        </div>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Today's Sessions</span>
                            <span>{systemStatus.metrics.todaySessions || 0}</span>
                          </div>
                          <ProgressBar 
                            now={Math.min(((systemStatus.metrics.todaySessions || 0) / 50) * 100, 100)} 
                            variant="primary" 
                          />
                        </div>
                      </>
                    )}

                    {/* Last Updated */}
                    {systemStatus.lastUpdated && (
                      <div className="mt-3 pt-3 border-top">
                        <small className="text-muted">
                          Last updated: {new Date(systemStatus.lastUpdated).toLocaleString()}
                        </small>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AdminDashboard;

