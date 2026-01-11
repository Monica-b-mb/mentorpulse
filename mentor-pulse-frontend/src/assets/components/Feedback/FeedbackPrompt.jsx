import React, { useState, useEffect } from 'react';
import FeedbackWizard from './FeedbackWizard';
import './FeedbackPrompt.css';

const FeedbackPrompt = () => {
  const [completedSessions, setCompletedSessions] = useState([]);
  const [showFeedbackWizard, setShowFeedbackWizard] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompletedSessions();
  }, []);

  const loadCompletedSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://mentorpulse.onrender.com/api/sessions/completed', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setCompletedSessions(data.data || []);
      } else {
        setCompletedSessions([]);
      }
    } catch (error) {
      console.error('Failed to load completed sessions:', error);
      setCompletedSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGiveFeedback = (session = null) => {
    if (session) {
      setSelectedSession(session);
    }
    setShowFeedbackWizard(true);
  };

  const handleFeedbackComplete = () => {
    setShowFeedbackWizard(false);
    setSelectedSession(null);
    loadCompletedSessions();
  };

  if (loading) {
    return (
      <div className="feedback-loading">
        <div className="loading-spinner"></div>
        <p>Checking for sessions...</p>
      </div>
    );
  }

  if (completedSessions.length === 0) {
    return null;
  }

  return (
    <div className="feedback-prompt">
      {/* Quick Feedback Prompt */}
      <div className="feedback-alert">
        <div className="alert-content">
          <div className="alert-icon">💬</div>
          <div className="alert-text">
            <h4>Feedback Request</h4>
            <p>You have {completedSessions.length} completed session{completedSessions.length !== 1 ? 's' : ''} waiting for your feedback</p>
          </div>
        </div>
        <div className="alert-actions">
          <button 
            className="btn btn-primary"
            onClick={() => handleGiveFeedback()}
          >
            Give Feedback
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="sessions-for-feedback">
        <h3>Sessions Awaiting Feedback</h3>
        <div className="sessions-grid">
          {completedSessions.map(session => (
            <SessionCard 
              key={session._id} 
              session={session} 
              onGiveFeedback={handleGiveFeedback}
            />
          ))}
        </div>
      </div>

      {/* Feedback Wizard Modal */}
      {showFeedbackWizard && (
        <div className="modal-overlay">
          <div className="modal-container">
            <FeedbackWizard
              sessions={completedSessions}
              selectedSession={selectedSession}
              onComplete={handleFeedbackComplete}
              onCancel={() => setShowFeedbackWizard(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const SessionCard = ({ session, onGiveFeedback }) => {
  const otherUser = session.otherUser || { name: 'User' };

  return (
    <div className="session-card">
      <div className="session-info">
        <h4>{session.title || 'Session'}</h4>
        <div className="session-meta">
          <span className="session-date">
            {new Date(session.scheduledDate || session.createdAt).toLocaleDateString()}
          </span>
          <span className="session-duration">{session.duration || 60} min</span>
          <span className="session-with">With: {otherUser.name}</span>
        </div>
      </div>
      <div className="session-actions">
        <button 
          className="btn btn-outline"
          onClick={() => onGiveFeedback(session)}
        >
          Provide Feedback
        </button>
      </div>
    </div>
  );
};

export default FeedbackPrompt;
