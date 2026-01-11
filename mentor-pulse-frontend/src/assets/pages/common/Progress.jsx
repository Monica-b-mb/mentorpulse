import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Button, Badge } from 'react-bootstrap';
import { 
  FaChartLine, 
  FaBullseye,
  FaTrophy, 
  FaCalendarAlt,
  FaPlus,
  FaCheckCircle,
  FaClock,
  FaStar,
  FaUserGraduate,
  FaBook,
  FaAward,
  FaMedal,
  FaRocket,
  FaFire,
  FaCrown
} from 'react-icons/fa';
import ProgressStats from '../../components/Progress/ProgressStats';
import GoalTracker from '../../components/Progress/GoalTracker';
import ProgressTimeline from '../../components/Progress/ProgressTimeline';
import SessionAnalytics from '../../components/Progress/SessionAnalytics';
import SkillProgress from '../../components/Progress/SkillProgress';
import GoalModal from '../../components/Progress/GoalModal';

const Progress = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const fetchProgressData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/progress/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setProgressData(data.data);
      } else {
        console.error('Failed to fetch progress data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGoalCreated = () => {
    setShowGoalModal(false);
    fetchProgressData();
  };

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  const quickStats = {
    completedGoals: progressData?.goals?.filter(g => g.status === 'completed').length || 0,
    totalSessions: progressData?.statistics?.totalSessions || 0,
    skillLevel: 'Intermediate',
    streak: 7,
    completionRate: '78%'
  };

  if (loading) {
    return (
      <Container fluid className="py-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
        <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <Col md={6} className="text-center">
            <div className="spinner-border text-white mb-4" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="text-white mb-2">Loading Your Progress</h5>
            <p className="text-light">We're preparing your learning insights...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="px-0">
      <div className="position-fixed top-0 left-0 w-100 h-100" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: -1,
        opacity: 0.03
      }}></div>

      <div className="floating-particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}></div>
        ))}
      </div>

      <Container className="py-4">
        <Row className="mb-5">
          <Col>
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                <div className="header-glow"></div>
                <h1 className="display-4 fw-bold text-dark mb-3 position-relative">
                  <span className="gradient-text">Learning Progress</span>
                </h1>
              </div>
              <p className="lead text-muted mb-4">
                Your journey to mastery, beautifully tracked
              </p>
            </div>
            
            <Row className="g-4 justify-content-center">
              <Col lg={2} md={4} sm={6}>
                <StatCard
                  icon={FaCheckCircle}
                  value={quickStats.completedGoals}
                  label="Goals Completed"
                  gradient="linear-gradient(135deg, #00b09b, #96c93d)"
                />
              </Col>
              <Col lg={2} md={4} sm={6}>
                <StatCard
                  icon={FaBook}
                  value={quickStats.totalSessions}
                  label="Total Sessions"
                  gradient="linear-gradient(135deg, #667eea, #764ba2)"
                />
              </Col>
              <Col lg={2} md={4} sm={6}>
                <StatCard
                  icon={FaStar}
                  value={quickStats.skillLevel}
                  label="Skill Level"
                  gradient="linear-gradient(135deg, #f093fb, #f5576c)"
                />
              </Col>
              <Col lg={2} md={4} sm={6}>
                <StatCard
                  icon={FaFire}
                  value={quickStats.streak}
                  label="Day Streak"
                  gradient="linear-gradient(135deg, #ff9a9e, #fecfef)"
                />
              </Col>
              <Col lg={2} md={4} sm={6}>
                <StatCard
                  icon={FaChartLine}
                  value={quickStats.completionRate}
                  label="Completion Rate"
                  gradient="linear-gradient(135deg, #4facfe, #00f2fe)"
                />
              </Col>
            </Row>

            <div className="text-center mt-4">
              <Button 
                className="px-5 py-3 fw-semibold glow-button"
                onClick={() => setShowGoalModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '1.1rem',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                }}
              >
                <FaPlus className="me-2" />
                Set New Goal
              </Button>
            </div>
          </Col>
        </Row>

        {progressData?.statistics && (
          <Row className="mb-5">
            <Col>
              <Card className="border-0 shadow-lg glass-card">
                <Card.Body className="p-4">
                  <ProgressStats statistics={progressData.statistics} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <Row>
          <Col>
            <Card className="border-0 shadow-lg overflow-hidden">
              <Card.Body className="p-0">
                <div className="tab-header-bg">
                  <Tabs
                    activeKey={activeTab}
                    onSelect={(tab) => setActiveTab(tab)}
                    className="px-4 pt-4 custom-tabs"
                    fill
                  >
                    <Tab eventKey="overview" title={
                      <TabTitle 
                        icon={FaChartLine}
                        title="Overview"
                        count={progressData?.recentActivity?.length || 0}
                        active={activeTab === 'overview'}
                      />
                    }>
                      <div className="p-4">
                        <Row>
                          <Col xl={8} className="mb-4">
                            <Card className="border-0 h-100 shadow-sm">
                              <Card.Header className="bg-white border-0 py-3">
                                <h5 className="mb-0 d-flex align-items-center text-dark">
                                  <div className="icon-wrapper bg-primary me-3">
                                    <FaClock className="text-white" />
                                  </div>
                                  Recent Activity Timeline
                                </h5>
                              </Card.Header>
                              <Card.Body>
                                <ProgressTimeline 
                                  activities={progressData?.recentActivity || []}
                                />
                              </Card.Body>
                            </Card>
                          </Col>
                          
                          <Col xl={4}>
                            <Card className="border-0 h-100 shadow-sm">
                              <Card.Header className="bg-white border-0 py-3">
                                <h5 className="mb-0 d-flex align-items-center text-dark">
                                  <div className="icon-wrapper bg-success me-3">
                                    <FaStar className="text-white" />
                                  </div>
                                  Skills Progress
                                </h5>
                              </Card.Header>
                              <Card.Body>
                                <SkillProgress />
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    </Tab>

                    <Tab eventKey="goals" title={
                      <TabTitle 
                        icon={FaBullseye}
                        title="Goals & Targets"
                        count={progressData?.goals?.length || 0}
                        active={activeTab === 'goals'}
                      />
                    }>
                      <div className="p-4">
                        <GoalTracker 
                          goals={progressData?.goals || []}
                          onGoalUpdate={fetchProgressData}
                        />
                      </div>
                    </Tab>

                    <Tab eventKey="sessions" title={
                      <TabTitle 
                        icon={FaCalendarAlt}
                        title="Session Analytics"
                        active={activeTab === 'sessions'}
                      />
                    }>
                      <div className="p-4">
                        <SessionAnalytics 
                          sessionsData={progressData?.statistics?.sessions}
                          progressOverTime={progressData?.progressOverTime || []}
                        />
                      </div>
                    </Tab>

                    <Tab eventKey="achievements" title={
                      <TabTitle 
                        icon={FaTrophy}
                        title="Achievements"
                        count={6}
                        active={activeTab === 'achievements'}
                      />
                    }>
                      <div className="p-4">
                        <EnhancedAchievementsSection />
                      </div>
                    </Tab>
                  </Tabs>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <GoalModal 
        show={showGoalModal}
        onHide={() => setShowGoalModal(false)}
        onGoalCreated={handleGoalCreated}
      />
    </Container>
  );
};

