import React from 'react';

const RecentUsers = () => {
  const recentUsers = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'mentor', joined: '2 hours ago' },
    { id: 2, name: 'Mike Chen', email: 'mike@example.com', role: 'mentee', joined: '5 hours ago' },
    { id: 3, name: 'Emily Davis', email: 'emily@example.com', role: 'mentor', joined: '1 day ago' },
    { id: 4, name: 'David Wilson', email: 'david@example.com', role: 'mentee', joined: '1 day ago' }
  ];

  return (
    <div className="card border-0 shadow h-100">
      <div className="card-header bg-white py-3">
        <h6 className="m-0 font-weight-bold text-primary">Recent Sign-ups</h6>
      </div>
      <div className="card-body">
        <div className="list-group list-group-flush">
          {recentUsers.map(user => (
            <div key={user.id} className="list-group-item border-0 px-0 py-2">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0">{user.name}</h6>
                  <small className="text-muted">{user.email}</small>
                </div>
                <div className="text-end">
                  <span className={`badge bg-${user.role === 'mentor' ? 'info' : 'success'} rounded-pill`}>
                    {user.role}
                  </span>
                  <br />
                  <small className="text-muted">{user.joined}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentUsers;
