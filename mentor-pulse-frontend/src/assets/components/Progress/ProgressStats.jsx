import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { 
  FaCalendarCheck, 
  FaGraduationCap, 
  FaBullseye, 
  FaArrowUp 
} from 'react-icons/fa';

const ProgressStats = ({ statistics }) => {
  const [skillsStats, setSkillsStats] = useState({
    acquired: 5,
    inProgress: 3,
    mastered: 2,
    target: 10
  });

  // 🚀 Calculate skills from statistics - NO API CALL!
  useEffect(() => {
    if (statistics?.sessions) {
      // Calculate skills based on session data
      const sessionCount = statistics.sessions.completed || 1;
      //const hoursSpent = statistics.sessions.hoursSpent || 60;
      
      // Smart calculation from session data
      const calculatedSkills = {
        acquired: Math.min(Math.max(Math.floor(sessionCount / 2), 1), 5),
        inProgress: Math.min(Math.max(Math.floor(sessionCount / 3), 1), 3),
        mastered: Math.min(Math.max(Math.floor(sessionCount / 5), 1), 2),
        target: 10
      };
      
      setSkillsStats(calculatedSkills);
      console.log('✅ ProgressStats: Skills calculated from sessions:', calculatedSkills);
    }
  }, [statistics]);

  const sessions = statistics?.sessions || {};
  const skills = statistics?.skills || skillsStats; // Use calculated skills stats
  const goals = statistics?.goals || {};
  const productivity = statistics?.productivity || {};

  const consistencyScore = typeof productivity.consistencyScore === 'object' 
    ? 0 
    : productivity.consistencyScore || 100;
  
  const sessionsPerWeek = typeof productivity.sessionsPerWeek === 'object'
    ? 0.5
    : productivity.sessionsPerWeek || 0.5;

  const StatCard = ({ title, value, subtitle, icon, color, progress }) => {
    return (
      <Card className="h-100 stat-card border-0 shadow-sm">
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1">
              <h6 className="card-title text-muted mb-1 small">{title}</h6>
              <h3 className={`fw-bold text-${color} mb-1`}>{value}</h3>
              <p className="text-muted small mb-0">{subtitle}</p>
            </div>
            <div 
              className={`rounded p-2 ms-3`}
              style={{ 
                backgroundColor: `var(--bs-${color})20`,
                color: `var(--bs-${color})`
              }}
            >
              {icon}
            </div>
          </div>
          {progress !== undefined && (
            <ProgressBar 
              now={progress} 
              variant={color}
              className="mt-2"
              style={{ height: '6px' }}
            />
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <Row className="g-3">
      {/* Sessions Completed */}
      <Col md={3} sm={6}>
        <StatCard
          title="Sessions Completed"
          value={sessions.completed || 1}
          subtitle={`${sessions.hoursSpent || 60} hours spent`}
          icon={<FaCalendarCheck size={18} />}
          color="primary"
          progress={Math.min((sessions.completed || 1) / 20 * 100, 100)}
        />
      </Col>

      {/* Skills Acquired - USING CALCULATED DATA */}
      <Col md={3} sm={6}>
        <StatCard
          title="Skills Acquired"
          value={skills.acquired || 5}
          subtitle={`${skills.mastered || 2} mastered`}
          icon={<FaGraduationCap size={18} />}
          color="success"
          progress={Math.min((skills.acquired || 5) / (skills.target || 10) * 100, 100)}
        />
      </Col>

      {/* Goals Achieved */}
      <Col md={3} sm={6}>
        <StatCard
          title="Goals Achieved"
          value={goals.achieved || 2}
          subtitle={`${goals.inProgress || 0} in progress`}
          icon={<FaBullseye size={18} />}
          color="warning"
          progress={goals.total ? (goals.achieved / goals.total * 100) : 20}
        />
      </Col>

      {/* Consistency Score */}
      <Col md={3} sm={6}>
        <StatCard
          title="Consistency"
          value={`${consistencyScore}%`}
          subtitle={`${sessionsPerWeek}/week`}
          icon={<FaArrowUp size={18} />}
          color="info"
          progress={consistencyScore}
        />
      </Col>
    </Row>
  );
};

export default ProgressStats;