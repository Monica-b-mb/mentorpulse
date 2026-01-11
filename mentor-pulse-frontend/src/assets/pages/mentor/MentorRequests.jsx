import React, { useState, useEffect } from 'react';
import { 
  FaEnvelope, FaCheck, FaTimes, FaClock, FaSearch, 
  FaFilter, FaSync, FaUser, FaExclamationTriangle 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { mentorshipService } from '../../services/mentorshipService';

const MentorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mentorshipService.getMentorRequests();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load requests. Please check your connection.');
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      setUpdating(true);
      await mentorshipService.updateStatus(requestId, status);
      toast.success(`Request ${status} successfully`);
      
      // Update local state instead of refetching all requests
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === requestId 
            ? { ...request, status, respondedAt: new Date() }
            : request
        )
      );
    } catch (error) {
      console.error('Error updating request:', error);
      
      if (error.message?.includes('CORS') || error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check if the server is running and allows PATCH requests.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update request');
      }
    } finally {
      setUpdating(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch =
      request.mentee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'warning', text: 'Pending', icon: FaClock },
      accepted: { class: 'success', text: 'Accepted', icon: FaCheck },
      rejected: { class: 'danger', text: 'Rejected', icon: FaTimes },
      cancelled: { class: 'secondary', text: 'Cancelled', icon: FaTimes }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const StatusIcon = config.icon;
    
    return (
      <span className={`badge bg-${config.class} d-flex align-items-center`}>
        <StatusIcon className="me-1" size={12} />
        {config.text}
      </span>
    );
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary me-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span>Loading mentorship requests...</span>
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
            <FaEnvelope className="me-2" /> Mentorship Requests
          </h1>
          <p className="text-muted mb-0">
            Manage incoming mentorship requests from potential mentees
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary p-2">{requests.length} total</span>
          <button 
            className="btn btn-outline-primary btn-sm" 
            onClick={fetchRequests}
            disabled={loading}
          >
            <FaSync className={`me-1 ${loading ? 'spinning' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* CORS Warning */}
      {error && error.includes('CORS') && (
        <div className="alert alert-warning mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>CORS Issue Detected:</strong> Please make sure your backend server allows PATCH requests from your frontend origin.
        </div>
      )}

      {/* Filters and Search */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                <FaSearch className="me-2" /> Search Requests
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by mentee name or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                <FaFilter className="me-2" /> Filter by Status
              </label>
              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-5">
          <FaEnvelope size={48} className="text-muted mb-3" />
          <h4>No requests found</h4>
          <p className="text-muted">
            {searchTerm || filter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'You don\'t have any mentorship requests yet'}
          </p>
        </div>
      ) : (
        <div className="row">
          {filteredRequests.map((request) => (
            <div key={request._id} className="col-12 mb-4">
              <div className={`card h-100 shadow-sm border-${request.status === 'pending' ? 'primary' : 'light'}`}>
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    {getStatusBadge(request.status)}
                    <small className="text-muted ms-2">
                      {getTimeAgo(request.createdAt)}
                    </small>
                  </div>
                  {request.respondedAt && (
                    <small className="text-muted">
                      Responded: {new Date(request.respondedAt).toLocaleDateString()}
                    </small>
                  )}
                </div>
                
                <div className="card-body">
                  <div className="d-flex align-items-start mb-3">
                    <div className="flex-shrink-0">
                      {request.mentee?.avatar ? (
                        <img
                          src={request.mentee.avatar}
                          alt={request.mentee.name}
                          className="rounded-circle me-3"
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                          style={{ width: '50px', height: '50px' }}>
                          <FaUser className="text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{request.mentee?.name || 'Unknown User'}</h6>
                      <small className="text-muted">Mentee</small>
                      {request.mentee?.email && (
                        <div className="mt-1">
                          <small className="text-muted">{request.mentee.email}</small>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="text-primary">Message:</h6>
                    <p className="mb-0">{request.message || 'No message provided'}</p>
                  </div>

                  {(request.goals || request.expectedOutcome) && (
                    <div className="row">
                      {request.goals && (
                        <div className="col-md-6 mb-3">
                          <h6 className="text-primary">Goals:</h6>
                          <p className="mb-0">{request.goals}</p>
                        </div>
                      )}
                      {request.expectedOutcome && (
                        <div className="col-md-6 mb-3">
                          <h6 className="text-primary">Expected Outcome:</h6>
                          <p className="mb-0">{request.expectedOutcome}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="card-footer bg-transparent">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusUpdate(request._id, 'accepted')}
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <div className="spinner-border spinner-border-sm me-1" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaCheck className="me-1" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleStatusUpdate(request._id, 'rejected')}
                        disabled={updating}
                      >
                        <FaTimes className="me-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MentorRequests;

