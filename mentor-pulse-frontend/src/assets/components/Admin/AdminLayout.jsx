import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Card, Button } from 'react-bootstrap';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaCalendarAlt, 
  FaChartBar, 
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';

const AdminLayout = ({ children, activeTab, onTabChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 991);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { id: 'users', label: 'Users', icon: <FaUsers /> },
    { id: 'sessions', label: 'Sessions', icon: <FaCalendarAlt /> },
    { id: 'analytics', label: 'Analytics', icon: <FaChartBar /> },
  ];

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      margin: 0, 
      padding: 0,
      overflow: 'hidden',
      display: 'flex',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.5)', 
            zIndex: 999 
          }}
        />
      )}

      {/* Sidebar */}
      <div 
        style={{ 
          width: '280px', 
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', 
          color: 'white', 
          position: 'fixed',
          height: '100vh',
          left: isMobile ? (sidebarOpen ? '0' : '-280px') : '0',
          top: 0,
          transition: 'left 0.3s ease',
          zIndex: 1000,
          overflowY: 'auto',
          margin: 0,
          padding: 0,
        }}
      >
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'relative'
        }}>
          <h5 style={{ color: 'white', margin: 0, fontWeight: 600 }}>
            MentorPulse Admin
          </h5>
          <button 
            onClick={() => setSidebarOpen(false)}
            style={{ 
              color: 'white', 
              padding: '5px',
              position: 'absolute', 
              right: '1rem', 
              top: '1.5rem',
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: isMobile ? 'block' : 'none'
            }}
          >
            <FaTimes />
          </button>
        </div>
        
        <div style={{ padding: '1rem 0' }}>
          {menuItems.map(item => (
            <div
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (isMobile) setSidebarOpen(false);
              }}
              style={{ 
                color: 'rgba(255,255,255,0.8)',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                backgroundColor: activeTab === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                borderRight: activeTab === item.id ? '3px solid white' : 'none',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <span style={{ marginRight: '0.75rem', width: '20px', textAlign: 'center' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={{ 
          padding: '1.5rem', 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          position: 'absolute', 
          bottom: 0, 
          width: '100%',
        }}>
          <button 
            style={{ 
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'transparent',
              color: 'white',
              padding: '0.5rem',
              width: '100%',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem'
            }}
          >
            <FaSignOutAlt style={{ marginRight: '0.5rem' }} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content - NO WHITE SPACE */}
      <div 
        style={{ 
          flex: 1,
          marginLeft: isMobile ? '0' : '280px',
          width: isMobile ? '100vw' : 'calc(100vw - 280px)',
          height: '100vh',
          backgroundColor: '#f8f9fa',
          transition: 'all 0.3s ease',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {/* Top Header */}
        <div style={{
          background: 'white',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ 
                border: 'none', 
                fontSize: '1.25rem', 
                color: '#6366F1',
                background: 'none',
                cursor: 'pointer',
                padding: '5px',
                display: isMobile ? 'block' : 'none'
              }}
            >
              <FaBars />
            </button>
            <h4 style={{ color: '#374151', fontWeight: 600, margin: 0 }}>
              {menuItems.find(item => item.id === activeTab)?.label || 'Admin'}
            </h4>
            <div style={{ color: '#6B7280', fontWeight: 500 }}>
              <span>Admin User</span>
            </div>
          </div>
        </div>

        {/* Page Content - ABSOLUTELY NO WHITE SPACE */}
        <div 
          style={{ 
            padding: '0',
            margin: '0',
            width: '100%',
            minHeight: 'calc(100vh - 80px)',
            backgroundColor: '#f8f9fa'
          }}
        >
          {children}
        </div>
      </div>

      {/* Add global CSS reset for admin pages */}
      <style>{`
        /* Nuclear reset for admin content */
        .admin-content * {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .admin-content .container,
        .admin-content .container-fluid {
          max-width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        
        /* Remove any potential white space from children */
        .admin-content > * {
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
