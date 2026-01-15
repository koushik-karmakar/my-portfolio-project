import { useState, useEffect, useRef } from "react";
import { getSocket } from "../utils/Chat/socketConn.jsx";
import axios from "axios";

export default function WhisperChatApp() {
  const [users, setUsers] = useState([]);

  const [messages, setMessages] = useState([]);
  // search new user
  const [searchedUser, setSearchedUser] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const modalRef = useRef(null);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;
  const filteredUsers = searchedUser.filter(
    (user) => user._id !== currentUserId
  );

  const searchUsers = async (query) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_PORT_LINK}/api/users/search`,
        { params: { q: query }, withCredentials: true }
      );
      setSearchedUser(res.data);
      console.log(res.data);
    } catch (error) {
      console.error("Get user data error:", error);
      return [];
    }
  };

  // get connected user
  useEffect(() => {
    const getUserChat = async () => {
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_PORT_LINK
          }/api/users/get-connected-user`,
          {
            withCredentials: true,
          }
        );
        setUsers(res.data);
        console.log(res.data[0]);
      } catch (error) {
        console.error("Search user error:", error);
        return [];
      }
    };
    getUserChat();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCloseModal();
      }
    };

    if (isNewChatModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isNewChatModalOpen]);

  // socekt sonnection -- set user online
  useEffect(() => {
    socketRef.current = getSocket(import.meta.env.VITE_BACKEND_PORT_LINK);
    const socket = socketRef.current;

    if (!socket) return;

    const onConnect = () => {
      console.log("User connected:", socket.id);
      const getUser = localStorage.getItem("user");
      if (!getUser) return;
      const user = JSON.parse(getUser);
      socket.emit("user_online", user._id);
      console.log(user._id);
    };
    // const onReceiveMessage = (payload) => {
    //   console.log("Received message:", payload.toString());
    //   updateLastMessage(payload.chatId, payload.text, payload.createdAt);

    //   if (payload.chatId?.toString()) {
    //     const sms = {
    //       chatId: payload.chatId.toString(),
    //       createdAt: payload.createdAt,
    //       messageType: payload.messageType,
    //       readBy: payload.readBy.map((id) => id.toString()),
    //       receiverId: payload.receiverId.toString(),
    //       senderId: payload.senderId.toString(),
    //       text: payload.text,
    //       updatedAt: payload.updatedAt,
    //       _id: payload._id,
    //     };

    //     setMessages((prev) => [...prev, sms]);
    //     console.log("new sms", sms);
    //   }
    // };
    const onReceiveMessage = (payload) => {
      console.log("Received message:", payload);

      updateLastMessage(
        payload.chatId,
        payload.text,
        payload.createdAt,
        payload.senderId
      );

      const currentChatId = selectedUser?.chatId?.toString();
      const incomingChatId = payload.chatId?.toString();

      if (currentChatId && incomingChatId === currentChatId) {
        const sms = {
          chatId: payload.chatId.toString(),
          createdAt: payload.createdAt,
          messageType: payload.messageType,
          readBy: payload.readBy.map((id) => id.toString()),
          receiverId: payload.receiverId.toString(),
          senderId: payload.senderId.toString(),
          text: payload.text,
          updatedAt: payload.updatedAt,
          _id: payload._id,
        };

        setMessages((prev) => [...prev, sms]);

        if (selectedUser?.chatId === payload.chatId) {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.chatId === payload.chatId ? { ...user, unread: 0 } : user
            )
          );
        }
      }
    };
    const onDisconnect = () => {
      console.log("User disconnected");
    };

    socket.on("connect", onConnect);
    socket.on("receive_message", onReceiveMessage);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("receive_message", onReceiveMessage);
      socket.off("disconnect", onDisconnect);
    };
  }, [selectedUser]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedUser?.chatId) return;

    socket.emit("join_chat", selectedUser.chatId);

    return () => {
      socket.emit("leave_chat", selectedUser.chatId);
    };
  }, [selectedUser?.chatId]);

  const updateLastMessage = async (
    chatId,
    text,
    time = new Date().toISOString(),
    senderId = null
  ) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.chatId === chatId) {
          const isMyMessage = senderId === currentUserId;

          return {
            ...user,
            lastMessage: text,
            lastMessageAt: time,
            unread: isMyMessage ? user.unread || 0 : (user.unread || 0) + 1,
          };
        }
        return user;
      })
    );

    const existingUser = users.find((user) => user.chatId === chatId);
    if (!existingUser) {
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_PORT_LINK
          }/api/users/get-chat-details`,
          {
            params: { chatId },
            withCredentials: true,
          }
        );

        if (res.data && res.data.otherUser) {
          const isMyMessage = senderId === currentUserId;

          setUsers((prev) => [
            {
              ...res.data.otherUser,
              chatId,
              lastMessage: text,
              lastMessageAt: time,
              unread: isMyMessage ? 0 : 1,
            },
            ...prev,
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch chat details:", error);
      }
    }
  };
  const handleOpenModal = () => {
    setIsNewChatModalOpen(true);
    setSearchQuery("");
  };

  const handleCloseModal = () => {
    setIsNewChatModalOpen(false);
    setSearchQuery("");
    setSearchedUser([]);
  };

  const handleSelectContact = async (user) => {
    const existingUser = users.find((u) => u._id === user._id);
    if (existingUser) {
      handleSelectUser(existingUser);
    } else {
      handleNewUserChat(user);
    }
    handleCloseModal();
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const newMsg = {
      text: newMessage.trim(),
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      createdAt: new Date(),
    };

    updateLastMessage(
      selectedUser.chatId,
      newMessage.trim(),
      new Date(),
      currentUser._id
    );

    socketRef.current.emit("send_message", newMsg);
    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();

      if (e.target.style) {
        e.target.style.height = "44px";
      }
    }
  };

  const getMessage = async (chatId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_PORT_LINK}/api/users/get-messages`,
        {
          params: {
            chatId,
          },
          withCredentials: true,
        }
      );
      setMessages(res.data);
      console.log("get all sms:", res.data);
    } catch (error) {
      console.error("Search user error:", error);
      return [];
    }
  };

  const handleNewUserChat = (user) => {
    setSelectedUser(user);
    setMessages([]);
    setUsers((prev) => {
      if (prev.some((u) => u._id === user._id)) {
        return prev;
      }
      return [user, ...prev];
    });
  };

  const handleSelectUser = async (user) => {
    setMessages([]);
    setSelectedUser(user);

    // Reset unread count for this user
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u._id === user._id ? { ...u, unread: 0 } : u))
    );

    if (user.chatId) {
      await getMessage(user.chatId);
    } else {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_PORT_LINK}/api/users/check-chat`,
          {
            params: { userId: user._id },
            withCredentials: true,
          }
        );
        if (res.data.chatId) {
          setSelectedUser((prev) => ({ ...prev, chatId: res.data.chatId }));
          await getMessage(res.data.chatId);
        }
      } catch (error) {
        console.error("Check chat error:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[calc(100vh-180px)] md:h-[calc(100vh-200px)]">
      {/* modal section start  */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-200 scale-100"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-gray-50 to-white">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">New Chat</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Start a conversation with your contacts
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer p-2 rounded-full transition-colors duration-150"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or phone number..."
                  className="w-full pl-10 pr-4 py-3.5 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              <div>
                {searchQuery.trim().length < 2 && (
                  <div className="py-12 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-r from-blue-50 to-purple-50 flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.114a4 4 0 00-5.667-5.667"
                        />
                      </svg>
                    </div>

                    <h4 className="text-xl font-semibold text-gray-900 mb-3">
                      Find Contacts
                    </h4>
                    <p className="text-gray-600 max-w-sm mx-auto">
                      Search for contacts by name to start a new conversation
                    </p>
                  </div>
                )}

                {searchQuery.trim().length >= 2 &&
                  filteredUsers &&
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectContact(user)}
                      className="flex items-center p-3.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors duration-150 mx-2 my-1"
                    >
                      <div className="relative w-12 h-12 shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullname || user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                            {(user.fullname || user.username)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {user.fullname || user.username}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {user.email || user.number}
                        </p>
                      </div>
                    </div>
                  ))}

                {searchQuery.trim().length >= 2 &&
                  filteredUsers.length === 0 && (
                    <div className="py-16 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>

                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No results found
                      </h4>
                      <p className="text-gray-600 max-w-xs mx-auto">
                        No contacts match{" "}
                        <span className="text-gray-900 font-medium">
                          "{searchQuery}"
                        </span>
                      </p>
                    </div>
                  )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-end text-sm">
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium rounded-lg cursor-pointer transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* modal section end  */}

      {/* users list - leftside */}
      <div
        className={`md:w-1/4 border-r border-gray-200 flex flex-col ${
          isMobile && selectedUser ? "hidden" : "flex"
        }`}
      >
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between text-gray-600">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Whisper Chat
            </h2>
            <button
              onClick={handleOpenModal}
              className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
            >
              New Chat
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full p-3 pl-10 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => handleSelectUser(user)}
              className={`p-4 md:p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                selectedUser && user._id === selectedUser._id
                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-center">
                <div className="relative">
                  <div className="relative w-12 h-12 shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullname || user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                        {(user.fullname || user.username)
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  {user.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {user.unread > 9 ? "9+" : user.unread}
                      </span>
                    </div>
                  )}

                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {user.fullname}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {user.lastMessageAt
                        ? new Date(user.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm truncate">
                    {user.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* chat section-right side */}
      <div
        className={`flex-1 flex flex-col ${
          isMobile && !selectedUser ? "hidden" : "flex"
        }`}
      >
        {selectedUser ? (
          <>
            {/* navbar */}
            <div className="p-4 md:p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {isMobile && (
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="mr-4 text-gray-600 hover:text-gray-800 cursor-pointer"
                    >
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                  )}
                  <div className="relative">
                    <div className="relative w-10 h-10 shrink-0">
                      {selectedUser?.avatar ? (
                        <img
                          src={selectedUser.avatar}
                          alt={selectedUser.fullname || selectedUser.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {(
                            selectedUser?.fullname ||
                            selectedUser?.username ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    {selectedUser.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h2 className="font-semibold text-gray-800">
                      {selectedUser.fullname}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedUser.isOnline ? "Online" : "Last seen recently"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button className="text-gray-600 hover:text-gray-800 cursor-pointer">
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 cursor-pointer">
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
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* message section  */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
              <div className="space-y-4">
                {messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      className={`flex ${
                        message.senderId === currentUserId
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] md:max-w-[60%] rounded-2xl px-4 py-3 ${
                          message.senderId === currentUserId
                            ? "bg-blue-500 text-white rounded-br-none"
                            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {message.text}
                        </p>
                        <div
                          className={`text-xs mt-1 ${
                            message.senderId === currentUserId
                              ? "text-blue-100"
                              : "text-gray-500"
                          } text-right`}
                        >
                          {message.createdAt
                            ? new Date(message.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : ""}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation 👋</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* input field  */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-3">
                <button className="text-gray-600 hover:text-gray-800 p-2 cursor-pointer">
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
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>

                <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full bg-transparent p-4 rounded-2xl focus:outline-none resize-none overflow-y-auto
                                [&::-webkit-scrollbar]:w-2
                                [&::-webkit-scrollbar-track]:bg-transparent
                                [&::-webkit-scrollbar-thumb]:bg-transparent
                                [&::-webkit-scrollbar-thumb]:hover:bg-transparent
                                [&::-webkit-scrollbar]:hover:bg-transparent
                                [&::-webkit-scrollbar]:active:bg-transparent
                                scrollbar-width: none; /* Firefox */
                                -ms-overflow-style: none; /* IE and Edge */"
                    rows="1"
                    style={{
                      minHeight: "44px",
                      maxHeight: "120px",
                      lineHeight: "24px",
                    }}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className={`p-3 rounded-full cursor-pointer ${
                    newMessage.trim()
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  } transition-colors duration-150`}
                >
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
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 max-w-md">
                Choose a contact from the list to start messaging. Your
                conversations will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
