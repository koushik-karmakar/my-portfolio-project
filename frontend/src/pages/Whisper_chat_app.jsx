import { useState, useEffect, useRef } from "react";
import { AlertBox } from "../components/AlertBox.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../utils/Chat/socketConn.jsx";

const Whisper_chat_app = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAtMaxHeight, setIsAtMaxHeight] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedInitialChats, setHasLoadedInitialChats] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const sidebarContainerRef = useRef(null);
  const socketRef = useRef(null);

  const MAX_LINES = 5;
  const LINE_HEIGHT = 24;
  const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES;

  const [number, setNumber] = useState(null);
  const [showAddNumber, setShowAddNumber] = useState(false);

  const hasChats = chats.length > 0;

  const getUser = () => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const user = getUser();

  useEffect(() => {
    if (socketRef.current?.connected && chats.length > 0) {
      chats.forEach((chat) => {
        socketRef.current.emit("join_chat", chat.id);
      });
    }
  }, [socketRef.current?.connected, chats]);
  useEffect(() => {
    const loadUserChats = async () => {
      if (!user?._id || hasLoadedInitialChats) return;

      setIsLoading(true);
      try {
        const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
        const response = await axios.get(`${backend}/api/users/chats`, {
          withCredentials: true,
        });

        if (response.data.success) {
          const backendChats = response.data.data;
          const filteredChats = backendChats.filter((chat) => {
            if (chat.lastMessage && chat.lastMessage.text) {
              const systemMessages = [
                "You started a conversation",
                "No messages yet",
              ];
              return !systemMessages.includes(chat.lastMessage.text);
            }
            return false;
          });

          const formattedChats = filteredChats.map((chat) => ({
            id: chat.id,
            backendId: chat.id,
            name: chat.name,
            avatar: chat.avatar,
            avatarColor:
              chat.avatarColor || "bg-linear-to-r from-blue-600 to-indigo-500",
            status: chat.status || "offline",
            lastSeen: chat.lastSeen || "Recently",
            unread: chat.unread || 0,
            members: chat.members,
            otherUserId: chat.otherUserInfo?._id,
            messages: [],
            lastMessageInfo: chat.lastMessage,
          }));

          setChats(formattedChats);
          setHasLoadedInitialChats(true);
        }
      } catch (error) {
        console.error("Error loading chats:", error);
        AlertBox("error", "Failed to load chats", 500);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserChats();
  }, [user, hasLoadedInitialChats]);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, MAX_HEIGHT);
      textareaRef.current.style.height = `${newHeight}px`;
      setIsAtMaxHeight(textareaRef.current.scrollHeight > MAX_HEIGHT);
      if (textareaRef.current.scrollHeight > MAX_HEIGHT) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }
  }, [messageText]);

  useEffect(() => {
    if (showUserSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showUserSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showUserSearch &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        if (
          !event.target.closest('button[class*="rounded-full"]') &&
          !event.target.closest('div[class*="cursor-pointer"]')
        ) {
          closeUserSearch();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserSearch]);

  useEffect(() => {
    const get_user_number = async () => {
      try {
        const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
        const user = getUser();
        if (!user || !user.email) {
          AlertBox("error", "User not found. Please log in again.", 401);
          navigate("/login");
          return;
        }

        const user_mail = user.email;
        const response = await axios.post(
          `${backend}/api/users/user-number`,
          { email: user_mail },
          {
            withCredentials: true,
          }
        );

        setNumber(response.data.data.number);
        setShowAddNumber(false);
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 400 && message === "User's number not added") {
          AlertBox("warning", "Please add your number to continue", 400);
          setShowAddNumber(true);
          return;
        }

        AlertBox("error", message || error.message, status);
      }
    };

    get_user_number();
  }, []);

  // Search for new users
  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        await searchUsers(searchInput.trim());
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!activeChat?.id || !socketRef.current) return;
    socketRef.current.emit("join_chat", activeChat.id);
  }, [activeChat]);

  useEffect(() => {
    socketRef.current = getSocket(import.meta.env.VITE_BACKEND_PORT_LINK);
    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      if (user?._id) {
        socket.emit("user_online", user._id);
      }

      chats.forEach((chat) => {
        socket.emit("join_chat", chat.id);
      });
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("receive_message", (messageData) => {
      console.log("DEBUG: Received new message:", messageData);
      handleIncomingMessage(messageData);
    });

    socket.on("message_read", ({ messageId, userId }) => {
      updateMessageStatus(messageId, "read");
    });

    socket.on("user_typing", ({ userId }) => {
      if (activeChat?.members?.includes(userId)) {
        setIsTyping(true);
      }
    });

    socket.on("user_stop_typing", ({ userId }) => {
      if (activeChat?.members?.includes(userId)) {
        setIsTyping(false);
      }
    });

    socket.on("user_status_change", ({ userId, isOnline, lastSeen }) => {
      updateUserStatus(userId, isOnline, lastSeen);
    });

    socket.on("new_message_notification", (data) => {
      if (Notification.permission === "granted" && !document.hasFocus()) {
        new Notification("New message", {
          body: data.message,
          icon: "/notification-icon.png",
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, chats]);

  useEffect(() => {
    if (socketRef.current?.connected && chats.length > 0) {
      chats.forEach((chat) => {
        socketRef.current.emit("join_chat", chat.id);
      });
    }
  }, [socketRef.current?.connected, chats]);

  const handleIncomingMessage = (messageData) => {
    const isMyMessage = messageData.senderId?._id === user?._id;
    const tempMessageMatch = messageData.tempId
      ? `temp_${Date.now()}`.includes(messageData.tempId)
      : false;

    const newMessage = {
      id: messageData._id,
      text: messageData.text,
      sender: isMyMessage
        ? "me"
        : messageData.messageType === "system"
        ? "system"
        : "them",
      time: new Date(messageData.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "delivered",
      senderInfo: messageData.senderId
        ? {
            _id: messageData.senderId._id,
            username: messageData.senderId.username,
            fullname: messageData.senderId.fullname,
            avatar: messageData.senderId.avatar,
          }
        : null,
      receiverId: messageData.receiverId?._id,
      createdAt: messageData.createdAt,
      isSystem: messageData.messageType === "system",
    };

    if (activeChat?.id === messageData.chatId) {
      setActiveChat((prev) => {
        const filteredMessages =
          prev.messages?.filter(
            (msg) => !(msg.isTemp && msg.text === messageData.text)
          ) || [];

        return {
          ...prev,
          messages: [...filteredMessages, newMessage],
          lastSeen: "Just now",
        };
      });

      if (!isMyMessage && socketRef.current) {
        socketRef.current.emit("mark_as_read", {
          messageId: messageData._id,
          userId: user._id,
        });
      }
    }

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === messageData.chatId) {
          const filteredMessages =
            chat.messages?.filter(
              (msg) => !(msg.isTemp && msg.text === messageData.text)
            ) || [];

          return {
            ...chat,
            messages: [...filteredMessages, newMessage],
            lastSeen: "Just now",
          };
        }
        return chat;
      })
    );

    scrollToBottom();
  };

  const updateMessageStatus = (messageId, status) => {
    setActiveChat((prev) => ({
      ...prev,
      messages: (prev.messages || []).map((msg) =>
        msg.id === messageId ? { ...msg, status } : msg
      ),
    }));

    setChats((prevChats) =>
      prevChats.map((chat) => ({
        ...chat,
        messages: (chat.messages || []).map((msg) =>
          msg.id === messageId ? { ...msg, status } : msg
        ),
      }))
    );
  };

  const updateUserStatus = (userId, isOnline, lastSeen) => {
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.otherUserId === userId || chat.otherUserInfo?._id === userId) {
          const updatedChat = { ...chat };
          updatedChat.status = isOnline ? "online" : "offline";
          if (lastSeen) {
            const now = new Date();
            const lastSeenDate = new Date(lastSeen);
            const diffInMinutes = Math.floor(
              (now - lastSeenDate) / (1000 * 60)
            );

            if (diffInMinutes < 1) updatedChat.lastSeen = "Just now";
            else if (diffInMinutes < 60)
              updatedChat.lastSeen = `${diffInMinutes}m ago`;
            else if (diffInMinutes < 1440)
              updatedChat.lastSeen = `${Math.floor(diffInMinutes / 60)}h ago`;
            else
              updatedChat.lastSeen = `${Math.floor(diffInMinutes / 1440)}d ago`;
          }

          if (updatedChat.otherUserInfo?._id === userId) {
            updatedChat.otherUserInfo = {
              ...updatedChat.otherUserInfo,
              isOnline,
              lastSeen,
            };
          }

          return updatedChat;
        }
        return chat;
      })
    );

    if (activeChat?.otherUserId === userId) {
      setActiveChat((prev) => ({
        ...prev,
        status: isOnline ? "online" : "offline",
      }));
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Recently";

    try {
      const now = new Date();
      const lastSeen = new Date(timestamp);
      const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));

      if (diffInMinutes < 1) return "Just now";
      else if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      else if (diffInMinutes < 1440)
        return `${Math.floor(diffInMinutes / 60)}h ago`;
      else return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch (error) {
      return "Recently";
    }
  };

  const getLastMessageFromBackend = (chat) => {
    if (chat.lastMessageInfo) {
      return {
        time: chat.lastMessageInfo.time || "",
        text: chat.lastMessageInfo.text || "",
        sender: chat.lastMessageInfo.senderIsMe ? "me" : "them",
        hasFile: false,
        fileName: "",
      };
    }

    const messages = chat.messages || [];
    if (messages.length === 0) {
      return {
        time: "",
        text: "No messages yet",
        sender: "",
        hasFile: false,
        fileName: "",
      };
    }

    const lastMessage = messages[messages.length - 1];
    return {
      time: lastMessage.time || "",
      text: lastMessage.text || "",
      sender: lastMessage.sender || "",
      hasFile: !!lastMessage.file,
      fileName: lastMessage.file?.name || "",
    };
  };

  const handleChatSelect = async (chat) => {
    if (chat.messages && chat.messages.length > 0) {
      setActiveChat(chat);
      setSidebarOpen(false);
      return;
    }

    setIsChatLoading(true);

    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
      const response = await axios.get(
        `${backend}/api/users/chats/${chat.id}/messages`,
        {
          withCredentials: true,
          params: { page: 1, limit: 50 },
        }
      );

      if (response.data.success) {
        const messagesData = response.data.data.messages;

        const realMessages = messagesData.filter(
          (msg) =>
            !msg.text.includes("You started a conversation") &&
            msg.text !== "No messages yet"
        );

        const formattedMessages = realMessages.map((msg) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          time: msg.time,
          status: msg.status || "read",
          senderInfo: msg.senderInfo,
          createdAt: msg.createdAt,
        }));

        const updatedChat = {
          ...chat,
          messages: formattedMessages,
        };

        setChats((prevChats) =>
          prevChats.map((c) => (c.id === chat.id ? updatedChat : c))
        );

        setActiveChat(updatedChat);
        setSidebarOpen(false);

        if (socketRef.current) {
          socketRef.current.emit("join_chat", chat.id);
        }

        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      AlertBox("error", "Failed to load messages", 500);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleTyping = () => {
    if (!activeChat?.id || !socketRef.current) return;

    socketRef.current.emit("typing", {
      chatId: activeChat.id,
      userId: user._id,
    });

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      socketRef.current.emit("stop_typing", {
        chatId: activeChat.id,
        userId: user._id,
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleTextareaInput = (e) => {
    setMessageText(e.target.value);
    handleTyping();
  };

  const searchUsers = async (query) => {
    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
      const res = await axios.get(`${backend}/api/users/search`, {
        params: { q: query },
        withCredentials: true,
      });
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setSearchResults([]);
      console.error("Search error:", error);
    }
  };

  const closeUserSearch = () => {
    setShowUserSearch(false);
    setSearchInput("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleSelectUser = async (userToChat) => {
    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
      console.log("Creating chat with user:", userToChat);

      const res = await axios.post(
        `${backend}/api/users/chats/create`,
        {
          targetUserId: userToChat._id,
        },
        {
          withCredentials: true,
        }
      );

      const responseData = res.data.data;
      const { chat, messages } = responseData;

      const newChat = {
        id: chat._id,
        backendId: chat._id,
        name:
          userToChat.fullname ||
          userToChat.username ||
          `User ${userToChat.number}`,
        lastSeen: "Just now",
        avatar:
          userToChat.avatar ||
          "https://res.cloudinary.com/db7qmdfr2/image/upload/v1767720537/user-avatar-male-5_dbn4iq.png",
        avatarColor: "bg-linear-to-r from-blue-600 to-indigo-500",
        status: userToChat.isOnline ? "online" : "offline",
        unread: 0,
        messages: (messages || []).map((msg) => ({
          id: msg._id,
          text: msg.text,
          sender: msg.sender || (msg.type === "system" ? "system" : "them"),
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "read",
          isSystem: msg.type === "system",
          backendId: msg._id,
        })),
        members: chat.members,
        otherUserId: userToChat._id,
      };

      setChats((prevChats) => {
        const existingChatIndex = prevChats.findIndex((c) => c.id === chat._id);
        if (existingChatIndex >= 0) {
          const updatedChats = [...prevChats];
          updatedChats[existingChatIndex] = newChat;
          return updatedChats;
        }
        return [newChat, ...prevChats];
      });

      setActiveChat(newChat);
      setShowUserSearch(false);
      setSearchInput("");
      setSearchResults([]);

      if (socketRef.current) {
        socketRef.current.emit("join_chat", chat._id);
      }

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error("Chat creation error:", error);
      AlertBox("error", "Failed to create chat. Please try again.", 500);
    }
  };

  const createLocalChat = (userToChat) => {
    return {
      id: `local_chat_${Date.now()}_${userToChat._id || userToChat.number}`,
      name: userToChat.username || `User ${userToChat.number}`,
      lastSeen: "Just now",
      avatarColor: "bg-linear-to-r from-blue-600 to-indigo-500",
      status: "offline",
      unread: 0,
      messages: [
        {
          id: 1,
          text: `Chat with ${
            userToChat.username || `User ${userToChat.number}`
          }`,
          sender: "system",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "read",
        },
        {
          id: 2,
          text: "Type your first message below to start the conversation!",
          sender: "system",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "read",
        },
      ],
      isLocal: true,
    };
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        AlertBox("error", "File size should be less than 10MB", 400);
        return;
      }

      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
      ];
      if (!validTypes.includes(file.type)) {
        AlertBox("error", "Only images, PDFs, and text files are allowed", 400);
        return;
      }

      setSelectedFile(file);
      handleUploadFile(file);
    }
  };

  const handleUploadFile = async (file) => {
    if (!file || !activeChat) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", activeChat.id);
    formData.append("sender", "me");

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await new Promise((resolve) => setTimeout(resolve, 2000));
      clearInterval(progressInterval);
      setUploadProgress(100);

      const fileMessage = {
        id: (activeChat.messages?.length || 0) + 1,
        text: "",
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
        },
        sender: "me",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sent",
      };

      const updatedChats = chats.map((chat) => {
        if (chat.id === activeChat.id) {
          return {
            ...chat,
            messages: [...(chat.messages || []), fileMessage],
            lastSeen: "Just now",
          };
        }
        return chat;
      });

      setChats(updatedChats);
      setActiveChat({
        ...activeChat,
        messages: [...(activeChat.messages || []), fileMessage],
        lastSeen: "Just now",
      });

      setSelectedFile(null);
      setIsUploading(false);
      setUploadProgress(0);

      setTimeout(() => {
        const updatedChatsWithDelivery = updatedChats.map((chat) => {
          if (chat.id === activeChat.id) {
            const updatedMessages = (chat.messages || []).map((msg) =>
              msg.id === fileMessage.id ? { ...msg, status: "delivered" } : msg
            );
            return { ...chat, messages: updatedMessages };
          }
          return chat;
        });

        setChats(updatedChatsWithDelivery);
        setActiveChat((prev) => ({
          ...prev,
          messages: (prev.messages || []).map((msg) =>
            msg.id === fileMessage.id ? { ...msg, status: "delivered" } : msg
          ),
        }));
      }, 1000);

      setTimeout(() => {
        const updatedChatsWithRead = updatedChats.map((chat) => {
          if (chat.id === activeChat.id) {
            const updatedMessages = (chat.messages || []).map((msg) =>
              msg.id === fileMessage.id ? { ...msg, status: "read" } : msg
            );
            return { ...chat, messages: updatedMessages };
          }
          return chat;
        });

        setChats(updatedChatsWithRead);
        setActiveChat((prev) => ({
          ...prev,
          messages: (prev.messages || []).map((msg) =>
            msg.id === fileMessage.id ? { ...msg, status: "read" } : msg
          ),
        }));
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      AlertBox("error", "Failed to upload file", 500);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeChat || !socketRef.current || !user) {
      console.error("Cannot send message: missing required data");
      return;
    }

    const receiverId =
      activeChat.otherUserId || activeChat.members?.find((m) => m !== user._id);

    if (!receiverId) {
      console.error("No receiver found for this chat");
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const tempMessage = {
      id: tempId,
      text: messageText,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sending",
      isTemp: true,
      createdAt: new Date(),
    };

    setActiveChat((prev) => ({
      ...prev,
      messages: [...(prev.messages || []), tempMessage],
      lastSeen: "Just now",
    }));

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === activeChat.id) {
          return {
            ...chat,
            messages: [...(chat.messages || []), tempMessage],
            lastSeen: "Just now",
          };
        }
        return chat;
      })
    );

    setMessageText("");
    scrollToBottom();

    socketRef.current.emit("send_message", {
      chatId: activeChat.id,
      senderId: user._id,
      receiverId: receiverId,
      text: messageText,
      tempId: tempId,
    });

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      socketRef.current.emit("stop_typing", {
        chatId: activeChat.id,
        userId: user._id,
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIcon = (status, sender = "me") => {
    const iconColor =
      sender === "me"
        ? "text-blue-200"
        : status === "read"
        ? "text-blue-500"
        : "text-gray-400";

    switch (status) {
      case "sent":
      case "delivered":
      case "read":
        return (
          <svg
            className={`w-4 h-4 ml-1 ${iconColor}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
              fillRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) {
      return (
        <svg
          className="w-6 h-6 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    } else if (fileType === "application/pdf") {
      return (
        <svg
          className="w-6 h-6 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-6 h-6 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    }
  };

  const lineCount = messageText.split("\n").length;
  const getLastMessageInfo = (chat) => {
    const messages = chat.messages || [];
    if (messages.length === 0) {
      return {
        time: "",
        text: "",
        sender: "",
        hasFile: false,
        fileName: "",
      };
    }

    const lastMessage = messages[messages.length - 1];
    return {
      time: lastMessage.time || "",
      text: lastMessage.text || "",
      sender: lastMessage.sender || "",
      hasFile: !!lastMessage.file,
      fileName: lastMessage.file?.name || "",
    };
  };

  const ChatLoadingAnimation = () => (
    <div className="flex-1 flex flex-col items-center justify-center pt-30">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div
              className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0s" }}
            ></div>
          </div>
          <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
            <div
              className="w-4 h-4 bg-indigo-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <div
              className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2">
            <div
              className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.3s" }}
            ></div>
          </div>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse"></div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Loading Messages
        </h3>
        <p className="text-slate-600">Fetching your conversation...</p>
      </div>
    </div>
  );

  const UserSearchModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={searchContainerRef}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-slate-200"
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">
              Find Users to Chat
            </h3>
            <button
              onClick={closeUserSearch}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by username or number..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-500"
              value={searchInput}
              onChange={handleSearchInputChange}
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[50vh] p-4">
          {isSearching ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-3 text-slate-600">Searching users...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 rounded-xl border border-slate-200 hover:bg-blue-50 cursor-pointer transition-all duration-200 hover:border-blue-300 group"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="w-12 h-12 rounded-full bg-linear-to-r from-blue-500 to-indigo-400 flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {user.username?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-semibold text-slate-800">
                      {user.username || `User ${user.number}`}
                    </h4>
                    {user.number && (
                      <p className="text-sm text-slate-500">{user.number}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Click to start chatting
                    </p>
                  </div>
                  <svg
                    className="w-6 h-6 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v12m8-8H4"
                    />
                  </svg>
                </div>
              ))}
            </div>
          ) : searchInput.trim().length >= 2 ? (
            <div className="py-8 text-center">
              <svg
                className="w-16 h-16 text-slate-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-slate-600">No users found</p>
              <p className="text-sm text-slate-500 mt-2">
                Try searching with a different username or number
              </p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <svg
                className="w-16 h-16 text-blue-200 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-slate-600">Search for users</p>
              <p className="text-sm text-slate-500 mt-2">
                Enter at least 2 characters to start searching
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            Search by username or phone number
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-slate-50 to-blue-50 overflow-hidden">
      {showUserSearch && <UserSearchModal />}

      {showAddNumber ? (
        <div className="flex items-center justify-center h-full px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100">
            <div className="flex flex-col items-center">
              <div className="mb-6 p-4 bg-linear-to-r from-blue-100 to-indigo-100 rounded-2xl">
                <svg
                  className="w-16 h-16 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M14 3a1 1 0 011 1v1a1 1 0 01-1 1M20 3a1 1 0 011 1v1a1 1 0 01-1 1"
                    className="opacity-70"
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Phone Verification Required
              </h3>

              <p className="text-gray-600 mb-2 text-center leading-relaxed">
                To ensure account security and enable important features, please
                add your phone number.
              </p>
              <p className="text-sm text-gray-500 mb-8 text-center">
                This helps with two-factor authentication and account recovery.
              </p>

              <button
                onClick={() => navigate("/add-number")}
                className="group relative cursor-pointer px-8 py-4 text-base font-semibold rounded-xl
                 bg-linear-to-r from-blue-500 to-indigo-600 text-white
                 hover:from-blue-600 hover:to-indigo-700 
                 transition-all duration-300 transform hover:-translate-y-1 
                 shadow-lg hover:shadow-xl active:translate-y-0
                 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:ring-offset-2"
              >
                <div className="flex items-center justify-center space-x-3">
                  <svg
                    className="w-5 h-5 transition-transform group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="tracking-wide">Add Phone Number</span>
                </div>
              </button>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Your number will only be used for security purposes
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse"></div>
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
                <div
                  className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0s" }}
                ></div>
              </div>
              <div className="absolute top-1/2 right-1 transform -translate-y-1/2">
                <div
                  className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                <div
                  className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
              <div className="absolute top-1/2 left-1 transform -translate-y-1/2">
                <div
                  className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.6s" }}
                ></div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Loading Your Chat
            </h3>
            <p className="text-slate-600">
              Preparing your messaging experience...
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-linear-to-r from-slate-100 to-slate-50 p-4 border-b border-slate-200 shadow-sm shrink-0">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-slate-800">Whisper Chat</h1>
              {hasChats && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors duration-200 text-slate-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {hasChats ? (
              <div
                ref={sidebarContainerRef}
                className={`${
                  sidebarOpen ? "absolute inset-0 z-10" : "hidden"
                } md:relative md:flex md:w-1/3 lg:w-1/4 flex-col border-r border-slate-200 bg-slate-50 transform transition-transform duration-300 ease-in-out ${
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0`}
              >
                <div className="p-4 border-b border-slate-200 bg-linear-to-r from-slate-50 to-slate-100 shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Chats</h2>

                    <button
                      onClick={() => setShowUserSearch(true)}
                      className="cursor-pointer p-2 rounded-full bg-linear-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 shadow-sm"
                    >
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search in chats..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {chats.map((chat) => {
                    const lastMessageInfo = getLastMessageFromBackend(chat);
                    return (
                      <div
                        key={chat.id}
                        className={`flex items-center p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 ${
                          activeChat?.id === chat.id
                            ? "bg-linear-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500"
                            : "hover:bg-slate-100"
                        }`}
                        onClick={() => handleChatSelect(chat)}
                      >
                        <div className="relative">
                          <div
                            className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden ${
                              !chat.avatar ? chat.avatarColor : ""
                            }`}
                          >
                            {chat.avatar ? (
                              <img
                                src={chat.avatar}
                                alt={chat.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const fallbackDiv =
                                    document.createElement("div");
                                  fallbackDiv.className = `w-full h-full flex items-center justify-center ${chat.avatarColor}`;
                                  fallbackDiv.textContent =
                                    chat.name?.charAt(0)?.toUpperCase() || "U";
                                  e.target.parentNode.appendChild(fallbackDiv);
                                }}
                              />
                            ) : (
                              chat.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          {chat.status === "online" && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800 truncate">
                              {chat.name}
                            </h3>
                            {lastMessageInfo.time && (
                              <span className="text-xs text-slate-500">
                                {lastMessageInfo.time}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-slate-600 text-sm truncate">
                              {lastMessageInfo.sender === "me" ? "You: " : ""}
                              {lastMessageInfo.text}
                            </p>
                            {chat.unread > 0 && (
                              <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5">
                                {chat.unread}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-slate-500">
                              {chat.status === "online"
                                ? "Online"
                                : `Last seen ${formatLastSeen(chat.lastSeen)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-linear-to-br from-slate-50 to-blue-50 p-4 md:p-8 overflow-hidden">
                <div className="max-w-md w-full mx-auto text-center">
                  <div className="w-48 h-48 mx-auto mb-8">
                    <svg
                      className="w-full h-full text-blue-200"
                      viewBox="0 0 400 400"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="200"
                        cy="200"
                        r="180"
                        fill="#EFF6FF"
                        stroke="#DBEAFE"
                        strokeWidth="4"
                      />
                      <path
                        d="M150 150C150 116.863 177.863 89 211 89H289C322.137 89 350 116.863 350 150V250C350 283.137 322.137 311 289 311H211C177.863 311 150 283.137 150 250V150Z"
                        fill="white"
                        stroke="#DBEAFE"
                        strokeWidth="2"
                      />
                      <circle cx="180" cy="180" r="20" fill="#3B82F6" />
                      <circle cx="280" cy="180" r="20" fill="#3B82F6" />
                      <path
                        d="M180 230C180 230 200 250 220 250C240 250 260 230 260 230"
                        stroke="#CBD5E1"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-3">
                    Start Your First Conversation
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Search for users to start chatting. Your conversations will
                    appear here.
                  </p>
                  <button
                    onClick={() => setShowUserSearch(true)}
                    className=" cursor-pointer inline-flex items-center px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Find Users to Chat
                  </button>
                </div>
              </div>
            )}

            {hasChats && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {!activeChat ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-linear-to-br from-slate-50 to-blue-50 p-4 md:p-8 overflow-hidden">
                    <div className="max-w-md w-full mx-auto text-center">
                      <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-linear-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-3">
                        Welcome to Whisper Chat
                      </h2>
                      <p className="text-slate-600 mb-4">
                        You have {chats.length} conversation
                        {chats.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-slate-500 text-sm mb-6">
                        Select a conversation from the sidebar to start chatting
                      </p>
                      <div className="flex justify-center space-x-4">
                        {chats.length > 0 && (
                          <button
                            onClick={() => handleChatSelect(chats[0])}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                          >
                            Open Latest Chat
                          </button>
                        )}
                        <button
                          onClick={() => setShowUserSearch(true)}
                          className="px-5 py-2.5 border border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 transition-colors duration-200 text-sm font-medium"
                        >
                          New Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-linear-to-r from-slate-100 to-slate-50 p-4 border-b border-slate-200 shadow-sm flex items-center shrink-0">
                      {hasChats && (
                        <button
                          onClick={() => setSidebarOpen(!sidebarOpen)}
                          className="md:hidden mr-3 p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors duration-200 text-slate-700"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                      )}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden ${
                          !activeChat.avatar ? activeChat.avatarColor : ""
                        }`}
                      >
                        {activeChat.avatar ? (
                          <img
                            src={activeChat.avatar}
                            alt={activeChat.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log(
                                "DEBUG: Avatar image failed to load, showing fallback"
                              );
                              e.target.style.display = "none";
                              const fallbackDiv = document.createElement("div");
                              fallbackDiv.className = `w-full h-full flex items-center justify-center ${activeChat.avatarColor}`;
                              fallbackDiv.textContent =
                                activeChat.name?.charAt(0)?.toUpperCase() ||
                                "U";
                              e.target.parentNode.appendChild(fallbackDiv);
                            }}
                          />
                        ) : (
                          activeChat.name?.charAt(0)?.toUpperCase() || "U"
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <h2 className="font-bold text-slate-800">
                          {activeChat.name}
                        </h2>
                        <div className="flex items-center">
                          {activeChat.status === "online" ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                              <p className="text-sm text-green-600 font-medium">
                                Online
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-600">
                              Last seen {activeChat.lastSeen}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto custom-scrollbar bg-linear-to-b from-slate-50 to-slate-100"
                    >
                      {isChatLoading ? (
                        <ChatLoadingAnimation />
                      ) : (
                        <div className="p-4 md:p-6 ">
                          {(activeChat.messages || []).length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 pt-20">
                              <div className="w-24 h-24 mb-6 text-blue-200">
                                <svg
                                  className="w-full h-full"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                No Messages Yet
                              </h3>
                              <p className="text-slate-600 mb-4">
                                Send your first message to start the
                                conversation
                              </p>
                            </div>
                          ) : (
                            <div className="max-w-3xl mx-auto">
                              <div className="flex justify-center my-6">
                                <div className="px-4 py-1.5 bg-slate-200/70 rounded-full text-xs font-medium text-slate-700">
                                  Today
                                </div>
                              </div>

                              {(activeChat.messages || []).map(
                                (message, index) => (
                                  <div
                                    key={message.id || index}
                                    className={`flex mb-6 animate-fadeIn ${
                                      message.sender === "me"
                                        ? "justify-end"
                                        : message.sender === "system"
                                        ? "justify-center"
                                        : "justify-start"
                                    }`}
                                    style={{
                                      animationDelay: `${index * 0.05}s`,
                                    }}
                                  >
                                    {/* Don't show avatar for system messages or your own messages */}
                                    {message.sender !== "me" &&
                                      message.sender !== "system" && (
                                        <div
                                          className={`${activeChat.avatarColor} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2 mt-1 shrink-0`}
                                        >
                                          {"U"}
                                        </div>
                                      )}

                                    {/* System messages */}
                                    {message.sender === "system" ? (
                                      <div className="max-w-xs md:max-w-md lg:max-w-lg">
                                        <div className="text-center text-xs text-slate-500 bg-slate-100/70 px-3 py-1.5 rounded-full">
                                          {message.text}
                                        </div>
                                      </div>
                                    ) : (
                                      /* Regular messages */
                                      <div
                                        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-4 shadow-sm ${
                                          message.sender === "me"
                                            ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-br-none shadow-md"
                                            : "bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow"
                                        }`}
                                      >
                                        {/* File message */}
                                        {message.file && (
                                          <div className="mb-3">
                                            {message.file.type.startsWith(
                                              "image/"
                                            ) ? (
                                              <div className="rounded-lg overflow-hidden">
                                                <img
                                                  src={message.file.url}
                                                  alt={message.file.name}
                                                  className="w-full h-48 object-cover"
                                                />
                                              </div>
                                            ) : (
                                              <div className="flex items-center p-3 bg-slate-100 rounded-lg">
                                                <div className="mr-3">
                                                  {getFileIcon(
                                                    message.file.type
                                                  )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-slate-800 truncate">
                                                    {message.file.name}
                                                  </p>
                                                  <p className="text-xs text-slate-500">
                                                    {formatFileSize(
                                                      message.file.size
                                                    )}
                                                  </p>
                                                </div>
                                                <a
                                                  href={message.file.url}
                                                  download={message.file.name}
                                                  className="ml-2 p-2 rounded-full hover:bg-slate-200 transition-colors duration-200 cursor-pointer"
                                                  onClick={() =>
                                                    console.log(
                                                      "DEBUG: Download file clicked:",
                                                      message.file.name
                                                    )
                                                  }
                                                >
                                                  <svg
                                                    className="w-4 h-4 text-blue-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth="2"
                                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                  </svg>
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Text message */}
                                        {message.text && (
                                          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap wrap-break-word">
                                            {message.text}
                                          </p>
                                        )}

                                        <div className="flex justify-end items-center mt-2">
                                          <span
                                            className={`text-xs ${
                                              message.sender === "me"
                                                ? "text-blue-100"
                                                : "text-slate-500"
                                            } mr-1`}
                                          >
                                            {message.time}
                                          </span>
                                          {message.sender === "me" &&
                                            getStatusIcon(
                                              message.status,
                                              message.sender
                                            )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              )}

                              {isTyping && (
                                <div className="flex justify-start mb-6 animate-fadeIn">
                                  <div
                                    className={`${activeChat.avatarColor} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2 mt-1`}
                                  >
                                    {"U"}
                                  </div>
                                  <div className="bg-white text-slate-800 rounded-2xl rounded-bl-none p-4 border border-slate-200 shadow">
                                    <div className="flex space-x-1.5">
                                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                      <div
                                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.1s" }}
                                      ></div>
                                      <div
                                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.2s" }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {isUploading && (
                                <div className="flex justify-end mb-6 animate-fadeIn">
                                  <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-4 shadow-sm bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-br-none">
                                    <div className="flex items-center">
                                      <div className="mr-3">
                                        <svg
                                          className="w-6 h-6"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                                          />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">
                                          Uploading {selectedFile?.name}...
                                        </p>
                                        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                                          <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                              width: `${uploadProgress}%`,
                                            }}
                                          ></div>
                                        </div>
                                        <p className="text-xs text-blue-100 mt-1">
                                          {uploadProgress}%
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-linear-to-r from-slate-100 to-slate-50 p-4 border-t border-slate-200 shadow-lg shrink-0">
                      <div className="max-w-3xl mx-auto">
                        <div className="flex items-end">
                          {/* File and emoji buttons */}
                          <div className="flex flex-col space-y-2 mr-3">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={(e) => {
                                console.log("DEBUG: File input changed");
                                handleFileSelect(e);
                              }}
                              className="hidden"
                              accept="image/*,.pdf,.txt"
                            />
                            <button
                              onClick={() => {
                                console.log(
                                  "DEBUG: File upload button clicked"
                                );
                                console.log(
                                  "DEBUG: isUploading state:",
                                  isUploading
                                );
                                fileInputRef.current?.click();
                              }}
                              className="p-2.5 rounded-full text-slate-500 hover:bg-slate-200 transition-colors duration-200 cursor-pointer"
                              disabled={isUploading}
                            >
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                            <button
                              className="p-2.5 rounded-full text-slate-500 hover:bg-slate-200 transition-colors duration-200 cursor-pointer"
                              onClick={() =>
                                console.log("DEBUG: Emoji button clicked")
                              }
                            >
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="flex-1 relative">
                            <div className="bg-white rounded-2xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200 overflow-hidden">
                              <div className="relative">
                                <textarea
                                  ref={textareaRef}
                                  className="w-full bg-transparent outline-none resize-none text-slate-800 placeholder-slate-500 py-3 px-4 overflow-y-auto textarea-custom-scroll cursor-text"
                                  placeholder="Type a message"
                                  value={messageText}
                                  onChange={(e) => {
                                    console.log(
                                      "DEBUG: Textarea input changed, length:",
                                      e.target.value.length
                                    );
                                    handleTextareaInput(e);
                                  }}
                                  onKeyPress={(e) => {
                                    console.log(
                                      "DEBUG: Key pressed:",
                                      e.key,
                                      "Shift:",
                                      e.shiftKey
                                    );
                                    handleKeyPress(e);
                                  }}
                                  rows="1"
                                  style={{
                                    maxHeight: `${MAX_HEIGHT}px`,
                                    minHeight: "44px",
                                    lineHeight: "1.5",
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-1 px-1">
                              <div className="text-xs text-slate-400">
                                {isAtMaxHeight ? (
                                  <div className="flex items-center">
                                    <svg
                                      className="w-3 h-3 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                      />
                                    </svg>
                                    <span>Scroll to see more</span>
                                  </div>
                                ) : lineCount > 1 ? (
                                  <span>Shift+Enter for new line</span>
                                ) : null}
                              </div>

                              <div className="flex items-center space-x-2">
                                {lineCount > 1 && (
                                  <div className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    {lineCount} line{lineCount > 1 ? "s" : ""}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            className={`p-3.5 rounded-full ml-3 shadow-md transition-all duration-200 transform hover:scale-105 cursor-pointer ${
                              messageText.trim() && !isUploading
                                ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                : "bg-slate-300 cursor-not-allowed"
                            }`}
                            onClick={() => {
                              console.log("DEBUG: Send button clicked");
                              console.log("DEBUG: messageText:", messageText);
                              console.log("DEBUG: isUploading:", isUploading);
                              handleSendMessage();
                            }}
                            disabled={!messageText.trim() || isUploading}
                          >
                            {messageText.trim() ? (
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-6 h-6 text-slate-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>

                        <div className="flex justify-between items-center mt-3 px-1">
                          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            <span className="font-medium">Tip:</span> Press
                            Enter to send, Shift+Enter for new line
                          </div>
                          <div className="flex items-center space-x-2">
                            {messageText.length > 0 && (
                              <div className="text-xs text-slate-500">
                                {messageText.length} characters
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Bottom Navigation */}
          {hasChats && (
            <div className="md:hidden flex justify-around items-center bg-linear-to-r from-slate-100 to-slate-50 border-t border-slate-200 py-2 shadow-lg shrink-0">
              <button className="flex flex-col items-center p-2 text-blue-600">
                <div className="relative">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs mt-1 font-medium">Chats</span>
              </button>
              <button
                onClick={() => setShowUserSearch(true)}
                className="flex flex-col items-center p-2 text-slate-500 hover:text-blue-600 transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                <span className="text-xs mt-1">Find Friends</span>
              </button>
              <button className="flex flex-col items-center p-2 text-slate-500 hover:text-blue-600 transition-colors duration-200">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-xs mt-1">Calls</span>
              </button>
              <button className="flex flex-col items-center p-2 text-slate-500 hover:text-blue-600 transition-colors duration-200">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                  />
                </svg>
                <span className="text-xs mt-1">Settings</span>
              </button>
            </div>
          )}
        </>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.txt"
      />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .wrap-break-word {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* Custom scrollbar for sidebar and chat area */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Textarea specific scrollbar */
        .textarea-custom-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .textarea-custom-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .textarea-custom-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .textarea-custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Whisper_chat_app;
