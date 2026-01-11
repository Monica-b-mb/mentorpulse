import React from 'react';
import './ChatModule.css';

const MessageItem = ({ message, isOwnMessage }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Determine delivery status
  const getDeliveryStatus = () => {
    if (!isOwnMessage) return null;
    
    if (message.isSeen) {
      return '✓✓ Seen';
    } else if (message.isDelivered) {
      return '✓✓ Delivered';
    } else if (!message.isTemp) {
      return '✓ Sent';
    } else {
      return '⏳ Sending...';
    }
  };

  return (
    <div className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}>
      {!isOwnMessage && message.sender && (
        <div className="message-avatar">
          {message.sender.profileImage ? (
            <img src={message.sender.profileImage} alt={message.sender.name} />
          ) : (
            <div className="avatar-initials">
              {getInitials(message.sender.name)}
            </div>
          )}
        </div>
      )}
      
      <div className="message-content">
        {!isOwnMessage && message.sender && (
          <div className="message-sender">
            <strong>{message.sender.name}</strong>
          </div>
        )}
        
        <div className="message-bubble">
          <p>{message.content}</p>
          
          <div className="message-meta">
            <span className="message-time">
              {formatTime(message.createdAt)}
            </span>
            
            {isOwnMessage && (
              <span className="message-status">
                {getDeliveryStatus()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {isOwnMessage && message.sender && (
        <div className="message-avatar own-avatar">
          {message.sender.profileImage ? (
            <img src={message.sender.profileImage} alt={message.sender.name} />
          ) : (
            <div className="avatar-initials own-initials">
              {getInitials(message.sender.name)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;

