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
    credentials: false,
  })
);
app.use(json({ limit: "5mb" }));

io.on("connection", (socket) => {
  console.log("socket connected");
  connectedUsers++;
  const username = socket.handshake.query.username;

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
        groupName: message.conversationName,
        time: message.time,
      })
        .save()
        .then(() => {
          console.log("message added to group conversations");
        })
        .catch((e) => {
          console.log(e);
          console.log("Message adding failed");
        });
    }
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected");
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
app.get("/check-connection", (req, res) => {
  res.status(200).send("succesfully connected");
});
app.post("/check-connection", (req, res) => {
  res.status(200).send("succesfully connected");
});

app.use((req, res) => {
  res.status(404).send("<h1> 404 Page not found <h1>");
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.j7xkveh.mongodb.net/?retryWrites=true&w=majority`
  )
  .then((res) => {
    console.log("mongo connected");

    server.listen(process.env.PORT, () => {
      console.log(
        `API is running on ${
          process.env.PORT
        } port started on ${new Date().toDateString()} ${new Date().toLocaleTimeString()}`
      );
    });
  })
  .catch((err) => console.log(err));
