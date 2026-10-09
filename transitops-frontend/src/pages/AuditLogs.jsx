import { useCallback, useEffect, useState } from "react";
import API from "../services/api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async (currentPage) => {
    try {
      setLoading(true);
      setErrorMessage("");
      const { data } = await API.get("/audit", {
        params: { page: currentPage, limit: 50 },
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Audit Logs</h1>
      {errorMessage && (
        <div role="alert">
          <p>{errorMessage}</p>
          <button onClick={() => fetchLogs(page)} disabled={loading}>Retry</button>
        </div>
      )}
      {loading && <p>Loading audit logs...</p>}

      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Module</th>
            <th>Details</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {!loading && logs.map((log) => (
            <tr key={log._id}>
              <td>{log.user}</td>
              <td>{log.action}</td>
              <td>{log.module}</td>
              <td>{log.details || ""}</td>
              <td>
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
          {!loading && !errorMessage && logs.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: 20 }}>
                No audit logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
          Previous
        </button>
        <span>Page {page} of {Math.max(1, Math.ceil(total / 50))}</span>
        <button
          onClick={() => setPage((current) => current + 1)}
          disabled={page * 50 >= total || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AuditLogs;