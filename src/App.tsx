import "./App.css";
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { auth } from "./config/firebase";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    return unsubscribe; // Cleanup on component unmount
  }, []);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    auth.signOut();
    setIsAuthenticated(false);
  };

  return (
    <Router basename="/simplify">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />{" "}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/register"
          element={<Register onRegister={handleLogin} />}
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
