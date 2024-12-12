import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LandingPage from "./pages/Landing.jsx";
import Authentication from "./pages/authentication.jsx";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/home" element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
