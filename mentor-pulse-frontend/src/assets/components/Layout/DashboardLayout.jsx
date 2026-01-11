import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Footer from '../Footer/Footer';

const DashboardLayout = ({ children }) => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content-with-sidebar flex-grow-1">
        <div className="container-fluid p-4">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
