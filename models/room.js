import mongoose from "mongoose";

const Room = new mongoose.Schema({
  roomName: { type: String, required: true, unique: true },
  roomMembers: {
    type: [String],
    required: true,
  },
});
export default mongoose.model("Room", Room);
