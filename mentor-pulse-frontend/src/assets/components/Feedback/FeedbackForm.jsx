import React, { useState } from 'react';
import './Feedback.css';

const FeedbackForm = ({ session, onFeedbackSubmitted, onCancel }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    categories: {
      communication: 0,
      knowledge: 0,
      professionalism: 0,
      effectiveness: 0
    },
    wouldRecommend: true,
    isAnonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: session._id,
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        onFeedbackSubmitted(data.data);
      } else {
        alert(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      alert('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleCategoryChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }));
  };

  const StarRating = ({ rating, onRatingChange, hoverRating, onHoverChange, size = 'large' }) => (
    <div className={`star-rating ${size}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => onHoverChange(star)}
          onMouseLeave={() => onHoverChange(0)}
        >
          ★
        </span>
      ))}
    </div>
  );

  return (
    <div className="feedback-form-container">
      <div className="feedback-form">
        <h3>Session Feedback</h3>
        <p className="session-info">
          Session: <strong>{session.title}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          {/* Overall Rating */}
          <div className="form-group">
            <label>Overall Rating *</label>
            <div className="rating-container">
              <StarRating
                rating={formData.rating}
                onRatingChange={handleRatingChange}
                hoverRating={hoverRating}
                onHoverChange={setHoverRating}
              />
              <span className="rating-text">
                {formData.rating > 0 ? `${formData.rating} stars` : 'Select rating'}
              </span>
            </div>
          </div>

          {/* Category Ratings */}
          <div className="form-group">
            <label>Category Ratings</label>
            <div className="category-ratings">
              {Object.entries(formData.categories).map(([category, rating]) => (
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
            <label>Comments (Optional)</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience with this session..."
              rows="4"
              maxLength="1000"
            />
            <div className="char-count">
              {formData.comment.length}/1000
            </div>
          </div>

          {/* Additional Options */}
          <div className="form-group options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.wouldRecommend}
                onChange={(e) => setFormData(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
              />
              Would recommend this mentor
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
              />
              Submit anonymously
            </label>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || formData.rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;