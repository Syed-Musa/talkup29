import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../model/messageModel.js";
import User from "../model/userModel.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

//used to store login users
const userSocketMap = {}; //{userId:socketId}

io.on("connection", (Socket) => {
  console.log("A new connected user :", Socket.id);

  const userId = Socket.handshake.query.userId;
   
  if(!userId || userId ==="undefined" || userId === "null"){
    console.log("Invalid userId received",userId)
  }

  Socket.userId=userId;
  if (userId) userSocketMap[userId] = Socket.id;

  //emits all online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  Socket.on("message_received", async ({ messageId, receiverId }) => {
    // messageId delivered to userId (receiver)
    try {
      await Message.findByIdAndUpdate(messageId || receiverId, {
        status: "delivered",
      });
      // notify sender
      const msg = await Message.findById(messageId);
      const senderSocket = userSocketMap[msg.senderId?.toString()];
      if (senderSocket) {
        io.to(senderSocket).emit("message_delivered", { messageId });
      }
    } catch (err) {
      console.error("message_received error", err);
    }
  });
  Socket.on("mark_seen", async ({ senderId, receiverId }) => {
    try {
      // mark all messages from senderId to receiverId as seen
      const res = await Message.updateMany(
        { senderId, receiverId, status: { $ne: "seen" } },
        { status: "seen" }
      );

      // notify the original sender(s)
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_seen", {
          senderId,
          receiverId,
        });
      }
    } catch (err) {
      console.error("mark_seen error", err);
    }
  });
  Socket.on("online", async ({ receiverId }) => {
    try {
      const res = await Message.updateMany(
        { receiverId, status: "sent" },
        { status: "delivered" }
      );
    } catch (error) {
      console.error("mark_seen error", err);
    }
  });

  Socket.on("typing", ({ reciverUserId, userId }) => {
    const reciverSocketId = userSocketMap[reciverUserId];
    if (reciverSocketId) {
      io.to(reciverSocketId).emit("user_typing", { userId });
    }
  });
  Socket.on("stop_typing", ({ reciverUserId, userId }) => {
    const reciverSocketId = userSocketMap[reciverUserId];
    if (reciverSocketId) {
      io.to(reciverSocketId).emit("user_stop_typing", { userId });
    }
  });

  Socket.on("disconnect", async () => {
    const uid = Socket.userId;

    console.log("User disconnected", Socket.id);

    if (!uid) {
      console.log("skipping disconnect - no  userId found");
      return;
    }

    if(userSocketMap[uid]===Socket.id){

      delete userSocketMap[userId];
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    const lastSeen = new Date();
    io.emit("user_last_seen_update",{
      userId,
      lastSeen
    })
    try {
      await User.findByIdAndUpdate(userId, { lastSeen });
      
    } catch (error) {
      console.log("Error updating lastseen:",error.meeage)
    }
  });
});
export { io, app, server };
