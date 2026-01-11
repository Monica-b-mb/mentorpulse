import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Get available users to chat with (excluding current user)
export const getAvailableUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Get users from database (excluding current user)
    const users = await User.find(
      { _id: { $ne: currentUserId } },
      'name email profileImage role'
    ).sort({ name: 1 });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available users'
    });
  }
};

// Get or create chat between two users
export const getOrCreateChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user._id;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Ensure participants are different users
    if (currentUserId.toString() === participantId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat with yourself'
      });
    }

    // Find existing active chat
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, participantId] },
      isActive: true
    }).populate('participants', 'name email profileImage role');

    // Create new chat if doesn't exist
    if (!chat) {
      console.log('Creating new chat between:', currentUserId, 'and', participantId);
      
      // Ensure we have exactly 2 participants in the correct order
      const participants = [currentUserId, participantId].sort();
      
      chat = new Chat({
        participants: participants
      });

      await chat.save();
      
      // Populate the new chat
      chat = await Chat.findById(chat._id)
        .populate('participants', 'name email profileImage role');
        
      console.log('New chat created successfully:', chat._id);
    }

    res.json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error('Get or create chat error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat data: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get or create chat'
    });
  }
};

// Get user's chats
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'name email profileImage role')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Format response with other participant info
    const formattedChats = await Promise.all(chats.map(async (chat) => {
      const otherParticipant = chat.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      // Get unread count
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      });

      // Get last message details
      const lastMessage = await Message.findOne({ chat: chat._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name');

      return {
        _id: chat._id,
        otherParticipant,
        lastMessage: lastMessage ? {
          _id: lastMessage._id,
          content: lastMessage.content,
          sender: lastMessage.sender,
          createdAt: lastMessage.createdAt
        } : null,
        unreadCount,
        updatedAt: chat.updatedAt
      };
    }));

    res.json({
      success: true,
      data: formattedChats
    });

  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user chats'
    });
  }
};

// Get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied'
      });
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name profileImage role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalMessages = await Message.countDocuments({ chat: chatId });

    // Mark messages as read for current user
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        },
        $set: {
          isSeen: true
        }
      }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });

  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat messages'
    });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const senderId = req.user._id;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Get socket.io instance
    const io = req.app.get('io');

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: senderId,
      isActive: true
    }).populate('participants', '_id name');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied'
      });
    }

    // Create new message - IMPORTANT: isDelivered should be false initially
    const message = new Message({
      chat: chatId,
      sender: senderId,
      content: content.trim(),
      messageType,
      readBy: [{
        user: senderId,
        readAt: new Date()
      }],
      isDelivered: false, // Start as false
      isSeen: false
    });

    await message.save();

    // Update chat's last message and timestamp
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    // Populate message for response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profileImage role');

    // EMIT SOCKET EVENT TO ALL CHAT PARTICIPANTS
    if (io) {
      // Get the other participant
      const otherParticipant = chat.participants.find(
        p => p._id.toString() !== senderId.toString()
      );
      
      // Emit to the chat room
      io.to(chatId).emit('new-message', {
        success: true,
        message: populatedMessage,
        chatId,
        isDelivered: false // Not delivered yet
      });
      
      // Also emit to sender for confirmation
      io.to(senderId.toString()).emit('message-sent', {
        success: true,
        message: populatedMessage,
        chatId,
        isDelivered: false
      });
      
      // Check if other participant is online by accessing connected sockets
      if (otherParticipant) {
        const otherParticipantId = otherParticipant._id.toString();
        
        // Check if user has any active socket connection
        const sockets = await io.fetchSockets();
        const isOnline = sockets.some(socket => 
          socket.userId === otherParticipantId
        );
        
        if (isOnline) {
          // Mark as delivered
          message.isDelivered = true;
          await message.save();
          
          // Re-populate with updated status
          const updatedMessage = await Message.findById(message._id)
            .populate('sender', 'name profileImage role');
          
          // Emit delivered status to sender
          io.to(senderId.toString()).emit('message-delivered', {
            success: true,
            messageId: message._id,
            chatId,
            isDelivered: true
          });
          
          console.log(`🔌 Message delivered to ${otherParticipant.name}`);
        } else {
          console.log(`⏳ ${otherParticipant.name} is offline, will deliver when online`);
        }
      }
      
      console.log(`🔌 Socket events emitted for chat: ${chatId}`);
    } else {
      console.warn('⚠️ Socket.io instance not available for message emission');
    }

    res.json({
      success: true,
      data: populatedMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied'
      });
    }

    // Get io instance for socket notifications
    const io = req.app.get('io');

    // Find all unread messages in this chat
    const unreadMessages = await Message.find({
      chat: chatId,
      sender: { $ne: userId },
      'readBy.user': { $ne: userId }
    });

    // Update messages as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        },
        $set: {
          isSeen: true
        }
      }
    );

    // Notify senders that their messages have been seen
    if (io) {
      for (const message of unreadMessages) {
        io.to(message.sender.toString()).emit('message-seen', {
          success: true,
          messageId: message._id,
          chatId,
          seenBy: userId,
          seenAt: new Date()
        });
        
        console.log(`👁️ Notified sender ${message.sender} that message ${message._id} was seen`);
      }
    }

    res.json({
      success: true,
      message: 'Messages marked as read',
      count: unreadMessages.length
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};