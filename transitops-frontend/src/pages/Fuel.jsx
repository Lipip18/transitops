import { useCallback, useEffect, useState } from "react";
import API from "../services/api";

function Fuel() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchFuelLogs = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const { data } = await API.get("/fuel");
      setFuelLogs(data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load fuel logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFuelLogs();
  }, [fetchFuelLogs]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Fuel Logs</h1>
      {errorMessage && (
        <div role="alert">
          <p>{errorMessage}</p>
          <button onClick={fetchFuelLogs} disabled={loading}>Retry</button>
        </div>
      )}

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Liters</th>
            <th>Cost</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr><td colSpan="4">Loading fuel logs...</td></tr>
          ) : fuelLogs.length === 0 && !errorMessage ? (
            <tr><td colSpan="4">No fuel logs found.</td></tr>
          ) : fuelLogs.map((fuel) => (
            <tr key={fuel._id}>
              <td>{fuel.vehicle?.vehicleName}</td>

              <td>{fuel.liters}</td>

              <td>₹{fuel.cost}</td>

              <td>
                {new Date(fuel.date).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Fuel;