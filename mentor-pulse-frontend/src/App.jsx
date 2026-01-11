import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider, useAuth } from './assets/context/AuthContext';
import { SocketProvider } from './assets/context/SocketContext';
import { ChatProvider } from './assets/context/ChatProvider';

// Pages
import Login from './assets/pages/auth/Login';
import Register from './assets/pages/auth/Register';
import Dashboard from './assets/pages/common/Dashboard';
import Home from './assets/pages/common/Home';
import Availability from './assets/pages/common/Availability';
import Mentors from './assets/pages/common/Mentors';
import Profile from './assets/pages/common/Profile';
import MentorRequests from './assets/pages/mentor/MentorRequests';
import MenteeRequests from './assets/pages/mentee/MenteeRequests';
import SessionDashboard from './assets/components/Sessions/SessionDashboard';
import ChatModule from './assets/components/Chat/ChatModule';
import Progress from './assets/pages/common/Progress';
import Admin from './assets/pages/Admin';

// Components
import Sidebar from './assets/components/Sidebar/Sidebar';
import Footer from './assets/components/Footer/Footer';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const publicPaths = ['/', '/login', '/register'];
  const isPublicPage = publicPaths.includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="App" style={{ minHeight: '100vh', width: '100vw', margin: 0, padding: 0 }}>
      {!isPublicPage && isAuthenticated && !isAdminPage && <Sidebar />}

      <div className={`main-content ${isPublicPage ? 'auth-page' : isAdminPage ? 'admin-page' : 'with-sidebar'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><div style={{ padding: '2rem' }}><Dashboard /></div></ProtectedRoute>} />
          <Route path="/mentors" element={<ProtectedRoute><div style={{ padding: '2rem' }}><Mentors /></div></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><div style={{ padding: '2rem' }}><SessionDashboard /></div></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><div style={{ padding: '2rem' }}><Profile /></div></ProtectedRoute>} />
          <Route path="/my-sessions" element={<ProtectedRoute><div style={{ padding: '2rem' }}><SessionDashboard /></div></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><div style={{ height: '100vh', padding: '2rem' }}><ChatModule /></div></ProtectedRoute>} />
          <Route path="/availability" element={<ProtectedRoute><div style={{ padding: '2rem' }}><Availability /></div></ProtectedRoute>} />
          <Route path="/mentor/requests" element={<ProtectedRoute><div style={{ padding: '2rem' }}><MentorRequests /></div></ProtectedRoute>} />
          <Route path="/mentee/requests" element={<ProtectedRoute><div style={{ padding: '2rem' }}><MenteeRequests /></div></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><div style={{ padding: '2rem' }}><Progress /></div></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

          <Route path="*" element={<div style={{ padding: '2rem' }}><div className="container mt-5"><h1>404 - Page Not Found</h1></div></div>} />
        </Routes>
      </div>

      {!isPublicPage && isAuthenticated && !isAdminPage && <Footer />}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <Router>
            <AppContent />
          </Router>
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
