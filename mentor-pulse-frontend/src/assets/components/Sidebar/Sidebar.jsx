import React, { useState } from "react";
import { Nav, Offcanvas, Button } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  FaHome, 
  FaUsers, 
  FaCalendarAlt, 
  FaUser, 
  FaCog,
  FaSignOutAlt,
  FaChevronRight,
  FaBars,
  FaGraduationCap,
  FaChartLine,
  FaUserCheck,
  FaUserPlus,
  FaSearch,
  FaTachometerAlt,
  FaCogs,
  FaBullseye,
  FaBook,
  FaFlagCheckered,
  FaEnvelope,
  FaPaperPlane
} from "react-icons/fa";
import { useAuth } from '../../context/AuthContext'; // ADD THIS IMPORT
import "./Sidebar.css";

export default function Sidebar() {
  const [show, setShow] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth(); // USE AUTHCONTEXT

  // If not authenticated, don't show sidebar
  if (!isAuthenticated) {
    return null;
  }

  const userRole = user?.role || 'mentee';

  const handleClose = () => setShow(false);
  const toggleMobile = () => setShow(!show);
  const toggleDesktop = () => setIsExpanded(!isExpanded);

  // Role-specific navigation links
  const menuItems = {
    admin: [
      { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
      { to: "/users", label: "User Management", icon: <FaUsers /> },
      { to: "/reports", label: "Reports", icon: <FaChartLine /> },
      { to: "/approvals", label: "Approvals", icon: <FaUserCheck /> },
      { to: "/system-settings", label: "System Settings", icon: <FaCogs /> }
    ],
    mentor: [
      { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
      { to: "/mentor/requests", label: "Mentorship Requests", icon: <FaEnvelope /> },
      //{ to: "/my-mentees", label: "My Mentees", icon: <FaUserPlus /> },
      { to: "/sessions", label: "Sessions", icon: <FaCalendarAlt /> },
      { to: "/availability", label: "Availability", icon: <FaCalendarAlt /> },
      //{ to: "/resources", label: "Resources", icon: <FaBook /> },
      { to: "/profile", label: "Profile", icon: <FaUser /> }
    ],
    mentee: [
      { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
      { to: "/mentors", label: "Find Mentors", icon: <FaSearch /> },
      { to: "/mentee/requests", label: "My Requests", icon: <FaPaperPlane /> },
      { to: "/my-sessions", label: "My Sessions", icon: <FaCalendarAlt /> },
     //{ to: "/my-goals", label: "My Goals", icon: <FaFlagCheckered /> },
       { to: "/progress", label: "Progress", icon: <FaChartLine /> }, // This is our new page
      { to: "/profile", label: "Profile", icon: <FaUser /> }
    ]
  };

  // Get links based on user role
  const links = menuItems[userRole] || menuItems.mentee;

  const handleLogout = () => {
    logout(); // Use AuthContext logout
    navigate('/login'); // Use navigate instead of window.location
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="primary"
        onClick={toggleMobile}
        className="d-md-none sidebar-toggle-btn"
      >
        <FaBars />
      </Button>

      {/* Desktop Sidebar */}
      <div className={`sidebar desktop-sidebar d-none d-md-flex flex-column ${isExpanded ? 'expanded' : 'collapsed'}`}>
        
        {/* Header */}
        <div className="sidebar-header p-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="logo-placeholder me-3">
                <FaGraduationCap className="text-white" size={28} />
              </div>
              {isExpanded && (
                <div>
                  <h5 className="fw-bold text-white mb-0">MentorPulse</h5>
                  <small className="text-white-50 text-capitalize">{userRole} Dashboard</small>
                </div>
              )}
            </div>
            <Button
              variant="outline-light"
              onClick={toggleDesktop}
              className="sidebar-collapse-btn"
              size="sm"
            >
              <FaChevronRight style={{ 
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.3s ease'
              }} />
            </Button>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="sidebar-content grow p-3">
          <Nav className="flex-column">
            {links.map(({ to, label, icon }) => (
              <Nav.Link
                as={Link}
                to={to}
                key={to}
                active={location.pathname === to}
                className="sidebar-nav-link"
                title={!isExpanded ? label : ''}
              >
                <span className="nav-icon">{icon}</span>
                {isExpanded && <span className="nav-label">{label}</span>}
                {location.pathname === to && (
                  <span className="nav-indicator"></span>
                )}
              </Nav.Link>
            ))}
          </Nav>
        </div>

        {/* User Info & Logout Section */}
        <div className="sidebar-footer p-3">
          {isExpanded && user && user.name && (
            <div className="user-info mb-3 p-2 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <small className="text-white d-block">{user.name}</small>
              <small className="text-white-50 d-block">{user.email}</small>
            </div>
          )}
          <Nav.Link 
            className="text-light sidebar-nav-link logout-btn" 
            title={!isExpanded ? "Logout" : ""}
            onClick={handleLogout}
          >
            <span className="nav-icon"><FaSignOutAlt /></span>
            {isExpanded && <span className="nav-label">Logout</span>}
          </Nav.Link>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Offcanvas
        show={show}
        onHide={handleClose}
        backdrop
        className="d-md-none"
      >
        <Offcanvas.Header closeButton className="sidebar-mobile-header">
          <Offcanvas.Title className="text-white fw-bold">
            <div className="d-flex align-items-center">
              <div className="logo-placeholder me-2">
                <FaGraduationCap className="text-white" size={24} />
              </div>
              <div>
                <div>MentorPulse</div>
                <small className="text-white-50 text-capitalize">{userRole}</small>
              </div>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          {/* User Info in Mobile */}
          {user && user.name && (
            <div className="p-3 border-bottom border-secondary">
              <h6 className="text-white mb-0">{user.name}</h6>
              <small className="text-white-50">{user.email}</small>
            </div>
          )}
          
          <Nav className="flex-column">
            {links.map(({ to, label, icon }) => (
              <Nav.Link
                as={Link}
                to={to}
                key={to}
                active={location.pathname === to}
                onClick={handleClose}
                className="sidebar-nav-link"
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{label}</span>
                {location.pathname === to && (
                  <span className="nav-indicator"></span>
                )}
              </Nav.Link>
            ))}
          </Nav>
          
          {/* Logout Section */}
          <div className="sidebar-footer p-3">
            <Nav.Link 
              className="text-danger sidebar-nav-link logout-btn"
              onClick={handleLogout}
            >
              <span className="nav-icon"><FaSignOutAlt /></span>
              <span className="nav-label">Logout</span>
            </Nav.Link>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

