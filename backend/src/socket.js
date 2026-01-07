import { Server } from "socket.io";
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

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("user_online", async (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} is online (socket: ${socket.id})`);

      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: null,
        });

        const userChats = await Chat.find({
          members: { $in: [userId] },
          isGroup: false,
        });

        userChats.forEach((chat) => {
          const otherUserId = chat.members.find(
            (memberId) => memberId.toString() !== userId.toString()
          );

          if (otherUserId) {
            const otherUserSocketId = onlineUsers.get(otherUserId.toString());
            if (otherUserSocketId) {
              io.to(otherUserSocketId).emit("user_status_change", {
                userId: userId,
                isOnline: true,
                lastSeen: null,
              });
            }
          }
        });
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    });

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });

    socket.on("send_message", async (data) => {
      const { chatId, senderId, receiverId, text, tempId } = data;
      console.log("Received message:", data);

      try {
        const chat = await Chat.findOne({
          _id: chatId,
          members: { $in: [senderId] },
        });

        if (!chat) {
          socket.emit("message_error", {
            error: "Chat not found or unauthorized",
            tempId,
          });
          return;
        }

        const message = await Message.create({
          chatId,
          senderId,
          receiverId,
          text,
          messageType: "text",
          readBy: [senderId],
        });

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "username fullname avatar")
          .populate("receiverId", "username fullname");

        const messageData = populatedMessage.toObject();

        const enhancedMessage = {
          ...messageData,
          id: messageData._id,
          tempId,
        };

        io.to(chatId).emit("receive_message", enhancedMessage);

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new_message_notification", {
            chatId,
            message: text,
            senderId,
            messageId: message._id,
          });
        }

        console.log(`Message sent in chat ${chatId}: ${text}`);
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("message_error", {
          error: "Failed to send message",
          tempId,
        });
      }
    });

    socket.on("typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("user_typing", { userId });
    });

    socket.on("stop_typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("user_stop_typing", { userId });
    });

    socket.on("mark_as_read", async ({ messageId, userId }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) {
          console.error("Message not found:", messageId);
          return;
        }

        const chat = await Chat.findOne({
          _id: message.chatId,
          members: { $in: [userId] },
        });

        if (!chat) {
          console.error("User not authorized to mark message as read");
          return;
        }

        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: userId },
        });

        io.to(message.chatId.toString()).emit("message_read", {
          messageId,
          userId,
        });
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      let disconnectedUserId = null;
      for (let [userId, socketId] of onlineUsers) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        try {
          const lastSeen = new Date();
          await User.findByIdAndUpdate(disconnectedUserId, {
            isOnline: false,
            lastSeen: lastSeen,
          });

          console.log(`User ${disconnectedUserId} went offline at ${lastSeen}`);

          const userChats = await Chat.find({
            members: { $in: [disconnectedUserId] },
            isGroup: false,
          });

          userChats.forEach((chat) => {
            const otherUserId = chat.members.find(
              (memberId) =>
                memberId.toString() !== disconnectedUserId.toString()
            );

            if (otherUserId) {
              const otherUserSocketId = onlineUsers.get(otherUserId.toString());
              if (otherUserSocketId) {
                io.to(otherUserSocketId).emit("user_status_change", {
                  userId: disconnectedUserId,
                  isOnline: false,
                  lastSeen: lastSeen,
                });
              }
            }
          });
        } catch (error) {
          console.error("Error updating offline status:", error);
        }
      }
    });
  });
}
