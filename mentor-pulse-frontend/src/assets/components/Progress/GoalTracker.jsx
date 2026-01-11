import React, { useState } from 'react';
import { Card, Button, ProgressBar, Badge, Dropdown, Row, Col, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEllipsisV, FaBullseye } from 'react-icons/fa';

const GoalTracker = ({ goals, onGoalUpdate }) => {
  const [updatingGoal, setUpdatingGoal] = useState(null);
  const [, setShowGoalModal] = useState(false);

  const handleProgressUpdate = async (goalId, newProgress) => {
    try {
      setUpdatingGoal(goalId);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://mentorpulse.onrender.com/api/progress/goals/${goalId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          progress: newProgress
        })
      });

      const data = await response.json();

      if (data.success) {
        onGoalUpdate();
      } else {
        console.error('Failed to update goal:', data.message);
      }
    } catch (error) {
      console.error('Update goal error:', error);
    } finally {
      setUpdatingGoal(null);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://mentorpulse.onrender.com/api/progress/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        onGoalUpdate();
      } else {
        console.error('Failed to delete goal:', data.message);
      }
    } catch (error) {
      console.error('Delete goal error:', error);
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'not-started': return 'secondary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const progressOptions = [0, 25, 50, 75, 100];

  if (!goals || goals.length === 0) {
    return (
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">My Learning Goals</h5>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowGoalModal(true)}
          >
            <FaPlus className="me-2" />
            Add Goal
          </Button>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <FaBullseye size={48} className="text-muted mb-3" />
          <h5 className="text-muted">No Goals Set Yet</h5>
          <p className="text-muted mb-4">
            Start your learning journey by setting your first goal!
          </p>
          <Button 
            variant="primary"
            onClick={() => setShowGoalModal(true)}
          >
            <FaPlus className="me-2" />
            Set Your First Goal
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">My Learning Goals</h5>
          <div>
            <span className="badge bg-primary me-2">{goals.length} goals</span>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setShowGoalModal(true)}
            >
              <FaPlus className="me-2" />
              Add Goal
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {goals.map(goal => (
            <div 
              key={goal._id} 
              className={`goal-item mb-3 p-3 border rounded ${goal.status === 'completed' ? 'completed' : ''}`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="flex-grow-1">
                  <h6 className="mb-1">{goal.title}</h6>
                  <p className="text-muted small mb-2">{goal.description}</p>
                </div>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm" id="goal-actions">
                    <FaEllipsisV />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleProgressUpdate(goal._id, 100)}>
                      Mark Complete
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item 
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="text-danger"
                    >
                      <FaTrash className="me-2" />
                      Delete
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <Badge bg={getPriorityVariant(goal.priority)} className="me-2">
                    {goal.priority}
                  </Badge>
                  <Badge bg={getStatusVariant(goal.status)}>
                    {goal.status}
                  </Badge>
                </div>
                <small className="text-muted">
                  Due: {new Date(goal.targetDate).toLocaleDateString()}
                </small>
              </div>

              <div className="mb-2">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Progress: {goal.progress}%</small>
                  <small className="text-muted">
                    {updatingGoal === goal._id ? 'Updating...' : ''}
                  </small>
                </div>
                <ProgressBar 
                  now={goal.progress} 
                  variant={
                    goal.progress === 100 ? 'success' : 
                    goal.progress >= 50 ? 'primary' : 
                    'warning'
                  }
                />
              </div>

              {/* Progress Update Buttons */}
              <div className="d-flex gap-2 mt-3">
                {progressOptions.map(progress => (
                  <Button
                    key={progress}
                    variant="outline-primary"
                    size="sm"
                    disabled={updatingGoal === goal._id}
                    onClick={() => handleProgressUpdate(goal._id, progress)}
                    className={goal.progress === progress ? 'active' : ''}
                  >
                    {progress}%
                  </Button>
                ))}
              </div>

              {/* Additional Goal Info */}
              <div className="mt-2 d-flex justify-content-between text-muted small">
                <span>Category: {goal.category}</span>
                {goal.estimatedHours && (
                  <span>Est. {goal.estimatedHours}h</span>
                )}
                {goal.actualHours > 0 && (
                  <span>Actual: {goal.actualHours}h</span>
                )}
              </div>
            </div>
          ))}
        </Card.Body>
      </Card>

      {/* You'll need to pass the showGoalModal state and handler to parent or manage here */}
    </div>
  );
};

export default GoalTracker;
