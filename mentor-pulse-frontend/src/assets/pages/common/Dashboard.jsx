import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MentorStats from '../../components/DashboardWidgets/Mentor/MentorStats';
import MenteeStats from '../../components/DashboardWidgets/Mentee/MenteeStats';
import ActivityFeed from '../../components/DashboardWidgets/Shared/ActivityFeed';
import AdminStats from '../../components/Admin/AdminStats';
import FeedbackPrompt from '../../components/Feedback/FeedbackPrompt';

const Dashboard = () => {
  const { user, isLoading } = useAuth();

  // Inline CSS styles
  const styles = `
    .dashboard-container {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      padding: 2rem 0;
    }
    
    .welcome-top-bar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 25px;
      padding: 2.5rem 3rem;
      margin-bottom: 2.5rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(102, 126, 234, 0.4);
      border: 2px solid rgba(255,255,255,0.3);
      backdrop-filter: blur(20px);
    }
    
    .welcome-top-bar::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
      animation: rotate 20s linear infinite;
    }
    
    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
      border-radius: 20px;
      padding: 2rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
      border: 2px solid rgba(255,255,255,0.8);
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      backdrop-filter: blur(10px);
    }
    
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      border-radius: 20px 20px 0 0;
    }
    
    .stat-card.sent::before { background: linear-gradient(135deg, #667eea, #764ba2); }
    .stat-card.pending::before { background: linear-gradient(135deg, #ffd166, #ff9e00); }
    .stat-card.accepted::before { background: linear-gradient(135deg, #06d6a0, #04a777); }
    .stat-card.rejected::before { background: linear-gradient(135deg, #ef476f, #d90429); }
    
    .stat-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }
    
    .stat-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .stat-icon-container {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }
    
    .stat-icon-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 20px;
      opacity: 0.1;
    }
    
    .stat-card.sent .stat-icon-container {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #667eea;
    }
    .stat-card.sent .stat-icon-container::before {
      background: #667eea;
    }
    
    .stat-card.pending .stat-icon-container {
      background: linear-gradient(135deg, #ffd166, #ff9e00);
      color: #ff9e00;
    }
    .stat-card.pending .stat-icon-container::before {
      background: #ff9e00;
    }
    
    .stat-card.accepted .stat-icon-container {
      background: linear-gradient(135deg, #06d6a0, #04a777);
      color: #06d6a0;
    }
    .stat-card.accepted .stat-icon-container::before {
      background: #06d6a0;
    }
    
    .stat-card.rejected .stat-icon-container {
      background: linear-gradient(135deg, #ef476f, #d90429);
      color: #ef476f;
    }
    .stat-card.rejected .stat-icon-container::before {
      background: #ef476f;
    }
    
    .stat-icon {
      position: relative;
      z-index: 2;
    }
    
    .stat-info {
      flex: 1;
    }
    
    .stat-number {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
      line-height: 1;
    }
    
    .stat-card.sent .stat-number { color: #667eea; }
    .stat-card.pending .stat-number { color: #ff9e00; }
    .stat-card.accepted .stat-number { color: #06d6a0; }
    .stat-card.rejected .stat-number { color: #ef476f; }
    
    .stat-title {
      font-size: 1rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-subtitle {
      font-size: 0.9rem;
      color: #718096;
      font-weight: 500;
    }
    
    .activity-section {
      margin-top: 2rem;
    }
    
    .activity-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
      border-radius: 20px;
      border: 2px solid rgba(255,255,255,0.8);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      transition: all 0.4s ease;
      overflow: hidden;
      height: 100%;
    }
    
    .activity-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15);
    }
    
    .activity-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1.5rem 2rem;
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .activity-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: rotate 15s linear infinite;
    }
    
    .activity-content {
      padding: 2rem;
    }
    
    .quick-actions-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
      border-radius: 20px;
      padding: 2rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
      border: 2px solid rgba(255,255,255,0.8);
      height: 100%;
    }
    
    .quick-actions-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 20px 20px 0 0;
    }
    
    .action-grid {
      display: grid;
      gap: 1.25rem;
    }
    
    .action-item {
      background: rgba(255, 255, 255, 0.8);
      border-radius: 15px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      cursor: pointer;
      border: 2px solid rgba(102, 126, 234, 0.1);
      backdrop-filter: blur(10px);
    }
    
    .action-item:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
      border-color: rgba(102, 126, 234, 0.3);
      background: rgba(255, 255, 255, 1);
    }
    
    .action-icon {
      width: 60px;
      height: 60px;
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin: 0 auto 1rem;
      transition: all 0.4s ease;
      position: relative;
      overflow: hidden;
    }
    
    .action-icon::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: inherit;
      opacity: 0.2;
      border-radius: 15px;
    }
    
    .action-item:hover .action-icon {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    
    .icon-find { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
    .icon-requests { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; }
    .icon-sessions { background: linear-gradient(135deg, #43e97b, #38f9d7); color: white; }
    .icon-feedback { background: linear-gradient(135deg, #fa709a, #fee140); color: white; }
    
    .action-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }
    
    .action-desc {
      color: #718096;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    
    .btn-glow {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border: 2px solid rgba(255,255,255,0.3);
      color: #667eea;
      font-weight: 700;
      padding: 1rem 2rem;
      border-radius: 15px;
      transition: all 0.4s ease;
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
      backdrop-filter: blur(10px);
    }
    
    .btn-glow:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
      color: #667eea;
      background: rgba(255, 255, 255, 1);
    }
    
    .text-glow {
      text-shadow: 0 0 30px rgba(255,255,255,0.8);
    }
    
    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: relative;
      z-index: 2;
    }
    
    .feedback-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%) !important;
      border: 2px solid rgba(255,255,255,0.8) !important;
      border-radius: 20px !important;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1) !important;
      backdrop-filter: blur(10px);
    }
    
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem 0;
      }
      
      .welcome-top-bar {
        padding: 2rem 1.5rem;
        margin-bottom: 2rem;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }
      
      .stat-card {
        padding: 1.5rem;
      }
      
      .stat-content {
        gap: 1rem;
      }
      
      .stat-icon-container {
        width: 70px;
        height: 70px;
        font-size: 1.8rem;
      }
      
      .activity-content {
        padding: 1.5rem;
      }
      
      .quick-actions-card {
        padding: 1.5rem;
      }
      
      .action-item {
        padding: 1.25rem;
      }
    }
  `;

  const quickActions = [
    {
      title: "Find Mentors",
      description: "Discover expert mentors tailored to your goals",
      icon: "fa-search",
      iconClass: "icon-find",
      path: "/mentors"
    },
    {
      title: "My Requests",
      description: "View and manage your mentorship applications",
      icon: "fa-list-alt",
      iconClass: "icon-requests",
      path: "/mentee/requests"
    },
    {
      title: "My Sessions",
      description: "Schedule and manage your learning sessions",
      icon: "fa-calendar-check",
      iconClass: "icon-sessions",
      path: "/sessions"
    },
    {
      title: "Give Feedback",
      description: "Share your experience and rate sessions",
      icon: "fa-star",
      iconClass: "icon-feedback",
      onClick: () => document.querySelector('.feedback-alert button')?.click()
    }
  ];

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <style>{styles}</style>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading your personalized dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <style>{styles}</style>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="stat-card text-center">
                <div className="card-body py-5">
                  <div className="text-warning mb-4">
                    <i className="fas fa-exclamation-triangle fa-4x"></i>
                  </div>
                  <h3 className="text-dark mb-3">Authentication Required</h3>
                  <p className="text-muted mb-4">Please sign in to access your dashboard</p>
                  <Link to="/login" className="btn-glow">
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <style>{styles}</style>
      <div className="container">
        
        {/* Welcome Bar - TOP */}
        <div className="welcome-top-bar text-white">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center">
                <div className="bg-white bg-opacity-20 rounded-circle p-3 me-4">
                  <i className="fas fa-user-check fa-2x"></i>
                </div>
                <div>
                  <h1 className="h2 fw-bold mb-2 text-glow">Learning Dashboard</h1>
                  <p className="mb-0 opacity-90 larger-text text-glow">
                    Welcome back, <strong>{user.name}</strong>! 🎉 Ready to continue your journey?
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-md-end">
              <div className="d-flex gap-2 justify-content-md-end flex-wrap">
                <Link to="/profile" className="btn-glow">
                  <i className="fas fa-user-edit me-2"></i>
                  Profile
                </Link>
                <Link to="/settings" className="btn-glow">
                  <i className="fas fa-cog me-2"></i>
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* FEEDBACK PROMPT - Consistent Styling */}
        {user.role !== 'admin' && (
          <div className="feedback-card">
            <FeedbackPrompt />
          </div>
        )}

        {/* Enhanced Stats Cards with Icons */}
        <div className="stats-grid">
          <div className="stat-card sent">
            <div className="stat-content">
              <div className="stat-icon-container">
                <i className="fas fa-paper-plane stat-icon"></i>
              </div>
              <div className="stat-info">
                <div className="stat-number">4</div>
                <div className="stat-title">SENT REQUESTS</div>
                <div className="stat-subtitle">Total requests sent</div>
              </div>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-content">
              <div className="stat-icon-container">
                <i className="fas fa-clock stat-icon"></i>
              </div>
              <div className="stat-info">
                <div className="stat-number">0</div>
                <div className="stat-title">PENDING</div>
                <div className="stat-subtitle">Awaiting response</div>
              </div>
            </div>
          </div>
          
          <div className="stat-card accepted">
            <div className="stat-content">
              <div className="stat-icon-container">
                <i className="fas fa-check-circle stat-icon"></i>
              </div>
              <div className="stat-info">
                <div className="stat-number">4</div>
                <div className="stat-title">ACCEPTED</div>
                <div className="stat-subtitle">Active mentorships</div>
              </div>
            </div>
          </div>
          
          <div className="stat-card rejected">
            <div className="stat-content">
              <div className="stat-icon-container">
                <i className="fas fa-times-circle stat-icon"></i>
              </div>
              <div className="stat-info">
                <div className="stat-number">0</div>
                <div className="stat-title">REJECTED</div>
                <div className="stat-subtitle">Not accepted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Activity Moved Down */}
        {user.role !== 'admin' && (
          <div className="row activity-section">
            {/* Recent Activities - USING ORIGINAL ActivityFeed COMPONENT */}
            <div className="col-xl-8 col-lg-7 mb-4">
              <div className="activity-card">
                <div className="activity-header">
                  <h3 className="section-title text-white text-glow m-0">
                    <i className="fas fa-history"></i>
                    Recent Activities
                  </h3>
                </div>
                <div className="activity-content">
                  {/* KEEPING ORIGINAL ActivityFeed COMPONENT FOR REAL-TIME DATA */}
                  <ActivityFeed />
                </div>
              </div>
            </div>

            {/* Quick Actions - Consistent Styling */}
            <div className="col-xl-4 col-lg-5 mb-4">
              <div className="quick-actions-card">
                <h3 className="section-title m-0 mb-4">
                  <i className="fas fa-bolt text-primary"></i>
                  Quick Actions
                </h3>
                <div className="action-grid">
                  {quickActions.map((action, index) => (
                    <div key={index}>
                      {action.path ? (
                        <Link to={action.path} className="action-item text-decoration-none d-block">
                          <div className={`action-icon ${action.iconClass}`}>
                            <i className={`fas ${action.icon}`}></i>
                          </div>
                          <div className="action-title">{action.title}</div>
                          <div className="action-desc">{action.description}</div>
                        </Link>
                      ) : (
                        <button 
                          className="action-item w-100 border-0 bg-transparent text-center"
                          onClick={action.onClick}
                        >
                          <div className={`action-icon ${action.iconClass}`}>
                            <i className={`fas ${action.icon}`}></i>
                          </div>
                          <div className="action-title">{action.title}</div>
                          <div className="action-desc">{action.description}</div>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;

