import { Server } from "socket.io";
import mongoose from "mongoose";
import { Message } from "./models/message.model.js";
import { User } from "./models/user.model.js";
import { Chat } from "./models/chat.model.js";

export function socketConnect(server, fr_url) {
  const io = new Server(server, {
    cors: {
      origin: fr_url,
      credentials: true,
    },
  });

  const onlineUsers = new Map();

  const socketToUser = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("user_online", async (userId) => {
      if (!mongoose.Types.ObjectId.isValid(userId)) return;

      // Store socket id for this user
      if (!socketToUser.has(socket.id)) {
        socketToUser.set(socket.id, userId);
      }

      // Update user status
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: null,
      });

      // Notify contacts
      notifyUserStatus(io, userId, true, null, socketToUser);
    });

    // ================= JOIN CHAT =================
    socket.on("join_chat", (chatId) => {
      if (!mongoose.Types.ObjectId.isValid(chatId)) return;
      socket.join(chatId);
    });

    // ================= SEND MESSAGE =================
    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, text } = data;
        console.log("SEND_MESSAGE:", data);
        if (
          !mongoose.Types.ObjectId.isValid(senderId) ||
          !mongoose.Types.ObjectId.isValid(receiverId) ||
          !text?.trim()
        ) {
          socket.emit("message_error", {
            error: "Invalid data",
          });
          return;
        }
        let chat = await Chat.findOne({
          isGroup: false,
          members: { $all: [senderId, receiverId] },
        });

        if (!chat) {
          chat = await Chat.create({
            members: [senderId, receiverId],
          });
        }
        const chatId = chat._id.toString();
        socket.join(chatId);
        const message = await Message.create({
          chatId,
          senderId,
          receiverId,
          messageType: "text",
          text: text.trim(),
          readBy: [senderId],
        });

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        const payload = await Message.findById(message._id);

        console.log("payload", payload.toObject());
        io.to(chatId).emit("receive_message", {
          ...payload.toObject(),
        });
      } catch (err) {
        console.error("send_message error:", err);
        socket.emit("message_error", {
          error: "Failed to send message",
        });
      }
    });

    // ================= TYPING =================
    socket.on("typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("user_typing", { userId });
    });

    socket.on("stop_typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("user_stop_typing", { userId });
    });

    // ================= READ =================
    socket.on("mark_as_read", async ({ messageId, userId }) => {
      if (
        !mongoose.Types.ObjectId.isValid(messageId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      )
        return;

      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { readBy: userId },
      });

      const msg = await Message.findById(messageId);
      if (msg) {
        io.to(msg.chatId.toString()).emit("message_read", {
          messageId,
          userId,
        });
      }
    });

    socket.on("disconnect", async () => {
      const userId = socketToUser.get(socket.id);
      console.log(userId);
      const del = socketToUser.delete(socket.id);
      console.log("second TimeRanges", socketToUser, del);
      if (del) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen,
        });
      }
    });
  });
}

// send sms to every online user except the user
function notifyUserStatus(io, userId, isOnline, lastSeen, socketToUser) {
  Chat.find({ members: userId, isGroup: false }).then((chats) => {
    chats.forEach((chat) => {
      const otherId = chat.members.find(
        (id) => id.toString() !== userId.toString()
      );
      if (socketToUser.has(otherId)) {
        socketToUser.get(otherId).forEach((sid) => {
          io.to(sid).emit("user_status_change", {
            userId,
            isOnline,
            lastSeen,
          });
        });
      }
    });
  });
}

function notifyReceiver(io, receiverId, payload, onlineUsers) {
  if (!onlineUsers.has(receiverId.toString())) return;

  onlineUsers.get(receiverId.toString()).forEach((sid) => {
    io.to(sid).emit("new_message_notification", {
      chatId: payload.chatId,
      message: payload.text,
      senderId: payload.senderId._id,
      messageId: payload._id,
    });
  });
}
