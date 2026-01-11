import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaCheck, FaTimes, FaClock, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { mentorshipService } from '../services/mentorshipService';

const MentorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await mentorshipService.getMentorRequests();
      setRequests(data.requests || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await mentorshipService.updateRequestStatus(requestId, status);
      toast.success(`Request ${status}`);
      fetchRequests(); // Refresh list
    } catch (error) {
      toast.error(error.message || 'Failed to update request');
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = request.mentee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'warning', text: 'Pending' },
      accepted: { class: 'success', text: 'Accepted' },
      rejected: { class: 'danger', text: 'Rejected' },
      cancelled: { class: 'secondary', text: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`badge bg-${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <FaEnvelope className="me-2" />
              Mentorship Requests
            </h2>
            <span className="badge bg-primary">{requests.length} total</span>
          </div>

          {/* Filters and Search */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaFilter />
                    </span>
                    <select
                      className="form-select"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
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
                <div key={request._id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      {getStatusBadge(request.status)}
                      <small className="text-muted">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <img
                          src={request.mentee?.avatar || '/default-avatar.png'}
                          alt={request.mentee?.name}
                          className="rounded-circle me-3"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                        <div>
                          <h6 className="mb-0">{request.mentee?.name || 'Unknown User'}</h6>
                          <small className="text-muted">Mentee</small>
                        </div>
                      </div>

                      <div className="mb-3">
                        <strong>Message:</strong>
                        <p className="text-muted mb-0 mt-1">{request.message}</p>
                      </div>

                      {request.goals && (
                        <div className="mb-3">
                          <strong>Goals:</strong>
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
                      <div className="card-footer">
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleStatusUpdate(request._id, 'accepted')}
                          >
                            <FaCheck className="me-1" />
                            Accept
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleStatusUpdate(request._id, 'rejected')}
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
        </div>
      </div>
    </div>
  );
};

export default MentorRequests;

