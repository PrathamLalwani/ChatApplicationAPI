import express from "express";
import dotenv from "dotenv";
import privateMessage from "../models/privateMessage.js";
import User from "../models/user.js";
import Room from "../models/room.js";
import GroupMessage from "../models/groupMessage.js";
export const chatRouter = express.Router();
dotenv.config();

chatRouter.get("/private-chat/:username", (req, res) => {
  console.log("here");
  const username = req.params.username;

  const user = User.findOne({ username: username }).then((user) => {
    if (user === null) {
      res.status(404).send("user doesn't exist");
    }

    privateMessage
      .find({
        $or: [{ sender: username }, { receiver: username }],
      })
      .sort({ time: 1 })
      .then((data) => {
        const result = {};
        let counter = 0;
        for (const friend of user.friends) {
          result[friend] = {
            conversationId: counter++,
            conversationName: friend,
            messages: [],
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
            });
          }
        }
        res.send(result);
      });
  });
});

chatRouter.get("/group-chat/:username", (req, res) => {
  const username = req.params.username;
  const rooms = Room.find({ roomMembers: username }).then((rooms) => {
    if (rooms === null) {
      res.send({});
    }
    const result = {};
    let conversationId = 0;
    for (const room of rooms) {
      result[room.roomName] = {
        conversationId: conversationId++,
        conversationName: room.roomName,
        messages: [],
        isPersonal: false,
      };
    }
    GroupMessage.find({ roomName: $[rooms.map((room) => room.roomName)] })
      .sort({ time: 1 })
      .then((data) => {
        for (const message of data) {
          result[message.roomName].messages.push({
            username: message.sender,
            message: message.message,
          });
        }
        res.send(result);
      })
      .catch((err) => {
        console.log(err);
      });
  });
});
