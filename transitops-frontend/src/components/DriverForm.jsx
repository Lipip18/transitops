import { useState } from "react";
import API from "../services/api";

function DriverForm({ onDriverAdded }) {
  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      licenseNumber: "",
      licenseCategory: "",
      licenseExpiryDate: "",
      contactNumber: "",
    });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post(
        "/drivers",
        formData
      );

      alert("Driver Added");

      onDriverAdded();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Driver</h3>

      <input
        name="name"
        placeholder="Name"
        onChange={handleChange}
      />

      <input
        type="email"
        name="email"
        placeholder="Driver account email (optional)"
        onChange={handleChange}
      />

      <input
        name="licenseNumber"
        placeholder="License Number"
        onChange={handleChange}
      />

      <input
        name="licenseCategory"
        placeholder="Category"
        onChange={handleChange}
      />

      <input
        type="date"
        name="licenseExpiryDate"
        onChange={handleChange}
      />

      <input
        name="contactNumber"
        placeholder="Contact"
        onChange={handleChange}
      />

      <button type="submit">
        Add Driver
      </button>
    </form>
  );
}

export default DriverForm;