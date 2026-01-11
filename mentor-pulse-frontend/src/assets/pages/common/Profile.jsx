import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaPlus, 
  FaUser, 
  FaEnvelope, 
  FaCalendar,
  FaAward,
  FaLinkedin,
  FaCamera,
  FaGithub,
  FaTwitter,
  FaBriefcase,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaGlobe,
  FaSpinner,
  FaStar,
  FaComments,
  FaThumbsUp,
  FaChartLine
} from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [formData, setFormData] = useState({
    designation: '',
    bio: '',
    skills: [],
    location: '',
    website: '',
    avatar: '',
    socialLinks: { linkedin: '', github: '', twitter: '' }
  });
  const [newSkill, setNewSkill] = useState('');

  // Fetch feedback data with useCallback to avoid infinite re-renders
  const fetchFeedbackData = useCallback(async () => {
    if (user.role === 'mentor' && user._id) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`https://mentorpulse.onrender.com/api/feedback/mentor/${user._id}?limit=3`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setFeedbackStats(response.data.data.statistics);
          setRecentFeedback(response.data.data.feedback);
        }
      } catch (error) {
        console.error('Error fetching feedback data:', error);
      }
    }
  }, [user._id, user.role]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user.role === 'mentor') {
      fetchFeedbackData();
    }
  }, [user.role, fetchFeedbackData]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login first');
        setLoading(false);
        return;
      }

      const response = await axios.get('https://mentorpulse.onrender.com/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Profile API response:', response.data);
      
      // FIXED: Response.data is the user object directly, not nested under 'user'
      const userData = response.data;
      setUser(userData);
      
      // Ensure avatar URL is properly formatted
      let avatarUrl = userData.avatar || '';
      if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
        avatarUrl = `https://mentorpulse.onrender.com/api${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
      }

      setFormData({
        designation: userData.designation || '',
        bio: userData.bio || '',
        skills: userData.skills || [],
        location: userData.location || '',
        website: userData.website || '',
        avatar: avatarUrl,
        socialLinks: userData.socialLinks || { linkedin: '', github: '', twitter: '' }
      });
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      toast.error('Error loading profile');
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', file);

      console.log('📤 Uploading avatar...', file);

      const response = await axios.post(
        'https://mentorpulse.onrender.com/api/auth/upload-avatar',
        uploadFormData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('✅ Avatar upload response:', response.data);
      
      if (response.data.success) {
        // FIXED: Use the user object from response
        const updatedUser = response.data.user || response.data;
        
        setUser(updatedUser);
        
        let avatarUrl = updatedUser.avatar || '';
        if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
          avatarUrl = `https://mentorpulse.onrender.com/api${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
        }

        console.log('🖼️ Final avatar URL:', avatarUrl);

        setFormData(prev => ({ ...prev, avatar: avatarUrl }));
        
        // Update localStorage if needed
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser._id === updatedUser._id) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        toast.success('Profile picture updated successfully! 📸');
        
        // Refresh the profile to get updated data
        setTimeout(() => {
          fetchUserProfile();
        }, 500);
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error('❌ Image upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload image';
      toast.error(`Upload failed: ${errorMessage}`);
      
      // Reset to previous avatar on error
      setFormData(prev => ({ ...prev, avatar: user.avatar }));
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Create immediate preview
      const previewUrl = URL.createObjectURL(file);
      console.log('🖼️ Created preview URL:', previewUrl);
      
      // Update form data with preview
      setFormData(prev => ({ ...prev, avatar: previewUrl }));
      
      // Upload to server
      handleImageUpload(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login first');
        setLoading(false);
        return;
      }

      console.log('📝 Submitting profile update:', {
        designation: formData.designation,
        bio: formData.bio,
        skills: formData.skills,
        location: formData.location,
        website: formData.website,
        socialLinks: formData.socialLinks
      });

      const response = await axios.put(
        'https://mentorpulse.onrender.com/api/auth/profile',
        {
          name: user.name, // Keep original name
          designation: formData.designation,
          bio: formData.bio,
          skills: formData.skills,
          location: formData.location,
          website: formData.website,
          socialLinks: formData.socialLinks,
          // Don't send avatar here - it should only be updated via upload-avatar endpoint
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Profile update response:', response.data);

      // FIXED: Update state with data from backend
      const updatedUser = response.data;
      setUser(updatedUser);
      
      // Update localStorage if needed
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser._id === updatedUser._id) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      // Update formData with the response data
      let avatarUrl = updatedUser.avatar || '';
      if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
        avatarUrl = `https://mentorpulse.onrender.com/api${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
      }
      
      setFormData({
        designation: updatedUser.designation || '',
        bio: updatedUser.bio || '',
        skills: updatedUser.skills || [],
        location: updatedUser.location || '',
        website: updatedUser.website || '',
        avatar: avatarUrl,
        socialLinks: updatedUser.socialLinks || { linkedin: '', github: '', twitter: '' }
      });
      
      toast.success('Profile updated successfully! 🎉');
      setEditing(false);
      
    } catch (error) {
      console.error('❌ Update error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData({
      ...formData,
      socialLinks: {
        ...formData.socialLinks,
        [platform]: value
      }
    });
  };

  // Star Rating Component
  const StarRating = ({ rating, size = 'medium' }) => {
    const starSize = size === 'large' ? '1.5rem' : size === 'small' ? '0.875rem' : '1rem';
    
    return (
      <div className="star-rating-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`star ${star <= rating ? 'filled' : 'empty'}`}
            style={{ 
              fontSize: starSize,
              color: star <= rating ? '#ffc107' : '#e4e5e9'
            }}
          />
        ))}
        <span className="rating-text ms-2">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Feedback Item Component
  const FeedbackItem = ({ feedback }) => (
    <div className="feedback-item">
      <div className="feedback-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {feedback.mentee?.profileImage ? (
              <img 
                src={feedback.mentee.profileImage} 
                alt={feedback.mentee.name}
                className="rounded-circle"
              />
            ) : (
              <div className="avatar-placeholder">
                {feedback.mentee?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="reviewer-details">
            <h6 className="mb-0">
              {feedback.isAnonymous ? 'Anonymous' : feedback.mentee?.name || 'User'}
            </h6>
            <small className="text-muted">
              {new Date(feedback.createdAt).toLocaleDateString()}
            </small>
          </div>
        </div>
        <StarRating rating={feedback.rating} size="small" />
      </div>
      
      {feedback.comment && (
        <div className="feedback-comment">
          <p className="mb-0">{feedback.comment}</p>
        </div>
      )}

      {feedback.categories && Object.values(feedback.categories).some(val => val > 0) && (
        <div className="category-ratings">
          {Object.entries(feedback.categories)
            .filter(([, value]) => value > 0)
            .map(([category, value]) => (
              <div key={category} className="category-rating">
                <span className="category-label">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
                <StarRating rating={value} size="small" />
              </div>
            ))}
        </div>
      )}

      {feedback.wouldRecommend && (
        <div className="recommendation-badge">
          <FaThumbsUp className="me-1" />
          Would recommend
        </div>
      )}
    </div>
  );

  // Get the current avatar URL to display
  const getCurrentAvatar = () => {
    // Priority: formData.avatar (latest) -> user.avatar -> default
    const currentAvatar = formData.avatar || user.avatar;
    
    if (currentAvatar) {
      // If it's a blob URL (preview) or already absolute URL, use it directly
      if (currentAvatar.startsWith('blob:') || currentAvatar.startsWith('http') || currentAvatar.startsWith('data:')) {
        return currentAvatar;
      }
      // If it's a relative path, make it absolute
      return `https://mentorpulse.onrender.com/api${currentAvatar.startsWith('/') ? '' : '/'}${currentAvatar}`;
    }
    
    return '/default-avatar.png';
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-8">
          {/* Header Card */}
          <div className="card profile-card gradient-bg text-white mb-4">
            <div className="card-body text-center p-5">
              <div className="position-relative d-inline-block">
                <div className="avatar-container">
                  <img
                    src={getCurrentAvatar()}
                    alt="Profile"
                    className="profile-avatar rounded-circle mb-3"
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      objectFit: 'cover',
                      border: '4px solid white'
                    }}
                    onError={(e) => {
                      console.log('🖼️ Image failed to load, using default');
                      e.target.src = '/default-avatar.png';
                    }}
                    onLoad={(e) => {
                      console.log('🖼️ Image loaded successfully:', e.target.src);
                    }}
                  />
                  <label className="avatar-upload-btn">
                    {uploading ? (
                      <FaSpinner className="text-white spin" />
                    ) : (
                      <FaCamera className="text-white" />
                    )}
                    <input
                      type="file"
                      className="d-none"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
              
              <h2 className="display-5 fw-bold mb-2">{user.name}</h2>
              <p className="lead mb-3">{formData.designation}</p>
              
              {/* Rating Display for Mentors */}
              {user.role === 'mentor' && feedbackStats && (
                <div className="rating-display-main mb-3">
                  <div className="d-flex align-items-center justify-content-center gap-3">
                    <div className="average-rating">
                      <span className="rating-number h4 mb-0">
                        {feedbackStats.averageRating}
                      </span>
                      <StarRating rating={Math.round(feedbackStats.averageRating)} size="large" />
                      <small className="text-white-50">
                        ({feedbackStats.totalReviews} reviews)
                      </small>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Professional Badges */}
              <div className="professional-badges-container">
                <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                  <span className="badge bg-light text-dark text-capitalize professional-badge">
                    {user.role}
                  </span>
                  {user.isVerified && (
                    <span className="badge bg-success professional-badge">
                      <FaAward className="me-1" /> Verified
                    </span>
                  )}
                  {formData.location && (
                    <span className="badge bg-info professional-badge">
                      <FaMapMarkerAlt className="me-1" /> {formData.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="row">
            {/* Left Column - Personal Info */}
            <div className="col-md-5 mb-4">
              <div className="card profile-card h-100">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 gradient-text">
                    <FaUser className="me-2" /> 
                    {editing ? 'Edit Professional Profile' : 'Professional Information'}
                  </h5>
                  {editing && (
                    <span className="badge bg-warning">
                      <FaEdit className="me-1" /> Editing
                    </span>
                  )}
                </div>
                <div className="card-body">
                  {/* Read-only Fields - Always visible */}
                  <div className="read-only-field">
                    <label className="form-label text-muted">
                      <FaEnvelope className="me-2" /> Email Address
                    </label>
                    <p className="fs-6">{user.email}</p>
                  </div>

                  <div className="read-only-field">
                    <label className="form-label text-muted">Full Name</label>
                    <p className="fs-6">{user.name}</p>
                  </div>

                  <div className="read-only-field">
                    <label className="form-label text-muted">Account Role</label>
                    <p className="fs-6">
                      <span className="badge bg-info text-capitalize">{user.role}</span>
                    </p>
                  </div>

                  {/* Editable Fields - Only in edit mode */}
                  {editing ? (
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label className="form-label">
                          <FaBriefcase className="me-2" /> Designation/Title
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.designation}
                          onChange={(e) => setFormData({...formData, designation: e.target.value})}
                          placeholder="e.g., Senior Developer, Product Manager"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">
                          <FaMapMarkerAlt className="me-2" /> Location
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          placeholder="e.g., San Francisco, CA"
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">
                          <FaGlobe className="me-2" /> Website/Portfolio
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          value={formData.website}
                          onChange={(e) => setFormData({...formData, website: e.target.value})}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Professional Bio</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={formData.bio}
                          onChange={(e) => setFormData({...formData, bio: e.target.value})}
                          placeholder="Tell your professional story..."
                          style={{ resize: 'none' }}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Skills & Expertise</label>
                        <div className="d-flex gap-2 mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Add a skill (e.g., React, Python)"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          />
                          <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={addSkill}
                          >
                            <FaPlus />
                          </button>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {formData.skills.map((skill, index) => (
                            <span key={index} className="skill-badge badge bg-primary">
                              {skill}
                              <button
                                type="button"
                                className="ms-2 btn-close btn-close-white"
                                onClick={() => removeSkill(skill)}
                                style={{ fontSize: '0.6rem' }}
                              />
                            </span>
                          ))}
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="read-only-field">
                        <label className="form-label text-muted">
                          <FaBriefcase className="me-2" /> Designation
                        </label>
                        <p className="fs-6">{formData.designation || 'Not specified'}</p>
                      </div>

                      <div className="read-only-field">
                        <label className="form-label text-muted">
                          <FaMapMarkerAlt className="me-2" /> Location
                        </label>
                        <p className="fs-6">{formData.location || 'Not specified'}</p>
                      </div>

                      <div className="read-only-field">
                        <label className="form-label text-muted">
                          <FaGlobe className="me-2" /> Website
                        </label>
                        <p className="fs-6">
                          {formData.website ? (
                            <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              {formData.website}
                            </a>
                          ) : 'Not specified'}
                        </p>
                      </div>

                      <div className="read-only-field">
                        <label className="form-label text-muted">Professional Bio</label>
                        <p className="fs-6">{formData.bio || 'No bio yet. Share your professional story!'}</p>
                      </div>

                      <div className="read-only-field">
                        <label className="form-label text-muted">Skills & Expertise</label>
                        <div>
                          {formData.skills.length > 0 ? (
                            formData.skills.map((skill, index) => (
                              <span key={index} className="skill-badge badge bg-primary me-1 mb-1">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-muted">No skills added yet</p>
                          )}
                        </div>
                      </div>

                      <div className="read-only-field">
                        <label className="form-label text-muted">
                          <FaCalendar className="me-2" /> Member Since
                        </label>
                        <p className="fs-6">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Social, Stats & Feedback */}
            <div className="col-md-7">
              {/* Social Links Card */}
              <div className="card profile-card mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0 gradient-text">
                    <FaGlobe className="me-2" /> Social Presence
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {['linkedin', 'github', 'twitter'].map((platform) => (
                      <div className="col-md-6" key={platform}>
                        <label className="form-label">
                          {platform === 'linkedin' && <FaLinkedin className="me-2 text-primary" />}
                          {platform === 'github' && <FaGithub className="me-2" />}
                          {platform === 'twitter' && <FaTwitter className="me-2 text-info" />}
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </label>
                        {editing ? (
                          <input
                            type="url"
                            className="form-control"
                            placeholder={`https://${platform}.com/username`}
                            value={formData.socialLinks[platform]}
                            onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                          />
                        ) : (
                          <div className="read-only-field">
                            {formData.socialLinks[platform] ? (
                              <a 
                                href={formData.socialLinks[platform]} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-decoration-none"
                              >
                                {formData.socialLinks[platform]}
                              </a>
                            ) : (
                              <span className="text-muted">Not connected</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feedback & Ratings Card (For Mentors) */}
              {user.role === 'mentor' && feedbackStats && (
                <div className="card profile-card mb-4">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 gradient-text">
                      <FaStar className="me-2" /> Ratings & Reviews
                    </h5>
                    <span className="badge bg-primary">
                      {feedbackStats.totalReviews} reviews
                    </span>
                  </div>
                  <div className="card-body">
                    {/* Rating Statistics */}
                    <div className="rating-stats mb-4">
                      <div className="row text-center">
                        <div className="col-4">
                          <div className="h3 text-primary mb-1">
                            {feedbackStats.averageRating}
                          </div>
                          <small className="text-muted">Average Rating</small>
                        </div>
                        <div className="col-4">
                          <div className="h3 text-success mb-1">
                            {feedbackStats.totalReviews}
                          </div>
                          <small className="text-muted">Total Reviews</small>
                        </div>
                        <div className="col-4">
                          <div className="h3 text-warning mb-1">
                            {Math.round((feedbackStats.averageRating / 5) * 100)}%
                          </div>
                          <small className="text-muted">Satisfaction</small>
                        </div>
                      </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="rating-distribution mb-4">
                      <h6 className="mb-3">Rating Distribution</h6>
                      {feedbackStats.distribution.map(({ star, count }) => {
                        const percentage = feedbackStats.totalReviews > 0 
                          ? (count / feedbackStats.totalReviews) * 100 
                          : 0;
                        
                        return (
                          <div key={star} className="distribution-item mb-2">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center">
                                <span className="me-2">{star} star</span>
                                <StarRating rating={star} size="small" />
                              </div>
                              <div className="distribution-bar-container flex-grow-1 mx-3">
                                <div 
                                  className="distribution-bar"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-muted">({count})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Recent Reviews */}
                    {recentFeedback.length > 0 && (
                      <div className="recent-reviews">
                        <h6 className="mb-3">Recent Reviews</h6>
                        <div className="feedback-list">
                          {recentFeedback.map((feedback) => (
                            <FeedbackItem key={feedback._id} feedback={feedback} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Card */}
              <div className="card profile-card mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0 gradient-text">
                    <FaChartLine className="me-2" /> Professional Stats
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="h3 text-primary mb-1">12</div>
                      <small className="text-muted">Sessions</small>
                    </div>
                    <div className="col-4">
                      <div className="h3 text-success mb-1">8</div>
                      <small className="text-muted">Completed</small>
                    </div>
                    <div className="col-4">
                      <div className="h3 text-warning mb-1">
                        {user.role === 'mentor' && feedbackStats ? feedbackStats.averageRating.toFixed(1) : '4.9'}
                      </div>
                      <small className="text-muted">Rating</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                {editing ? (
                  <>
                    <button 
                      type="submit" 
                      className="btn btn-success btn-lg"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="me-2 spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" /> Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-lg"
                      onClick={() => setEditing(false)}
                      disabled={loading}
                    >
                      <FaTimes className="me-2" /> Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setEditing(true)}
                  >
                    <FaEdit className="me-2" /> Edit Professional Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

