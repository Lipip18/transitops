import { useEffect, useState } from "react";
import API from "../services/api";

function FuelForm({ refresh }) {
  const [vehicles, setVehicles] = useState([]);

  const [formData, setFormData] = useState({
    vehicle: "",
    liters: "",
    pricePerLiter: "",
    odometerReading: "",
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    const { data } = await API.get("/vehicles");

    setVehicles(data.vehicles || []);
  };

  const submit = async (e) => {
    e.preventDefault();

    await API.post("/fuel", {
      vehicle: formData.vehicle,
      liters: Number(formData.liters),
      pricePerLiter: Number(formData.pricePerLiter),
      odometerReading: Number(formData.odometerReading),
    });

    refresh();

    setFormData({
      vehicle: "",
      liters: "",
      pricePerLiter: "",
      odometerReading: "",
    });
  };

  return (
    <form onSubmit={submit}>
      <h3>Add Fuel Log</h3>

      <select
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

      <button>Add</button>
    </form>
  );
}

export default FuelForm;