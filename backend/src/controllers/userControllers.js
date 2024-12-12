import { User } from "../models/userModel.js";
import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt";
import crypto from "crypto";

// REGISTER
const register = async (req, res) => {
  const { name, username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(httpStatus.FOUND).json({ message: "User already exsist" });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name,
      username: username,
      password: hashPassword,
    });
    await newUser.save();
    res.status(httpStatus.CREATED).json({ message: "Usr created" });
  } catch (e) {
    res.json({
      message: `Someting went wrong${e}`,
    });
  }
};

// LOGIN
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please Provide valid info" });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User Not Found" });
    }
    const isPassword = await bcrypt.compare(password, user.password);
    if (isPassword) {
      let token = crypto.randomBytes(20).toString("hex");
      user.token = token;
      await user.save();
      //   setTimeout(async () => {
      //     try {
      //       user.token = null;
      //       await user.save();
      //       console.log("token has been deleted ");
      //     } catch (e) {
      //       console.log(`something went wrong ${e}`);
      //     }
      //   }, 2000);
      return res.status(httpStatus.OK).json({ token: token });
    } else {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid" });
    }
  } catch (e) {
    return res.status(500).json({ message: `something went wrong ${e}` });
  }
};

export { register, login };
