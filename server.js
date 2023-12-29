import { chatRouter } from "./routers/chat.js";
import express, { json } from "express";
import http from "http";
import ejs from "ejs";
import { router } from "./routers/router.js";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import mongoose from "mongoose";
import User from "./models/user.js";
import privateMessage from "./models/privateMessage.js";
import groupMessage from "./models/groupMessage.js";
import { userRouter } from "./routers/userRouter.js";

const app = express();
const server = http.createServer(app);
let connectedUsers = 0;
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
dotenv.config();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }),
);
app.use(json({ limit: "5mb" }));

const activeUsers = {};
io.on("connection", async (socket) => {
  console.log("socket connected");
  connectedUsers++;
  activeUsers[username] = socket.id;
  //getting the username
  const username = socket.handshake.query.username;
  //getting the rooms the user is a part of
  const rooms = await User.findOne({ username: username })
    .select("rooms")
    .populate("rooms");
  if (rooms === null) {
    console.log("no rooms found");
  } else {
    for (const room of rooms.rooms) {
      socket.join(room.roomName);
    }
  }
  //send message event
  socket.on("send-message", (message) => {
    console.log(message);
    if (message.isPersonal) {
      new privateMessage({
        message: message.message,
        sender: message.username,
        receiver: message.conversationName,
        time: message.time,
      })
        .save()
        .then(() => {
          console.log("message added to private conversation successfully");
          socket.to;
          socket.broadcast.emit("receive-message", message);
        })
        .catch((e) => {
          console.log(e);
          console.log("message append failed");
        });
    } else {
      new groupMessage({
        message: message.message,
        sender: message.username,
        roomName: message.conversationName,
        time: message.time,
      })
        .save()
        .then(() => {
          console.log("message added to group conversations");
          socket.to(message.conversationName).emit("receive-message", message);
        })
        .catch((e) => {
          console.log(e);
          console.log("Message adding failed");
        });
    }
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected");
    delete activeUsers[username];
    connectedUsers--;
  });

  socket.on("join-room", (room) => {
    socket.join(room);
  });

  socket.on("send-message-room", (room) => {
    socket.broadcast.to(room);
  });
});

app.use(chatRouter);
app.use(userRouter);
app.get("/check-connection", (_, res) => {
  res.status(200).send("succesfully connected");
});
app.post("/check-connection", (_, res) => {
  res.status(200).send("succesfully connected");
});

app.use((req, res) => {
  res.status(404).send("<h1> 404 Page not found <h1>");
});

mongoose
  .connect(process.env.DB_ADDRESS)
  .then((res) => {
    console.log("mongo connected");

    server.listen(process.env.PORT, () => {
      console.log(
        `API is running on ${
          process.env.PORT
        } port started on ${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
      );
    });
  })
  .catch((err) => console.log(err));
