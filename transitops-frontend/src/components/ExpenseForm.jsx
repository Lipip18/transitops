import { useEffect, useState } from "react";
import API from "../services/api";

function ExpenseForm({ refresh, expense, onCancel }) {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicle: expense?.vehicle?._id || expense?.vehicle || "",
    expenseType: expense?.expenseType || "",
    amount: expense?.amount || "",
    description: expense?.description || "",
    date: expense?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get("/vehicles", { params: { limit: 100 } })
      .then(({ data }) => setVehicles(data.vehicles || []))
      .catch((error) => setErrorMessage(error.response?.data?.message || "Unable to load vehicles."));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };
      if (expense?._id) {
        await API.put(`/expenses/${expense._id}`, payload);
      } else {
        await API.post("/expenses", payload);
      }
      await refresh();
      if (expense && onCancel) {
        onCancel();
      } else {
        setFormData((current) => ({ ...current, expenseType: "", amount: "", description: "" }));
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="record-form" onSubmit={submit}>
      <h3>{expense ? "Edit expense" : "Record an expense"}</h3>
      <select name="vehicle" value={formData.vehicle} onChange={(event) => setFormData((current) => ({ ...current, vehicle: event.target.value }))} required>
        <option value="">Select vehicle</option>
        {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.vehicleName} ({vehicle.registrationNumber})</option>)}
      </select>
      <select name="expenseType" value={formData.expenseType} onChange={(event) => setFormData((current) => ({ ...current, expenseType: event.target.value }))} required>
        <option value="">Select expense type</option>
        {["Fuel", "Maintenance", "Toll", "Insurance", "Salary", "Other"].map((type) => <option key={type}>{type}</option>)}
      </select>
      <input type="number" min="0.01" step="any" placeholder="Amount" value={formData.amount} onChange={(event) => setFormData((current) => ({ ...current, amount: event.target.value }))} required />
      <input type="date" value={formData.date} onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))} required />
      <textarea placeholder="Description" value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} />
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? "Saving..." : expense ? "Save changes" : "Save expense"}</button>
        {onCancel && <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export default ExpenseForm;
