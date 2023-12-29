import express from "express";
import dotenv from "dotenv";
import privateMessage from "../models/privateMessage.js";
import User from "../models/user.js";
import Room from "../models/room.js";
import GroupMessage from "../models/groupMessage.js";
export const chatRouter = express.Router();
dotenv.config();

chatRouter.get("/private-chat/", async (req, res) => {
  const username = req.query.username;
  const token = req.query.token;
  const user = await User.findOne({ username: username }).catch((err) =>
    console.log(err),
  );
  if (user === null) {
    res.status(404).send("user doesn't exist");
  }

  const data = await privateMessage
    .find({
      $or: [{ sender: username }, { receiver: username }],
    })
    .sort({ time: 1 })
    .catch((err) => console.log(err));
  const result = {};
  let counter = 0;

  for (const friend of user.friends) {
    result[friend] = {
      conversationId: counter++,
      conversationName: friend,
      messages: [],
      members: [friend, username],
      isPersonal: true,
    };
  }
  for (const message of data) {
    const name =
      message.sender === username ? message.receiver : message.sender;
    if (name in result) {
      result[name].messages.push({
        username: message.sender,
        message: message.message,
        time: message.time,
      });
    }
  }
  res.send(result);
});

chatRouter.get("/group-chat/", async (req, res) => {
  const username = req.query.username;
  const token = req.query.token;
  const rooms = await Room.find({ roomMembers: username }).catch((err) =>
    console.log(err),
  );
  if (rooms === null) {
    res.send({});
    return;
  }
  const result = {};
  let conversationId = 0;
  for (const room of rooms) {
    result[room.roomName] = {
      conversationId: conversationId++,
      conversationName: room.roomName,
      messages: [],
      members: room.roomMembers,
      isPersonal: false,
    };
  }
  const data = await GroupMessage.find({
    roomName: { $in: rooms.map((room) => room.roomName) },
  })
    .sort({ time: 1 })
    .catch((err) => console.log(err));

  if (data === null || data === undefined) {
    res.send(result);
    return;
  }
  for (const message of data) {
    result[message.roomName].messages.push({
      username: message.sender,
      message: message.message,
      time: message.time,
    });
  }
  res.send(result);
});
