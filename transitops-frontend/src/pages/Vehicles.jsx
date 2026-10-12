import { useCallback, useEffect, useState } from "react";
import { CSVLink } from "react-csv";

import API from "../services/api";

import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatusFilter from "../components/StatusFilter";
import AddVehicleButton from "../components/AddVehicleButton";
import VehicleForm from "../components/VehicleForm";
import { hasRole } from "../data/roles";

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const canManageVehicles = hasRole("Fleet Manager");

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const { data } = await API.get("/vehicles", {
        params: {
          page,
          limit: 5,
          search,
          status,
        },
      });

      setVehicles(data.vehicles || []);
      setTotalPages(data.totalPages || 1);
      setTotalVehicles(data.totalVehicles || 0);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Unable to load vehicles.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const columns = [
    { key: "registrationNumber", label: "Registration" },
    { key: "vehicleName", label: "Vehicle" },
    { key: "type", label: "Type" },
    { key: "maximumLoadCapacity", label: "Capacity (kg)" },
    { key: "odometer", label: "Odometer (km)" },
    { key: "status", label: "Status", render: (vehicle) => <span className={`pill pill-${vehicle.status.toLowerCase().replaceAll(" ", "")}`}>{vehicle.status}</span> },
  ];

  const csvData = vehicles.map((vehicle) => ({
    Registration: vehicle.registrationNumber,
    Vehicle: vehicle.vehicleName,
    Type: vehicle.type,
    Capacity: vehicle.maximumLoadCapacity,
    Odometer: vehicle.odometer,
    Status: vehicle.status,
  }));

  const deleteVehicle = async (vehicle) => {
    if (!window.confirm(`Delete ${vehicle.vehicleName} (${vehicle.registrationNumber})?`)) return;
    try {
      await API.delete(`/vehicles/${vehicle._id}`);
      await fetchVehicles();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete vehicle.");
    }
  };

  const saveVehicle = async () => {
    setEditingVehicle(null);
    setShowVehicleForm(false);
    await fetchVehicles();
  };

  return (
    <div>
      <PageHeader
        title="Fleet Vehicles"
        subtitle={`Total Vehicles : ${totalVehicles}`}
        action={
          <>
            <CSVLink data={csvData} filename="vehicles.csv" className="ghost-btn" style={loading || errorMessage ? { pointerEvents: "none", opacity: 0.6 } : undefined}>Export CSV</CSVLink>
            {canManageVehicles && <AddVehicleButton onClick={() => { setEditingVehicle(null); setShowVehicleForm((visible) => !visible); }} />}
          </>
        }
      />

      {(showVehicleForm || editingVehicle) && canManageVehicles && (
        <VehicleForm
          key={editingVehicle?._id || "new-vehicle"}
          vehicle={editingVehicle}
          onVehicleSaved={saveVehicle}
          onCancel={() => { setEditingVehicle(null); setShowVehicleForm(false); }}
        />
      )}

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <SearchBar
          value={search}
          placeholder="Search Vehicle..."
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
            "In Shop",
            "Retired",
          ]}
        />
      </div>

      {errorMessage && (
        <div role="alert" style={{ marginBottom: 16 }}>
          <p>{errorMessage}</p>
          <button onClick={fetchVehicles} disabled={loading}>Retry</button>
        </div>
      )}
      {loading ? (
        <p>Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <EmptyState
          title="No Vehicles Found"
          description="There are no vehicles matching your search."
        />
      ) : (
        <DataTable
          columns={columns}
          data={vehicles}
          actions={canManageVehicles ? {
            edit: (vehicle) => { setShowVehicleForm(false); setEditingVehicle(vehicle); },
            delete: deleteVehicle,
          } : {}}
        />
      )}

      <div
        style={{
          marginTop: 30,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        <button
          className="primary-btn"
          disabled={page === 1 || loading}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          className="primary-btn"
          disabled={page === totalPages || loading}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

    </div>
  );
}

export default Vehicles;