import { useEffect, useState } from "react";
import API from "../services/api";

function TripForm({ onTripAdded }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [formData, setFormData] = useState({
    source: "",
    destination: "",
    vehicle: "",
    driver: "",
    cargoWeight: "",
    cargoType: "",
    plannedDistance: "",
    estimatedDuration: "",
  });

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
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

  const fetchDrivers = async () => {
    try {
      const { data } = await API.get("/drivers", {
        params: { availableForDispatch: true },
      });
      setDrivers(data.drivers || []);
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

    try {
      await API.post("/trips", {
        ...formData,
        cargoWeight: Number(formData.cargoWeight),
        plannedDistance: Number(formData.plannedDistance),
        estimatedDuration: Number(formData.estimatedDuration),
      });

      alert("Trip created successfully.");

      setFormData({
        source: "",
        destination: "",
        vehicle: "",
        driver: "",
        cargoWeight: "",
        cargoType: "",
        plannedDistance: "",
        estimatedDuration: "",
      });

      onTripAdded();
      fetchVehicles();
      fetchDrivers();

    } catch (error) {

      alert(
        error.response?.data?.message ||
          "Failed to create trip."
      );

    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: "1px solid #ddd",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "25px",
        background: "#fff",
      }}
    >
      <h2>Create Trip</h2>

      <input
        name="source"
        placeholder="Source"
        value={formData.source}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <input
        name="destination"
        placeholder="Destination"
        value={formData.destination}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <input
        name="cargoWeight"
        type="number"
        placeholder="Cargo Weight (kg)"
        value={formData.cargoWeight}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <input
        name="cargoType"
        placeholder="Cargo Type"
        value={formData.cargoType}
        onChange={handleChange}
      />

      <br />
      <br />

      <input
        name="plannedDistance"
        type="number"
        placeholder="Planned Distance (km)"
        value={formData.plannedDistance}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <input
        name="estimatedDuration"
        type="number"
        placeholder="Estimated Duration (minutes)"
        value={formData.estimatedDuration}
        onChange={handleChange}
      />

      <br />
      <br />

      <select
        name="vehicle"
        value={formData.vehicle}
        onChange={handleChange}
        required
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

      <br />
      <br />

      <select
        name="driver"
        value={formData.driver}
        onChange={handleChange}
        required
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

      <br />
      <br />

      <button type="submit">
        Create Trip
      </button>
    </form>
  );
}

export default TripForm;