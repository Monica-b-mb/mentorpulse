import React from 'react';
import WeeklyCalendar from '../../components/Availability/WeeklyCalendar';

const Availability = () => {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0 text-gray-800">Manage Availability</h1>
              <p className="text-muted mb-0">Set your weekly available time slots for sessions</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary">
                View Calendar
              </button>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-8">
              <WeeklyCalendar />
            </div>
            
            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-header bg-info text-white">
                  <h6 className="mb-0">Availability Guide</h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <h6>How it works:</h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">✅ Click time slots to mark availability</li>
                      <li className="mb-2">✅ Green indicates available times</li>
                      <li className="mb-2">✅ Set consistent weekly patterns</li>
                      <li className="mb-2">✅ Remember to save changes</li>
                    </ul>
                  </div>

                  <div className="mb-3">
                    <h6>Best Practices:</h6>
                    <ul className="list-unstyled">
                      <li className="mb-1">• Set buffer time between sessions</li>
                      <li className="mb-1">• Consider your timezone differences</li>
                      <li className="mb-1">• Update exceptions for holidays/vacations</li>
                      <li className="mb-1">• Keep availability up-to-date</li>
                    </ul>
                  </div>

                  <div className="alert alert-warning">
                    <small>
                      <strong>Note:</strong> Your availability will be visible to mentees
                      looking to book sessions with you. Changes take effect immediately.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Availability;

