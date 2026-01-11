import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { mentorshipService } from '../../../services/mentorshipService';

const MenteeStats = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    rejectedRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenteeStats();
  }, []);

  const fetchMenteeStats = async () => {
    try {
      const requests = await mentorshipService.getMenteeRequests();
      const totalRequests = requests.requests?.length || 0;
      const pendingRequests = requests.requests?.filter(req => req.status === 'pending').length || 0;
      const acceptedRequests = requests.requests?.filter(req => req.status === 'accepted').length || 0;
      const rejectedRequests = requests.requests?.filter(req => req.status === 'rejected').length || 0;
      
      setStats({
        totalRequests,
        pendingRequests,
        acceptedRequests,
        rejectedRequests
      });
    } catch (error) {
      console.error('Failed to fetch mentee stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="row">
        {[1, 2, 3, 4].map(item => (
          <div key={item} className="col-xl-3 col-md-6 mb-4">
            <div className="card border-left-primary shadow h-100 py-2">
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                      <div className="skeleton-line" style={{width: '80px', height: '15px'}}></div>
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      <div className="skeleton-line" style={{width: '40px', height: '25px'}}></div>
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="skeleton-circle" style={{width: '40px', height: '40px'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Sent Requests',
      value: stats.totalRequests,
      icon: FaPaperPlane,
      color: 'primary',
      subtitle: 'Total requests sent'
    },
    {
      title: 'Pending',
      value: stats.pendingRequests,
      icon: FaClock,
      color: 'warning',
      subtitle: 'Awaiting response'
    },
    {
      title: 'Accepted',
      value: stats.acceptedRequests,
      icon: FaCheckCircle,
      color: 'success',
      subtitle: 'Active mentorships'
    },
    {
      title: 'Rejected',
      value: stats.rejectedRequests,
      icon: FaTimesCircle,
      color: 'danger',
      subtitle: 'Not accepted'
    }
  ];

  return (
    <div className="row">
      {statCards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div key={index} className="col-xl-3 col-md-6 mb-4">
            <div className={`card border-left-${card.color} shadow h-100 py-2`}>
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className={`text-xs font-weight-bold text-${card.color} text-uppercase mb-1`}>
                      {card.title}
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {card.value}
                    </div>
                    <div className="text-muted small mt-1">{card.subtitle}</div>
                  </div>
                  <div className="col-auto">
                    <IconComponent className={`text-${card.color}`} size="2em" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenteeStats;