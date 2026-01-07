import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAvatarColor = (userId) => {
  const colors = [
    "bg-linear-to-r from-blue-600 to-indigo-500",
    "bg-linear-to-r from-purple-600 to-pink-500",
    "bg-linear-to-r from-green-600 to-teal-500",
    "bg-linear-to-r from-red-600 to-orange-500",
    "bg-linear-to-r from-yellow-600 to-amber-500",
    "bg-linear-to-r from-indigo-600 to-purple-500",
    "bg-linear-to-r from-pink-600 to-rose-500",
    "bg-linear-to-r from-teal-600 to-cyan-500",
  ];

  if (!userId) return colors[0];

  let hash = 0;
  const idStr = userId.toString();
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const createNewChat = asyncHandler(async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required",
      });
    }

    if (userId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot create chat with yourself",
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let chat = await Chat.findOne({
      members: { $all: [userId, targetUserId] },
      isGroup: false,
    }).populate({
      path: "members",
      select: "username fullname avatar email number isOnline lastSeen",
    });

    let isNewChat = false;

    if (!chat) {
      chat = await Chat.create({
        members: [userId, targetUserId],
        isGroup: false,
      });

      await Message.create({
        chatId: chat._id,
        senderId: userId,
        messageType: "system",
        text: "You started a conversation",
        readBy: [userId],
      });

      isNewChat = true;

      chat = await Chat.findById(chat._id).populate({
        path: "members",
        select: "username fullname avatar email number isOnline lastSeen",
      });
    }

    const messages = await Message.find({ chatId: chat._id })
      .populate("senderId", "username fullname avatar")
      .sort({ createdAt: 1 })
      .lean();

    const otherUser = chat.members.find(
      (member) => member._id.toString() !== userId.toString()
    );

    const formattedMessages = messages.map((msg) => {
      const isMe = msg.senderId._id.toString() === userId.toString();

      return {
        _id: msg._id,
        id: msg._id,
        text: msg.text,
        sender: isMe ? "me" : msg.messageType === "system" ? "system" : "them",
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "read",
        isSystem: msg.messageType === "system",
        senderInfo: msg.senderId
          ? {
              _id: msg.senderId._id,
              username: msg.senderId.username,
              fullname: msg.senderId.fullname,
              avatar: msg.senderId.avatar,
            }
          : null,
        receiverId: msg.receiverId,
        createdAt: msg.createdAt,
        messageType: msg.messageType,
      };
    });

    const responseData = {
      chat: {
        _id: chat._id,
        id: chat._id,
        members: chat.members.map((m) => m._id),
        isGroup: chat.isGroup,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
      otherUser: {
        _id: otherUser._id,
        username: otherUser.username,
        fullname: otherUser.fullname,
        avatar: otherUser.avatar,
        email: otherUser.email,
        number: otherUser.number,
        isOnline: otherUser.isOnline,
        lastSeen: otherUser.lastSeen,
      },
      messages: formattedMessages,
    };

    return res.status(200).json({
      success: true,
      message: isNewChat ? "New chat created" : "Existing chat found",
      data: responseData,
    });
  } catch (error) {
    console.error("Error creating/getting chat:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating chat",
      error: error.message,
    });
  }
});

