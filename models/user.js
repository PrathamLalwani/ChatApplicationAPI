import mongoose from "mongoose";
import Room from "./room.js";
const privateConversation = new mongoose.Schema({
  conversationId: { type: String, required: true },
  conversationName: { type: String, required: true },
  isPersonal: { type: Boolean, required: true },
});

const PrivateConversations = mongoose.model(
  "private-conversation",
  privateConversation
);
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, lowercase: true },
  password: { type: String },
  friends: {
    type: [String],
    default: [],
  },
  rooms: { type: mongoose.Schema.Types.ObjectId, ref: Room },
});

export default mongoose.model("User", userSchema);
