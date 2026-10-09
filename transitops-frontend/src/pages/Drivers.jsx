import { useCallback, useEffect, useState } from "react";
import { CSVLink } from "react-csv";

import API from "../services/api";

import DriverForm from "../components/DriverForm";
import SearchBar from "../components/SearchBar";
import StatusFilter from "../components/StatusFilter";
import { hasRole } from "../data/roles";

function Drivers() {
  const [drivers, setDrivers] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const { data } = await API.get("/drivers", {
        params: {
          page,
          limit: 5,
          search,
          status,
        },
      });

      setDrivers(data.drivers);
      setTotalPages(data.totalPages);
      setTotalDrivers(data.totalDrivers);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load drivers.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const csvData = drivers.map((driver) => ({
    Name: driver.name,
    LicenseNumber: driver.licenseNumber,
    LicenseCategory: driver.licenseCategory,
    ContactNumber: driver.contactNumber,
    SafetyScore: driver.safetyScore,
    Status: driver.status,
    LicenseExpiryDate: driver.licenseExpiryDate,
  }));

  return (
    <div style={{ padding: 20 }}>
      <h1>Driver Management</h1>

      {hasRole("Fleet Manager") && (
        <DriverForm onDriverAdded={fetchDrivers} />
      )}

      <br />

      <p>
        <strong>Total Drivers:</strong> {totalDrivers}
      </p>

      {/* Search + Filter */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 15,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 15,
          }}
        >
          <SearchBar
            value={search}
            placeholder="Search Driver..."
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <StatusFilter
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={[
              "",
              "Available",
              "On Trip",
              "Off Duty",
              "Suspended",
            ]}
          />
        </div>

        <CSVLink
          filename="drivers-report.csv"
          data={csvData}
          style={{
            background: "#16a34a",
            color: "white",
            padding: "10px 18px",
            borderRadius: 6,
            textDecoration: "none",
            ...(loading || errorMessage ? { pointerEvents: "none", opacity: 0.6 } : {}),
          }}
        >
          Export CSV
        </CSVLink>
      </div>

      {/* Driver Table */}

      <table
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
            <th>Name</th>
            <th>License No.</th>
            <th>Category</th>
            <th>Contact</th>
            <th>Safety Score</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                Loading drivers...
              </td>
            </tr>
          ) : errorMessage ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                <span role="alert">{errorMessage}</span>{" "}
                <button onClick={fetchDrivers} disabled={loading}>Retry</button>
              </td>
            </tr>
          ) : drivers.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  textAlign: "center",
                  padding: 20,
                }}
              >
                No Drivers Found
              </td>
            </tr>
          ) : (
            drivers.map((driver) => (
              <tr key={driver._id}>
                <td>{driver.name}</td>
                <td>{driver.licenseNumber}</td>
                <td>{driver.licenseCategory}</td>
                <td>{driver.contactNumber}</td>
                <td>{driver.safetyScore}</td>
                <td>{driver.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}

      <div
        style={{
          marginTop: 25,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        <button
          disabled={page === 1 || loading}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages || loading}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Drivers;