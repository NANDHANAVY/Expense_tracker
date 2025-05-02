import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios"; // axios instance

export default function AuthForm() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email_address: "",
    password: "",
    confirmPassword: ""
  });

  const handleToggle = () => {
    setIsLogin((prev) => !prev);
    setFormData({ email_address: "", password: "", confirmPassword: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email_address) {
      alert("Email address is required");
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      if (isLogin) {
        // Login flow
        const res = await api.post("/auth/login/", {
          email_address: formData.email_address,
          password: formData.password
        });

        localStorage.setItem("access_token", res.data.access);
        localStorage.setItem("refresh_token", res.data.refresh);
        localStorage.setItem("email_address", formData.email_address);
        localStorage.setItem("password", formData.password);

        navigate("/dashboard");
      } else {
        // Register flow
        const res = await api.post("/auth/register/", {
          email_address: formData.email_address,
          password: formData.password,
          username: formData.email_address.split("@")[0]
        });

        // Auto login after registration
        const loginRes = await api.post("/auth/login/", {
          email_address: formData.email_address,
          password: formData.password
        });

        localStorage.setItem("access_token", loginRes.data.access);
        localStorage.setItem("refresh_token", loginRes.data.refresh);
        localStorage.setItem("email_address", formData.email_address);
        localStorage.setItem("password", formData.password);

        alert("Registration successful! Logged in.");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Auth error:", err.response?.data || err.message);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (err.response?.data && JSON.stringify(err.response.data)) ||
        err.message ||
        "Something went wrong";
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
            <div className="mb-3">
              <label className="form-label">Email Address</label>
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
