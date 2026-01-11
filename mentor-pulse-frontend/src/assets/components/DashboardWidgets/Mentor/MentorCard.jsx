import React, { useState, useEffect } from 'react';
import { 
  FaStar, FaClock, FaMapMarkerAlt, FaBookOpen, FaUserCheck, 
  FaUser, FaPaperPlane, FaVideo, FaCheckCircle, FaUserTimes,
  FaSpinner
} from 'react-icons/fa';
import RequestModal from '../../Mentorship/RequestModal';
import BookingModal from '../../Booking/BookingModal';
import ProfileView from '../../Profile/ProfileView';
import { mentorshipService } from '../../../services/mentorshipService';

const MentorCard = ({ mentor }) => {  // Removed onBookSession prop
  const [imageError, setImageError] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // SAFE DATA EXTRACTION WITH DEFAULTS
  const {
    _id = '',
    name = 'Mentor Name',
    designation = 'Professional Mentor',
    company = '',
    rating = 4.5,
    reviews = 0,
    skills = [],
    hourlyRate = 50,
    availability = 'available',
    avatar = '',
    experience = '',
  } = mentor || {};

  // Check connection status when component mounts or mentor changes
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!_id) {
        setLoadingStatus(false);
        return;
      }

      try {
        setLoadingStatus(true);
        const requests = await mentorshipService.getMenteeRequests();
        const existingRequest = requests.requests?.find(
          req => req.mentor._id === _id && ['pending', 'accepted'].includes(req.status)
        );
        
        if (existingRequest) {
          setConnectionStatus(existingRequest.status);
        } else {
          setConnectionStatus(null);
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
        setConnectionStatus(null);
      } finally {
        setLoadingStatus(false);
      }
    };

    checkConnectionStatus();
  }, [_id]);

  const handleImageError = () => {
    setImageError(true);
  };

  const getAvailabilityText = (status) => {
    switch (status) {
      case 'available': return 'Available Now';
      case 'busy': return 'Busy';
      case 'away': return 'Away';
      default: return 'Available Now';
    }
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'busy': return 'danger';
      case 'away': return 'warning';
      default: return 'secondary';
    }
  };

  // Render star ratings
  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <FaStar
        key={star}
        className={star <= Math.floor(rating) ? 'text-warning' : 'text-muted'}
        size={14}
      />
    ));
  };

  const handleRequestClick = () => {
    console.log('🎯 Requesting mentorship from:', name);
    setShowRequestModal(true);
  };

  const handleBookSessionClick = () => {
    console.log('🎯 Booking session with:', name);
    setShowBookingModal(true);
  };

  const handleViewProfile = () => {
    console.log('👤 Viewing profile of:', name);
    setShowProfileModal(true);
  };

  const getConnectionStatusBadge = () => {
    if (loadingStatus) {
      return (
        <span className="badge bg-secondary">
          <FaSpinner className="spinner me-1" />
          Checking...
        </span>
      );
    }

    if (connectionStatus === 'accepted') {
      return (
        <span className="badge bg-success">
          <FaCheckCircle className="me-1" />
          Connected
        </span>
      );
    }

    if (connectionStatus === 'pending') {
      return (
        <span className="badge bg-warning text-dark">
          <FaClock className="me-1" />
          Request Pending
        </span>
      );
    }

    return null;
  };

  return (
    <>
      <div className="card mentor-card h-100 border-0 shadow-sm">
        <div className="card-body">
          {/* Connection Status Badge */}
          {getConnectionStatusBadge() && (
            <div className="mb-3">
              {getConnectionStatusBadge()}
            </div>
          )}

          {/* Header */}
          <div className="d-flex align-items-start mb-3">
            <div className="position-relative">
              {imageError || !avatar ? (
                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                  style={{ width: '60px', height: '60px' }}>
                  <FaUser className="text-muted" size={24} />
                </div>
              ) : (
                <img
                  src={avatar}
                  alt={name}
                  className="rounded-circle"
                  style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                  onError={handleImageError}
                />
              )}
              <span className={`position-absolute bottom-0 end-0 badge bg-${getAvailabilityColor(availability)} rounded-circle p-1`}></span>
            </div>
            <div className="ms-3 flex-grow-1">
              <h6 className="mb-1 fw-bold">{name}</h6>
              <p className="text-muted mb-1 small">{designation}</p>
              {company && <p className="text-muted mb-0 small">{company}</p>}
            </div>
          </div>

          {/* Rating */}
          <div className="d-flex align-items-center mb-3">
            <div className="text-warning">
              {renderStars(rating)}
            </div>
            <span className="ms-2 small text-muted">
              {rating} ({reviews} reviews)
            </span>
          </div>

          {/* Skills */}
          {skills && skills.length > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-1">
                {skills.slice(0, 4).map((skill, index) => (
                  <span key={index} className="badge bg-light text-dark border small">
                    {skill}
                  </span>
                ))}
                {skills.length > 4 && (
                  <span className="badge bg-light text-dark border small">
                    +{skills.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center small text-muted mb-2">
              <span><FaClock className="me-1" />{getAvailabilityText(availability)}</span>
              <span><FaMapMarkerAlt className="me-1" /> Remote</span>
            </div>
            {experience && (
              <div className="small text-muted mb-2">
                Exp: {experience}
              </div>
            )}
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold text-primary">${hourlyRate}/hr</span>
              <span className={`badge bg-${getAvailabilityColor(availability)}`}>
                {getAvailabilityText(availability)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="d-grid gap-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleBookSessionClick}
              disabled={availability !== 'available' || connectionStatus !== 'accepted'}
              title={connectionStatus !== 'accepted' ? 'You need to be connected to book sessions' : ''}
            >
              <FaVideo className="me-1" />
              {connectionStatus === 'accepted' ? 'Book Session' : 'Connect to Book'}
            </button>
            
            {!connectionStatus ? (
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={handleRequestClick}
              >
                <FaPaperPlane className="me-1" /> Request Mentorship
              </button>
            ) : connectionStatus === 'accepted' ? (
              <button className="btn btn-outline-success btn-sm" disabled>
                <FaUserCheck className="me-1" /> Already Connected
              </button>
            ) : (
              <button className="btn btn-outline-warning btn-sm" disabled>
                <FaClock className="me-1" /> Request Pending
              </button>
            )}
            
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={handleViewProfile}
            >
              <FaUserCheck className="me-1" /> View Profile
            </button>
          </div>
        </div>
      </div>

      {/* Mentorship Request Modal */}
      <RequestModal
        mentor={mentor}
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {
          console.log('✅ Request sent successfully!');
          setConnectionStatus('pending');
          setShowRequestModal(false);
        }}
      />

      {/* Booking Modal - ONLY SHOW IF CONNECTED */}
      {connectionStatus === 'accepted' && (
        <BookingModal
          mentor={mentor}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
        />
      )}

      {/* Profile View Modal */}
      <ProfileView
        mentorId={mentor._id}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
};

export default MentorCard;
