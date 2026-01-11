import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Badge,
  Spinner, Alert, ButtonGroup
} from 'react-bootstrap';
import {
  FaCalendar, FaRobot, FaExclamationTriangle,
  FaFilter, FaSync, FaPlusCircle
} from 'react-icons/fa';
import api from '../../../config/axios';
import { toast } from 'react-toastify';
import SessionCard from './SessionCard';
import SessionFilters from './SessionFilters';

const SessionDashboard = () => {
  const [sessions, setSessions] = useState({
    upcoming: [],
    completed: [],
    cancelled: []
  });
  const [counts, setCounts] = useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  });
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: '',
    sessionType: '',
    sortBy: 'date'
  });

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUserRole(userData.role || '');

      const response = await api.get('/sessions/user-sessions');

      if (response.data.success) {
        setSessions(response.data.data);
        setCounts(response.data.counts);
      } else {
        setError(response.data.message || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(error.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSessionStatus = async (sessionId, status, reason = '') => {
    try {
      const response = await api.patch(`/sessions/${sessionId}/cancel`, { 
        cancellationReason: reason 
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchSessions();
      }
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    }
  };

  const addReview = async (sessionId, rating, feedback) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/review`, { rating, feedback });
      if (response.data.success) {
        toast.success('Review submitted successfully!');
        fetchSessions();
      }
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Failed to submit review');
    }
  };

  const sendReminder = async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/reminder`);
      if (response.data.success) {
        toast.success('Reminder sent successfully!');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const updateMeetLink = async (sessionId, meetLink) => {
    try {
      const response = await api.patch(`/sessions/${sessionId}/meet-link`, { meetLink });
      if (response.data.success) {
        toast.success('Meeting link updated successfully!');
        fetchSessions();
      }
    } catch (error) {
      console.error('Error updating meet link:', error);
      toast.error('Failed to update meeting link');
    }
  };

  // ✅ INITIATE COMPLETION - SIMPLE WORKING VERSION
  const initiateCompletion = async (sessionId, notes = '') => {
    try {
      const response = await api.patch(`/sessions/${sessionId}/initiate-completion`, { 
        notes: notes 
      });
      
      if (response.data.success) {
        toast.success('✅ Session moved to verification phase!');
        fetchSessions();
      } else {
        toast.error('Failed to initiate completion');
      }
    } catch (error) {
      console.error('Error initiating completion:', error);
      toast.error('Failed to initiate session completion');
    }
  };

  // ✅ APPROVE SESSION - SIMPLE WORKING VERSION
  const approveSession = async (sessionId, approved, notes, actualDuration) => {
    try {
      const response = await api.patch(`/sessions/${sessionId}/approve`, { 
        approved,
        notes,
        actualDuration
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        if (response.data.progressAwarded) {
          toast.info('🎉 Progress updated!');
        }
        fetchSessions();
      }
    } catch (error) {
      console.error('Error approving session:', error);
      toast.error('Failed to approve session');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center session-loading-container">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid className="session-dashboard">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <FaCalendar className="me-3" />
            My Sessions
          </h1>
          <p className="lead text-muted">
            {userRole === 'mentor' ? 'Manage your mentoring sessions' : 'Track your learning journey'}
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <ButtonGroup>
            {['upcoming', 'completed', 'cancelled'].map(tab => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {counts[tab] > 0 && (
                  <Badge bg="light" text="dark" className="ms-2">{counts[tab]}</Badge>
                )}
              </Button>
            ))}
          </ButtonGroup>
          <Button variant="outline-secondary" className="ms-3" onClick={() => setShowFilters(true)}>
            <FaFilter className="me-1" />
            Filters
          </Button>
          <Button variant="outline-info" className="ms-2" onClick={fetchSessions}>
            <FaSync className="me-1" />
            Refresh
          </Button>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">
              <FaExclamationTriangle className="me-2" />
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          {sessions[activeTab]?.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <FaRobot size={64} className="text-muted mb-3" />
                <h4 className="text-muted">No {activeTab} sessions</h4>
                {activeTab === 'upcoming' && userRole === 'mentee' && (
                  <Button variant="primary" size="lg" onClick={() => window.location.href = '/mentors'}>
                    <FaPlusCircle className="me-2" />
                    Find Mentors
                  </Button>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Row>
              {sessions[activeTab]?.map(session => (
                <Col key={session._id} lg={4} md={6} className="mb-4">
                  <SessionCard
                    session={session}
                    onStatusUpdate={updateSessionStatus}
                    onAddReview={addReview}
                    onSendReminder={sendReminder}
                    onUpdateMeetLink={updateMeetLink}
                    onInitiateCompletion={initiateCompletion}
                    onApproveSession={approveSession}
                    userRole={userRole}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      <SessionFilters
        show={showFilters}
        onHide={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={setFilters}
      />
    </Container>
  );
};

export default SessionDashboard;