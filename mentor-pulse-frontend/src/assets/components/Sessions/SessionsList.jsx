// src/assets/components/Sessions/SessionsList.jsx
import React, { useState, useEffect } from 'react';
import { FaCalendar, FaClock, FaVideo, FaUser, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const SessionsList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('https://mentorpulse.onrender.com/api/sessions/my-sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSessions(response.data.data);
      } else {
        setError('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Error fetching sessions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <FaSpinner style={styles.spinner} />
        <p>Loading sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <FaExclamationTriangle />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Booked Sessions</h2>
      
      {sessions.length === 0 ? (
        <div style={styles.empty}>
          <FaCalendar style={styles.emptyIcon} />
          <h3>No sessions booked yet</h3>
          <p>Book your first session with a mentor to get started!</p>
        </div>
      ) : (
        <div style={styles.sessionsGrid}>
          {sessions.map((session) => (
            <div key={session._id} style={styles.sessionCard}>
              <div style={styles.sessionHeader}>
                <h3 style={styles.sessionTitle}>{session.sessionType} Session</h3>
                <span style={{
                  ...styles.status,
                  ...(session.status === 'confirmed' ? styles.statusConfirmed : {}),
                  ...(session.status === 'pending' ? styles.statusPending : {}),
                  ...(session.status === 'cancelled' ? styles.statusCancelled : {})
                }}>
                  {session.status}
                </span>
              </div>

              <div style={styles.sessionDetails}>
                <div style={styles.detailItem}>
                  <FaCalendar style={styles.detailIcon} />
                  <span>{formatDate(session.sessionDate)}</span>
                </div>
                <div style={styles.detailItem}>
                  <FaClock style={styles.detailIcon} />
                  <span>{session.startTime} - {session.endTime}</span>
                </div>
                <div style={styles.detailItem}>
                  <FaUser style={styles.detailIcon} />
                  <span>With: {session.mentorId?.name}</span>
                </div>
                {session.meetingLink && (
                  <div style={styles.detailItem}>
                    <FaVideo style={styles.detailIcon} />
                    <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>

              {session.notes && (
                <div style={styles.notes}>
                  <p style={styles.notesText}>{session.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    color: '#2c3e50',
    marginBottom: '30px',
    fontSize: '2rem',
    fontWeight: '600'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6c757d'
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '40px 20px',
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    margin: '20px'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6c757d'
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '20px',
    color: '#bdc3c7'
  },
  sessionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e1e5e9',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
    }
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  sessionTitle: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '1.2rem',
    fontWeight: '600'
  },
  status: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  statusConfirmed: {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404'
  },
  statusCancelled: {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  },
  sessionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#495057',
    fontSize: '14px'
  },
  detailIcon: {
    color: '#6c757d',
    width: '14px'
  },
  link: {
    color: '#3498db',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline'
    }
  },
  notes: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #3498db'
  },
  notesText: {
    margin: 0,
    color: '#495057',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  }
};

export default SessionsList;
