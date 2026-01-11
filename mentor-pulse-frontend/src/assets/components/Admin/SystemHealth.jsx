import React from 'react';

const SystemHealth = () => {
  const systemMetrics = [
    { name: 'API Response Time', value: '128ms', status: 'good' },
    { name: 'Database Load', value: '24%', status: 'good' },
    { name: 'Active Connections', value: '87', status: 'normal' },
    { name: 'Error Rate', value: '0.2%', status: 'good' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'good': return 'success';
      case 'normal': return 'warning';
      case 'critical': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="card border-0 shadow h-100">
      <div className="card-header bg-white py-3">
        <h6 className="m-0 font-weight-bold text-primary">System Health</h6>
      </div>
      <div className="card-body">
        {systemMetrics.map(metric => (
          <div key={metric.name} className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted">{metric.name}</span>
              <span className={`badge bg-${getStatusColor(metric.status)}`}>
                {metric.value}
              </span>
            </div>
            <div className="progress mt-1" style={{ height: '5px' }}>
              <div 
                className={`progress-bar bg-${getStatusColor(metric.status)}`}
                style={{ width: metric.status === 'good' ? '85%' : metric.status === 'normal' ? '65%' : '40%' }}
              ></div>
            </div>
          </div>
        ))}
        <div className="text-center mt-3">
          <button className="btn btn-outline-primary btn-sm">
            View Detailed Metrics
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;

