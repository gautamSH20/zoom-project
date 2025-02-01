import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import { connectTo } from "./controllers/socketManger.js";
import exp from "node:constants";
import "dotenv/config";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const server = createServer(app);
const io = connectTo(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/users", userRoutes);

app.get("/home", (req, res) => {
  res.json({
    hello: "my friend",
  });
});

const initiate = async () => {
  const connectionDb = await mongoose.connect(process.env.DB_ID);

  server.listen(app.get("port"), (req, res) => {
    console.log("working");
  });
};

initiate();
