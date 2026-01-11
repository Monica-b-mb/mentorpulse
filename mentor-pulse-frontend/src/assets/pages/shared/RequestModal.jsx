import React, { useState, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaLightbulb, FaUser, FaGraduationCap, FaBullseye } from 'react-icons/fa';
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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        document.querySelector('.request-form textarea')?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.message.trim()) {
      newErrors.message = 'Please introduce yourself and explain why you want mentorship';
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Your message should be at least 20 characters to make a good impression';
    }
    if (formData.goals.length > 500) {
      newErrors.goals = 'Goals should be less than 500 characters';
    }
    if (formData.expectedOutcome.length > 200) {
      newErrors.expectedOutcome = 'Expected outcome should be less than 200 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await mentorshipService.sendRequest(mentor._id, formData);
      toast.success(`Request sent to ${mentor.name}!`);
      onSuccess();
      onClose();
      setFormData({ message: '', goals: '', expectedOutcome: '' });
    } catch (error) {
      console.error('Request error:', error);
      toast.error(error.message || 'Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getCharacterCount = (text, max) => `${text.length}/${max} characters`;

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 rounded-4 shadow">
          <div className="modal-header px-4 pt-4">
            <h5 className="modal-title d-flex align-items-center">
              <FaPaperPlane className="me-2 text-primary" />
              Request Mentorship
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <div className="modal-body px-4">
            {/* Mentor Info */}
            <div className="card border-start border-primary mb-4 p-3">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <img
                    src={mentor.avatar || '/default-avatar.png'}
                    alt={mentor.name}
                    className="rounded-circle border shadow-sm"
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = '/default-avatar.png'; }}
                  />
                </div>
                <div>
                  <h5 className="mb-1">{mentor.name}</h5>
                  <p className="text-muted mb-1">{mentor.designation}</p>
                  {mentor.company && <p className="text-muted small mb-0"><FaUser className="me-1" />{mentor.company}</p>}
                  {mentor.experience && <p className="text-muted small mb-0"><FaGraduationCap className="me-1" />{mentor.experience} of experience</p>}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="request-form">
              {/* Message */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  <FaLightbulb className="me-2 text-warning" />
                  Your Introduction Message *
                </label>
                <textarea
                  className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                  rows={5}
                  placeholder="Introduce yourself, explain why you want mentorship, and what you hope to achieve."
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  disabled={loading}
                />
                <div className="form-text d-flex justify-content-between">
                  <span>Minimum 20 characters recommended</span>
                  <span className={formData.message.length > 300 ? 'text-warning' : ''}>
                    {getCharacterCount(formData.message, 1000)}
                  </span>
                </div>
                {errors.message && <div className="invalid-feedback d-block">{errors.message}</div>}
              </div>

              {/* Goals */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  <FaBullseye className="me-2 text-info" />
                  Learning Goals <span className="text-muted fw-normal">(Optional)</span>
                </label>
                <textarea
                  className={`form-control ${errors.goals ? 'is-invalid' : ''}`}
                  rows={3}
                  placeholder="What specific skills or areas would you like to focus on?"
                  value={formData.goals}
                  onChange={(e) => handleChange('goals', e.target.value)}
                  disabled={loading}
                />
                <div className="form-text d-flex justify-content-between">
                  <span>Be specific about what you want to learn</span>
                  <span className={formData.goals.length > 400 ? 'text-warning' : ''}>
                    {getCharacterCount(formData.goals, 500)}
                  </span>
                </div>
                {errors.goals && <div className="invalid-feedback d-block">{errors.goals}</div>}
              </div>

              {/* Expected Outcome */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  <FaGraduationCap className="me-2 text-success" />
                  Expected Outcome <span className="text-muted fw-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.expectedOutcome ? 'is-invalid' : ''}`}
                  placeholder="What do you hope to achieve? (e.g., career transition)"
                  value={formData.expectedOutcome}
                  onChange={(e) => handleChange('expectedOutcome', e.target.value)}
                  disabled={loading}
                />
                <div className="form-text d-flex justify-content-between">
                  <span>Define your success criteria</span>
                  <span className={formData.expectedOutcome.length > 150 ? 'text-warning' : ''}>
                    {getCharacterCount(formData.expectedOutcome, 200)}
                  </span>
                </div>
                {errors.expectedOutcome && <div className="invalid-feedback d-block">{errors.expectedOutcome}</div>}
              </div>

              {/* Actions */}
              <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary d-flex align-items-center" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
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
      </div>
    </div>
  );
};

export default RequestModal;
