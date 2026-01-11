import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { ChatContext } from './ChatContext';

// Move case logic outside the reducer
const handleAddMessage = (state, action) => {
  const { chatId, message } = action.payload;
  const currentMessages = state.messages[chatId] || [];
  
  // More comprehensive duplicate check
  const messageExists = currentMessages.some(msg => {
    // Check by _id
    if (msg._id && message._id && msg._id === message._id) return true;
    // Check by tempId
    if (msg.tempId && message.tempId && msg.tempId === message.tempId) return true;
    // Check by content and timestamp (for temp messages)
    if (msg.isTemp && message.isTemp && 
        msg.content === message.content && 
        Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 1000) {
      return true;
    }
    return false;
  });
  
  if (messageExists) {
    console.log('⚠️ Message already exists, skipping:', message._id || message.tempId);
    return state;
  }
  
  console.log('✅ Adding new message to chat:', chatId, 'Message ID:', message._id || message.tempId);
  
  return {
    ...state,
    messages: {
      ...state.messages,
      [chatId]: [...currentMessages, message]
    }
  };
};

const handleSetMessages = (state, action) => {
  const { chatId, messages } = action.payload;
  // Ensure messages is always an array and remove duplicates
  const safeMessages = Array.isArray(messages) ? messages : [];
  
  // Remove duplicates based on _id
  const uniqueMessages = safeMessages.filter((message, index, self) =>
    index === self.findIndex((m) => m._id === message._id)
  );
  
  return {
    ...state,
    messages: {
      ...state.messages,
      [chatId]: uniqueMessages
    }
  };
};

const handleSetTyping = (state, action) => {
  const { userId, isTyping } = action.payload;
  return {
    ...state,
    typingUsers: {
      ...state.typingUsers,
      [userId]: isTyping
    }
  };
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChat: action.payload };
    
    case 'ADD_MESSAGE':
      return handleAddMessage(state, action);
    
    case 'SET_MESSAGES':
      return handleSetMessages(state, action);
    
    case 'SET_TYPING':
      return handleSetTyping(state, action);
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    default:
      return state;
  }
};

