import mongoose from "mongoose";
import Room from "./room.js";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true },
  password: { type: String, required: true },
  friends: {
    type: [String],
    default: [],
  },
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: Room }],
  userImage: {
    type: String,
  },
});

export default mongoose.model("User", userSchema);
