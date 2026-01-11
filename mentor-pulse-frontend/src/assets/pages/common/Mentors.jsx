import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUsers,
  FaFilter,
  FaPlus,
  FaExclamationTriangle,
  FaSync,
  FaSearch
} from 'react-icons/fa';
import MentorCard from '../../components/DashboardWidgets/Mentor/MentorCard';
import { mentorService } from '../../services/mentorService';
import './Mentors.css';

const Mentors = () => {
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    skills: '',
    availability: '',
    rating: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🚀 Starting to fetch mentors from backend...');
      const mentorsData = await mentorService.getAllMentors();
      console.log('📦 Received mentors data:', mentorsData);
      
      if (mentorsData && mentorsData.length > 0) {
        setMentors(mentorsData);
        setFilteredMentors(mentorsData);
        console.log('✅ Successfully loaded', mentorsData.length, 'real mentors');
      } else {
        console.log('ℹ️ No mentors found in database');
        setError('No mentors found in the system');
        setMentors([]);
        setFilteredMentors([]);
      }
    } catch (err) {
      console.error('❌ Failed to load mentors:', err);
      setError('Failed to load mentors. Please check your connection and try again.');
      setMentors([]);
      setFilteredMentors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  // Filter mentors based on search criteria
  useEffect(() => {
    let results = mentors;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(mentor =>
        mentor.name?.toLowerCase().includes(term) ||
        mentor.designation?.toLowerCase().includes(term) ||
        (mentor.skills && mentor.skills.some(skill =>
          skill.toLowerCase().includes(term)
        )) ||
        (mentor.bio && mentor.bio.toLowerCase().includes(term))
      );
    }

    if (filters.skills) {
      results = results.filter(mentor =>
        mentor.skills && mentor.skills.some(skill =>
          skill.toLowerCase().includes(filters.skills.toLowerCase())
        )
      );
    }

    if (filters.availability) {
      results = results.filter(mentor =>
        mentor.availability === filters.availability.toLowerCase()
      );
    }

    if (filters.rating) {
      results = results.filter(mentor =>
        mentor.rating >= parseFloat(filters.rating)
      );
    }

    setFilteredMentors(results);
  }, [filters, mentors]);

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ search: '', skills: '', availability: '', rating: '' });
  };

  const handleRetry = () => {
    setError('');
    fetchMentors();
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading mentors...</span>
        </div>
        <p className="mt-3 text-muted">Loading professional mentors from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-5 text-center">
        <FaExclamationTriangle className="text-warning mb-3" size={48} />
        <h5>Oops! Something went wrong</h5>
        <p className="text-muted mb-4">{error}</p>
        <button className="btn btn-primary" onClick={handleRetry}>
          <FaSync className="me-2" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 text-primary mb-1">
            <FaUsers className="me-2" /> Find Your Mentor
          </h1>
          <p className="text-muted mb-0">
            Connect with experienced professionals ready to guide you
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={fetchMentors}>
            <FaSync className="me-2" /> Refresh
          </button>
          <button className="btn btn-primary">
            <FaPlus className="me-2" /> Become a Mentor
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="alert alert-info mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Database Connection:</strong> {mentors.length} mentors found |
            Showing {filteredMentors.length} after filtering
          </div>
          <button
            className="btn btn-sm btn-outline-info"
            onClick={() => {
              console.log('🧪 All mentors:', mentors);
              console.log('🧪 Filtered mentors:', filteredMentors);
            }}
          >
            Debug Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">
                <FaSearch className="me-2" /> Search Mentors
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, skills, or expertise..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Skills</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., React, Python"
                value={filters.skills}
                onChange={(e) => handleFilterChange('skills', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Availability</label>
              <select
                className="form-select"
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
              >
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="away">Away</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Min Rating</label>
              <select
                className="form-select"
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
              >
                <option value="">All</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-outline-secondary btn-sm" onClick={handleClearFilters}>
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <span className="text-muted">
          Showing {filteredMentors.length} of {mentors.length} mentors
        </span>
        <div className="d-flex align-items-center">
          <FaFilter className="me-2 text-muted" />
          <select className="form-select form-select-sm" style={{ width: '120px' }}>
            <option>Sort by: Rating</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Availability</option>
          </select>
        </div>
      </div>

      {/* Mentors Grid */}
      {filteredMentors.length === 0 ? (
        <div className="text-center py-5">
          <FaUsers size={48} className="text-muted mb-3" />
          <h5>No mentors found</h5>
          <p className="text-muted">Try adjusting your filters to see more results</p>
          <button className="btn btn-outline-primary" onClick={handleClearFilters}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {filteredMentors.map(mentor => (
            <div key={mentor._id} className="col">
              <MentorCard mentor={mentor} />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {mentors.length === 0 && !loading && (
        <div className="text-center py-5">
          <FaUsers size={64} className="text-muted mb-3" />
          <h4>No Mentors Available</h4>
          <p className="text-muted mb-4">
            There are currently no mentors in the system.
            Check back later or contact support.
          </p>
          <button className="btn btn-primary" onClick={fetchMentors}>
            <FaSync className="me-2" /> Check Again
          </button>
        </div>
      )}
    </div>
  );
};

export default Mentors;
