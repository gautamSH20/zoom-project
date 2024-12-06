import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import { connectTo } from "./controllers/socketManger.js";
import exp from "node:constants";

const app = express();
const server = createServer(app);
const io = connectTo(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.get("/home", (req, res) => {
  res.json({
    hello: "my friend",
  });
});

const initiate = async () => {
  const connectionDb = await mongoose.connect(
    "mongodb+srv://gs841400:WiREiWwa9IiAWJ9o@cluster0.6eh78.mongodb.net/"
  );
  console.log(`${connectionDb.connection.host}`);
  server.listen(app.get("port"), (req, res) => {
    console.log("working");
  });
};

initiate();