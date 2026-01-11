import React from 'react';

const StatsCard = ({ title, value, icon, color = 'primary', subtitle }) => {
  const colorClasses = {
    primary: 'bg-primary text-white',
    success: 'bg-success text-white', 
    warning: 'bg-warning text-dark',
    info: 'bg-info text-white',
    danger: 'bg-danger text-white'
  };

  return (
    <div className="col-xl-3 col-md-6 mb-4">
      <div className={`card border-0 shadow-sm h-100 py-2 ${colorClasses[color]}`}>
        <div className="card-body">
          <div className="row no-gutters align-items-center">
            <div className="col mr-2">
              <div className="text-xs font-weight-bold text-uppercase mb-1">
                {title}
              </div>
              <div className="h5 mb-0 font-weight-bold">{value}</div>
              {subtitle && <div className="mt-1 small">{subtitle}</div>}
            </div>
            <div className="col-auto">
              <div className="h2">{icon}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;