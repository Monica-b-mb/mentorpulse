import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTrophy, 
  FaUserGraduate,
  FaLightbulb,
  FaClock
} from 'react-icons/fa';

const ProgressTimeline = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'session_completed':
        return <FaCheckCircle className="text-success" />;
      case 'skill_acquired':
        return <FaUserGraduate className="text-primary" />;
      case 'goal_achieved':
        return <FaTrophy className="text-warning" />;
      case 'milestone_reached':
        return <FaLightbulb className="text-info" />;
      default:
        return <FaClock className="text-secondary" />;
    }
  };

  const getActivityVariant = (type) => {
    switch (type) {
      case 'session_completed': return 'success';
      case 'skill_acquired': return 'primary';
      case 'goal_achieved': return 'warning';
      case 'milestone_reached': return 'info';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (!activities || activities.length === 0) {
    return (
      <Card className="h-100">
        <Card.Header>
          <h5 className="mb-0">Recent Activity</h5>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <FaClock size={48} className="text-muted mb-3" />
          <p className="text-muted">No recent activity to display</p>
          <small className="text-muted">
            Complete sessions and achieve goals to see your progress here!
          </small>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="h-100">
      <Card.Header>
        <h5 className="mb-0">Recent Activity</h5>
      </Card.Header>
      <Card.Body className="timeline-container">
        <div className="timeline">
          {activities.map((activity, index) => (
            <div key={activity._id || index} className="timeline-item">
              <div className="timeline-marker">
                {getActivityIcon(activity.type)}
              </div>
              <div className="timeline-content">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <h6 className="mb-0">{activity.title}</h6>
                  <Badge bg={getActivityVariant(activity.type)} className="text-capitalize">
                    {activity.type.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-muted small mb-2">{activity.description}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    <FaCalendarAlt className="me-1" />
                    {formatDate(activity.createdAt)}
                  </small>
                  {activity.value > 0 && (
                    <small className="text-success fw-bold">
                      +{activity.value} XP
                    </small>
                  )}
                </div>
                
                {/* Session specific details */}
                {activity.relatedSession && (
                  <div className="mt-2 p-2 bg-light rounded">
                    <small className="text-muted">
                      Duration: {activity.relatedSession.duration} hours
                    </small>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProgressTimeline;

