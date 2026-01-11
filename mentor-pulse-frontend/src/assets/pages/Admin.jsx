import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminDashboard from '../components/Admin/AdminDashboard';
import AdminUsers from '../components/Admin/AdminUsers';
import AdminSessions from '../components/Admin/AdminSessions';
import AdminAnalytics from '../components/Admin/AdminAnalytics';
import AdminService from '../services/adminService';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminData, setAdminData] = useState({
    stats: {},
    users: { data: [], total: 0, page: 1, totalPages: 1 },
    sessions: { data: [], total: 0, page: 1, totalPages: 1 },
    analytics: {}
  });
  const [loading, setLoading] = useState(true);
  const [usersFilters, setUsersFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    status: ''
  });

  // Fetch data when tab changes or filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        let response;
        
        switch (activeTab) {
          case 'dashboard':
            response = await AdminService.getDashboardStats();
            if (response.success) {
              setAdminData(prev => ({ ...prev, stats: response.data }));
            }
            break;
            
          case 'users':
            response = await AdminService.getUsers(usersFilters);
            if (response.success) {
              setAdminData(prev => ({ 
                ...prev, 
                users: {
                  data: response.data,
                  total: response.total,
                  page: response.page,
                  totalPages: response.totalPages
                }
              }));
            }
            break;
            
          case 'sessions':
            response = await AdminService.getSessions();
            if (response.success) {
              setAdminData(prev => ({ 
                ...prev, 
                sessions: {
                  data: response.data,
                  total: response.total,
                  page: response.page,
                  totalPages: response.totalPages
                }
              }));
            }
            break;
            
          case 'analytics':
            response = await AdminService.getAnalytics();
            if (response.success) {
              setAdminData(prev => ({ ...prev, analytics: response.data }));
            }
            break;
            
          default:
            break;
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, usersFilters]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleUsersUpdate = (updatedUsers) => {
    setAdminData(prev => ({
      ...prev,
      users: {
        ...prev.users,
        data: updatedUsers
      }
    }));
  };

  const handleUsersFilterChange = (newFilters) => {
    setUsersFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleUsersPageChange = (newPage) => {
    setUsersFilters(prev => ({ ...prev, page: newPage }));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading admin data...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard data={adminData.stats} />;
      case 'users':
        return (
          <AdminUsers 
            users={adminData.users.data}
            totalUsers={adminData.users.total}
            currentPage={adminData.users.page}
            totalPages={adminData.users.totalPages}
            filters={usersFilters}
            onUsersUpdate={handleUsersUpdate}
            onFilterChange={handleUsersFilterChange}
            onPageChange={handleUsersPageChange}
          />
        );
      case 'sessions':
        return <AdminSessions sessions={adminData.sessions.data} />;
      case 'analytics':
        return <AdminAnalytics analytics={adminData.analytics} />;
      default:
        return <AdminDashboard data={adminData.stats} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
    </AdminLayout>
  );
};

export default Admin;