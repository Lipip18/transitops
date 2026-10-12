import { useEffect, useState } from "react";
import API from "../services/api";

function FuelForm({ refresh, fuelLog, onCancel }) {
  const [vehicles, setVehicles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    vehicle: fuelLog?.vehicle?._id || fuelLog?.vehicle || "",
    liters: fuelLog?.liters || "",
    pricePerLiter: fuelLog?.pricePerLiter || "",
    odometerReading: fuelLog?.odometerReading || "",
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const { data } = await API.get("/vehicles", { params: { limit: 100 } });
      setVehicles(data.vehicles || []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load vehicles.");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const payload = {
        vehicle: formData.vehicle,
        liters: Number(formData.liters),
        pricePerLiter: Number(formData.pricePerLiter),
        odometerReading: Number(formData.odometerReading),
      };
      if (fuelLog?._id) {
        await API.put(`/fuel/${fuelLog._id}`, payload);
      } else {
        await API.post("/fuel", payload);
      }
      await refresh();
      if (fuelLog && onCancel) onCancel();
      setFormData({
        vehicle: "",
        liters: "",
        pricePerLiter: "",
        odometerReading: "",
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save fuel log.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="record-form" onSubmit={submit}>
      <h3>{fuelLog ? "Edit fuel log" : "Add fuel log"}</h3>
      <select
        name="vehicle"
        value={formData.vehicle}
        required
        onChange={(e) =>
          setFormData({
            ...formData,
            vehicle: e.target.value,
          })
        }
      >
        <option value="">Select Vehicle</option>

        {vehicles.map((v) => (
          <option
            key={v._id}
            value={v._id}
          >
            {v.vehicleName}
          </option>
        ))}
      </select>

      <input
        required
        type="number"
        placeholder="Liters"
        min="0.01"
        step="any"
        value={formData.liters}
        onChange={(e) =>
          setFormData({
            ...formData,
            liters: e.target.value,
          })
        }
      />

      <input
        required
        type="number"
        placeholder="Price per Liter"
        min="0.01"
        step="any"
        value={formData.pricePerLiter}
        onChange={(e) =>
          setFormData({
            ...formData,
            pricePerLiter: e.target.value,
          })
        }
      />

      <input
        required
        type="number"
        placeholder="Odometer Reading"
        min="0"
        step="any"
        value={formData.odometerReading}
        onChange={(e) =>
          setFormData({
            ...formData,
            odometerReading: e.target.value,
          })
        }
      />

      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? "Saving..." : fuelLog ? "Save changes" : "Add fuel log"}</button>
        {onCancel && <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export default FuelForm;