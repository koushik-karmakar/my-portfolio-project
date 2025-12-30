import React, { useState, useEffect, useRef } from "react";
import { AlertBox } from "../components/AlertBox.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Whisper_chat_app = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAtMaxHeight, setIsAtMaxHeight] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [showUserSearch, setShowUserSearch] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const textareaContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const MAX_LINES = 5;
  const LINE_HEIGHT = 24;
  const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES;

  const [number, setNumber] = useState(null);
  const [showAddNumber, setShowAddNumber] = useState(false);

  const hasChats = chats.length > 0;

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
        const user = JSON.parse(localStorage.getItem("user"));
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

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const searchUsers = async (query) => {
    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
      const res = await axios.get(`http://localhost:8000/api/users/search`, {
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

  const handleSelectUser = (user) => {
    const newChat = {
      id: Date.now(),
      name: user.username || `User ${user.number}`,
      lastSeen: "Just now",
      avatarColor: "bg-linear-to-r from-blue-600 to-indigo-500",
      status: "offline",
      unread: 0,
      messages: [
        {
          id: 1,
          text: `You started a conversation with ${
            user.username || `User ${user.number}`
          }`,
          sender: "system",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "read",
        },
      ],
    };

    setChats([newChat]);
    setActiveChat(newChat);
    setShowUserSearch(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        AlertBox("error", "File size should be less than 10MB", 400);
        return;
      }

      // Check file type
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

    // Create a FormData object
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", activeChat.id);
    formData.append("sender", "me");

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // In a real app, you would upload to your backend
      const response = await axios.post("/api/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));
      clearInterval(progressInterval);
      setUploadProgress(100);

      const fileMessage = {
        id: activeChat.messages.length + 1,
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
            messages: [...chat.messages, fileMessage],
            lastSeen: "Just now",
          };
        }
        return chat;
      });

      setChats(updatedChats);
      setActiveChat({
        ...activeChat,
        messages: [...activeChat.messages, fileMessage],
        lastSeen: "Just now",
      });

      setSelectedFile(null);
      setIsUploading(false);
      setUploadProgress(0);

      setTimeout(() => {
        const updatedChatsWithDelivery = updatedChats.map((chat) => {
          if (chat.id === activeChat.id) {
            const updatedMessages = chat.messages.map((msg) =>
              msg.id === fileMessage.id ? { ...msg, status: "delivered" } : msg
            );
            return { ...chat, messages: updatedMessages };
          }
          return chat;
        });

        setChats(updatedChatsWithDelivery);
        setActiveChat((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === fileMessage.id ? { ...msg, status: "delivered" } : msg
          ),
        }));
      }, 1000);

      setTimeout(() => {
        const updatedChatsWithRead = updatedChats.map((chat) => {
          if (chat.id === activeChat.id) {
            const updatedMessages = chat.messages.map((msg) =>
              msg.id === fileMessage.id ? { ...msg, status: "read" } : msg
            );
            return { ...chat, messages: updatedMessages };
          }
          return chat;
        });

        setChats(updatedChatsWithRead);
        setActiveChat((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
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
    if (messageText.trim() === "") return;

    const newMessage = {
      id: activeChat.messages.length + 1,
      text: messageText,
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
          messages: [...chat.messages, newMessage],
          lastSeen: "Just now",
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setActiveChat({
      ...activeChat,
      messages: [...activeChat.messages, newMessage],
      lastSeen: "Just now",
    });

    setMessageText("");
    setIsAtMaxHeight(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setTimeout(() => {
      const updatedChatsWithDelivery = updatedChats.map((chat) => {
        if (chat.id === activeChat.id) {
          const updatedMessages = chat.messages.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
          );
          return { ...chat, messages: updatedMessages };
        }
        return chat;
      });

      setChats(updatedChatsWithDelivery);
      setActiveChat((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
        ),
      }));
    }, 1000);

    setTimeout(() => {
      const updatedChatsWithRead = updatedChats.map((chat) => {
        if (chat.id === activeChat.id) {
          const updatedMessages = chat.messages.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "read" } : msg
          );
          return { ...chat, messages: updatedMessages };
        }
        return chat;
      });

      setChats(updatedChatsWithRead);
      setActiveChat((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "read" } : msg
        ),
      }));
    }, 2000);

    setIsTyping(true);
    setTimeout(() => {
      const replyMessage = {
        id: activeChat.messages.length + 2,
        text: generateReply(messageText),
        sender: "them",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "read",
      };

      const updatedChatsWithReply = updatedChats.map((chat) => {
        if (chat.id === activeChat.id) {
          const updatedMessages = chat.messages.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "read" } : msg
          );
          return {
            ...chat,
            messages: [...updatedMessages, replyMessage],
          };
        }
        return chat;
      });

      setChats(updatedChatsWithReply);
      setActiveChat((prev) => ({
        ...prev,
        messages: [
          ...prev.messages.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "read" } : msg
          ),
          replyMessage,
        ],
      }));
      setIsTyping(false);
    }, 2000);
  };

  const generateReply = (text) => {
    const replies = [
      "Thanks for the update!",
      "That sounds great!",
      "Let me check and get back to you.",
      "I'll look into that right away.",
      "Perfect timing! I was just thinking about that.",
      "Could you send me more details about that?",
      "I agree with you on that point.",
      "Let's discuss this further tomorrow.",
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e) => {
    setMessageText(e.target.value);
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

  const formatTime = (timeStr) => {
    const time = new Date(`01/01/2000 ${timeStr}`);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

  return (
    <div className="h-screen">
      {showAddNumber ? (
        <div className="flex items-center justify-center h-screen px-4 bg-linear-to-br from-gray-50 to-blue-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
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
      ) : (
        <div className="flex flex-col h-screen bg-linear-to-br from-slate-50 to-slate-100 overflow-hidden">
          {/* Header - Always visible */}
          <div className="bg-linear-to-r from-slate-100 to-slate-50 p-4 border-b border-slate-200 shadow-sm">
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

          <div className="flex flex-1 overflow-hidden relative">
            {/* Sidebar - Only show when user has chats */}
            {hasChats && (
              <div
                className={`${
                  sidebarOpen ? "absolute inset-0 z-10" : "hidden"
                } md:relative md:flex md:w-1/3 lg:w-1/4 flex-col border-r border-slate-200 bg-slate-50 transform transition-transform duration-300 ease-in-out ${
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0`}
              >
                <div className="p-4 border-b border-slate-200 bg-linear-to-r from-slate-50 to-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Chats</h2>
                    {/* Plus button for search in sidebar */}
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

                  {/* Search bar that appears when plus is clicked */}
                  {showUserSearch && hasChats && (
                    <div ref={searchContainerRef} className="mb-4">
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
                          placeholder="Search users..."
                          className="w-full pl-10 pr-10 py-2.5 bg-white border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-500"
                          value={searchInput}
                          onChange={handleSearchInputChange}
                        />
                        <button
                          onClick={closeUserSearch}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                        >
                          <svg
                            className="w-5 h-5 text-slate-400 hover:text-slate-600"
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

                      {/* Search Results in Sidebar */}
                      {searchInput.trim().length > 0 && (
                        <div className="mt-2 bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-4">
                              <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-sm text-slate-600">
                                  Searching...
                                </span>
                              </div>
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((user, index) => (
                              <div
                                key={index}
                                className="flex items-center p-3 border-b border-slate-100 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors duration-150 group"
                                onClick={() => handleSelectUser(user)}
                              >
                                <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-500 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform duration-150 overflow-hidden">
                                  {user.avatar ? (
                                    <img
                                      src={user.avatar}
                                      alt={user.username}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <span>
                                      {user.username?.charAt(0) || "U"}
                                    </span>
                                  )}
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                  <h3 className="font-medium text-slate-800 truncate">
                                    {user.username || `User ${user.number}`}
                                  </h3>
                                  {user.number && (
                                    <p className="text-xs text-slate-500 truncate">
                                      {user.number}
                                    </p>
                                  )}
                                </div>
                                <svg
                                  className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
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
                            ))
                          ) : (
                            <div className="p-4 text-center">
                              <svg
                                className="w-12 h-12 text-slate-400 mx-auto mb-3"
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
                              <p className="text-sm text-slate-500">
                                No users found
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Search Bar (for existing chats) */}
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

                <div className="overflow-y-auto flex-1">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`flex items-center p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 ${
                        activeChat?.id === chat.id
                          ? "bg-linear-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500"
                          : "hover:bg-slate-100"
                      }`}
                      onClick={() => {
                        setActiveChat(chat);
                        setSidebarOpen(false);
                      }}
                    >
                      <div className="relative">
                        <div
                          className={`${chat.avatarColor} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm`}
                        >
                          {chat.name.charAt(0)}
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
                          <span className="text-xs text-slate-500">
                            {chat.messages[chat.messages.length - 1].time}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-slate-600 text-sm truncate">
                            {chat.messages[chat.messages.length - 1].sender ===
                            "me"
                              ? "You: "
                              : ""}
                            {chat.messages[chat.messages.length - 1].text ||
                              (chat.messages[chat.messages.length - 1].file
                                ? `📎 ${
                                    chat.messages[chat.messages.length - 1].file
                                      .name
                                  }`
                                : "")}
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
                              : `Last seen ${chat.lastSeen}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {/* When no active chat - Show search interface */}
              {!activeChat ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-linear-to-br from-slate-50 to-blue-50 p-4 md:p-8">
                  <div className="max-w-md w-full mx-auto">
                    {/* Welcome Message */}
                    <div className="text-center mb-8">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-xl">
                        <svg
                          className="w-12 h-12 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                      </div>
                      <h1 className="text-2xl font-bold text-slate-800 mb-3">
                        Find and Connect
                      </h1>
                      <p className="text-slate-600">
                        Search for users by username or phone number to start
                        chatting
                      </p>
                    </div>

                    <div ref={searchContainerRef} className="w-full">
                      <div className="relative mb-4">
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
                          placeholder="Search by username ..."
                          className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-500"
                          value={searchInput}
                          onChange={handleSearchInputChange}
                          autoFocus
                        />
                      </div>

                      {searchInput.trim().length > 0 && (
                        <div className="mt-4 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                          {isSearching ? (
                            <div className="p-6">
                              <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-sm text-slate-600">
                                  Searching for users...
                                </span>
                              </div>
                            </div>
                          ) : searchResults.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto">
                              {searchResults.map((user, index) => (
                                <div
                                  key={index}
                                  className="flex items-center p-4 border-b border-slate-100 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors duration-150 group"
                                  onClick={() => handleSelectUser(user)}
                                >
                                  <div className="w-12 h-12 rounded-full bg-linear-to-r from-blue-500 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform duration-150 overflow-hidden">
                                    {user.avatar ? (
                                      <img
                                        src={user.avatar}
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                        }}
                                      />
                                    ) : (
                                      <span>
                                        {user.username?.charAt(0) || "U"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="ml-4 flex-1 min-w-0">
                                    <h3 className="font-medium text-slate-800 truncate">
                                      {user.username || `User ${user.number}`}
                                    </h3>
                                    {user.number && (
                                      <p className="text-xs text-slate-500 truncate">
                                        {user.number}
                                      </p>
                                    )}
                                  </div>
                                  <svg
                                    className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
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
                            <div className="p-6 text-center">
                              <svg
                                className="w-12 h-12 text-slate-400 mx-auto mb-3"
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
                              <p className="text-sm text-slate-600">
                                No users found for "
                                <span className="font-medium">
                                  {searchInput}
                                </span>
                                "
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                Try a different search term
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* When active chat exists - Show chat interface */
                <div className="flex-1 flex flex-col bg-linear-to-b from-slate-50 to-slate-100">
                  {/* Chat Header */}
                  <div className="bg-linear-to-r from-slate-100 to-slate-50 p-4 border-b border-slate-200 shadow-sm flex items-center">
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
                      className={`${activeChat.avatarColor} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}
                    >
                      {activeChat.name.charAt(0)}
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

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-linear-to-b from-slate-50 to-slate-100">
                    <div className="max-w-3xl mx-auto">
                      <div className="flex justify-center my-6">
                        <div className="px-4 py-1.5 bg-slate-200/70 rounded-full text-xs font-medium text-slate-700">
                          Today
                        </div>
                      </div>

                      {activeChat.messages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`flex mb-6 animate-fadeIn ${
                            message.sender === "me"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {message.sender !== "me" && (
                            <div
                              className={`${activeChat.avatarColor} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2 mt-1 shrink-0`}
                            >
                              {activeChat.name.charAt(0)}
                            </div>
                          )}
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
                                {message.file.type.startsWith("image/") ? (
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
                                      {getFileIcon(message.file.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-slate-800 truncate">
                                        {message.file.name}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {formatFileSize(message.file.size)}
                                      </p>
                                    </div>
                                    <a
                                      href={message.file.url}
                                      download={message.file.name}
                                      className="ml-2 p-2 rounded-full hover:bg-slate-200 transition-colors duration-200"
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
                                getStatusIcon(message.status, message.sender)}
                            </div>
                          </div>
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex justify-start mb-6 animate-fadeIn">
                          <div
                            className={`${activeChat.avatarColor} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2 mt-1`}
                          >
                            {activeChat.name.charAt(0)}
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
                                    style={{ width: `${uploadProgress}%` }}
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
                  </div>

                  {/* Message Input Area */}
                  <div className="bg-linear-to-r from-slate-100 to-slate-50 p-4 border-t border-slate-200 shadow-lg">
                    <div className="max-w-3xl mx-auto">
                      <div className="flex items-end">
                        {/* File and emoji buttons */}
                        <div className="flex flex-col space-y-2 mr-3">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,.pdf,.txt"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 rounded-full text-slate-500 hover:bg-slate-200 transition-colors duration-200"
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
                          <button className="p-2.5 rounded-full text-slate-500 hover:bg-slate-200 transition-colors duration-200">
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
                          <div
                            ref={textareaContainerRef}
                            className="bg-white rounded-2xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200 overflow-hidden"
                          >
                            <div className="relative">
                              <textarea
                                ref={textareaRef}
                                className="w-full bg-transparent outline-none resize-none text-slate-800 placeholder-slate-500 py-3 px-4 overflow-y-auto textarea-custom-scroll"
                                placeholder="Type a message"
                                value={messageText}
                                onChange={handleTextareaInput}
                                onKeyPress={handleKeyPress}
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
                          className={`p-3.5 rounded-full ml-3 shadow-md transition-all duration-200 transform hover:scale-105 ${
                            messageText.trim() && !isUploading
                              ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                              : "bg-slate-300 cursor-not-allowed"
                          }`}
                          onClick={handleSendMessage}
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
                          <span className="font-medium">Tip:</span> Press Enter
                          to send, Shift+Enter for new line
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
                </div>
              )}
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="md:hidden flex justify-around items-center bg-linear-to-r from-slate-100 to-slate-50 border-t border-slate-200 py-2 shadow-lg">
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
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.txt"
      />

      {/* Add CSS for animations */}
      <style jsx>{`
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
