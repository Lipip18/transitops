import { useEffect, useState } from "react";
import API from "../services/api";

function TripForm({ trip, onTripAdded, onCancel }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    source: trip?.source || "",
    destination: trip?.destination || "",
    vehicle: trip?.vehicle?._id || trip?.vehicle || "",
    driver: trip?.driver?._id || trip?.driver || "",
    cargoWeight: trip?.cargoWeight ?? "",
    cargoType: trip?.cargoType || "",
    plannedDistance: trip?.plannedDistance ?? "",
    estimatedDuration: trip?.estimatedDuration ?? "",
  });

  useEffect(() => {
    Promise.all([fetchVehicles(), fetchDrivers()])
      .finally(() => setLoadingOptions(false));
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

  const fetchDrivers = async () => {
    try {
      const { data } = await API.get("/drivers", {
        params: { availableForDispatch: true, limit: 100 },
      });
      setDrivers(data.drivers || []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load available drivers.");
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
    setSaving(true);
    setErrorMessage("");
    try {
      const payload = {
        ...formData,
        cargoWeight: Number(formData.cargoWeight),
        plannedDistance: Number(formData.plannedDistance),
        estimatedDuration: Number(formData.estimatedDuration),
      };
      if (trip?._id) {
        await API.put(`/trips/${trip._id}`, payload);
      } else {
        await API.post("/trips", payload);
      }

      if (!trip) setFormData({
        source: "",
        destination: "",
        vehicle: "",
        driver: "",
        cargoWeight: "",
        cargoType: "",
        plannedDistance: "",
        estimatedDuration: "",
      });

      await onTripAdded();
      if (trip && onCancel) onCancel();
      fetchVehicles();
      fetchDrivers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to create trip.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <h3>{trip ? "Edit draft trip" : "Create Trip"}</h3>
      <input
        name="source"
        placeholder="Source"
        value={formData.source}
        onChange={handleChange}
        required
      />

      <input
        name="destination"
        placeholder="Destination"
        value={formData.destination}
        onChange={handleChange}
        required
      />

      <input
        name="cargoWeight"
        type="number"
        placeholder="Cargo Weight (kg)"
        value={formData.cargoWeight}
        onChange={handleChange}
        required
      />

      <input
        name="cargoType"
        placeholder="Cargo Type"
        value={formData.cargoType}
        onChange={handleChange}
      />

      <input
        name="plannedDistance"
        type="number"
        placeholder="Planned Distance (km)"
        value={formData.plannedDistance}
        onChange={handleChange}
        required
      />

      <input
        name="estimatedDuration"
        type="number"
        placeholder="Estimated Duration (minutes)"
        value={formData.estimatedDuration}
        onChange={handleChange}
      />

      <select
        name="vehicle"
        value={formData.vehicle}
        onChange={handleChange}
        required
        disabled={loadingOptions}
      >
        <option value="">
          Select Vehicle
        </option>

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
        name="driver"
        value={formData.driver}
        onChange={handleChange}
        required
        disabled={loadingOptions}
      >
        <option value="">
          Select Driver
        </option>

        {drivers.map((driver) => (
          <option
            key={driver._id}
            value={driver._id}
          >
            {driver.name}
          </option>
        ))}
      </select>

      {loadingOptions && <p>Loading available vehicles and drivers...</p>}
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      {trip && <button type="button" className="ghost-btn" onClick={onCancel}>Cancel editing</button>}
      <div className="form-actions">
        <button type="submit" disabled={saving || loadingOptions}>{saving ? "Saving..." : trip ? "Save trip" : "Create trip"}</button>
      </div>
    </form>
  );
}

export default TripForm;