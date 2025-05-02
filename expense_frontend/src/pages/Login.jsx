import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Base URL for backend API, loaded from environment variables
const baseURL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

export default function loginFrom() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email_address: "",
    password: "",
    confirmPassword: ""
  });

  const handleToggle = () => {
    setIsLogin(prev => !prev);
    setFormData({ username: "", email_address: "", password: "", confirmPassword: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      if (isLogin) {
        // Login flow
        const res = await axios.post(`${baseURL}/auth/login/`, {
          email_address: formData.email_address,
          password: formData.password,
        });

        // Store JWT tokens and user credentials
        localStorage.setItem("access_token", res.data.access);
        localStorage.setItem("refresh_token", res.data.refresh);
        localStorage.setItem("email_address", formData.email_address);
        localStorage.setItem("password", formData.password);

        // Redirect to dashboard route
        navigate("/dashboard");
      } else {
        // Register flow
        const res = await axios.post(`${baseURL}/auth/register/`, {
          username: formData.username,
          email_address: formData.email_address,
          password: formData.password,
        });
        console.log("Registration response:", res.data);
        alert("Registration successful! Please login.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error("loginFrom error:", err.response?.data || err.message);
      const msg = err.response?.data?.detail
        || err.response?.data?.error
        || (err.response?.data && JSON.stringify(err.response.data))
        || err.message
        || "Something went wrong";
      alert(msg);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-lg" style={{ maxWidth: 400, width: "100%" }}>
        <div className="card-body">
          <h3 className="card-title text-center mb-4">
            {isLogin ? "Login" : "Register"}
          </h3>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input
                type="email"
                name="email_address"
                value={formData.email_address}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            {!isLogin && (
              <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
            )}
            <button type="submit" className="btn btn-primary w-100">
              {isLogin ? "Login" : "Register"}
            </button>
          </form>
          <div className="mt-3 text-center">
            <button onClick={handleToggle} className="btn btn-link">
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
