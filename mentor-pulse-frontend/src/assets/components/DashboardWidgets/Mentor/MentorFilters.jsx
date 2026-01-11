import React from 'react';
import { FaFilter, FaSearch, FaTimes } from 'react-icons/fa';

const MentorFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const skillOptions = ['React', 'Node.js', 'Python', 'JavaScript', 'AWS', 'UI/UX', 'DevOps', 'Machine Learning'];
  const availabilityOptions = ['Available Now', 'This Week', 'Next Week'];

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="row g-3">
          {/* Search */}
          <div className="col-md-4">
            <label className="form-label">Search Mentors</label>
            <div className="input-group">
              <span className="input-group-text">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or skills..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Skills Filter */}
          <div className="col-md-3">
            <label className="form-label">Skills</label>
            <select
              className="form-select"
              value={filters.skills}
              onChange={(e) => onFilterChange('skills', e.target.value)}
            >
              <option value="">All Skills</option>
              {skillOptions.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="col-md-3">
            <label className="form-label">Availability</label>
            <select
              className="form-select"
              value={filters.availability}
              onChange={(e) => onFilterChange('availability', e.target.value)}
            >
              <option value="">Any Time</option>
              {availabilityOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="col-md-2 d-flex align-items-end">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={onClearFilters}
            >
              <FaTimes className="me-1" /> Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorFilters;