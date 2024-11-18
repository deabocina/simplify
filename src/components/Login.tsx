import "../styles/index.css"
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, signInWithEmailAndPassword } from "../config/firebase";

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
      navigate("/dashboard");
    } catch (error) {
      setError("E-mail or password is not correct! Please try again.");
    }
  };

  return (
    <div className="background-container">
      <div className="register-container">
        <h1>Login</h1>
        <p>
          Don't have an account?{" "}
          <Link to="/register" className="link-style">
            Register here
          </Link>
          .
        </p>
        <form onSubmit={handleSubmit} className="register-form">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="register-input"
            required
          ></input>
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="register-input"
              required
            ></input>
            <img
              src={showPassword ? "/view.png" : "/hide.png"}
              alt={showPassword ? "Hide Password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            ></img>
          </div>

          <button className="home-button" type="submit">
            <span className="text">Login</span>
          </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;
