import mongoose, { Schema } from "mongoose";

const userScehma = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: ture },
  password: { type: String, required: true },
  token: { typr: String },
});

const User = mongoose.model("User", userScehma);

export { User };
