import mongoose from "mongoose";

const privateMessage = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: Date, required: true },
});

export default mongoose.model("privateMessage", privateMessage);
