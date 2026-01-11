import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Badge, Form, InputGroup, Modal, Alert, Spinner } from 'react-bootstrap';
import { FaSearch, FaEdit, FaTrash, FaEye, FaFilter, FaUserPlus, FaCheck, FaTimes, FaSync, FaUserCheck, FaUserSlash } from 'react-icons/fa';
import AdminService from '../../services/adminService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState({
    users: false,
    action: false
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  // Alert function - defined first and memoized
  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
  }, []);

  // Load users from API - memoized with useCallback
  const loadUsers = useCallback(async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const response = await AdminService.getUsers();
      if (response.success) {
        setUsers(response.data);
        setFilteredUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showAlert('Failed to load users', 'danger');
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, [showAlert]);

  // Filter users based on search and filters - memoized
  const filterUsers = useCallback(() => {
    const filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Initialize data
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Apply filters when dependencies change
  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleStatusChange = useCallback(async (userId, newStatus) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await AdminService.updateUser(userId, { status: newStatus });
      if (response.success) {
        await loadUsers(); // Reload users to get updated data
        showAlert(`User status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      showAlert('Error updating user status', 'danger');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [loadUsers, showAlert]);

  const handleVerification = useCallback(async (userId) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await AdminService.updateUser(userId, { status: 'verified' });
      if (response.success) {
        await loadUsers();
        showAlert('Mentor verified successfully');
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      showAlert('Error verifying mentor', 'danger');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [loadUsers, showAlert]);

  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await AdminService.deleteUser(selectedUser.id);
      if (response.success) {
        showAlert('User deleted successfully');
        setShowDeleteModal(false);
        setSelectedUser(null);
        await loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('Error deleting user', 'danger');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [selectedUser, loadUsers, showAlert]);

  const openDeleteModal = useCallback((user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  }, []);

  const getStatusVariant = useCallback((status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'secondary';
      case 'suspended': return 'danger';
      case 'verified': return 'info';
      default: return 'secondary';
    }
  }, []);

  const getRoleVariant = useCallback((role) => {
    switch (role) {
      case 'mentor': return 'primary';
      case 'mentee': return 'success';
      case 'admin': return 'danger';
      default: return 'secondary';
    }
  }, []);

  const getRatingStars = useCallback((rating) => {
    if (!rating || rating === 0) return 'Not rated';
    const fullStars = '★'.repeat(Math.floor(rating));
    const emptyStars = '☆'.repeat(5 - Math.floor(rating));
    return (
      <span className="text-warning">
        {fullStars}{emptyStars}
        <small className="text-muted ms-1">({rating})</small>
      </span>
    );
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  return (
    <div>
      {/* Alert */}
      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
          {alert.message}
        </Alert>
      )}

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">Users Management</h1>
          <p className="text-muted">
            {loading.users ? 'Loading users...' : `Manage all users in the system (${users.length} total)`}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={loadUsers}
            disabled={loading.users}
          >
            <FaSync className={loading.users ? 'fa-spin' : ''} /> 
            Refresh
          </Button>
          <Button variant="primary">
            <FaUserPlus className="me-2" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="mentor">Mentors</option>
                <option value="mentee">Mentees</option>
                <option value="admin">Admins</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="outline-secondary" className="w-100" onClick={filterUsers}>
                <FaFilter className="me-2" />
                Filter
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">
            Users ({filteredUsers.length})
          </h6>
          {loading.users && <Spinner animation="border" size="sm" />}
        </Card.Header>
        <Card.Body style={{ padding: '0' }}>
          {loading.users ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading users...</p>
            </div>
          ) : (
            <Table responsive hover className="m-0">
              <thead className="bg-light">
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Sessions</th>
                  <th>Rating</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {user.avatar && (
                            <img 
                              src={user.avatar} 
                              alt={user.name}
                              className="rounded-circle me-3"
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <div className="font-weight-bold">{user.name}</div>
                            <small className="text-muted">{user.email}</small>
                            {user.designation && (
                              <div>
                                <small className="text-muted">{user.designation}</small>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg={getRoleVariant(user.role)} className="text-capitalize">
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Badge bg={getStatusVariant(user.status)} className="text-capitalize">
                            {user.status}
                          </Badge>
                          {user.isVerified && user.role === 'mentor' && (
                            <Badge bg="info" title="Verified Mentor">
                              <FaUserCheck size={10} />
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{user.sessionsCompleted || 0}</strong>
                        <div>
                          <small className="text-muted">completed</small>
                        </div>
                      </td>
                      <td>
                        {getRatingStars(user.rating)}
                      </td>
                      <td>
                        {formatDate(user.joinDate)}
                        <div>
                          <small className="text-muted">
                            {user.lastActive ? formatDate(user.lastActive) : 'Never'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {/* View Profile */}
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            title="View Profile"
                            disabled={loading.action}
                          >
                            <FaEye />
                          </Button>
                          
                          {/* Activate/Deactivate */}
                          {user.status === 'active' ? (
                            <Button 
                              size="sm" 
                              variant="outline-warning"
                              title="Deactivate User"
                              onClick={() => handleStatusChange(user.id, 'inactive')}
                              disabled={loading.action}
                            >
                              <FaUserSlash />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline-success"
                              title="Activate User"
                              onClick={() => handleStatusChange(user.id, 'active')}
                              disabled={loading.action}
                            >
                              <FaUserCheck />
                            </Button>
                          )}
                          
                          {/* Verify Mentor */}
                          {user.role === 'mentor' && !user.isVerified && (
                            <Button 
                              size="sm" 
                              variant="outline-info"
                              title="Verify Mentor"
                              onClick={() => handleVerification(user.id)}
                              disabled={loading.action}
                            >
                              <FaCheck /> Verify
                            </Button>
                          )}
                          
                          {/* Delete User */}
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            title="Delete User"
                            onClick={() => openDeleteModal(user)}
                            disabled={loading.action || user.role === 'admin'}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                        {user.role === 'admin' && (
                          <small className="text-muted d-block mt-1">Admin protected</small>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => !loading.action && setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete user <strong>{selectedUser?.name}</strong>? 
          </p>
          <p className="text-muted">
            This action will permanently remove the user account and all associated data. 
            This action cannot be undone.
          </p>
          {selectedUser?.role === 'mentor' && (
            <Alert variant="warning" className="mb-0">
              <strong>Warning:</strong> This user is a mentor. Deleting them may affect ongoing sessions.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={loading.action}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteUser} 
            disabled={loading.action}
          >
            {loading.action ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminUsers;

