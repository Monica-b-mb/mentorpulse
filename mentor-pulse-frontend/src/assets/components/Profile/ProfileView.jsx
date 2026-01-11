import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaBriefcase, FaMapMarkerAlt, FaGlobe, 
  FaGraduationCap, FaStar, FaClock, FaMoneyBillWave, FaUsers,
  FaPaperPlane, FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import RequestModal from '../Mentorship/RequestModal';

const ProfileView = ({ mentorId, isOpen, onClose }) => {
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageRating: 0,
    responseRate: 0
  });
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (isOpen && mentorId && !mentor) {
      fetchMentorProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mentorId]);

  const fetchMentorProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://mentorpulse.onrender.com/api/mentors/${mentorId}`);
      const mentorData = response.data;
      setMentor(mentorData);
      setStats(mentorData.stats || {
        totalSessions: 0,
        averageRating: 0,
        responseRate: 0
      });
    } catch (error) {
      console.error('Error fetching mentor profile:', error);
      toast.error('Failed to load mentor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMentorship = () => {
    setShowRequestModal(true);
  };

  // Keep modal mounted, just hide/show
  return (
    <>
      <div 
        className={`modal-overlay ${isOpen ? 'show' : 'hide'}`} 
        onClick={(e) => {
          if (e.target.classList.contains('modal-overlay')) onClose();
        }}
      >
        <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Mentor Profile</h3>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading profile...</p>
              </div>
            ) : !mentor ? (
              <div className="text-center py-5">
                <p>Mentor not found</p>
                <button className="btn btn-primary" onClick={onClose}>
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Header Section */}
                <div className="profile-header text-center mb-4">
                  <img
                    src={mentor.avatar || '/default-avatar.png'}
                    alt={mentor.name}
                    className="profile-avatar rounded-circle mb-3"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                  <h4>{mentor.name}</h4>
                  <p className="text-muted">{mentor.designation}</p>
                  {mentor.company && <p className="text-primary">{mentor.company}</p>}
                </div>

                {/* Stats Section */}
                <div className="row text-center mb-4">
                  <div className="col-4">
                    <div className="stat-item">
                      <FaUsers className="stat-icon text-primary" />
                      <div className="stat-number">{stats.totalSessions}+</div>
                      <div className="stat-label">Sessions</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="stat-item">
                      <FaStar className="stat-icon text-warning" />
                      <div className="stat-number">{stats.averageRating}/5</div>
                      <div className="stat-label">Rating</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="stat-item">
                      <FaClock className="stat-icon text-info" />
                      <div className="stat-number">{stats.responseRate}%</div>
                      <div className="stat-label">Response</div>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="profile-details">
                  <h5 className="section-title">About</h5>
                  {mentor.bio ? (
                    <p className="bio-text">{mentor.bio}</p>
                  ) : (
                    <p className="text-muted">No bio provided</p>
                  )}

                  <div className="row mt-4">
                    <div className="col-md-6">
                      <h6 className="detail-title">
                        <FaBriefcase className="me-2 text-primary" />
                        Experience
                      </h6>
                      <p>{mentor.experience || 'Not specified'}</p>

                      <h6 className="detail-title">
                        <FaMoneyBillWave className="me-2 text-success" />
                        Hourly Rate
                      </h6>
                      <p>${mentor.hourlyRate}/hour</p>
                    </div>

                    <div className="col-md-6">
                      <h6 className="detail-title">
                        <FaMapMarkerAlt className="me-2 text-info" />
                        Location
                      </h6>
                      <p>{mentor.location || 'Remote'}</p>

                      <h6 className="detail-title">
                        <FaGraduationCap className="me-2 text-warning" />
                        Skills
                      </h6>
                      <div className="skills-container">
                        {mentor.skills?.length > 0 ? (
                          mentor.skills.map((skill, index) => (
                            <span key={index} className="skill-badge">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">No skills listed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {mentor && (
              <button className="btn btn-primary" onClick={handleRequestMentorship}>
                <FaPaperPlane className="me-2" />
                Request Mentorship
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {mentor && (
        <RequestModal
          mentor={mentor}
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            toast.success('Mentorship request sent successfully!');
            setShowRequestModal(false);
          }}
        />
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }
        .modal-overlay.hide { display: none; }
        .profile-modal {
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 8px;
          padding: 1rem;
        }
        .profile-avatar {
          border: 4px solid #fff;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .stat-item { padding: 1rem; }
        .stat-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .stat-number { font-size: 1.25rem; font-weight: 600; color: #2c3e50; }
        .stat-label { font-size: 0.85rem; color: #6c757d; }
        .section-title {
          color: #2c3e50;
          border-bottom: 2px solid #4e73df;
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        .bio-text { line-height: 1.6; color: #495057; }
        .detail-title { color: #2c3e50; margin-bottom: 0.5rem; }
        .skills-container { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .skill-badge {
          background: #e9ecef;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.85rem;
          color: #495057;
        }
        .modal-title {
          color: #2c3e50;
          font-weight: 600;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #6c757d;
          padding: 0.25rem;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover {
          background: #f8f9fa;
          color: #495057;
        }
        
        @media (max-width: 768px) {
          .profile-modal {
            margin: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default ProfileView;
