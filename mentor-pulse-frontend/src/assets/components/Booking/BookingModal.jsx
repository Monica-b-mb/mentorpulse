// src/assets/components/Booking/BookingModal.jsx
import React, { useState, useEffect , useMemo} from 'react';
import { 
  FaCalendar, FaClock, FaVideo, FaTimes, FaMoneyBillWave, 
  FaInfoCircle, FaCalendarCheck, FaSpinner, FaCheckCircle,
  FaUserTie, FaStar, FaMapMarkerAlt, FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const BookingModal = ({ isOpen, onClose, mentor, sessionType: propSessionType, onBookingSuccess }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1); // 1: Date selection, 2: Time selection, 3: Confirmation

  // Set default sessionType
   const sessionType = useMemo(() => {
  return propSessionType || {
    type: 'One-on-One',
    price: 0,
    duration: 60,
    isGroup: false
  };
}, [propSessionType]);


  useEffect(() => {
    if (isOpen) {
      setSelectedDate('');
      setAvailableSlots([]);
      setSelectedSlot(null);
      setNotes('');
      setStep(1);
    }
  }, [isOpen, mentor, sessionType]);

  const fetchAvailableSlots = async (date) => {
    if (!date || !mentor) return;
    
    setLoadingSlots(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://mentorpulse.onrender.com/api/availability/mentor/${mentor._id}?date=${date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAvailableSlots(response.data.availableSlots || []);
        if (response.data.availableSlots.length > 0) {
          setStep(2); // Move to time selection
        } else {
          toast.info('No available slots for this date. Please choose another date.');
        }
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
      toast.error('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedSlot(null);
    
    if (date) {
      fetchAvailableSlots(date);
    } else {
      setAvailableSlots([]);
      setStep(1);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep(3); // Move to confirmation
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2); // Back to time selection
      setSelectedSlot(null);
    } else if (step === 2) {
      setStep(1); // Back to date selection
      setSelectedDate('');
      setAvailableSlots([]);
    }
  };

  const handleBooking = async () => {
  if (!selectedDate || !selectedSlot || !mentor) return;
  
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Check if user is authenticated
    if (!userData._id) {
      throw new Error('Please log in to book a session');
    }

    // Prepare payload with menteeId (REQUIRED by your backend)
    const payload = {
      mentorId: mentor._id,
      menteeId: userData._id, // ✅ ADD THIS LINE - REQUIRED by your model
      sessionDate: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      sessionType: sessionType.type,
      price: sessionType.price,
      duration: sessionType.duration,
      notes: notes
      // ✅ Don't send status - let backend use default 'upcoming'
    };

    console.log('📤 Booking payload:', payload);

    const response = await axios.post(
      'https://mentorpulse.onrender.com/api/sessions/book',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      toast.success('🎉 Session booked successfully!');
      
      if (onBookingSuccess) {
        onBookingSuccess();
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      toast.error(response.data.message || 'Failed to book session');
    }
  } catch (error) {
    console.error('Error booking session:', error);
    
    // Better error handling
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.errors?.join(', ') || 
                        error.message || 
                        'Error booking session';
    
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.mentorInfo}>
              <div style={styles.avatar}>
                {mentor?.profileImage ? (
                  <img 
                    src={mentor.profileImage} 
                    alt={mentor.name}
                    style={styles.avatarImage}
                  />
                ) : (
                  <FaUserTie style={styles.avatarIcon} />
                )}
              </div>
              <div style={styles.mentorDetails}>
                <h2 style={styles.mentorName}>{mentor?.name}</h2>
                <div style={styles.mentorMeta}>
                  <span style={styles.rating}>
                    <FaStar style={styles.starIcon} />
                    4.8 • 24 Sessions
                  </span>
                  <span style={styles.expertise}>
                    <FaMapMarkerAlt style={styles.locationIcon} />
                    {mentor?.skills?.[0] || 'Software Development'}
                  </span>
                </div>
              </div>
            </div>
            <button style={styles.closeButton} onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div style={styles.progressContainer}>
          <div style={styles.progressSteps}>
            <div style={{...styles.progressStep, ...(step >= 1 ? styles.progressStepActive : {})}}>
              <div style={{...styles.stepNumber, ...(step >= 1 ? styles.progressStepActiveStepNumber : {})}}>1</div>
              <span style={styles.stepLabel}>Choose Date</span>
            </div>
            <div style={styles.progressLine}></div>
            <div style={{...styles.progressStep, ...(step >= 2 ? styles.progressStepActive : {})}}>
              <div style={{...styles.stepNumber, ...(step >= 2 ? styles.progressStepActiveStepNumber : {})}}>2</div>
              <span style={styles.stepLabel}>Select Time</span>
            </div>
            <div style={styles.progressLine}></div>
            <div style={{...styles.progressStep, ...(step >= 3 ? styles.progressStepActive : {})}}>
              <div style={{...styles.stepNumber, ...(step >= 3 ? styles.progressStepActiveStepNumber : {})}}>3</div>
              <span style={styles.stepLabel}>Confirm</span>
            </div>
          </div>
        </div>

        <div style={styles.body}>
          {/* Session Info Card */}
          <div style={styles.sessionCard}>
            <div style={styles.sessionHeader}>
              <h3 style={styles.sessionTitle}>{sessionType.type} Session</h3>
              <div style={styles.sessionPrice}>${sessionType.price}</div>
            </div>
            <div style={styles.sessionDetails}>
              <div style={styles.detailItem}>
                <FaClock style={styles.detailIcon} />
                <span>{sessionType.duration} minutes</span>
              </div>
              <div style={styles.detailItem}>
                <FaVideo style={styles.detailIcon} />
                <span>{sessionType.isGroup ? 'Group Session' : 'One-on-One'}</span>
              </div>
              <div style={styles.detailItem}>
                <FaMoneyBillWave style={styles.detailIcon} />
                <span>Secure payment</span>
              </div>
            </div>
          </div>

          {/* Step 1: Date Selection */}
          {step === 1 && (
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Select a Date</h3>
              <p style={styles.stepDescription}>
                Choose a date for your session with {mentor?.name}
              </p>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FaCalendar style={styles.labelIcon} />
                  Session Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  style={styles.dateInput}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {loadingSlots && (
                <div style={styles.loadingContainer}>
                  <FaSpinner style={styles.spinner} />
                  <p>Loading available times...</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Time Selection */}
          {step === 2 && (
            <div style={styles.stepContent}>
              <div style={styles.stepHeader}>
                <button style={styles.backButtonSmall} onClick={handleBack}>
                  <FaArrowLeft />
                </button>
                <div>
                  <h3 style={styles.stepTitle}>Select a Time Slot</h3>
                  <p style={styles.stepDescription}>
                    Available times on {formatDate(selectedDate)}
                  </p>
                </div>
              </div>
              
              {loadingSlots ? (
                <div style={styles.loadingContainer}>
                  <FaSpinner style={styles.spinner} />
                  <p>Loading available times...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div style={styles.noSlots}>
                  <FaClock style={styles.noSlotsIcon} />
                  <h4>No available slots</h4>
                  <p>Please choose another date</p>
                  <button style={styles.chooseDateButton} onClick={handleBack}>
                    Choose Different Date
                  </button>
                </div>
              ) : (
                <div style={styles.timeGrid}>
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      style={{
                        ...styles.timeSlot,
                        ...(selectedSlot === slot ? styles.timeSlotSelected : {})
                      }}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <span style={styles.timeText}>
                        {slot.startTime} - {slot.endTime}
                      </span>
                      {selectedSlot === slot && (
                        <FaCheckCircle style={styles.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div style={styles.stepContent}>
              <div style={styles.stepHeader}>
                <button style={styles.backButtonSmall} onClick={handleBack}>
                  <FaArrowLeft />
                </button>
                <div>
                  <h3 style={styles.stepTitle}>Confirm Your Booking</h3>
                  <p style={styles.stepDescription}>
                    Review your session details
                  </p>
                </div>
              </div>
              
              <div style={styles.confirmationCard}>
                <div style={styles.confirmationItem}>
                  <span style={styles.confirmationLabel}>Date:</span>
                  <span style={styles.confirmationValue}>{formatDate(selectedDate)}</span>
                </div>
                <div style={styles.confirmationItem}>
                  <span style={styles.confirmationLabel}>Time:</span>
                  <span style={styles.confirmationValue}>
                    {selectedSlot.startTime} - {selectedSlot.endTime}
                  </span>
                </div>
                <div style={styles.confirmationItem}>
                  <span style={styles.confirmationLabel}>Duration:</span>
                  <span style={styles.confirmationValue}>{sessionType.duration} minutes</span>
                </div>
                <div style={styles.confirmationItem}>
                  <span style={styles.confirmationLabel}>Total:</span>
                  <span style={styles.confirmationPrice}>${sessionType.price}</span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FaInfoCircle style={styles.labelIcon} />
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What would you like to focus on during this session?"
                  rows="3"
                  style={styles.textarea}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          {step > 1 && (
            <button style={styles.backButton} onClick={handleBack}>
              <FaArrowLeft style={styles.backButtonIcon} />
              Back
            </button>
          )}
          
          <div style={styles.footerActions}>
            <button style={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              style={{
                ...styles.bookButton,
                ...((step !== 3 || loading) ? styles.bookButtonDisabled : {})
              }}
              onClick={handleBooking}
              disabled={step !== 3 || loading}
            >
              {loading ? (
                <>
                  <FaSpinner style={styles.spinner} />
                  Booking...
                </>
              ) : (
                <>
                  <FaCalendarCheck />
                  Confirm Booking • ${sessionType.price}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(5px)'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '25px',
    color: 'white'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  mentorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  avatarIcon: {
    fontSize: '24px',
    color: 'white'
  },
  mentorDetails: {
    flex: 1
  },
  mentorName: {
    margin: '0 0 5px 0',
    fontSize: '1.4rem',
    fontWeight: '600'
  },
  mentorMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    fontSize: '0.9rem',
    opacity: 0.9
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  expertise: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  starIcon: {
    fontSize: '12px',
    color: '#FFD700'
  },
  locationIcon: {
    fontSize: '12px'
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1.1rem',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.3)',
      transform: 'rotate(90deg)'
    }
  },
  progressContainer: {
    padding: '20px 25px 0',
    backgroundColor: '#f8f9fa'
  },
  progressSteps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: '#6c757d'
  },
  progressStepActive: {
    color: '#667eea'
  },
  stepNumber: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease'
  },
  progressStepActiveStepNumber: {
    backgroundColor: '#667eea',
    color: 'white'
  },
  stepLabel: {
    fontSize: '12px',
    fontWeight: '500'
  },
  progressLine: {
    flex: 1,
    height: '2px',
    backgroundColor: '#e9ecef',
    margin: '0 10px'
  },
  body: {
    padding: '25px',
    flex: 1,
    overflowY: 'auto'
  },
  sessionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '25px',
    border: '1px solid #e9ecef'
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  sessionTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2c3e50'
  },
  sessionPrice: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#27ae60'
  },
  sessionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#6c757d',
    fontSize: '14px'
  },
  detailIcon: {
    color: '#667eea',
    width: '14px'
  },
  stepContent: {
    animation: 'fadeIn 0.3s ease-in'
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    marginBottom: '20px'
  },
  backButtonSmall: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  stepTitle: {
    margin: '0 0 8px 0',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2c3e50'
  },
  stepDescription: {
    margin: '0 0 20px 0',
    color: '#6c757d',
    fontSize: '14px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    color: '#2c3e50',
    fontSize: '14px',
    marginBottom: '8px'
  },
  labelIcon: {
    color: '#667eea',
    width: '14px'
  },
  dateInput: {
    width: '100%',
    padding: '15px',
    border: '2px solid #e9ecef',
    borderRadius: '10px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
    ':focus': {
      outline: 'none',
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    }
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#6c757d'
  },
  noSlots: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6c757d'
  },
  noSlotsIcon: {
    fontSize: '2rem',
    marginBottom: '15px',
    color: '#dee2e6'
  },
  chooseDateButton: {
    padding: '10px 20px',
    border: '2px solid #667eea',
    background: 'transparent',
    color: '#667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    marginTop: '15px',
    ':hover': {
      backgroundColor: '#667eea',
      color: 'white'
    }
  },
  timeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px',
    marginBottom: '20px'
  },
  timeSlot: {
    padding: '15px 10px',
    border: '2px solid #e9ecef',
    background: 'white',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    ':hover': {
      borderColor: '#667eea',
      backgroundColor: '#f8f9ff'
    }
  },
  timeSlotSelected: {
    borderColor: '#27ae60',
    backgroundColor: '#e8f5e8',
    color: '#27ae60',
    transform: 'scale(1.05)'
  },
  timeText: {
    fontWeight: '600'
  },
  checkIcon: {
    fontSize: '14px'
  },
  confirmationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #e9ecef'
  },
  confirmationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #e9ecef',
    ':last-child': {
      borderBottom: 'none'
    }
  },
  confirmationLabel: {
    fontWeight: '500',
    color: '#6c757d'
  },
  confirmationValue: {
    fontWeight: '600',
    color: '#2c3e50'
  },
  confirmationPrice: {
    fontWeight: '700',
    fontSize: '1.1rem',
    color: '#27ae60'
  },
  textarea: {
    width: '100%',
    padding: '15px',
    border: '2px solid #e9ecef',
    borderRadius: '10px',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '100px',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
    ':focus': {
      outline: 'none',
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    }
  },
  footer: {
    padding: '25px',
    borderTop: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: {
    padding: '12px 20px',
    border: '2px solid #6c757d',
    background: 'transparent',
    color: '#6c757d',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: '#6c757d',
      color: 'white'
    }
  },
  backButtonIcon: {
    fontSize: '14px'
  },
  footerActions: {
    display: 'flex',
    gap: '12px'
  },
  cancelButton: {
    padding: '12px 20px',
    border: '2px solid #6c757d',
    background: 'transparent',
    color: '#6c757d',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: '#6c757d',
      color: 'white'
    }
  },
  bookButton: {
    padding: '15px 25px',
    border: 'none',
    background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
    color: 'white',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(39, 174, 96, 0.4)'
    }
  },
  bookButtonDisabled: {
    background: '#bdc3c7',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
    ':hover': {
      transform: 'none',
      boxShadow: 'none'
    }
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  }
};

// Add these global styles
const globalStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Add to your component
const StyleInjector = () => (
  <style>{globalStyles}</style>
);

export default BookingModal;

