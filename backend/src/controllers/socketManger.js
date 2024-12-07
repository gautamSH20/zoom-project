import { Server, Socket } from "socket.io";
let connections = {};
let messages = {};
let timeOnline = {};
export const connectTo = (server) => {
  const io = new Server(server);
  io.on("connection", (socket) => {
    socket.on("join-call", (path) => {});
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });
    socket.on("chat-message", (data, sender) => {});
    socket.on("disconnect", () => {});
  });
  return io;
};
