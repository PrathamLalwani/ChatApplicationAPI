import express from "express";
import dotenv from "dotenv";
export const userRouter = express.Router();
import User from "../models/user.js";
import user from "../models/user.js";
import room from "../models/room.js";
dotenv.config();

userRouter.post("/add-user", (req, res) => {
  const data = req.body;
  console.log(data.username, data.friendName);

  User.findOne({ username: data.friendName }).then((user) => {
    if (user === null) {
      res.status(404).send("user doesn't exist");
    } else {
      User.findOneAndUpdate(
        { username: user.username },
        { $addToSet: { friends: data.username } }
      )
        .then(() => {
          console.log("friend added successfully");
        })
        .catch((e) => {
          console.log(e);
          res.status(500).send("friend append failed");
        });
      console.log(data.friendName);
      User.findOneAndUpdate(
        { username: data.username },
        { $addToSet: { friends: data.friendName } }
      )
        .then((x) => {
          console.log(`added ${data.friendName} to ${data.username} friends`);
          console.log(x);
          const body = {
            conversationId: 0,
            conversationName: data.friendName,
            messages: [],
            isPersonal: true,
          };
          res.status(200).send({ body: body });
        })
        .catch((e) => {
          console.log(e);
          res.status(500).send("friend append failed");
        });
    }
  });
});

userRouter.post("/create-group", (req, res) => {
  console.log(req.body);
  res.status(200).send({});
});

userRouter.get("/user/:username", (req, res) => {
  const username = req.params.username;
  User.findOne({ username: username })
    .then((t) => {
      if (t === null) {
        new User({ username: username })
          .save()
          .then(() => {
            console.log("new user created");
            res.status(200).send();
          })
          .catch(() => {
            console.log("fail");
            res.status(500);
          });
      }
      res.status(200).send("user exists");
    })
    .catch(() => {
      console.log("user doesn't exist");
    });
});

export default userRouter;
