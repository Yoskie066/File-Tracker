import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  number: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["faculty", "admin"], 
    required: true,
  },
  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("UserManagement", userSchema);
export default User;
