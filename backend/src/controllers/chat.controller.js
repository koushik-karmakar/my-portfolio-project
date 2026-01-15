import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getConnectedUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({
    members: { $in: [userId] },
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
  console.log(formattedChats);
});

const getMessages = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.query;
    console.log(chatId);
    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    console.log(messages);
    return res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
export { getConnectedUser, getMessages };
