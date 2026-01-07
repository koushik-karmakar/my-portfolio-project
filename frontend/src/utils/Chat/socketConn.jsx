import { io } from "socket.io-client";

let socket;

export const getSocket = (url) => {
  if (!socket) {
    socket = io(url, {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
};
