import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Form, Alert, InputGroup } from 'react-bootstrap';
import {
  FaVideo, FaClock, FaCalendar, FaStar, FaTimes, 
  FaMoneyBillWave, FaUserTie, FaUserGraduate, FaBell,
  FaComments, FaExclamationTriangle, FaCheckCircle,
  FaLink, FaEdit, FaGoogle, FaComments as FaChat,
  FaCheck, FaFlagCheckered, FaUserCheck
} from 'react-icons/fa';

const SessionCard = ({
  session,
  onStatusUpdate,
  onAddReview,
  onSendReminder,
  onUpdateMeetLink,
  onInitiateCompletion,
  onApproveSession,
  userRole
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMeetLinkModal, setShowMeetLinkModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [meetLink, setMeetLink] = useState(session.meetLink || '');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [actualDuration, setActualDuration] = useState(session.duration || 60);
  const [completionNotes, setCompletionNotes] = useState('');

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const isMentor = session.mentorId._id === userData._id;
  const otherPerson = isMentor ? session.menteeId : session.mentorId;

  const handleSaveMeetLink = () => {
    if (meetLink.trim()) {
      onUpdateMeetLink(session._id, meetLink.trim());
      setShowMeetLinkModal(false);
    }
  };

  const handleJoinMeeting = () => {
    if (session.meetLink) {
      window.open(session.meetLink, '_blank', 'noopener,noreferrer');
    }
  };

  // FIXED: Changed to hash URL for Vercel SPA compatibility
  const handleStartChat = () => {
    const chatUrl = `/#/chat?sessionId=${session._id}&otherUserId=${otherPerson._id}`;
    window.location.href = chatUrl;
  };

  const handleApproveSession = (approved = true) => {
    onApproveSession(session._id, approved, approvalNotes, actualDuration);
    setShowApproveModal(false);
    setApprovalNotes('');
  };

  const handleInitiateCompletion = () => {
    onInitiateCompletion(session._id, completionNotes);
    setShowCompleteModal(false);
    setCompletionNotes('');
  };

  const formatDate = (isoDateString) => {
    try {
      const date = new Date(isoDateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      case 'upcoming': return 'warning';
      case 'pending_verification': return 'info';
      default: return 'secondary';
    }
  };

  const handleCancel = () => {
    onStatusUpdate(session._id, 'cancelled', cancellationReason);
    setShowCancelModal(false);
    setCancellationReason('');
  };

  const handleReviewSubmit = () => {
    onAddReview(session._id, rating, feedback);
    setShowReviewModal(false);
    setRating(5);
    setFeedback('');
  };

  const getSessionStatusInfo = () => {
    try {
      const sessionEnd = new Date(`${session.sessionDate}T${session.endTime}`);
      const sessionStart = new Date(`${session.sessionDate}T${session.startTime}`);
      const now = new Date();

      if (isNaN(sessionEnd.getTime())) {
        return { isExpired: false, isActive: false, message: 'Invalid date' };
      }

      const isExpired = sessionEnd < now;
      const isActive = sessionStart <= now && sessionEnd >= now;
      
      return {
        isExpired,
        isActive,
        message: isExpired ? 'Session expired' : isActive ? 'Live now' : 'Upcoming'
      };
    } catch {
      return { isExpired: false, isActive: false, message: 'Error' };
    }
  };

  const sessionStatus = getSessionStatusInfo();
  const canJoinMeeting = !sessionStatus.isExpired && 
                         (session.status === 'confirmed' || session.status === 'upcoming') && 
                         session.meetLink;

  const showVerificationSection = session.status === 'pending_verification';
  const showCompleteButton = session.status === 'confirmed' && isMentor && !sessionStatus.isExpired;

  return (
    <>
      <Card className="session-card h-100">
        <Card.Header className="session-card-header">
          <div className="d-flex justify-content-between align-items-start">
            <Badge bg="secondary" className="session-type-badge">
              {session.sessionType}
            </Badge>
            <Badge bg={getStatusVariant(session.status)}>
              {session.status}
            </Badge>
          </div>
        </Card.Header>

        <Card.Body className="session-card-body">
          {sessionStatus.isExpired && (
            <Alert variant="danger" className="py-2">
              <FaExclamationTriangle className="me-2" />
              <strong>Session Expired</strong> - This session has ended
            </Alert>
          )}

          {showVerificationSection && (
            <Alert variant="info" className="py-2">
              <FaUserCheck className="me-2" />
              <strong>Verification Required</strong>
              <div className="mt-1">
                <small>
                  Mentor: {session.mentorApproval?.approved ? '✅ Approved' : '⏳ Pending'} | 
                  Mentee: {session.menteeApproval?.approved ? '✅ Approved' : '⏳ Pending'}
                </small>
              </div>
            </Alert>
          )}

          <div className="session-details">
            <div className="detail-item">
              <FaCalendar className="text-primary" />
              <span>{formatDate(session.sessionDate)}</span>
            </div>
            <div className="detail-item">
              <FaClock className="text-primary" />
              <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
            </div>
            {session.price > 0 && (
              <div className="detail-item">
                <FaMoneyBillWave className="text-primary" />
                <span>₹{session.price}</span>
              </div>
            )}
          </div>

          {session.meetLink ? (
            <Alert variant="success" className="py-2 mt-2">
              <FaGoogle className="me-2" />
              <strong>Meeting Link Ready</strong>
              <div className="mt-1">
                <small className="text-break d-block">{session.meetLink}</small>
                <Button variant="outline-success" size="sm" className="mt-1" onClick={() => setShowMeetLinkModal(true)}>
                  <FaEdit className="me-1" /> Edit Link
                </Button>
              </div>
            </Alert>
          ) : (
            <Alert variant="info" className="py-2 mt-2">
              <FaLink className="me-2" />
              <strong>No Meeting Link Added</strong>
              <Button variant="outline-primary" size="sm" className="mt-1 ms-2" onClick={() => setShowMeetLinkModal(true)}>
                Add Meeting Link
              </Button>
            </Alert>
          )}

          <div className="user-info mt-3">
            <div className="d-flex align-items-center">
              <div className="user-avatar">
                {otherPerson?.profileImage ? (
                  <img
                    src={otherPerson.profileImage}
                    alt={otherPerson.name}
                    className="rounded-circle"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {isMentor ? <FaUserGraduate /> : <FaUserTie />}
                  </div>
                )}
              </div>
              <div className="user-details ms-3">
                <h6 className="mb-0">{otherPerson?.name || 'Unknown User'}</h6>
                <small className="text-muted">{isMentor ? 'Mentee' : 'Mentor'}</small>
              </div>
            </div>
          </div>

          {session.notes && (
            <div className="session-notes mt-2">
              <FaComments className="text-muted me-2" />
              <small>{session.notes}</small>
            </div>
          )}
        </Card.Body>

        <Card.Footer className="session-card-footer">
          {showVerificationSection && (
            <div className="verification-buttons mb-3">
              <div className="d-flex gap-2">
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={() => setShowApproveModal(true)}
                  disabled={isMentor ? session.mentorApproval?.approved : session.menteeApproval?.approved}
                >
                  <FaCheck className="me-1" />
                  {isMentor ? session.mentorApproval?.approved ? 'Approved' : 'Approve' : session.menteeApproval?.approved ? 'Approved' : 'Approve'}
                </Button>
                
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => handleApproveSession(false)}
                >
                  <FaTimes className="me-1" />
                  Dispute
                </Button>
              </div>
            </div>
          )}

          {!sessionStatus.isExpired && (session.status === 'confirmed' || session.status === 'upcoming') ? (
            <div className="action-buttons">
              <div className="bg-success text-white p-2 mb-2 text-center rounded">
                <small>✅ {sessionStatus.isActive ? 'LIVE NOW' : 'SESSION AVAILABLE'}</small>
              </div>
              
              {showCompleteButton && (
                <Button variant="warning" className="w-100 mb-2" onClick={() => setShowCompleteModal(true)}>
                  <FaFlagCheckered className="me-2" />
                  Mark as Completed
                </Button>
              )}
              
              {canJoinMeeting ? (
                <Button variant="success" className="w-100 mb-2" onClick={handleJoinMeeting}>
                  <FaGoogle className="me-2" />
                  Join Google Meet
                </Button>
              ) : (
                <Button variant="outline-success" className="w-100 mb-2" onClick={() => setShowMeetLinkModal(true)}>
                  <FaLink className="me-2" />
                  Add Meeting Link to Join
                </Button>
              )}

              <div className="d-flex gap-2 mb-2">
                <Button variant="outline-primary" className="flex-fill" onClick={() => onSendReminder(session._id)}>
                  <FaBell className="me-1" />
                  Remind
                </Button>
                <Button variant="outline-info" className="flex-fill" onClick={handleStartChat}>
                  <FaChat className="me-1" />
                  Chat
                </Button>
              </div>

              <Button variant="outline-danger" className="w-100" onClick={() => setShowCancelModal(true)}>
                <FaTimes className="me-2" />
                Cancel Session
              </Button>
            </div>
          ) : (
            <div className="text-center">
              {sessionStatus.isExpired ? (
                <Alert variant="warning" className="py-2">
                  <FaExclamationTriangle className="me-2" />
                  <strong>Session Expired</strong>
                </Alert>
              ) : (
                <Alert variant="secondary" className="py-2">
                  <strong>Session Not Available</strong>
                </Alert>
              )}
            </div>
          )}

          {session.status === 'completed' && !session.rating && userRole === 'mentee' && (
            <Button variant="warning" className="w-100 mt-2" onClick={() => setShowReviewModal(true)}>
              <FaStar className="me-2" />
              Rate Session
            </Button>
          )}
        </Card.Footer>
      </Card>

      {/* Meet Link Modal */}
      <Modal show={showMeetLinkModal} onHide={() => setShowMeetLinkModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaGoogle className="me-2" />
            {session.meetLink ? 'Edit Meeting Link' : 'Add Meeting Link'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Meeting Link</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <FaLink />
              </InputGroup.Text>
              <Form.Control
                type="url"
                placeholder="https://meet.google.com/abc-def-ghi"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
              />
            </InputGroup>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMeetLinkModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveMeetLink}>
            Save Meeting Link
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Session Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Session</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Reason for cancellation</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Please provide a reason for cancellation..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={handleCancel}>
            Confirm Cancellation
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Review Session Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rate Your Session</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <div className="rating-stars text-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`star ${star <= rating ? 'text-warning' : 'text-muted'}`}
                  style={{ cursor: 'pointer', fontSize: '2rem', margin: '0 2px' }}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </Form.Group>
          <Form.Group>
            <Form.Label>Feedback (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Share your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleReviewSubmit}>
            Submit Review
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Initiate Completion Modal */}
      <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFlagCheckered className="me-2 text-warning" />
            Mark Session as Completed
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Note:</strong> This will move the session to verification phase. 
            Both you and the mentee need to approve for the session to be fully completed.
          </Alert>
          
          <Form.Group>
            <Form.Label>Completion Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Add any notes about how the session went..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleInitiateCompletion}>
            <FaFlagCheckered className="me-2" />
            Mark for Verification
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Approve Session Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Approve Session Completion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Actual Duration (minutes)</Form.Label>
            <Form.Control
              type="number"
              value={actualDuration}
              onChange={(e) => setActualDuration(parseInt(e.target.value))}
              min="15"
              max="240"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Any notes about the session..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={() => handleApproveSession(true)}>
            <FaCheck className="me-2" />
            Confirm Completion
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SessionCard;