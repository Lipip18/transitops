import { useCallback, useEffect, useState } from "react";
import { CSVLink } from "react-csv";

import API from "../services/api";

import DriverForm from "../components/DriverForm";
import SearchBar from "../components/SearchBar";
import StatusFilter from "../components/StatusFilter";
import { hasRole } from "../data/roles";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";

function Drivers() {
  const [drivers, setDrivers] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingDriver, setEditingDriver] = useState(null);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const canManageDrivers = hasRole("Fleet Manager");

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

  const saveDriver = async () => {
    setEditingDriver(null);
    setShowDriverForm(false);
    await fetchDrivers();
  };

  const deleteDriver = async (driver) => {
    if (!window.confirm(`Delete ${driver.name}?`)) return;
    try {
      await API.delete(`/drivers/${driver._id}`);
      await fetchDrivers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete driver.");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "licenseNumber", label: "License No." },
    { key: "licenseCategory", label: "Category" },
    { key: "contactNumber", label: "Contact" },
    { key: "safetyScore", label: "Safety Score" },
    { key: "status", label: "Status", render: (driver) => <span className={`pill pill-${driver.status.toLowerCase().replaceAll(" ", "")}`}>{driver.status}</span> },
  ];

  return (
    <div style={{ padding: 20 }}>
      <PageHeader
        title="Driver Management"
        subtitle={`${totalDrivers} drivers in your fleet`}
        action={(
          <>
            <CSVLink filename="drivers-report.csv" data={csvData} className="ghost-btn" style={loading || errorMessage ? { pointerEvents: "none", opacity: 0.6 } : undefined}>Export CSV</CSVLink>
            {canManageDrivers && <button className="primary-btn" onClick={() => { setEditingDriver(null); setShowDriverForm((visible) => !visible); }}>+ Add driver</button>}
          </>
        )}
      />

      {(showDriverForm || editingDriver) && canManageDrivers && (
        <DriverForm
          key={editingDriver?._id || "new-driver"}
          driver={editingDriver}
          onDriverSaved={saveDriver}
          onCancel={() => { setEditingDriver(null); setShowDriverForm(false); }}
        />
      )}

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

      </div>

      {errorMessage && <div className="notice notice-error" role="alert">{errorMessage}<button className="ghost-btn" onClick={fetchDrivers} disabled={loading}>Retry</button></div>}
      {loading ? <p>Loading drivers...</p> : drivers.length === 0 ? <p className="empty-table">No drivers found.</p> : (
        <DataTable columns={columns} data={drivers} actions={canManageDrivers ? {
          edit: (driver) => { setShowDriverForm(false); setEditingDriver(driver); },
          delete: deleteDriver,
        } : {}} />
      )}

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