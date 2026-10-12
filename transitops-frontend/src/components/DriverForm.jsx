import { useState } from "react";
import API from "../services/api";

function DriverForm({ driver, onDriverSaved, onCancel }) {
  const [formData, setFormData] = useState({
    name: driver?.name || "",
    email: driver?.email || "",
    licenseNumber: driver?.licenseNumber || "",
    licenseCategory: driver?.licenseCategory || "",
    licenseExpiryDate: driver?.licenseExpiryDate?.slice(0, 10) || "",
    contactNumber: driver?.contactNumber || "",
    status: driver?.status || "Available",
    safetyScore: driver?.safetyScore ?? 100,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const payload = { ...formData, safetyScore: Number(formData.safetyScore) };
      if (driver?._id) {
        await API.put(`/drivers/${driver._id}`, payload);
      } else {
        await API.post("/drivers", payload);
      }
      await onDriverSaved();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save driver.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <h3>{driver ? "Edit driver" : "Add driver"}</h3>
      <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
      <input type="email" name="email" placeholder="Driver account email (optional)" value={formData.email} onChange={handleChange} />
      <input name="licenseNumber" placeholder="License number" value={formData.licenseNumber} onChange={handleChange} required />
      <select name="licenseCategory" value={formData.licenseCategory} onChange={handleChange} required>
        <option value="">Select license category</option>
        {["LMV", "HMV", "Transport", "Commercial"].map((category) => <option key={category}>{category}</option>)}
      </select>
      <input type="date" name="licenseExpiryDate" value={formData.licenseExpiryDate} onChange={handleChange} required />
      <input name="contactNumber" placeholder="Contact number" value={formData.contactNumber} onChange={handleChange} required />
      <input type="number" name="safetyScore" min="0" max="100" placeholder="Safety score" value={formData.safetyScore} onChange={handleChange} />
      {driver && (
        <select name="status" value={formData.status} onChange={handleChange}>
          {["Available", "Off Duty", "Suspended"].map((status) => <option key={status}>{status}</option>)}
          {driver.status === "On Trip" && <option>On Trip</option>}
        </select>
      )}
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? "Saving..." : driver ? "Save changes" : "Add driver"}</button>
        {onCancel && <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export default DriverForm;
