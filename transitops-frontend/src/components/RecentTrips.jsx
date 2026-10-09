import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/table.css";

function statusPill(status) {
  const key = String(status || "").toLowerCase().replace(/\s+/g, "");
  return `pill pill-${key}`;
}

function RecentTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/trips", { params: { limit: 5 } });
      setTrips(data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load recent trips.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chart-panel">
      <h3>Recent trips</h3>

      <div className="table-container" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Route</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="empty-table">
                  Loading trips…
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan="5" className="empty-table" role="alert">
                  {errorMessage}
                </td>
              </tr>
            ) : trips.length > 0 ? (
              trips.map((trip) => (
                <tr key={trip._id}>
                  <td>{trip.vehicle?.vehicleName || "-"}</td>
                  <td>{trip.driver?.name || "-"}</td>
                  <td>
                    {trip.source} → {trip.destination}
                  </td>
                  <td>
                    <span className={statusPill(trip.status)}>{trip.status}</span>
                  </td>
                  <td>{trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-table">
                  No recent trips found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentTrips;
