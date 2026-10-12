import { useState } from "react";
import API from "../services/api";

const emptyForm = {
  registrationNumber: "",
  vehicleName: "",
  type: "",
  maximumLoadCapacity: "",
  acquisitionCost: "",
  manufacturer: "",
  model: "",
  year: "",
  odometer: "",
};

function VehicleForm({ vehicle, onVehicleSaved, onCancel }) {
  const [formData, setFormData] = useState(() => ({
    ...emptyForm,
    ...vehicle,
    year: vehicle?.year || "",
    odometer: vehicle?.odometer || "",
  }));
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const payload = {
        ...formData,
        maximumLoadCapacity: Number(formData.maximumLoadCapacity),
        acquisitionCost: Number(formData.acquisitionCost),
        ...(formData.year ? { year: Number(formData.year) } : {}),
        ...(formData.odometer ? { odometer: Number(formData.odometer) } : {}),
      };
      if (vehicle?._id) {
        await API.put(`/vehicles/${vehicle._id}`, payload);
      } else {
        await API.post("/vehicles", payload);
      }
      onVehicleSaved();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to save vehicle."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <h3>{vehicle ? "Edit vehicle" : "Add vehicle"}</h3>
      <input
        name="registrationNumber"
        placeholder="Registration Number"
        value={formData.registrationNumber}
        onChange={handleChange}
        required
      />
      <input
        name="vehicleName"
        placeholder="Vehicle Name"
        value={formData.vehicleName}
        onChange={handleChange}
        required
      />
      <select
        name="type"
        value={formData.type}
        onChange={handleChange}
        required
      >
        <option value="">Select vehicle type</option>
        {["Truck", "Bus", "Van", "Mini Truck", "Pickup", "Car"].map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <input name="manufacturer" placeholder="Manufacturer" value={formData.manufacturer || ""} onChange={handleChange} />
      <input name="model" placeholder="Model" value={formData.model || ""} onChange={handleChange} />
      <input name="year" type="number" min="1900" max="2100" placeholder="Year" value={formData.year} onChange={handleChange} />
      <input
        name="maximumLoadCapacity"
        type="number"
        min="1"
        step="any"
        placeholder="Maximum load capacity (kg)"
        value={formData.maximumLoadCapacity}
        onChange={handleChange}
        required
      />
      <input
        name="acquisitionCost"
        type="number"
        min="0"
        step="any"
        placeholder="Acquisition cost"
        value={formData.acquisitionCost}
        onChange={handleChange}
        required
      />
      <input name="odometer" type="number" min="0" step="any" placeholder="Odometer (km)" value={formData.odometer} onChange={handleChange} />
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? "Saving..." : vehicle ? "Save changes" : "Add vehicle"}</button>
        {onCancel && <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export default VehicleForm;