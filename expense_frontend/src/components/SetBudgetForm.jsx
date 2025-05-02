import { useState } from "react";
import axios from "axios";

export default function SetBudgetForm({ onBudgetAdded }) {
  const [formData, setFormData] = useState({
    budget: "",
    month: "",
    year: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("email_address");

    if (!email) {
      alert("Email not found. Please login again.");
      return;
    }

    const payload = { ...formData, email_address: email };
    const baseURL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

    console.log("Payload being sent:", payload); // Debug log

    try {
      const response = await axios.post(`${baseURL}/budgets/create/`, payload);
      console.log("Response from backend:", response.data);
      alert("Budget set successfully");

      // Reset form
      setFormData({
        budget: "",
        month: "",
        year: "",
      });

      if (onBudgetAdded) onBudgetAdded(); // Optional callback
    } catch (error) {
      console.error("Error setting budget:", error);
      console.log("Response object:", error.response);
      alert(error.response?.data?.detail || "Error setting budget");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border p-4 rounded bg-light shadow-sm mt-5">
      <h5 className="mb-3">Set Monthly Budget</h5>

      <div className="mb-3">
        <input
          name="budget"
          type="number"
          placeholder="Budget"
          className="form-control"
          value={formData.budget}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <input
          name="month"
          placeholder="Month"
          className="form-control"
          value={formData.month}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <input
          name="year"
          placeholder="Year"
          className="form-control"
          value={formData.year}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary w-100">
        Set Budget
      </button>
    </form>
  );
}
