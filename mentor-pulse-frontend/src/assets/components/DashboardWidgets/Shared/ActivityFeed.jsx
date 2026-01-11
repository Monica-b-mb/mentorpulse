import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaCheck, FaTimes, FaUserPlus, FaClock } from 'react-icons/fa';
import { mentorshipService } from '../../../services/mentorshipService';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      // For mentors: get their requests, for mentees: get their sent requests
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let requests = [];
      
      if (user.role === 'mentor') {
        const response = await mentorshipService.getMentorRequests();
        requests = response.requests || [];
      } else {
        const response = await mentorshipService.getMenteeRequests();
        requests = response.requests || [];
      }
      
      // Transform requests into activities
      const recentActivities = requests
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(request => ({
          id: request._id,
          type: 'mentorship_request',
          title: user.role === 'mentor' 
            ? `New request from ${request.mentee?.name || 'a mentee'}`
            : `Request sent to ${request.mentor?.name || 'a mentor'}`,
          description: request.message?.substring(0, 100) + (request.message?.length > 100 ? '...' : ''),
          timestamp: new Date(request.createdAt),
          status: request.status,
          icon: FaEnvelope
        }));
      
      setActivities(recentActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      // Sample data for demo
      setActivities([
        {
          id: 1,
          type: 'system',
          title: 'Welcome to MentorMatch!',
          description: 'Your dashboard is ready. Start exploring mentors or update your profile.',
          timestamp: new Date(),
          status: 'completed',
          icon: FaUserPlus
        }
      ]);
    } finally {
      setLoading(false);
    }
  };


  const formatTime = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="card shadow h-100">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Recent Activity</h6>
        </div>
        <div className="card-body">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="mb-3">
              <div className="skeleton-line" style={{width: '70%', height: '15px'}}></div>
              <div className="skeleton-line" style={{width: '90%', height: '12px', marginTop: '5px'}}></div>
              <div className="skeleton-line" style={{width: '40%', height: '10px', marginTop: '5px'}}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow h-100">
      <div className="card-header py-3 d-flex justify-content-between align-items-center">
        <h6 className="m-0 font-weight-bold text-primary">Recent Activity</h6>
        <span className="badge bg-primary">{activities.length}</span>
      </div>
      <div className="card-body">
        {activities.length === 0 ? (
          <div className="text-center py-4">
            <FaEnvelope size={32} className="text-muted mb-2" />
            <p className="text-muted">No recent activity</p>
          </div>
        ) : (
          <div className="activity-feed">
            {activities.map((activity, index) => (
              <div key={activity.id || index} className="activity-item mb-3 pb-3 border-bottom">
                <div className="d-flex align-items-start">
                  <div className="activity-icon me-3">
                    {React.createElement(activity.icon, { 
                      className: `text-${activity.status === 'accepted' ? 'success' : activity.status === 'rejected' ? 'danger' : 'primary'}` 
                    })}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{activity.title}</h6>
                    <p className="text-muted small mb-1">{activity.description}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">{formatTime(activity.timestamp)}</small>
                      {activity.status && (
                        <span className={`badge bg-${
                          activity.status === 'accepted' ? 'success' : 
                          activity.status === 'rejected' ? 'danger' : 
                          activity.status === 'pending' ? 'warning' : 'secondary'
                        }`}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
