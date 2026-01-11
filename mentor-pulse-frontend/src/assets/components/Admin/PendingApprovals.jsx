import React from 'react';

const PendingApprovals = () => {
  const pendingItems = [
    { id: 1, type: 'Mentor Application', user: 'Dr. Emily Chen', submitted: '2 hours ago' },
    { id: 2, type: 'Profile Update', user: 'John Smith', submitted: '5 hours ago' },
    { id: 3, type: 'Content Submission', user: 'Tech Tutorials Inc.', submitted: '1 day ago' }
  ];

  return (
    <div className="card border-0 shadow h-100">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h6 className="m-0 font-weight-bold text-primary">Pending Approvals</h6>
        <span className="badge bg-danger rounded-pill">{pendingItems.length}</span>
      </div>
      <div className="card-body">
        <div className="list-group list-group-flush">
          {pendingItems.map(item => (
            <div key={item.id} className="list-group-item border-0 px-0 py-2">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1">{item.type}</h6>
                  <small className="text-muted">By: {item.user}</small>
                  <br />
                  <small className="text-muted">{item.submitted}</small>
                </div>
                <div>
                  <button className="btn btn-success btn-sm me-1" title="Approve">
                    ✓
                  </button>
                  <button className="btn btn-danger btn-sm" title="Reject">
                    ✗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-3">
          <button className="btn btn-outline-primary btn-sm">
            View All Pending Items
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovals;

