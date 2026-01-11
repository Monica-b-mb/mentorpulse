import React from 'react';
import { Row, Col, Card, Table, Badge } from 'react-bootstrap';

const AdminSessions = ({ sessions }) => {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'upcoming': return 'info';
      case 'scheduled': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getTypeVariant = (type) => {
    return type === 'video' ? 'primary' : 'success';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">Sessions Management</h1>
          <p className="text-muted">Manage all mentoring sessions</p>
        </div>
      </div>

      {/* Sessions Table */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-0">
          <h6 className="m-0 font-weight-bold text-primary">All Sessions</h6>
        </Card.Header>
        <Card.Body style={{ padding: '0' }}>
          <Table responsive hover className="m-0">
            <thead className="bg-light">
              <tr>
                <th>Mentor</th>
                <th>Mentee</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Topic</th>
                <th>Type</th>
                <th>Status</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <tr key={session.id}>
                  <td className="font-weight-bold">{session.mentor.name}</td>
                  <td>{session.mentee.name}</td>
                  <td>
                    <div>{new Date(session.date).toLocaleDateString()}</div>
                    <small className="text-muted">{session.time}</small>
                  </td>
                  <td>{session.duration} mins</td>
                  <td>{session.topic}</td>
                  <td>
                    <Badge bg={getTypeVariant(session.type)} className="text-capitalize">
                      {session.type}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={getStatusVariant(session.status)} className="text-capitalize">
                      {session.status}
                    </Badge>
                  </td>
                  <td>
                    {session.rating ? (
                      <span className="text-warning">
                        {'★'.repeat(session.rating)}
                        {'☆'.repeat(5 - session.rating)}
                      </span>
                    ) : (
                      <span className="text-muted">Not rated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminSessions;