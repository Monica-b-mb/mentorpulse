// Action types and utility functions for chat
export const ACTION_TYPES = {
  SET_CHATS: 'SET_CHATS',
  SET_ACTIVE_CHAT: 'SET_ACTIVE_CHAT',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_MESSAGES: 'SET_MESSAGES',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_UNREAD_COUNT: 'UPDATE_UNREAD_COUNT',
  USER_TYPING: 'USER_TYPING'
};

export const initialState = {
  chats: [],
  activeChat: null,
  messages: [],
  loading: false,
  error: null,
  typingUsers: {}
};

export const chatReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_CHATS: {
      return { ...state, chats: action.payload, loading: false };
    }
    
    case ACTION_TYPES.SET_ACTIVE_CHAT: {
      return { ...state, activeChat: action.payload };
    }
    
    case ACTION_TYPES.ADD_MESSAGE: {
      const updatedChats = state.chats.map(chat => 
        chat._id === action.payload.chatId 
          ? { ...chat, lastMessage: action.payload.message }
          : chat
      );
      
      return {
        ...state,
        chats: updatedChats,
        messages: state.activeChat?._id === action.payload.chatId
          ? [...state.messages, action.payload.message]
          : state.messages
      };
    }
    
    case ACTION_TYPES.SET_MESSAGES: {
      return { ...state, messages: action.payload };
    }
    
    case ACTION_TYPES.SET_LOADING: {
      return { ...state, loading: action.payload };
    }
    
    case ACTION_TYPES.SET_ERROR: {
      return { ...state, error: action.payload, loading: false };
    }
    
    case ACTION_TYPES.UPDATE_UNREAD_COUNT: {
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat._id === action.payload.chatId
            ? { ...chat, unreadCount: action.payload.count }
            : chat
        )
      };
    }
    
    case ACTION_TYPES.USER_TYPING: {
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.userId]: action.payload.isTyping
        }
      };
    }
    
    default: {
      return state;
    }
  }
};

// Mock data functions
export const getMockChats = () => [
  {
    _id: '1',
    otherParticipant: {
      _id: '2',
      name: 'John Mentor',
      profileImage: '',
      role: 'mentor'
    },
    lastMessage: {
      _id: '1',
      content: 'Hello there! How can I help you?',
      createdAt: new Date().toISOString()
    },
    unreadCount: 2,
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    otherParticipant: {
      _id: '3',
      name: 'Sarah Mentee',
      profileImage: '',
      role: 'mentee'
    },
    lastMessage: {
      _id: '2',
      content: 'Thanks for the session!',
      createdAt: new Date().toISOString()
    },
    unreadCount: 0,
    updatedAt: new Date().toISOString()
  }
];

export const getMockMessages = () => [
  {
    _id: '1',
    sender: {
      _id: '2',
      name: 'John Mentor',
      profileImage: '',
      role: 'mentor'
    },
    content: 'Hello! How can I help you today?',
    messageType: 'text',
    readBy: [],
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: '2',
    sender: {
      _id: '1',
      name: 'You',
      profileImage: '',
      role: 'mentee'
    },
    content: 'I need help with React programming',
    messageType: 'text',
    readBy: ['2'],
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    _id: '3',
    sender: {
      _id: '2',
      name: 'John Mentor',
      profileImage: '',
      role: 'mentor'
    },
    content: 'Sure! I can help you with that. What specific issues are you facing?',
    messageType: 'text',
    readBy: ['1'],
    createdAt: new Date().toISOString()
  }
];