import { useCallback, useEffect, useState } from "react";
import MaintenanceForm from "../components/MaintenanceForm";
import API from "../services/api";
import { hasRole } from "../data/roles";
import PageHeader from "../components/PageHeader";

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
    <div className="resource-page">
      <PageHeader title="Maintenance" subtitle="Schedule and track vehicle maintenance." />

      {canManageMaintenance && (
        <MaintenanceForm onMaintenanceAdded={fetchMaintenanceLogs} />
      )}

      {errorMessage && (
        <div className="notice notice-error" role="alert">
          <span>{errorMessage}</span>
          <button className="ghost-btn" onClick={fetchMaintenanceLogs} disabled={loading}>Retry</button>
        </div>
      )}

      <div className="table-container">
      <table className="data-table">
        <thead
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

                <td><span className={`pill pill-${log.status.toLowerCase().replaceAll(" ", "")}`}>{log.status}</span></td>

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
                  <div className="row-actions">
                    {canManageMaintenance && log.status === "Active" && (
                      <button
                        className="primary-btn"
                        onClick={() => completeMaintenance(log._id)}
                        disabled={pendingMaintenanceId === log._id}
                      >
                        Complete
                      </button>
                    )}
                    {canManageMaintenance && log.status === "Completed" && (
                      <button
                        className="delete-btn"
                        onClick={async () => {
                          if (!window.confirm("Delete this completed maintenance record?")) return;
                          try {
                            await API.delete(`/maintenance/${log._id}`);
                            await fetchMaintenanceLogs();
                          } catch (error) {
                            setErrorMessage(error.response?.data?.message || "Unable to delete maintenance record.");
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                    {!canManageMaintenance && log.status === "Completed" && "Completed"}
                    {!canManageMaintenance && log.status !== "Completed" && "—"}
                  </div>
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
    </div>
  );
}

export default Maintenance;