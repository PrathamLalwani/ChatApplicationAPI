import mongoose from "mongoose";
const groupMessage = mongoose.Schema({
  sender: { type: String, required: true },
  groupName: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: Date, required: true },
});

export default mongoose.model("groupMessage", groupMessage);
