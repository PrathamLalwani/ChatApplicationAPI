import express from "express";
import dotenv from "dotenv";
export const userRouter = express.Router();
import User from "../models/user.js";
import Room from "../models/room.js";

dotenv.config();

userRouter.post("/add-user", async (req, res) => {
  const data = req.body;
  console.log(data.username, data.friendName);
  const user = await User.findOne({ username: data.username }).catch((e) =>
    console.log(e)
  );
  const friend = await User.findOne({ username: data.friendName }).catch((e) =>
    console.log(e)
  );

  if (friend === null || user === null) {
    res.status(404).send("user doesn't exist");
    return;
  }
  await user
    .updateOne({ $addToSet: { friends: friend.username } })
    .catch((e) => console.log(e));

  console.log("friend added successfully");

  console.log(data.friendName);
  await friend
    .updateOne({ $addToSet: { friends: user.username } })
    .catch((e) => console.log(e));
  console.log(`added ${friend.username} to ${user.username} friends`);
  const body = {
    conversationId: 0,
    conversationName: data.friendName,
    messages: [],
    members: [friend.username, user.username],
    isPersonal: true,
  };
  res.status(200).send({ body: body });
});

userRouter.post("/create-group", async (req, res) => {
  try {
    const roomName = req.body.groupName;
    const roomMembers = req.body.groupMembers;
    console.log(roomName, roomMembers);
    if (roomName === null || roomMembers === null || roomName === "")
      throw new Error("invalid room name or members");
    if (req.body.groupMembers.length < 2)
      throw new Error("invalid room members");
    const room = await Room.findOne({ roomName: req.body.roomName });
    if (room !== null) res.status(500).send("room already exists");

    const createdRoom = await new Room({
      roomName: req.body.groupName,
      roomMembers: req.body.groupMembers,
    }).save();

    for (const member of req.body.groupMembers) {
      await User.findOneAndUpdate(
        { username: member },
        { $addToSet: { rooms: createdRoom } }
      );
      console.log(`added ${member} to ${req.body.groupName} members`);
    }
    console.log(createdRoom);
    res.status(200).send(createdRoom);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

userRouter.get("/user/:username", async (req, res) => {
  const username = req.params.username;
  try {
    const t = await User.findOne({ username: username }).catch((e) =>
      console.log(e)
    );
    if (t !== null) {
      res.status(200).send(t);
      return;
    }
    console.log("user doesn't exist");
    const user = await new User({
      username: username,
    })
      .save()
      .catch((e) => console.log(e));

    console.log("new user created");
    res.status(200).send(user);
  } catch (e) {
    console.log(e);
    res.status(500);
  }
});

userRouter.post("/leave-group", async (req, res) => {
  const username = req.body.username;
  const roomName = req.body.roomName;
  const room = await Room.findOneAndUpdate(
    { roomName: roomName },
    { $pull: { roomMembers: username } }
  ).catch((e) => console.log(e));

  await User.findOneAndUpdate(
    { username: username },
    { $pull: { rooms: room._id } }
  ).catch((e) => console.log(e));
  if (room.roomMembers.length !== 0) {
    await Room.findOneAndDelete({ roomName: roomName }).catch((e) =>
      console.log(e)
    );
    res.status(200).send("user left successfully");
    return;
  }
  res.status(200).send("room deleted successfully");
});

export default userRouter;
