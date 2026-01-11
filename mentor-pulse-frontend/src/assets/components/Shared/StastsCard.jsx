import React from 'react';

const StatsCard = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    primary: 'border-left-primary',
    success: 'border-left-success', 
    warning: 'border-left-warning',
    info: 'border-left-info',
    danger: 'border-left-danger'
  };

  const textColors = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-info',
    danger: 'text-danger'
  };

  return (
    <div className="col-xl-3 col-md-6 mb-4">
      <div className={`card ${colorClasses[color] || 'border-left-primary'} shadow h-100 py-2`}>
        <div className="card-body">
          <div className="row no-gutters align-items-center">
            <div className="col mr-2">
              <div className={`text-xs font-weight-bold ${textColors[color] || 'text-primary'} text-uppercase mb-1`}>
                {title}
              </div>
              <div className="h5 mb-0 font-weight-bold text-gray-800">{value}</div>
              {subtitle && (
                <div className="text-xs text-muted mt-1">{subtitle}</div>
              )}
            </div>
            <div className="col-auto">
              <div className="text-gray-300" style={{ fontSize: '2rem' }}>
                {icon}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

