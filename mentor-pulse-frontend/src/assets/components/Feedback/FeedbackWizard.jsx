import React, { useState } from 'react';
import './FeedbackWizard.css';

const FeedbackWizard = ({ sessions, selectedSession, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState(
    selectedSession?._id || (sessions.length === 1 ? sessions[0]._id : '')
  );
  const [sessionFeedback, setSessionFeedback] = useState({
    rating: 0,
    comment: '',
    categories: {
      communication: 0,
      knowledge: 0,
      professionalism: 0,
      effectiveness: 0
    },
    wouldRecommend: true
  });
  const [platformFeedback, setPlatformFeedback] = useState({
    rating: 0,
    comment: '',
    categories: {
      easeOfUse: 0,
      features: 0,
      support: 0,
      value: 0
    },
    suggestions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { title: 'Select Session', description: 'Choose which session to review' },
    { title: 'Session Feedback', description: 'Rate your session experience' },
    { title: 'Platform Feedback', description: 'Share your platform experience' },
    { title: 'Complete', description: 'Feedback submitted successfully' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 2) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === steps.length - 2) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSessionId) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Submit session feedback
      if (sessionFeedback.rating > 0) {
        const sessionResponse = await fetch('https://mentorpulse.onrender.com/api/feedback/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            ...sessionFeedback
          })
        });

        if (!sessionResponse.ok) {
          throw new Error('Failed to submit session feedback');
        }
      }

      // Submit platform feedback (if provided)
      if (platformFeedback.rating > 0) {
        const platformResponse = await fetch('https://mentorpulse.onrender.com/api/feedback/platform', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(platformFeedback)
        });

        if (!platformResponse.ok) {
          throw new Error('Failed to submit platform feedback');
        }
      }

      setCurrentStep(steps.length - 1);
      
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error('Feedback submission error:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <SessionSelectionStep
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSessionSelect={setSelectedSessionId}
          />
        );
      case 1:
        return (
          <SessionFeedbackStep
            feedback={sessionFeedback}
            onChange={setSessionFeedback}
            selectedSession={sessions.find(s => s._id === selectedSessionId)}
          />
        );
      case 2:
        return (
          <PlatformFeedbackStep
            feedback={platformFeedback}
            onChange={setPlatformFeedback}
          />
        );
      case 3:
        return <CompletionStep />;
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 0:
        return !selectedSessionId;
      case 1:
        return sessionFeedback.rating === 0;
      case 2:
        return false;
      default:
        return false;
    }
  };

  return (
    <div className="feedback-wizard">
      {/* Header */}
      <div className="wizard-header">
        <div className="header-content">
          <h2>Share Your Feedback</h2>
          <p className="header-subtitle">Help us improve your experience</p>
        </div>
        <button className="close-btn" onClick={onCancel} aria-label="Close">
          <span>×</span>
        </button>
      </div>

      {/* Progress Steps */}
      <div className="wizard-progress">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`progress-step ${index === currentStep ? 'active' : ''} ${
              index < currentStep ? 'completed' : ''
            }`}
          >
            <div className="step-indicator">
              <div className="step-number">{index + 1}</div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
            <div className="step-info">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="wizard-content-wrapper">
        <div className="wizard-content">
          {renderStep()}
        </div>
      </div>

      {/* Navigation */}
      {currentStep < steps.length - 1 && (
        <div className="wizard-actions">
          <button
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            Back
          </button>
          <div className="step-indicator-mobile">
            Step {currentStep + 1} of {steps.length - 1}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={isNextDisabled() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : currentStep === steps.length - 2 ? (
              'Submit Feedback'
            ) : (
              'Next'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// Step 1: Session Selection
const SessionSelectionStep = ({ sessions, selectedSessionId, onSessionSelect }) => (
  <div className="step-content session-selection">
    <div className="step-header">
      <h3>Select a Session to Review</h3>
      <p>Choose which completed session you'd like to provide feedback for.</p>
    </div>
    
    <div className="sessions-list">
      {sessions.map(session => (
        <div
          key={session._id}
          className={`session-option ${selectedSessionId === session._id ? 'selected' : ''}`}
          onClick={() => onSessionSelect(session._id)}
        >
          <div className="session-radio">
            <div className="radio-dot"></div>
          </div>
          <div className="session-details">
            <h4>{session.title || 'Session'}</h4>
            <div className="session-meta">
              <span className="session-date">
                {new Date(session.scheduledDate || session.createdAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span className="session-duration">{session.duration || 60} minutes</span>
              <span className="session-with">With: {session.otherUser?.name || 'User'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Step 2: Session Feedback
const SessionFeedbackStep = ({ feedback, onChange, selectedSession }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const StarRating = ({ rating, onRatingChange, hoverRating, onHoverChange, size = 'large' }) => (
    <div className={`star-rating ${size}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => onHoverChange(star)}
          onMouseLeave={() => onHoverChange(0)}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );

  const handleCategoryChange = (category, value) => {
    onChange(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }));
  };

  return (
    <div className="step-content session-feedback">
      <div className="step-header">
        <h3>Session Feedback</h3>
        <p>How was your session with <strong>{selectedSession?.otherUser?.name || 'your partner'}</strong>?</p>
      </div>

      <div className="feedback-section">
        {/* Overall Rating */}
        <div className="form-group required">
          <label>Overall Session Rating</label>
          <div className="rating-container">
            <StarRating
              rating={feedback.rating}
              onRatingChange={(rating) => onChange(prev => ({ ...prev, rating }))}
              hoverRating={hoverRating}
              onHoverChange={setHoverRating}
            />
            <div className="rating-text">
              {feedback.rating > 0 ? (
                <span className="rating-value">{feedback.rating} out of 5 stars</span>
              ) : (
                <span className="rating-placeholder">Select your rating</span>
              )}
            </div>
          </div>
        </div>

        {/* Category Ratings */}
        <div className="form-group">
          <label>Rate Specific Areas (Optional)</label>
          <div className="category-ratings">
            {Object.entries(feedback.categories).map(([category, rating]) => (
              <div key={category} className="category-rating">
                <span className="category-label">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
                <StarRating
                  rating={rating}
                  onRatingChange={(value) => handleCategoryChange(category, value)}
                  size="small"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="form-group">
          <label>Comments about the session (Optional)</label>
          <textarea
            value={feedback.comment}
            onChange={(e) => onChange(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="What went well? What could be improved? Share your thoughts..."
            rows="4"
            maxLength="1000"
            className="form-textarea"
          />
          <div className="char-count">
            {feedback.comment.length}/1000 characters
          </div>
        </div>

        {/* Recommendation */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={feedback.wouldRecommend}
              onChange={(e) => onChange(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
              className="checkbox-input"
            />
            <span className="checkbox-custom"></span>
            I would recommend this {selectedSession?.userRole === 'mentor' ? 'mentee' : 'mentor'} to others
          </label>
        </div>
      </div>
    </div>
  );
};

// Step 3: Platform Feedback
const PlatformFeedbackStep = ({ feedback, onChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const StarRating = ({ rating, onRatingChange, hoverRating, onHoverChange }) => (
    <div className="star-rating large">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => onHoverChange(star)}
          onMouseLeave={() => onHoverChange(0)}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );

  const platformCategories = [
    { key: 'easeOfUse', label: 'Ease of Use' },
    { key: 'features', label: 'Features & Functionality' },
    { key: 'support', label: 'Support & Help' },
    { key: 'value', label: 'Overall Value' }
  ];

  return (
    <div className="step-content platform-feedback">
      <div className="step-header">
        <h3>Platform Feedback</h3>
        <p>How has your experience been with MentorPulse overall? (Optional)</p>
      </div>

      <div className="feedback-section">
        {/* Overall Platform Rating */}
        <div className="form-group">
          <label>Overall Platform Rating</label>
          <div className="rating-container">
            <StarRating
              rating={feedback.rating}
              onRatingChange={(rating) => onChange(prev => ({ ...prev, rating }))}
              hoverRating={hoverRating}
              onHoverChange={setHoverRating}
            />
            <div className="rating-text">
              {feedback.rating > 0 ? (
                <span className="rating-value">{feedback.rating} out of 5 stars</span>
              ) : (
                <span className="rating-placeholder">Select rating (optional)</span>
              )}
            </div>
          </div>
        </div>

        {/* Platform Categories */}
        {feedback.rating > 0 && (
          <div className="form-group">
            <label>Rate Specific Platform Areas</label>
            <div className="category-ratings">
              {platformCategories.map(({ key, label }) => (
                <div key={key} className="category-rating">
                  <span className="category-label">{label}</span>
                  <StarRating
                    rating={feedback.categories[key]}
                    onRatingChange={(value) => onChange(prev => ({
                      ...prev,
                      categories: { ...prev.categories, [key]: value }
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform Comments */}
        <div className="form-group">
          <label>General Platform Feedback</label>
          <textarea
            value={feedback.comment}
            onChange={(e) => onChange(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="What do you love about MentorPulse? What could we improve?"
            rows="3"
            maxLength="500"
            className="form-textarea"
          />
          <div className="char-count">
            {feedback.comment.length}/500 characters
          </div>
        </div>

        {/* Suggestions */}
        <div className="form-group">
          <label>Feature Suggestions (Optional)</label>
          <textarea
            value={feedback.suggestions}
            onChange={(e) => onChange(prev => ({ ...prev, suggestions: e.target.value }))}
            placeholder="Any features you'd like to see in the future?"
            rows="2"
            maxLength="300"
            className="form-textarea"
          />
          <div className="char-count">
            {feedback.suggestions.length}/300 characters
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 4: Completion
const CompletionStep = () => (
  <div className="step-content completion-step">
    <div className="success-animation">
      <div className="success-icon">✓</div>
    </div>
    <div className="completion-content">
      <h3>Thank You for Your Feedback!</h3>
      <p>Your feedback helps us improve the MentorPulse community for everyone.</p>
      <div className="completion-message">
        <p>We appreciate you taking the time to share your experience. Your insights are valuable to us.</p>
      </div>
    </div>
    <div className="completion-footer">
      <p className="closing-message">This window will close automatically...</p>
    </div>
  </div>
);

export default FeedbackWizard;
