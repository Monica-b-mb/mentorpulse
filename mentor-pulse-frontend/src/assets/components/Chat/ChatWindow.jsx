import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChat } from '../../context/useChat';
import MessageItem from './MessageItem';
import './ChatModule.css';

const ChatWindow = ({ chat, onBack }) => {
  const { 
    messages, 
    loadChatMessages, 
    markMessagesAsRead, 
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    isSocketConnected,
    joinChat,
    leaveChat
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatIdRef = useRef(null);
  const sentMessageIdsRef = useRef(new Set()); // Track sent message IDs

  // Safe user data retrieval
  const getCurrentUser = useCallback(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : {};
    } catch (error) {
      console.error('Error parsing user data:', error);
      return {};
    }
  }, []);

  // Memoize participant
  const participant = useMemo(() => {
    const currentUser = getCurrentUser();
    return chat?.otherParticipant || chat?.participants?.find(
      p => p._id !== currentUser._id
    );
  }, [chat, getCurrentUser]);

  // Memoize and deduplicate chat messages
  const chatMessages = useMemo(() => {
    const messagesForChat = messages[chat?._id];
    // Ensure it's always an array
    if (!Array.isArray(messagesForChat)) {
      return [];
    }
    
    // Remove duplicates based on _id
    const uniqueMessages = messagesForChat.filter((message, index, self) => {
      if (!message._id) return true; // Keep temp messages
      return index === self.findIndex((m) => m._id === message._id);
    });
    
    // Sort by timestamp
    return uniqueMessages.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [messages, chat?._id]);

  // Load messages when chat changes
  useEffect(() => {
    if (!chat?._id) return;
    
    const loadMessages = async () => {
      // Leave previous chat room
      if (chatIdRef.current && chatIdRef.current !== chat._id) {
        leaveChat(chatIdRef.current);
      }
      
      console.log('📥 Loading messages for chat:', chat._id);
      chatIdRef.current = chat._id;
      sentMessageIdsRef.current.clear(); // Clear sent IDs for new chat

      setIsLoading(true);
      try {
        // Join the new chat room
        joinChat(chat._id);
        
        const loadedMessages = await loadChatMessages(chat._id, 1);
        console.log('✅ Messages loaded count:', loadedMessages.length);
        
        // Mark messages as read
        if (loadedMessages.length > 0) {
          await markMessagesAsRead(chat._id);
        }
      } catch (error) {
        console.error('❌ Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
    
    // Cleanup on unmount
    return () => {
      if (chatIdRef.current) {
        leaveChat(chatIdRef.current);
        chatIdRef.current = null;
      }
    };
  }, [chat?._id, loadChatMessages, markMessagesAsRead, joinChat, leaveChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && chatMessages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending || !chat?._id) return;

    const messageContent = newMessage.trim();
    console.log('📤 Sending message:', messageContent);
    
    // Check if we're already sending this message
    const messageKey = `${chat._id}-${messageContent}-${Date.now()}`;
    if (sentMessageIdsRef.current.has(messageKey)) {
      console.log('⚠️ Message already being sent, skipping');
      return;
    }
    
    sentMessageIdsRef.current.add(messageKey);
    setIsSending(true);
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    stopTyping(chat._id);

    try {
      await sendMessage({
        chatId: chat._id,
        content: messageContent,
        messageType: 'text'
      });
      
      // Clear input after successful send
      setNewMessage('');
      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    } finally {
      setIsSending(false);
      // Remove from sent IDs after a delay
      setTimeout(() => {
        sentMessageIdsRef.current.delete(messageKey);
      }, 1000);
    }
  }, [newMessage, isSending, chat?._id, sendMessage, stopTyping]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (isSocketConnected() && chat?._id) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (value.trim()) {
        startTyping(chat._id);
      } else {
        stopTyping(chat._id);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(chat._id);
        typingTimeoutRef.current = null;
      }, 2000);
    }
  }, [isSocketConnected, chat?._id, startTyping, stopTyping]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  // Safe message rendering with unique keys
  const renderMessages = useCallback(() => {
    try {
      if (!Array.isArray(chatMessages)) {
        console.error('❌ chatMessages is not an array:', chatMessages);
        return (
          <div className="error-message">
            <p>Error: Messages data is invalid</p>
          </div>
        );
      }

      const currentUser = getCurrentUser();
      
      if (chatMessages.length === 0) {
        return (
          <div className="no-messages">
            <p>No messages yet</p>
            <small>Start the conversation!</small>
          </div>
        );
      }
      
      // Create unique keys for each message
      const messagesWithKeys = chatMessages.map((message, index) => {
        let uniqueKey;
        
        if (message._id && message._id.startsWith('temp-')) {
          // Temp message: use tempId + timestamp
          uniqueKey = `${message.tempId}-${new Date(message.createdAt).getTime()}`;
        } else if (message._id) {
          // Real message from database
          uniqueKey = message._id;
        } else {
          // Fallback: use content + timestamp + index
          uniqueKey = `${message.content}-${new Date(message.createdAt).getTime()}-${index}`;
        }
        
        return { ...message, uniqueKey };
      });
      
      return messagesWithKeys.map((message) => {
        const isOwnMessage = message.sender && message.sender._id === currentUser._id;
        
        return (
          <MessageItem 
            key={message.uniqueKey} 
            message={message}
            isOwnMessage={isOwnMessage}
          />
        );
      });
    } catch (error) {
      console.error('❌ Error rendering messages:', error);
      return (
        <div className="error-message">
          <p>Error displaying messages</p>
        </div>
      );
    }
  }, [chatMessages, getCurrentUser]);

  const isTyping = typingUsers[participant?._id];

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="chat-partner-info">
          <div className="partner-avatar">
            {participant?.profileImage ? (
              <img src={participant.profileImage} alt={participant.name} />
            ) : (
              <div className="avatar-placeholder">
                {participant?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="partner-details">
            <h3>{participant?.name || 'Unknown User'}</h3>
            <span className="partner-role">{participant?.role || 'User'}</span>
            {isTyping && (
              <div className="typing-indicator">
                <span>typing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="messages-container">
        {isLoading ? (
          <div className="loading-messages">
            <p>Loading messages...</p>
          </div>
        ) : (
          <div className="messages-list">
            {renderMessages()}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            rows={1}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            className="send-button"
          >
            {isSending ? '⏳' : '📤'}
          </button>
        </div>
        {!isSocketConnected() && (
          <div className="connection-warning">
            🔴 You are offline. Messages will be sent when connection is restored.
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatWindow;

