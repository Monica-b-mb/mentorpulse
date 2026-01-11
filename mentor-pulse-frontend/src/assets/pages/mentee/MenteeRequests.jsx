import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaCheck, FaTimes, FaClock, FaTrash, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { mentorshipService } from '../../services/mentorshipService'; // FIXED PATH

const MenteeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await mentorshipService.getMenteeRequests();
      setRequests(data.requests || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    
    try {
      await mentorshipService.updateRequestStatus(requestId, 'cancelled');
      toast.success('Request cancelled');
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel request');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { class: 'warning', icon: FaClock, text: 'Pending Review' },
      accepted: { class: 'success', icon: FaCheck, text: 'Accepted' },
      rejected: { class: 'danger', icon: FaTimes, text: 'Rejected' },
      cancelled: { class: 'secondary', icon: FaTrash, text: 'Cancelled' }
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 text-primary mb-1">
            <FaPaperPlane className="me-2" /> My Mentorship Requests
          </h1>
          <p className="text-muted mb-0">
            Track and manage your sent mentorship requests
          </p>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={fetchRequests}>
          <FaSync className="me-1" />
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-5">
          <FaPaperPlane size={48} className="text-muted mb-3" />
          <h4>No requests sent yet</h4>
          <p className="text-muted">
            You haven't sent any mentorship requests. Find mentors and send your first request!
          </p>
        </div>
      ) : (
        <div className="row">
          {requests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={request._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span className={`badge bg-${statusConfig.class}`}>
                      <StatusIcon className="me-1" />
                      {statusConfig.text}
                    </span>
                    <small className="text-muted">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <img
                        src={request.mentor?.avatar || '/default-avatar.png'}
                        alt={request.mentor?.name}
                        className="rounded-circle me-3"
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                      <div>
                        <h6 className="mb-0">{request.mentor?.name || 'Mentor'}</h6>
                        <small className="text-muted">
                          {request.mentor?.designation || 'Professional Mentor'}
                        </small>
                      </div>
                    </div>

                    <div className="mb-3">
                      <strong>Your Message:</strong>
                      <p className="text-muted mb-0 mt-1">{request.message}</p>
                    </div>

                    {request.goals && (
                      <div className="mb-3">
                        <strong>Your Goals:</strong>
                        <p className="text-muted mb-0 mt-1">{request.goals}</p>
                      </div>
                    )}

                    {request.expectedOutcome && (
                      <div className="mb-3">
                        <strong>Expected Outcome:</strong>
                        <p className="text-muted mb-0 mt-1">{request.expectedOutcome}</p>
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="card-footer bg-transparent">
                      <button
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={() => cancelRequest(request._id)}
                      >
                        <FaTrash className="me-1" />
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MenteeRequests;