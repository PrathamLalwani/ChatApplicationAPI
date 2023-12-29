import express from "express";
import dotenv from "dotenv";
export const userRouter = express.Router();
import User from "../models/user.js";
import Room from "../models/room.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import isAuth from "../middleware/is-auth.js";
dotenv.config();
const saltRounds = parseInt(process.env.NUMFOLDS);
const secret = process.env.SECRET_KEY;
userRouter.post("/add-friend", isAuth, async (req, res) => {
  const data = req.body;
  console.log(data.username, data.friendName);
  const user = await User.findOne({ username: data.username }).catch((e) =>
    console.log(e),
  );
  const friend = await User.findOne({ username: data.friendName }).catch((e) =>
    console.log(e),
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

userRouter.post("/create-group", isAuth, async (req, res) => {
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
        { $addToSet: { rooms: createdRoom } },
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

userRouter.post("/signup", async (req, res) => {
  let username, email, password;
  ({ username, email, password } = req.body);
  console.log(username, password, email);
  console.log(req.body);
  if (!(username && email && password)) {
    res.status(400).send("Not enough information");
    return;
  }
  let t;
  try {
    t = await User.findOne({ username: username });
  } catch (e) {
    console.log(e);
    res.status(500).send("Server Error");
    return;
  }
  if (t !== null) {
    res.status(409).send("User already exists!");
    return;
  }
  console.log(typeof saltRounds);
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const user = new User({
    username: username,
    email: email,
    password: hashedPassword,
  });
  let result;
  try {
    result = await user.save();
  } catch (e) {
    console.log(e);
  }
  res.status(200).send(`New user created with ${user.username}`);
});

userRouter.post("/login", async (req, res) => {
  let username, password;
  try {
    ({ username, password } = req.body);
  } catch (e) {
    res.status(500).send("Not enough information");
    return;
  }
  console.log(req.body);
  let user;
  try {
    user = await User.findOne({ username: username }).catch((e) =>
      console.log(e),
    );
  } catch (e) {
    res.status(500).send("Server Error");
  }
  if (user === null) {
    res.status(404).send("User doesn't exist");
    return;
  }
  let doMatch;
  console.log(user);
  if (user) {
    try {
      doMatch = await bcrypt.compare(password, user.password);
    } catch (e) {
      res.status(500).send("Server Error!");
      return;
    }
    if (!doMatch) {
      res.status(401).send("Wrong Username or Password!");
      return;
    }
  }

  const token = jwt.sign(
    { email: user.email, username: user.username },
    secret,
    { expiresIn: "1h" },
  );
  res.status(200).json({ token: token, username: user.username });
});

userRouter.post("/leave-group", isAuth, async (req, res) => {
  const username = req.body.username;
  const roomName = req.body.roomName;
  const room = await Room.findOneAndUpdate(
    { roomName: roomName },
    { $pull: { roomMembers: username } },
  ).catch((e) => console.log(e));

  await User.findOneAndUpdate(
    { username: username },
    { $pull: { rooms: room._id } },
  ).catch((e) => console.log(e));
  if (room.roomMembers.length !== 0) {
    await Room.findOneAndDelete({ roomName: roomName }).catch((e) =>
      console.log(e),
    );
    res.status(200).send("user left successfully");
    return;
  }
  res.status(200).send("room deleted successfully");
});

export default userRouter;
