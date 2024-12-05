import { Server } from "socket.io";
export const connectTo = (server) => {
  const io = new Server(server);
  return io;
};
