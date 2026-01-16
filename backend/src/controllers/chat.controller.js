import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getConnectedUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({
    members: { $in: [userId] },
    lastMessage: { $exists: true },
  })
    .populate({
      path: "members",
      select: "username fullname avatar isOnline lastSeen",
    })
    .populate({
      path: "lastMessage",
      select: "text senderId createdAt",
      populate: {
        path: "senderId",
        select: "username fullname avatar",
      },
    })
    .sort({ updatedAt: -1 })
    .lean();
  if (!chats) {
    res.status(200).json(false);
  }
  console.log("chat id", chats.chatId, chats);
  const formattedChats = chats.map((chat) => {
    const otherUser = chat.members.find(
      (member) => member._id.toString() !== userId.toString()
    );

    return {
      chatId: chat._id.toString(),
      ...otherUser,
      lastMessage: chat.lastMessage?.text || "",
      lastMessageAt: chat.lastMessage?.createdAt || chat.updatedAt,
    };
  });

  res.status(200).json(formattedChats);
  // console.log(formattedChats);
});

const getMessages = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.query;
    // console.log(chatId);
    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    // console.log(messages);
    return res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

const createOrGetChatId = asyncHandler(async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;
    if (!receiverId || !senderId) {
      return res.status(400).json({ message: "Id is required" });
    }

    let chat = await Chat.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!chat) {
      chat = await Chat.create({
        members: [senderId, receiverId],
      });
    }
    return res.status(200).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

const getChatDetails = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.query;
    const currentUserId = req.user._id;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID required" });
    }

    const chat = await Chat.findById(chatId).populate(
      "members",
      "_id fullname username avatar email isOnline lastSeen number"
    );

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const otherUser = chat.members.find(
      (member) => member._id.toString() !== currentUserId.toString()
    );

    return res.status(200).json({otherUser});
  } catch (error) {
    console.error("Get Chat Details Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});
export { getConnectedUser, getMessages, createOrGetChatId, getChatDetails };
