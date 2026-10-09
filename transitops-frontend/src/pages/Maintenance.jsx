import { useCallback, useEffect, useState } from "react";
import MaintenanceForm from "../components/MaintenanceForm";
import API from "../services/api";
import { hasRole } from "../data/roles";

function Maintenance() {
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingMaintenanceId, setPendingMaintenanceId] = useState("");
  const canManageMaintenance = hasRole("Fleet Manager");

  const fetchMaintenanceLogs = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const { data } = await API.get("/maintenance");
      setMaintenanceLogs(data);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to load maintenance records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceLogs();
  }, [fetchMaintenanceLogs]);

  const completeMaintenance = async (id) => {
    try {
      setPendingMaintenanceId(id);
      await API.put(`/maintenance/${id}/complete`);

      alert("Maintenance completed successfully.");

      fetchMaintenanceLogs();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to complete maintenance."
      );
    } finally {
      setPendingMaintenanceId("");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Maintenance Management</h1>

      {canManageMaintenance && (
        <MaintenanceForm onMaintenanceAdded={fetchMaintenanceLogs} />
      )}

      <br />
      {errorMessage && (
        <div role="alert">
          <p>{errorMessage}</p>
          <button onClick={fetchMaintenanceLogs} disabled={loading}>Retry</button>
        </div>
      )}

      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
        }}
      >
        <thead
          style={{
            background: "#1e293b",
            color: "white",
          }}
        >
          <tr>
            <th>Vehicle</th>
            <th>Maintenance Type</th>
            <th>Description</th>
            <th>Cost</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>Completed Date</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                Loading maintenance records...
              </td>
            </tr>
          ) : maintenanceLogs.length > 0 ? (
            maintenanceLogs.map((log) => (
              <tr key={log._id}>
                <td>
                  {log.vehicle?.vehicleName || "N/A"}
                </td>

                <td>{log.maintenanceType}</td>

                <td>{log.description}</td>

                <td>₹{log.cost}</td>

                <td>{log.status}</td>

                <td>
                  {log.startDate
                    ? new Date(
                        log.startDate
                      ).toLocaleDateString()
                    : "-"}
                </td>

                <td>
                  {log.completedDate
                    ? new Date(
                        log.completedDate
                      ).toLocaleDateString()
                    : "-"}
                </td>

                <td>
                  {canManageMaintenance && log.status === "Active" ? (
                    <button
                      onClick={() =>
                        completeMaintenance(log._id)
                      }
                      disabled={pendingMaintenanceId === log._id}
                    >
                      Complete
                    </button>
                  ) : (
                    "✔ Completed"
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="8"
                style={{
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                No maintenance records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Maintenance;