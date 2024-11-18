import "../styles/index.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db, createUserWithEmailAndPassword } from "../config/firebase";
import { doc, setDoc } from "firebase/firestore";

interface RegisterProps {
  onRegister: () => void;
}

const Register = ({ onRegister }: RegisterProps) => {
  const [name, setName] = useState<string>("");
  const [surname, setSurname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !surname || !email || !password) {
      setError("Please fill in all fields!");
      return;
    }

    try {
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredentials.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        surname: surname,
        email: email,
      });
      onRegister();
      navigate("/dashboard");
    } catch (error: any) {
      console.log(`Registration error: ${error.message}`);

      if (error.code === "auth/email-already-in-use") {
        setError("E-mail is already in use. Try logging in.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid e-mail format. Please check your input.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. It should be at least 6 characters.");
      } else {
        setError("An error occurred during registration. Please try again.");
      }
    }
  };

  return (
    <div className="background-container">
      <div className="register-container">
        <h1>Register</h1>
        <p>
          Already have an account?{" "}
          <Link to="/login" className="link-style">
            Login here
          </Link>
          .
        </p>
        <form onSubmit={handleSubmit} className="register-form">
          <div className="name-container">
            <input
              type="text"
              placeholder="First name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="register-input"
              required
            />
            <input
              type="text"
              placeholder="Last name"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="register-input"
              required
            />
          </div>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="register-input"
            required
          />
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="register-input"
              required
            />
            <img
              src={showPassword ? "/view.png" : "hide.png"}
              alt={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            ></img>
          </div>
          <div className="checkbox-terms">
            <input
              type="checkbox"
              id="termsAndConditions"
              name="termsAndConditions"
              value="accepted"
              required
            />
            <label htmlFor="termsAndConditions">
              <small>
                I agree to the{" "}
                <Link
                  to="https://www.termsfeed.com/live/b212b84e-d5e2-4b88-8d0c-8c668bca5586"
                  className="link-style"
                >
                  Terms & Conditions
                </Link>
              </small>
            </label>
          </div>

          <br />
          <button className="home-button" type="submit">
            <span className="text">Register</span>
          </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
};

export default Register;
