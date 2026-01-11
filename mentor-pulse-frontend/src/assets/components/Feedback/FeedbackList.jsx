import React, { useState, useEffect, useCallback } from 'react';
import './Feedback.css';

const FeedbackList = ({ mentorId }) => {
  const [feedback, setFeedback] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filter !== 'all' && { rating: filter })
      });

      const response = await fetch(
        `https://mentorpulse.onrender.com/api/feedback/mentor/${mentorId}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        if (page === 1) {
          setFeedback(data.data.feedback);
          setStatistics(data.data.statistics);
        } else {
          setFeedback(prev => [...prev, ...data.data.feedback]);
        }
        setHasMore(data.data.feedback.length === 10);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  }, [mentorId, filter, page]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const StarRating = ({ rating }) => (
    <div className="star-rating small static">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && feedback.length === 0) {
    return <div className="loading">Loading feedback...</div>;
  }

  return (
    <div className="feedback-list">
      {/* Statistics */}
      {statistics && (
        <div className="feedback-stats">
          <div className="stat-item">
            <div className="stat-value">{statistics.averageRating}</div>
            <div className="stat-label">Average Rating</div>
            <StarRating rating={Math.round(statistics.averageRating)} />
          </div>
          <div className="stat-item">
            <div className="stat-value">{statistics.totalReviews}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="rating-distribution">
            {statistics.distribution.map(({ star, count }) => (
              <div key={star} className="distribution-item">
                <span>{star} star</span>
                <div className="distribution-bar">
                  <div 
                    className="distribution-fill"
                    style={{ 
                      width: `${(count / statistics.totalReviews) * 100}%` 
                    }}
                  ></div>
                </div>
                <span>({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="feedback-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => { setFilter('all'); setPage(1); }}
        >
          All
        </button>
        {[5, 4, 3, 2, 1].map(rating => (
          <button
            key={rating}
            className={`filter-btn ${filter === rating.toString() ? 'active' : ''}`}
            onClick={() => { setFilter(rating.toString()); setPage(1); }}
          >
            {rating} Star{rating !== 1 ? 's' : ''}
          </button>
        ))}
      </div>

      {/* Feedback Items */}
      <div className="feedback-items">
        {feedback.map((item) => (
          <div key={item._id} className="feedback-item">
            <div className="feedback-header">
              <div className="reviewer-info">
                <div className="reviewer-avatar">
                  {item.isAnonymous ? (
                    <div className="avatar-placeholder">A</div>
                  ) : (
                    item.mentee.profileImage ? (
                      <img src={item.mentee.profileImage} alt={item.mentee.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {item.mentee.name.charAt(0).toUpperCase()}
                      </div>
                    )
                  )}
                </div>
                <div className="reviewer-details">
                  <h4>{item.isAnonymous ? 'Anonymous' : item.mentee.name}</h4>
                  <span className="review-date">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>
              <StarRating rating={item.rating} />
            </div>

            {item.comment && (
              <div className="feedback-comment">
                <p>{item.comment}</p>
              </div>
            )}

            {/* Category Ratings */}
            {item.categories && Object.values(item.categories).some(val => val > 0) && (
              <div className="category-ratings-display">
                {Object.entries(item.categories)
                  //.filter((, value]) => value > 0)
                  .map(([category, value]) => (
                    <div key={category} className="category-rating-display">
                      <span className="category-label">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                      <StarRating rating={value} />
                    </div>
                  ))}
              </div>
            )}

            {item.wouldRecommend !== undefined && (
              <div className="recommendation">
                {item.wouldRecommend ? '✓ Would recommend' : '✗ Would not recommend'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="load-more">
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={loading}
            className="btn btn-outline"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {feedback.length === 0 && !loading && (
        <div className="no-feedback">
          <p>No feedback available yet.</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;