const getUserChats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      members: { $in: [userId] },
      isGroup: false,
    })
      .populate({
        path: "members",
        select: "username fullname avatar email number isOnline lastSeen",
      })
      .populate({
        path: "lastMessage",
        select: "text senderId receiverId createdAt messageType readBy",
      })
      .sort({ updatedAt: -1 })
      .lean();

    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const otherUser = chat.members.find(
          (member) => member._id.toString() !== userId.toString()
        );

        if (!otherUser) {
          return null;
        }

        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          senderId: otherUser._id,
          readBy: { $ne: userId },
        });

        let lastMessageText = "No messages yet";
        let lastMessageTime = "";
        let lastMessageSenderIsMe = false;
        let lastMessageStatus = "sent";

        if (chat.lastMessage) {
          lastMessageText =
            chat.lastMessage.text ||
            (chat.lastMessage.messageType === "image"
              ? "📷 Image"
              : chat.lastMessage.messageType === "file"
              ? "📎 File"
              : chat.lastMessage.messageType === "system"
              ? "System message"
              : "");

          lastMessageTime = new Date(
            chat.lastMessage.createdAt
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          lastMessageSenderIsMe =
            chat.lastMessage.senderId?.toString() === userId.toString();

          if (lastMessageSenderIsMe) {
            lastMessageStatus = chat.lastMessage.readBy?.includes(userId)
              ? "read"
              : "delivered";
          }
        }

        const status = otherUser.isOnline ? "online" : "offline";

        let lastSeen = "Recently";
        if (otherUser.lastSeen) {
          const now = new Date();
          const lastSeenDate = new Date(otherUser.lastSeen);
          const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));

          if (diffInMinutes < 1) lastSeen = "Just now";
          else if (diffInMinutes < 60) lastSeen = `${diffInMinutes}m ago`;
          else if (diffInMinutes < 1440)
            lastSeen = `${Math.floor(diffInMinutes / 60)}h ago`;
          else lastSeen = `${Math.floor(diffInMinutes / 1440)}d ago`;
        }

        return {
          id: chat._id.toString(),
          backendId: chat._id,
          name: otherUser.fullname || otherUser.username,
          username: otherUser.username,
          avatar: otherUser.avatar,
          avatarColor: generateAvatarColor(otherUser._id),
          status: status,
          lastSeen: lastSeen,
          unread: unreadCount,
          members: chat.members.map((m) => m._id),
          otherUserInfo: {
            _id: otherUser._id,
            username: otherUser.username,
            fullname: otherUser.fullname,
            email: otherUser.email,
            number: otherUser.number,
            avatar: otherUser.avatar,
            isOnline: otherUser.isOnline,
            lastSeen: otherUser.lastSeen,
          },
          lastMessage: {
            text: lastMessageText,
            time: lastMessageTime,
            senderIsMe: lastMessageSenderIsMe,
            status: lastMessageStatus,
            senderId: chat.lastMessage?.senderId,
            messageType: chat.lastMessage?.messageType,
          },
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        };
      })
    );

    const validChats = formattedChats.filter((chat) => chat !== null);

    res.status(200).json({
      success: true,
      data: validChats,
    });
  } catch (error) {
    console.error("Error getting user chats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chats",
      error: error.message,
    });
  }
});

const getChatMessages = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOne({
      _id: chatId,
      members: { $in: [userId] },
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this chat",
      });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chatId })
      .populate("senderId", "username fullname avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedMessages = messages.reverse().map((msg) => {
      const isMe = msg.senderId._id.toString() === userId.toString();
      const isSystem = msg.messageType === "system";

      return {
        id: msg._id,
        text: msg.text,
        sender: isMe ? "me" : isSystem ? "system" : "them",
        senderInfo: {
          _id: msg.senderId._id,
          username: msg.senderId.username,
          fullname: msg.senderId.fullname,
          avatar: msg.senderId.avatar,
        },
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: isMe
          ? msg.readBy?.length > 1
            ? "read"
            : "delivered"
          : "received",
        messageType: msg.messageType || "text",
        createdAt: msg.createdAt,
        readBy: msg.readBy || [],
      };
    });

    const unreadMessages = messages.filter(
      (msg) =>
        msg.senderId._id.toString() !== userId.toString() &&
        !msg.readBy?.includes(userId)
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: unreadMessages.map((m) => m._id) },
          chatId: chatId,
        },
        {
          $addToSet: { readBy: userId },
        }
      );
    }

    res.status(200).json({
      success: true,
      data: {
        messages: formattedMessages,
        hasMore: messages.length === limit,
        page,
        total: await Message.countDocuments({ chatId }),
      },
    });
  } catch (error) {
    console.error("Error getting chat messages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
});

const searchUsers = asyncHandler(async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user._id;

    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: q, $options: "i" } },
            { fullname: { $regex: q, $options: "i" } },
            { number: { $regex: q, $options: "i" } },
          ],
        },
        { _id: { $ne: userId } },
      ],
    })
      .select("username fullname avatar email number isOnline lastSeen")
      .limit(10);

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      message: "Error searching users",
      error: error.message,
    });
  }
});

export {
  createNewChat,
  getUserChats,
  getChatMessages,
  searchUsers,
  generateAvatarColor,
};