const StatCard = ({ icon, value, label, gradient }) => {
  const IconComponent = icon;
  return (
    <Card className="border-0 text-center stat-card h-100" style={{
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      transition: 'all 0.3s ease'
    }}>
      <Card.Body className="p-4">
        <div className="stat-icon-wrapper mb-3" style={{
          background: gradient,
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto'
        }}>
          <IconComponent className="text-white" size={24} />
        </div>
        <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '2rem' }}>{value}</h3>
        <p className="text-muted mb-0 small fw-semibold">{label}</p>
      </Card.Body>
    </Card>
  );
};

const TabTitle = ({ icon, title, count, active }) => {
  const IconComponent = icon;
  return (
    <span className="d-flex align-items-center">
      <IconComponent className="me-2" size={16} />
      {title}
      {count !== undefined && (
        <Badge 
          bg={active ? "primary" : "light"} 
          text={active ? "white" : "dark"}
          className="ms-2"
          style={{ 
            borderRadius: '12px',
            fontSize: '0.7rem',
            padding: '0.25rem 0.5rem'
          }}
        >
          {count}
        </Badge>
      )}
    </span>
  );
};

const EnhancedAchievementsSection = () => {
  const achievements = [
    {
      icon: FaUserGraduate,
      title: "Rising Star",
      description: "Complete 10 mentorship sessions",
      progress: 7,
      total: 10,
      badge: "bronze",
      gradient: "linear-gradient(135deg, #f093fb, #f5576c)"
    },
    {
      icon: FaStar,
      title: "Skill Master",
      description: "Master 5 different skills",
      progress: 3,
      total: 5,
      badge: "silver",
      gradient: "linear-gradient(135deg, #4facfe, #00f2fe)"
    },
    {
      icon: FaTrophy,
      title: "Goal Crusher",
      description: "Achieve 10 learning goals",
      progress: 5,
      total: 10,
      badge: "gold",
      gradient: "linear-gradient(135deg, #43e97b, #38f9d7)"
    },
    {
      icon: FaMedal,
      title: "Consistent Learner",
      description: "Maintain 30-day learning streak",
      progress: 7,
      total: 30,
      badge: "bronze",
      gradient: "linear-gradient(135deg, #667eea, #764ba2)"
    },
    {
      icon: FaAward,
      title: "Quick Learner",
      description: "Complete 5 goals ahead of schedule",
      progress: 2,
      total: 5,
      badge: "silver",
      gradient: "linear-gradient(135deg, #fa709a, #fee140)"
    },
    {
      icon: FaCrown,
      title: "Mentorship Pro",
      description: "Participate in 25 sessions",
      progress: 15,
      total: 25,
      badge: "gold",
      gradient: "linear-gradient(135deg, #ff9a9e, #fecfef)"
    }
  ];

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#6c757d';
    }
  };

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <div className="text-center">
            <h3 className="text-dark mb-2 fw-bold">Your Learning Journey</h3>
            <p className="text-muted">Unlock achievements as you progress through your mentorship journey</p>
          </div>
        </Col>
      </Row>
      
      <Row>
        {achievements.map((achievement, index) => {
          const IconComponent = achievement.icon;
          const progressPercentage = (achievement.progress / achievement.total) * 100;
          
          return (
            <Col md={6} lg={4} className="mb-4" key={index}>
              <Card className="h-100 border-0 shadow-sm achievement-card" style={{
                transition: 'all 0.3s ease',
                borderRadius: '20px',
                overflow: 'hidden'
              }}>
                <Card.Body className="p-4 position-relative">
                  <div className="position-absolute top-0 start-0 w-100 h-3" style={{
                    background: achievement.gradient
                  }}></div>
                  
                  <div className="d-flex align-items-start mb-3">
                    <div 
                      className="rounded-circle p-3 me-3 flex-shrink-0"
                      style={{ 
                        background: achievement.gradient,
                        width: '60px', 
                        height: '60px'
                      }}
                    >
                      <IconComponent className="text-white" size={24} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="text-dark mb-0 fw-semibold">{achievement.title}</h6>
                        <Badge 
                          style={{ 
                            backgroundColor: getBadgeColor(achievement.badge),
                            color: achievement.badge === 'gold' ? '#000' : '#fff',
                            fontSize: '0.65rem'
                          }}
                        >
                          {achievement.badge}
                        </Badge>
                      </div>
                      <p className="text-muted small mb-2">{achievement.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted fw-semibold">
                        Progress: {achievement.progress}/{achievement.total}
                      </small>
                      <small className="text-muted fw-semibold">
                        {Math.round(progressPercentage)}%
                      </small>
                    </div>
                    <div className="progress" style={{ height: '8px', borderRadius: '10px' }}>
                      <div 
                        className="progress-bar"
                        style={{ 
                          background: achievement.gradient,
                          width: `${progressPercentage}%`,
                          borderRadius: '10px'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {achievement.total - achievement.progress} to go
                    </small>
                    {progressPercentage === 100 && (
                      <Badge bg="success" className="ms-2">
                        <FaCheckCircle className="me-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default Progress;