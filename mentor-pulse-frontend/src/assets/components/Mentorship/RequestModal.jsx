import React, { useState, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaLightbulb, FaUser, FaGraduationCap, FaBullseye, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { mentorshipService } from '../../services/mentorshipService';

const RequestModal = ({ mentor, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    message: '',
    goals: '',
    expectedOutcome: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [existingStatus, setExistingStatus] = useState(null);

  // Check for existing mentorship status when modal opens
  useEffect(() => {
    const checkExistingMentorship = async () => {
      if (isOpen && mentor) {
        try {
          const requests = await mentorshipService.getMenteeRequests();
          const existingRequest = requests.requests?.find(
            req => req.mentor._id === mentor._id && 
                   ['pending', 'accepted'].includes(req.status)
          );
          
          if (existingRequest) {
            setExistingStatus(existingRequest.status);
          } else {
            setExistingStatus(null);
          }
        } catch (error) {
          console.error('Error checking existing mentorship:', error);
        }
      }
    };

    checkExistingMentorship();
  }, [isOpen, mentor]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ message: '', goals: '', expectedOutcome: '' });
      setErrors({});
      setServerError('');
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.message.trim()) {
      newErrors.message = 'Please introduce yourself and explain why you want mentorship';
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Your message should be at least 20 characters to make a good impression';
    }
    
    if (formData.goals && formData.goals.length > 500) {
      newErrors.goals = 'Goals should be less than 500 characters';
    }
    
    if (formData.expectedOutcome && formData.expectedOutcome.length > 200) {
      newErrors.expectedOutcome = 'Expected outcome should be less than 200 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('Sending request to mentor:', mentor._id, formData);
      await mentorshipService.sendRequest(mentor._id, formData);
      toast.success('Mentorship request sent successfully! 🎉');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Request error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send request. Please try again.';
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const getCharacterCount = (text, max) => {
    return `${text.length}/${max} characters`;
  };

  if (!isOpen) return null;

  // If already connected, show status message
  if (existingStatus) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content professional-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">
              <FaPaperPlane className="me-2 text-primary" />
              Mentorship Status
            </h3>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          
          <div className="modal-body text-center py-4">
            <FaCheckCircle size={48} className="text-success mb-3" />
            <h4>
              {existingStatus === 'accepted' 
                ? 'Already Connected' 
                : 'Request Pending'}
            </h4>
            <p className="text-muted">
              {existingStatus === 'accepted'
                ? `You are already connected with ${mentor.name}. You can start booking sessions now!`
                : `You already have a pending mentorship request with ${mentor.name}. Please wait for their response.`
              }
            </p>
            <button className="btn btn-primary mt-3" onClick={onClose}>
              Okay
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content professional-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <FaPaperPlane className="me-2 text-primary" />
            Request Mentorship
          </h3>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Server Error Display */}
          {serverError && (
            <div className="alert alert-danger d-flex align-items-center">
              <FaExclamationTriangle className="me-2 flex-shrink-0" />
              <div>{serverError}</div>
            </div>
          )}

          {/* Mentor Information */}
          <div className="mentor-card bg-light p-3 rounded mb-4">
            <div className="d-flex align-items-center">
              <div className="mentor-avatar-container me-3">
                <img
                  src={mentor.avatar || '/default-avatar.png'}
                  alt={mentor.name}
                  className="mentor-avatar"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
              </div>
              <div>
                <h5 className="mb-1">{mentor.name}</h5>
                <p className="text-muted mb-1">{mentor.designation}</p>
                {mentor.company && (
                  <p className="text-muted small mb-0">
                    <FaUser className="me-1" />
                    {mentor.company}
                  </p>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="request-form">
            {/* Message Field */}
            <div className="form-group mb-4">
              <label className="form-label fw-semibold">
                <FaLightbulb className="me-2 text-warning" />
                Your Introduction Message *
              </label>
              <textarea
                placeholder="Introduce yourself, explain why you want mentorship from this mentor, and what you hope to achieve..."
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                rows={4}
                className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                disabled={loading}
              />
              <div className="d-flex justify-content-between mt-1">
                <small className="text-muted">
                  Minimum 20 characters recommended
                </small>
                <small className={formData.message.length > 300 ? 'text-warning' : 'text-muted'}>
                  {getCharacterCount(formData.message, 1000)}
                </small>
              </div>
              {errors.message && (
                <div className="invalid-feedback d-block">{errors.message}</div>
              )}
            </div>

            {/* Goals Field */}
            <div className="form-group mb-4">
              <label className="form-label fw-semibold">
                <FaBullseye className="me-2 text-info" />
                Learning Goals
                <span className="text-muted fw-normal"> (Optional)</span>
              </label>
              <textarea
                placeholder="What specific skills or knowledge would you like to focus on?"
                value={formData.goals}
                onChange={(e) => handleChange('goals', e.target.value)}
                rows={2}
                className={`form-control ${errors.goals ? 'is-invalid' : ''}`}
                disabled={loading}
              />
              <div className="d-flex justify-content-between mt-1">
                <small className="text-muted">
                  Be specific about what you want to learn
                </small>
                <small className={formData.goals.length > 400 ? 'text-warning' : 'text-muted'}>
                  {getCharacterCount(formData.goals, 500)}
                </small>
              </div>
              {errors.goals && (
                <div className="invalid-feedback d-block">{errors.goals}</div>
              )}
            </div>

            {/* Expected Outcome Field */}
            <div className="form-group mb-4">
              <label className="form-label fw-semibold">
                <FaGraduationCap className="me-2 text-success" />
                Expected Outcome
                <span className="text-muted fw-normal"> (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="What do you hope to achieve through this mentorship?"
                value={formData.expectedOutcome}
                onChange={(e) => handleChange('expectedOutcome', e.target.value)}
                className={`form-control ${errors.expectedOutcome ? 'is-invalid' : ''}`}
                disabled={loading}
              />
              <div className="d-flex justify-content-between mt-1">
                <small className="text-muted">
                  Define your success criteria
                </small>
                <small className={formData.expectedOutcome.length > 150 ? 'text-warning' : 'text-muted'}>
                  {getCharacterCount(formData.expectedOutcome, 200)}
                </small>
              </div>
              {errors.expectedOutcome && (
                <div className="invalid-feedback d-block">{errors.expectedOutcome}</div>
              )}
            </div>

            {/* Form Actions */}
            <div className="modal-actions d-flex gap-2 justify-content-end pt-3 border-top">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary d-flex align-items-center"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </span>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="me-2" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1060;
          padding: 1rem;
        }
        
        .professional-modal {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          border: none;
        }
        
        .modal-header {
          padding: 1.5rem 1.5rem 0;
          border-bottom: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-title {
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
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
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .mentor-card {
          border-left: 4px solid #4e73df;
        }
        
        .mentor-avatar-container {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
        }
        
        .mentor-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .form-label {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }
        
        .form-control {
          border: 1px solid #dce4ec;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }
        
        .form-control:focus {
          border-color: #4e73df;
          box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.15);
        }
        
        .form-control.is-invalid {
          border-color: #e74a3b;
        }
        
        .invalid-feedback {
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }
        
        .modal-actions {
          margin-top: 1.5rem;
        }
        
        .btn {
          padding: 0.5rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #4e73df 0%, #3a56c5 100%);
          border: none;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(78, 115, 223, 0.3);
        }
        
        .btn-outline-secondary:hover:not(:disabled) {
          background-color: #f8f9fa;
        }
        
        @media (max-width: 576px) {
          .professional-modal {
            margin: 0.5rem;
            max-height: 95vh;
          }
          
          .modal-header, .modal-body {
            padding: 1rem;
          }
          
          .modal-actions {
            flex-direction: column;
          }
          
          .modal-actions .btn {
            width: 100%;
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RequestModal;