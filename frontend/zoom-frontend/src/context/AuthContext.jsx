import { createContext, useContext, useState } from "react";
import httpStatus from "http-status";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { server } from "../enviorment";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);

  const [userData, setUserData] = useState(authContext);

  const handleRegister = async (name, username, password) => {
    try {
      let request = await client.post("/register", {
        name,
        username,
        password,
      });
      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", {
        username,
        password,
      });
      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
      }
    } catch (err) {
      throw err;
    }
  };

  const router = useNavigate();
  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

// Add this line for default export
export default { AuthProvider };