const initialState = {
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: {},
  error: null,
  isLoading: false
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const socketRef = useRef(null);
  const initializedRef = useRef(false);
  const stateRef = useRef(state);
  const sendingMessagesRef = useRef(new Set()); // Track messages being sent

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Base API URL
  const API_BASE = 'http://localhost:5000/api';

  console.log('🔄 ChatProvider initialized');

  // Memoized functions
  const addMessage = useCallback((payload) => {
    dispatch({ type: 'ADD_MESSAGE', payload });
  }, []);

  const setUserTyping = useCallback((payload) => {
    dispatch({ type: 'SET_TYPING', payload });
  }, []);

  const loadUserChats = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/chat/user/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load chats: ${response.status}`);
      }
      
      const data = await response.json();
      const safeChats = Array.isArray(data.data) ? data.data : [];
      dispatch({ type: 'SET_CHATS', payload: safeChats });
    } catch (error) {
      console.error('❌ Failed to load chats:', error.message);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (initializedRef.current) {
      console.log('⚡ ChatProvider: Socket already initialized, skipping');
      return;
    }

    console.log('🔌 ChatProvider: Initializing socket...');
    initializedRef.current = true;

    const initializeSocket = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('❌ No token found for chat');
          return;
        }

        const { io } = await import('socket.io-client');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        console.log('🔌 Creating socket connection...');
        const socket = io(apiUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // Socket event handlers
        const handleConnect = () => {
          console.log('✅ Socket connected successfully');
          loadUserChats();
        };

        const handleDisconnect = (reason) => {
          console.log('❌ Socket disconnected:', reason);
        };

        const handleConnectError = (error) => {
          console.error('🔴 Socket connection error:', error.message);
        };

        const handleNewMessage = (data) => {
          if (data.success && data.message) {
            const currentState = stateRef.current;
            const existingMessages = currentState.messages[data.chatId] || [];
            const messageExists = existingMessages.some(msg => 
              msg._id === data.message._id
            );
            
            if (!messageExists) {
              console.log('📨 New message received via socket:', data.message._id);
              addMessage({
                chatId: data.chatId,
                message: data.message
              });
            }
          }
        };

        const handleMessageSent = (data) => {
          if (data.success && data.message) {
            console.log('✅ Message sent confirmation:', data.message._id);
            // Get current state
            const currentState = stateRef.current;
            const messagesForChat = currentState.messages[data.chatId] || [];
            
            // Remove temp messages and add the real one
            const filteredMessages = messagesForChat.filter(msg => 
              !msg.isTemp || (msg.isTemp && msg.content !== data.message.content)
            );
            
            // Check if real message already exists
            const realMessageExists = filteredMessages.some(msg => 
              msg._id === data.message._id
            );
            
            if (!realMessageExists) {
              const updatedMessages = [...filteredMessages, data.message];
              
              // Remove duplicates
              const uniqueMessages = updatedMessages.filter((message, index, self) =>
                index === self.findIndex((m) => 
                  (m._id && message._id && m._id === message._id) ||
                  (m.tempId && message.tempId && m.tempId === message.tempId)
                )
              );
              
              dispatch({ 
                type: 'SET_MESSAGES', 
                payload: { 
                  chatId: data.chatId, 
                  messages: uniqueMessages 
                } 
              });
            }
          }
        };

        const handleUserTyping = (data) => {
          setUserTyping({
            userId: data.userId,
            isTyping: data.isTyping
          });
        };

        const handleError = (errorData) => {
          console.error('🔴 Socket error:', errorData);
          dispatch({ type: 'SET_ERROR', payload: errorData.message });
        };

        // Attach event listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('new-message', handleNewMessage);
        socket.on('message-sent', handleMessageSent);
        socket.on('user-typing', handleUserTyping);
        socket.on('error', handleError);

      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        initializedRef.current = false;
      }
    };

    initializeSocket();

    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (socketRef.current) {
        // Copy to local variable for cleanup
        const socketToCleanup = socketRef.current;
        
        // Remove all listeners
        socketToCleanup.off('connect');
        socketToCleanup.off('disconnect');
        socketToCleanup.off('connect_error');
        socketToCleanup.off('new-message');
        socketToCleanup.off('message-sent');
        socketToCleanup.off('user-typing');
        socketToCleanup.off('error');
        
        socketToCleanup.disconnect();
        socketRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [loadUserChats, addMessage, setUserTyping]);

  const getOrCreateChat = useCallback(async (participantId) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('📝 Creating/retrieving chat for participant:', participantId);
      
      const response = await fetch(`${API_BASE}/chat/get-or-create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participantId })
      });
      
      console.log('🔍 Create chat response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to create chat: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Chat created/retrieved successfully');
      return data.data;
    } catch (error) {
      console.error('❌ Failed to create chat:', error.message);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  }, []);

  const loadChatMessages = useCallback(async (chatId, page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/chat/${chatId}/messages?page=${page}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }
      
      const data = await response.json();
      const safeMessages = Array.isArray(data.data) ? data.data : [];
      
      // Remove duplicates before setting
      const uniqueMessages = safeMessages.filter((message, index, self) =>
        index === self.findIndex((m) => m._id === message._id)
      );
      
      dispatch({ 
        type: 'SET_MESSAGES', 
        payload: { chatId, messages: uniqueMessages } 
      });
      return uniqueMessages;
    } catch (error) {
      console.error('❌ Failed to load messages:', error.message);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return [];
    }
  }, []);

  const markMessagesAsRead = useCallback(async (chatId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/chat/${chatId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error.message);
    }
  }, []);

  const sendMessageViaHttp = useCallback(async (chatId, content, messageType = 'text') => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('📤 Sending message via HTTP for chat:', chatId);
      
      const response = await fetch(`${API_BASE}/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content: content.trim(), 
          messageType 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to send message: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ HTTP message sent:', data.data._id);
      return data;
    } catch (error) {
      console.error('❌ Failed to send message via HTTP:', error.message);
      throw error;
    }
  }, []);

  // Main send message function - FIXED to prevent duplicate sending
  const sendMessage = useCallback(async (messageData) => {
    const { chatId, content, messageType } = messageData;
    
    // Create a unique key for this message to prevent duplicate sending
    const messageKey = `${chatId}-${content.trim()}-${Date.now()}`;
    
    // Check if we're already sending this message
    if (sendingMessagesRef.current.has(messageKey)) {
      console.log('⚠️ Message already being sent, skipping:', messageKey);
      return { success: false, message: 'Message already being sent' };
    }
    
    // Mark as sending
    sendingMessagesRef.current.add(messageKey);
    
    console.log('🔧 Sending message:', content);
    
    // Create unique temp message - DON'T set isDelivered to true
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      _id: tempId,
      tempId: tempId,
      chat: chatId,
      sender: {
        _id: currentUser._id,
        name: currentUser.name,
        profileImage: currentUser.profileImage,
        role: currentUser.role
      },
      content: content.trim(),
      messageType,
      createdAt: new Date().toISOString(),
      isDelivered: false, // IMPORTANT: Start as false
      isSeen: false, // Added seen status
      isTemp: true
    };
    
    // Add temp message
    addMessage({ chatId, message: tempMessage });
    
    try {
      // Send via HTTP only (remove socket sending to prevent duplicates)
      const result = await sendMessageViaHttp(chatId, content, messageType);
      
      if (result.success && result.data) {
        console.log('✅ Message saved to database:', result.data._id);
        
        // IMPORTANT: The backend should NOT set isDelivered to true immediately
        // It should only set isDelivered to true when the other user receives it via socket
        
        // Remove temp message and add real one via state update
        const currentState = stateRef.current;
        const messagesForChat = currentState.messages[chatId] || [];
        const filteredMessages = messagesForChat.filter(msg => 
          msg.tempId !== tempId && msg._id !== result.data._id
        );
        
        const updatedMessages = [...filteredMessages, result.data];
        const uniqueMessages = updatedMessages.filter((message, index, self) =>
          index === self.findIndex((m) => m._id === message._id)
        );
        
        dispatch({ 
          type: 'SET_MESSAGES', 
          payload: { chatId, messages: uniqueMessages } 
        });
        
        // DO NOT emit via socket - backend will handle socket emission
        // This prevents duplicate messages
        
        return result;
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Remove temp message on error
      const currentState = stateRef.current;
      const messagesForChat = currentState.messages[chatId] || [];
      const filteredMessages = messagesForChat.filter(msg => msg.tempId !== tempId);
      dispatch({ 
        type: 'SET_MESSAGES', 
        payload: { chatId, messages: filteredMessages } 
      });
      
      throw error;
    } finally {
      // Remove from sending set
      sendingMessagesRef.current.delete(messageKey);
    }
  }, [sendMessageViaHttp, addMessage]);

  // Other memoized functions...
  const setActiveChat = useCallback((chat) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: chat });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const joinChat = useCallback((chatId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-chat', chatId);
    }
  }, []);

  const leaveChat = useCallback((chatId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-chat', chatId);
    }
  }, []);

  const startTyping = useCallback((chatId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing-start', { chatId });
    }
  }, []);

  const stopTyping = useCallback((chatId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing-stop', { chatId });
    }
  }, []);

  const isSocketConnected = useCallback(() => {
    return socketRef.current?.connected || false;
  }, []);

  const value = {
    ...state,
    loadUserChats,
    getOrCreateChat,
    loadChatMessages,
    markMessagesAsRead,
    sendMessage,
    addMessage,
    setActiveChat,
    setUserTyping,
    clearError,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    isSocketConnected,
    socket: socketRef.current
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};