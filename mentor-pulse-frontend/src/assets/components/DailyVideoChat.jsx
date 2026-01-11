import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Spinner, Alert, Card, Badge } from 'react-bootstrap';
import DailyIframe from '@daily-co/daily-js';
import { FaVideo, FaUsers, FaMicrophone, FaVideoSlash, FaPhoneSlash, FaUserTie, FaUserGraduate } from 'react-icons/fa';

const DailyVideoFrame = ({ session, userRole, onMeetingEnd }) => {
  const containerRef = useRef(null);
  const callFrameRef = useRef(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMentor = userRole === 'mentor';

  useEffect(() => {
    if (!session?.dailyRoom?.url || !containerRef.current) return;

    try {
      const callFrame = DailyIframe.createFrame({
        iframeStyle: {
          width: '100%',
          height: '500px',
          border: 'none',
          borderRadius: '10px',
        },
        parentElement: containerRef.current,
      });

      callFrame.join({
        url: session.dailyRoom.url,
        userName: `${isMentor ? 'Mentor' : 'Mentee'} - ${session.mentorId.name}`,
        showLeaveButton: true,
      });

      callFrameRef.current = callFrame;

      setIsLoading(false);
    } catch  {
      setError('Failed to join meeting');
      setIsLoading(false);
    }

    return () => {
      callFrameRef.current?.leave();
      callFrameRef.current?.destroy();
    };
  }, [session, isMentor]);

  const toggleAudio = () => {
    const callFrame = callFrameRef.current;
    if (callFrame) {
      callFrame.setLocalAudio(!isAudioMuted);
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    const callFrame = callFrameRef.current;
    if (callFrame) {
      callFrame.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const leaveCall = () => {
    callFrameRef.current?.leave();
    onMeetingEnd();
  };

  if (error) {
    return (
      <div className="text-center p-4">
        <Alert variant="danger">
          <h5>Connection Error</h5>
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="daily-video-container">
      <div className="video-frame-container position-relative">
        {isLoading && (
          <div className="video-loading-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center bg-dark bg-opacity-75 text-white">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Joining mentorship session...</p>
          </div>
        )}
        <div ref={containerRef} />
      </div>

      <div className="video-controls mt-3">
        <div className="d-flex justify-content-center gap-3">
          <Button variant={isAudioMuted ? 'danger' : 'outline-primary'} onClick={toggleAudio} size="sm">
            <FaMicrophone /> {isAudioMuted ? 'Unmute' : 'Mute'}
          </Button>
          <Button variant={isVideoOff ? 'danger' : 'outline-primary'} onClick={toggleVideo} size="sm">
            <FaVideoSlash /> {isVideoOff ? 'Start Video' : 'Stop Video'}
          </Button>
          <Button variant="danger" onClick={leaveCall} size="sm">
            <FaPhoneSlash /> Leave
          </Button>
        </div>
      </div>

      <Card className="mt-3">
        <Card.Body className="py-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted">
                <FaUsers className="me-1" />
                Mentorship Session • {isMentor ? 'Mentor' : 'Mentee'} View
              </small>
            </div>
            <div>
              <Badge bg={isMentor ? 'primary' : 'success'}>
                {isMentor ? <FaUserTie /> : <FaUserGraduate />}
                {isMentor ? ' Mentor' : ' Mentee'}
              </Badge>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

const DailyVideoChat = ({ show, onClose, session, userRole }) => {
  const [meetingEnded, setMeetingEnded] = useState(false);

  const handleMeetingEnd = () => {
    setMeetingEnded(true);
    setTimeout(() => {
      onClose();
      setMeetingEnded(false);
    }, 2000);
  };

  if (!session?.dailyRoom) {
    return (
      <Modal show={show} onHide={onClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Video Session Not Ready</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <p>Video room not configured. Please generate a meeting link first.</p>
          </Alert>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaVideo className="me-2" />
          Mentorship Session with {userRole === 'mentor' ? session.menteeId.name : session.mentorId.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <DailyVideoFrame session={session} userRole={userRole} onMeetingEnd={handleMeetingEnd} />
        {meetingEnded && (
          <Alert variant="success" className="mt-3">
            <p>Meeting ended successfully. Hope it was productive! 🌟</p>
          </Alert>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default DailyVideoChat;

