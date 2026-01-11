import React from 'react';

const AdminStats = () => {
  const stats = [
    {
      title: "TOTAL USERS",
      value: "1,248", 
      icon: "👥",
      color: "primary",
      subtitle: "+12% this month"
    },
    {
      title: "ACTIVE SESSIONS",
      value: "47",
      icon: "📊", 
      color: "success",
      subtitle: "Live now"
    },
    {
      title: "PENDING REQUESTS", 
      value: "8",
      icon: "⏳",
      color: "warning",
      subtitle: "Need approval"
    },
    {
      title: "PLATFORM RATING",
      value: "4.8/5",
      icon: "⭐",
      color: "info", 
      subtitle: "From 284 reviews"
    }
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <div key={index} className="col-xl-3 col-md-6 mb-4">
          <div className={`card border-left-${stat.color} shadow h-100 py-2`}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className={`text-xs font-weight-bold text-${stat.color} text-uppercase mb-1`}>
                    {stat.title}
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stat.value}</div>
                  {stat.subtitle && (
                    <div className="text-xs text-muted mt-1">{stat.subtitle}</div>
                  )}
                </div>
                <div className="col-auto">
                  <div className="text-gray-300" style={{ fontSize: '2rem' }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default AdminStats;