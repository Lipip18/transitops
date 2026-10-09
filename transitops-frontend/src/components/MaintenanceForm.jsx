import { useEffect, useState } from "react";
import API from "../services/api";

function MaintenanceForm({ onMaintenanceAdded }) {
  const [vehicles, setVehicles] = useState([]);

  const [formData, setFormData] = useState({
    vehicle: "",
    maintenanceType: "",
    description: "",
    cost: "",
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data } = await API.get("/vehicles", {
        params: { availableForDispatch: true },
      });
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.vehicle ||
      !formData.maintenanceType ||
      !formData.description ||
      !formData.cost
    ) {
      return alert("Please fill all fields.");
    }

    try {
      await API.post("/maintenance", formData);

      alert("Maintenance started successfully.");

      setFormData({
        vehicle: "",
        maintenanceType: "",
        description: "",
        cost: "",
      });

      fetchVehicles();

      if (onMaintenanceAdded) {
        onMaintenanceAdded();
      }

    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to create maintenance."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "25px",
      }}
    >
      <h3>Start Vehicle Maintenance</h3>

      <select
        name="vehicle"
        value={formData.vehicle}
        onChange={handleChange}
      >
        <option value="">Select Vehicle</option>

        {vehicles.map((vehicle) => (
          <option
            key={vehicle._id}
            value={vehicle._id}
          >
            {vehicle.vehicleName} (
            {vehicle.registrationNumber})
          </option>
        ))}
      </select>

      <br />
      <br />

      <input
        type="text"
        name="maintenanceType"
        placeholder="Maintenance Type"
        value={formData.maintenanceType}
        onChange={handleChange}
      />

      <br />
      <br />

      <textarea
        name="description"
        rows="4"
        placeholder="Maintenance Description"
        value={formData.description}
        onChange={handleChange}
      />

      <br />
      <br />

      <input
        type="number"
        name="cost"
        placeholder="Cost"
        value={formData.cost}
        onChange={handleChange}
      />

      <br />
      <br />

      <button type="submit">
        Start Maintenance
      </button>
    </form>
  );
}

export default MaintenanceForm;