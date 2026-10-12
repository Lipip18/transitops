import { useEffect, useState } from "react";
import API from "../services/api";

function MaintenanceForm({ onMaintenanceAdded }) {
  const [vehicles, setVehicles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    vehicle: "",
    maintenanceType: "Preventive",
    description: "",
    cost: "",
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data } = await API.get("/vehicles", {
        params: { availableForDispatch: true, limit: 100 },
      });
      setVehicles(data.vehicles || []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load available vehicles.");
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
      formData.cost === ""
    ) {
      return alert("Please fill all fields.");
    }

    try {
      setSaving(true);
      setErrorMessage("");
      await API.post("/maintenance", {
        ...formData,
        cost: Number(formData.cost),
      });

      setFormData({
        vehicle: "",
        maintenanceType: "Preventive",
        description: "",
        cost: "",
      });

      fetchVehicles();

      if (onMaintenanceAdded) {
        await onMaintenanceAdded();
      }

    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to create maintenance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <h3>Start vehicle maintenance</h3>
      <select
        name="vehicle"
        value={formData.vehicle}
        onChange={handleChange}
        required
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

      <select
        name="maintenanceType"
        value={formData.maintenanceType}
        onChange={handleChange}
        required
      >
        {["Preventive", "Corrective", "Engine Repair", "Oil Change", "Brake Service", "Tyre Replacement", "Battery Replacement", "General Service", "Insurance", "Other"].map((type) => <option key={type}>{type}</option>)}
      </select>

      <textarea
        name="description"
        rows="4"
        placeholder="Maintenance Description"
        value={formData.description}
        onChange={handleChange}
        required
      />

      <input
        type="number"
        name="cost"
        placeholder="Cost"
        min="0"
        step="any"
        value={formData.cost}
        onChange={handleChange}
        required
      />
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      <div className="form-actions"><button type="submit" disabled={saving}>{saving ? "Starting..." : "Start maintenance"}</button></div>
    </form>
  );
}

export default MaintenanceForm;