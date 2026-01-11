import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, ProgressBar, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { 
  FaChartLine, 
  FaUsers, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaSync,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import AdminService from '../../services/adminService';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await AdminService.getAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const StatCard = ({ title, value, icon, change, changeType, subtitle }) => (
    <Card className="h-100 shadow-sm border-0">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <h6 className="text-muted mb-2">{title}</h6>
            <h3 className="mb-1">{value}</h3>
            {subtitle && <small className="text-muted">{subtitle}</small>}
            {change !== undefined && (
              <small className={changeType === 'positive' ? 'text-success' : 'text-danger'}>
                {changeType === 'positive' ? <FaArrowUp /> : <FaArrowDown />} 
                {change}%
              </small>
            )}
          </div>
          <div className="text-primary" style={{ fontSize: '2rem', opacity: 0.8 }}>
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  // Safe data access functions
  const getUserGrowthData = () => {
    return analytics?.userGrowth || [];
  };

  const getSessionMetrics = () => {
    return analytics?.sessionMetrics || {
      totalSessions: 0,
      averageDuration: 0,
      completionRate: 0,
      cancellationRate: 0,
      activeSessions: 0
    };
  };

  const getPlatformStats = () => {
    return analytics?.platformStats || {
      totalUsers: 0,
      activeUsers: 0,
      verifiedMentors: 0,
      newRegistrations: 0
    };
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 text-muted">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  const sessionMetrics = getSessionMetrics();
  const platformStats = getPlatformStats();
  const userGrowth = getUserGrowthData();

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">Analytics Dashboard</h1>
          <p className="text-muted">Platform performance and user insights</p>
        </div>
        <Button 
          variant="outline-primary" 
          onClick={loadAnalytics} 
          disabled={loading}
        >
          <FaSync className={loading ? 'fa-spin' : ''} /> 
          {loading ? ' Refreshing...' : ' Refresh Data'}
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Platform Overview Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-4">
          <StatCard 
            title="Total Users" 
            value={platformStats.totalUsers?.toLocaleString() || '0'} 
            icon={<FaUsers />}
            change={12.5}
            changeType="positive"
            subtitle={`${platformStats.activeUsers || 0} active`}
          />
        </Col>
        <Col xl={3} md={6} className="mb-4">
          <StatCard 
            title="Verified Mentors" 
            value={platformStats.verifiedMentors?.toLocaleString() || '0'} 
            icon={<FaUsers />}
            change={8.3}
            changeType="positive"
            subtitle="Quality mentors"
          />
        </Col>
        <Col xl={3} md={6} className="mb-4">
          <StatCard 
            title="Total Sessions" 
            value={sessionMetrics.totalSessions?.toLocaleString() || '0'} 
            icon={<FaCalendarAlt />}
            change={15.7}
            changeType="positive"
            subtitle={`${sessionMetrics.completionRate || 0}% completion`}
          />
        </Col>
        <Col xl={3} md={6} className="mb-4">
          <StatCard 
            title="New Registrations" 
            value={platformStats.newRegistrations?.toLocaleString() || '0'} 
            icon={<FaChartLine />}
            change={5.2}
            changeType="positive"
            subtitle="Last 30 days"
          />
        </Col>
      </Row>

      <Row>
        {/* User Growth Chart */}
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 text-primary">
                <FaChartLine className="me-2" /> User Growth Trend
              </h5>
            </Card.Header>
            <Card.Body>
              {userGrowth.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <FaChartLine size={48} className="mb-3 opacity-50" />
                  <p>No growth data available</p>
                  <small>User growth data will appear here as the platform grows</small>
                </div>
              ) : (
                <Table responsive hover>
                  <thead className="bg-light">
                    <tr>
                      <th>Month</th>
                      <th>Total Users</th>
                      <th>Mentors</th>
                      <th>Mentees</th>
                      <th>Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userGrowth.map((item, index) => (
                      <tr key={index}>
                        <td className="fw-semibold">{item.month}</td>
                        <td>{item.users?.toLocaleString() || '0'}</td>
                        <td>{item.mentors?.toLocaleString() || '0'}</td>
                        <td>{item.mentees?.toLocaleString() || '0'}</td>
                        <td>
                          <Badge bg={
                            index > 0 && userGrowth[index - 1]?.users > 0 
                              ? (item.users > userGrowth[index - 1].users ? 'success' : 'danger')
                              : 'success'
                          }>
                            {index > 0 && userGrowth[index - 1]?.users > 0 
                              ? `${(((item.users - userGrowth[index - 1].users) / userGrowth[index - 1].users) * 100).toFixed(1)}%`
                              : 'New'
                            }
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Session Metrics */}
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 text-primary">
                <FaCalendarAlt className="me-2" /> Session Performance
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Completion Rate</span>
                  <span className="fw-semibold">{sessionMetrics.completionRate || 0}%</span>
                </div>
                <ProgressBar 
                  now={sessionMetrics.completionRate || 0} 
                  variant={
                    (sessionMetrics.completionRate || 0) > 80 ? 'success' :
                    (sessionMetrics.completionRate || 0) > 60 ? 'warning' : 'danger'
                  } 
                />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Cancellation Rate</span>
                  <span className="fw-semibold">{sessionMetrics.cancellationRate || 0}%</span>
                </div>
                <ProgressBar 
                  now={sessionMetrics.cancellationRate || 0} 
                  variant={
                    (sessionMetrics.cancellationRate || 0) < 10 ? 'success' :
                    (sessionMetrics.cancellationRate || 0) < 20 ? 'warning' : 'danger'
                  } 
                />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Average Duration</span>
                  <span className="fw-semibold">{sessionMetrics.averageDuration || 0} min</span>
                </div>
                <ProgressBar 
                  now={Math.min((sessionMetrics.averageDuration || 0) / 120 * 100, 100)} 
                  variant="info" 
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Active Sessions</span>
                  <span className="fw-semibold">{sessionMetrics.activeSessions || 0}</span>
                </div>
                <ProgressBar 
                  now={Math.min((sessionMetrics.activeSessions || 0) / 50 * 100, 100)} 
                  variant="primary" 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Platform Statistics */}
      <Row>
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 text-primary">
                <FaUsers className="me-2" /> User Distribution
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="row text-center">
                <div className="col-4">
                  <div className="h3 text-primary mb-1">
                    {platformStats.totalUsers?.toLocaleString() || '0'}
                  </div>
                  <small className="text-muted">Total Users</small>
                </div>
                <div className="col-4">
                  <div className="h3 text-success mb-1">
                    {platformStats.activeUsers?.toLocaleString() || '0'}
                  </div>
                  <small className="text-muted">Active Users</small>
                </div>
                <div className="col-4">
                  <div className="h3 text-info mb-1">
                    {platformStats.verifiedMentors?.toLocaleString() || '0'}
                  </div>
                  <small className="text-muted">Verified Mentors</small>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>User Activity Rate</span>
                  <span className="fw-semibold">
                    {platformStats.totalUsers > 0 
                      ? `${Math.round((platformStats.activeUsers / platformStats.totalUsers) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <ProgressBar 
                  now={platformStats.totalUsers > 0 ? (platformStats.activeUsers / platformStats.totalUsers) * 100 : 0} 
                  variant="success" 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 text-primary">
                <FaCalendarAlt className="me-2" /> Session Analytics
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="row text-center">
                <div className="col-4">
                  <div className="h3 text-warning mb-1">
                    {sessionMetrics.totalSessions?.toLocaleString() || '0'}
                  </div>
                  <small className="text-muted">Total Sessions</small>
                </div>
                <div className="col-4">
                  <div className="h3 text-success mb-1">
                    {Math.round((sessionMetrics.completionRate / 100) * sessionMetrics.totalSessions) || '0'}
                  </div>
                  <small className="text-muted">Completed</small>
                </div>
                <div className="col-4">
                  <div className="h3 text-danger mb-1">
                    {Math.round((sessionMetrics.cancellationRate / 100) * sessionMetrics.totalSessions) || '0'}
                  </div>
                  <small className="text-muted">Cancelled</small>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Session Success Rate</span>
                  <span className="fw-semibold">
                    {100 - (sessionMetrics.cancellationRate || 0)}%
                  </span>
                </div>
                <ProgressBar 
                  now={100 - (sessionMetrics.cancellationRate || 0)} 
                  variant={
                    (100 - (sessionMetrics.cancellationRate || 0)) > 90 ? 'success' :
                    (100 - (sessionMetrics.cancellationRate || 0)) > 80 ? 'warning' : 'danger'
                  } 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* No Data State */}
      {!analytics && !loading && (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center py-5">
            <FaChartLine size={64} className="text-muted mb-3 opacity-50" />
            <h5 className="text-muted">No Analytics Data Available</h5>
            <p className="text-muted mb-4">
              Analytics data will appear here as users interact with the platform.
            </p>
            <Button variant="primary" onClick={loadAnalytics}>
              <FaSync className="me-2" />
              Try Loading Again
            </Button>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default AdminAnalytics;
