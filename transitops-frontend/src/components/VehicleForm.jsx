import { useState } from "react";
import API from "../services/api";

function VehicleForm({ onVehicleAdded }) {
  const [formData, setFormData] = useState({
    registrationNumber: "",
    vehicleName: "",
    type: "",
    maximumLoadCapacity: "",
    acquisitionCost: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/vehicles", formData);

      alert("Vehicle Added");

      setFormData({
        registrationNumber: "",
        vehicleName: "",
        type: "",
        maximumLoadCapacity: "",
        acquisitionCost: "",
      });

      onVehicleAdded();
    } catch (error) {
      console.error(error);
      alert("Failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Vehicle</h3>

      <input
        name="registrationNumber"
        placeholder="Registration Number"
        value={formData.registrationNumber}
        onChange={handleChange}
      />

      <input
        name="vehicleName"
        placeholder="Vehicle Name"
        value={formData.vehicleName}
        onChange={handleChange}
      />

      <input
        name="type"
        placeholder="Type"
        value={formData.type}
        onChange={handleChange}
      />

      <input
        name="maximumLoadCapacity"
        placeholder="Capacity"
        value={formData.maximumLoadCapacity}
        onChange={handleChange}
      />

      <input
        name="acquisitionCost"
        placeholder="Acquisition Cost"
        value={formData.acquisitionCost}
        onChange={handleChange}
      />

      <button type="submit">
        Add Vehicle
      </button>
    </form>
  );
}

export default VehicleForm;