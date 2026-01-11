import React, { useState, useEffect } from 'react';
import './ChatModule.css';

const ChatList = ({ chats, onSelectChat, onStartNewChat }) => {
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (content, maxLength = 40) => {
    if (!content) return 'No messages yet';
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h3>Conversations</h3>
        <div className="header-actions">
          <span className="chat-count">{chats.length}</span>
          <button 
            className="new-chat-btn"
            onClick={() => setShowNewChatModal(true)}
            title="Start new chat"
          >
            +
          </button>
        </div>
      </div>
      
      <div className="chats-container">
        {chats.length === 0 ? (
          <div className="no-chats">
            <p>No conversations yet</p>
            <span>Start a chat with a mentor or mentee!</span>
            <button 
              className="btn btn-primary mt-3"
              onClick={() => setShowNewChatModal(true)}
            >
              Start Your First Chat
            </button>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat._id}
              className="chat-item"
              onClick={() => onSelectChat(chat)}
            >
              <div className="chat-avatar">
                {chat.otherParticipant?.profileImage ? (
                  <img 
                    src={chat.otherParticipant.profileImage} 
                    alt={chat.otherParticipant.name} 
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {chat.otherParticipant?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                {chat.unreadCount > 0 && (
                  <span className="unread-badge">{chat.unreadCount}</span>
                )}
              </div>
              
              <div className="chat-info">
                <div className="chat-header">
                  <h4>{chat.otherParticipant?.name || 'Unknown User'}</h4>
                  <span className="chat-time">
                    {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                  </span>
                </div>
                
                <div className="chat-preview">
                  <p className="last-message">
                    {truncateMessage(chat.lastMessage?.content)}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="unread-indicator"></span>
                  )}
                </div>
                
                <div className="chat-meta">
                  <span className="partner-role">
                    {chat.otherParticipant?.role || 'User'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal 
          onClose={() => setShowNewChatModal(false)}
          onStartChat={onStartNewChat}
        />
      )}
    </div>
  );
};

// New Chat Modal Component
const NewChatModal = ({ onClose, onStartChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Load available users from API
  useEffect(() => {
    // In ChatList.jsx, update the loadAvailableUsers function:
const loadAvailableUsers = async () => {
  try {
    setIsLoadingUsers(true);
    const token = localStorage.getItem('token');
    
    // FIXED: CORRECT ENDPOINT - /api/chat/users/available
    const response = await fetch('https://mentorpulse.onrender.com/api/chat/users/available', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setAvailableUsers(data.data || []);
    } else {
      console.error('Failed to load available users:', response.status);
    }
  } catch (error) {
    console.error('Failed to load available users:', error);
  } finally {
    setIsLoadingUsers(false);
  }
};
    loadAvailableUsers();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Filter from real users
    const results = availableUsers.filter(user => 
      user.name.toLowerCase().includes(term.toLowerCase()) ||
      user.email.toLowerCase().includes(term.toLowerCase())
    );
    
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleStartChat = (user) => {
    onStartChat(user._id);
    onClose();
  };

  // Get quick users (first 3 available users)
  const quickUsers = availableUsers.slice(0, 3);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h4>Start New Chat</h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for mentors or mentees..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            {isSearching && <div className="search-spinner">Searching...</div>}
          </div>

          <div className="search-results">
            {isLoadingUsers ? (
              <div className="loading-users">
                <p>Loading users...</p>
              </div>
            ) : (
              <>
                {searchResults.map(user => (
                  <div key={user._id} className="user-result" onClick={() => handleStartChat(user)}>
                    <div className="user-avatar">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} />
                      ) : (
                        <div className="avatar-placeholder small">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <h5>{user.name}</h5>
                      <p>{user.email}</p>
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </div>
                    <button className="start-chat-btn">Chat</button>
                  </div>
                ))}
                
                {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
                  <div className="no-results">
                    <p>No users found matching "{searchTerm}"</p>
                  </div>
                )}
              </>
            )}
          </div>

          {!isLoadingUsers && availableUsers.length > 0 && (
            <div className="quick-actions">
              <h5>Quick Start</h5>
              <div className="quick-users">
                {quickUsers.map(user => (
                  <button 
                    key={user._id}
                    className="quick-user-btn"
                    onClick={() => handleStartChat(user)}
                  >
                    <div className="quick-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isLoadingUsers && availableUsers.length === 0 && (
            <div className="no-results">
              <p>No users available to chat with</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
