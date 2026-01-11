import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/useChat';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import './ChatModule.css';

const ChatModule = () => {
  const {
    chats,
    activeChat,
    setActiveChat,
    addMessage,
    setUserTyping,
    error,
    clearError,
    loadUserChats,
    getOrCreateChat
  } = useChat();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const socketRef = useRef(null);
  const initializedRef = useRef(false);
  const mountedRef = useRef(true);
  const contextRef = useRef({
    addMessage,
    setUserTyping,
    loadUserChats
  });

  // Update the ref when context functions change
  useEffect(() => {
    contextRef.current = {
      addMessage,
      setUserTyping,
      loadUserChats
    };
  }, [addMessage, setUserTyping, loadUserChats]);

  // Single useEffect - runs ONLY ONCE
  useEffect(() => {
    // Check if component is still mounted
    if (!mountedRef.current || initializedRef.current) {
      console.log('⚡ Socket already initialized or component unmounted, skipping...');
      return;
    }

    console.log('🔌 INITIALIZING SOCKET (ONCE)');
    initializedRef.current = true;

    const initializeSocket = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('❌ No token found for chat');
          return;
        }

        setIsConnecting(true);

        const { io } = await import('socket.io-client');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const newSocket = io(apiUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          if (!mountedRef.current) return;
          setIsConnected(true);
          setIsConnecting(false);
          console.log('✅ Chat socket connected successfully');
          contextRef.current.loadUserChats();
        });

        newSocket.on('disconnect', (reason) => {
          if (!mountedRef.current) return;
          setIsConnected(false);
          console.log('❌ Chat socket disconnected:', reason);
        });

        newSocket.on('connect_error', (error) => {
          if (!mountedRef.current) return;
          setIsConnecting(false);
          console.error('🔴 Chat socket connection error:', error.message);
        });

        newSocket.on('new-message', (message) => {
          if (!mountedRef.current) return;
          console.log('📨 Received new message:', message);
          contextRef.current.addMessage({
            chatId: message.chat,
            message: message
          });
        });

        newSocket.on('user-typing', (data) => {
          if (!mountedRef.current) return;
          console.log('⌨️ User typing:', data);
          contextRef.current.setUserTyping({
            userId: data.userId,
            isTyping: data.isTyping
          });
        });

        newSocket.on('message-delivered', (data) => {
          if (!mountedRef.current) return;
          console.log('✅ Message delivered:', data);
        });

      } catch (error) {
        if (!mountedRef.current) return;
        console.error('❌ Failed to initialize chat socket:', error);
        setIsConnecting(false);
        initializedRef.current = false;
      }
    };

    initializeSocket();

    return () => {
      console.log('🧹 CLEANUP: Disconnecting socket');
      mountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      initializedRef.current = false;
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, []); // Empty dependency array

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    if (socketRef.current && isConnected) {
      console.log('🚀 Joining chat room:', chat._id);
      socketRef.current.emit('join-chat', chat._id);
    }
  };

  const handleBackToList = () => {
    setActiveChat(null);
  };

  const handleStartNewChat = async (participantId) => {
    try {
      console.log('Starting new chat with participant:', participantId);
      const chat = await getOrCreateChat(participantId);

      if (chat) {
        console.log('Chat created/retrieved:', chat);
        setActiveChat(chat);
        if (socketRef.current && isConnected) {
          socketRef.current.emit('join-chat', chat._id);
        }
      } else {
        console.error('Failed to create chat');
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  if (error) {
    return (
      <div className="chat-module error">
        <div className="error-message">
          <p>Error loading chat: {error}</p>
          <button onClick={clearError}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-module">
      <div className="chat-header">
        <h2>Messages</h2>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected'}`}>
            {isConnected ? '🟢 Online' : isConnecting ? '🟡 Connecting...' : '🔴 Offline'}
          </span>
        </div>
      </div>

      <div className="chat-container">
        <div className={`chat-sidebar ${activeChat ? 'hidden' : ''}`}>
          <ChatList
            chats={chats}
            onSelectChat={handleSelectChat}
            onStartNewChat={handleStartNewChat}
            isLoading={isConnecting}
          />
        </div>

        <div className={`chat-main ${activeChat ? 'active' : ''}`}>
          {activeChat ? (
            <ChatWindow
              chat={activeChat}
              onBack={handleBackToList}
              socket={socketRef.current}
              isConnected={isConnected}
            />
          ) : (
            <div className="no-chat-selected">
              <div className="placeholder-content">
                <h3>Select a conversation</h3>
                <p>Choose a chat from the list to start messaging</p>
                {!isConnected && !isConnecting && (
                  <div className="alert alert-warning mt-3">
                    <small>Chat is currently offline. Connect to start messaging.</small>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModule;