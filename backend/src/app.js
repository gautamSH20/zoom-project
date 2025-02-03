import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import { connectTo } from "./controllers/socketManger.js";
import userRoutes from "./routes/userRoutes.js";
import path from "path";
import "dotenv/config";

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? "https://in-vedio1.onrender.com"
      : "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Routes
app.use("/api/v1/users", userRoutes);
app.get("/health", (req, res) => res.status(200).send("OK"));
app.get("/home", (req, res) => res.json({ hello: "my friend" }));

// Socket.io setup
const io = connectTo(server); // Ensure socketManager.js has production configs

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Server startup
const initiate = async () => {
  try {
    await mongoose.connect(process.env.DB_ID);
    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT || 8000}`);
      console.log(corsOptions.origin);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

initiate();
