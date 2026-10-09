import { useCallback, useEffect, useState } from "react";
import { Car, CheckCircle2, Gauge, Truck, Users, Wrench } from "lucide-react";

import API from "../services/api";

import FleetChart from "../components/FleetChart";
import KPIcard from "../components/KPIcard";
import Loader from "../components/Loader";
import RecentTrips from "../components/RecentTrips";
import UtilizationChart from "../components/UtilizationChart";
import VehicleStatusChart from "../components/VehicleStatusChart";
import "./Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    vehicleType: "",
    vehicleStatus: "",
    region: "",
  });

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const fetchDashboard = useCallback(async (activeFilters = filters) => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, value]) => value)
      );
      const { data } = await API.get("/dashboard", { params });
      setStats(data);
    } catch (error) {
      console.error(error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboard(filters);
  }, [filters, fetchDashboard]);

  if (loading) {
    return <Loader />;
  }

  if (!stats) {
    return (
      <div className="dashboard-error">
        <h2>Couldn't load the dashboard.</h2>
        <p>Check that the TransitOps API is running, then try again.</p>
        <button className="primary-btn" onClick={() => fetchDashboard()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-head">
        <div>
          <h1>Operations overview</h1>
          <p>
            {user.name ? `Welcome back, ${user.name}.` : "Welcome back."} Here's the state of the fleet right now.
          </p>
        </div>
        <button className="ghost-btn" onClick={() => fetchDashboard()}>
          Refresh
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <select
          aria-label="Filter by vehicle type"
          value={filters.vehicleType}
          onChange={(event) =>
            setFilters((current) => ({ ...current, vehicleType: event.target.value }))
          }
        >
          <option value="">All vehicle types</option>
          {(stats.filterOptions?.vehicleTypes || []).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          aria-label="Filter by vehicle status"
          value={filters.vehicleStatus}
          onChange={(event) =>
            setFilters((current) => ({ ...current, vehicleStatus: event.target.value }))
          }
        >
          <option value="">All vehicle statuses</option>
          {["Available", "On Trip", "In Shop", "Retired"].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select
          aria-label="Filter by region"
          value={filters.region}
          onChange={(event) =>
            setFilters((current) => ({ ...current, region: event.target.value }))
          }
        >
          <option value="">All regions</option>
          {(stats.filterOptions?.regions || []).map((region) => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      <div className="kpi-grid">
        <KPIcard title="Active Vehicles" value={stats.activeVehicles ?? 0} icon={<Truck size={20} />} tone="ink" />
        <KPIcard title="Available Vehicles" value={stats.availableVehicles ?? 0} icon={<CheckCircle2 size={20} />} tone="teal" />
        <KPIcard title="In Maintenance" value={stats.vehiclesInMaintenance ?? 0} icon={<Wrench size={20} />} tone="amber" />
        <KPIcard title="Retired" value={stats.retiredVehicles ?? 0} icon={<Truck size={20} />} tone="red" />
        <KPIcard title="Active Trips" value={stats.activeTrips ?? 0} icon={<Car size={20} />} tone="amber" />
        <KPIcard title="Pending / Draft Trips" value={stats.pendingTrips ?? 0} icon={<Car size={20} />} tone="ink" />
        <KPIcard title="Completed Trips" value={stats.completedTrips ?? 0} icon={<CheckCircle2 size={20} />} tone="teal" />
        <KPIcard title="Drivers On Duty" value={stats.driversOnDuty ?? 0} icon={<Users size={20} />} tone="ink" />
        <KPIcard title="Fleet Utilization" value={`${stats.fleetUtilization ?? 0}%`} icon={<Gauge size={20} />} tone="teal" />
      </div>

      <div className="chart-grid">
        <div className="chart-panel">
          <h3>Fleet status</h3>
          <FleetChart
            available={stats.availableVehicles ?? 0}
            maintenance={stats.vehiclesInMaintenance ?? 0}
            active={stats.vehiclesOnTrip ?? 0}
          />
        </div>

        <div className="chart-panel">
          <h3>Vehicle status</h3>
          <VehicleStatusChart
            available={stats.availableVehicles ?? 0}
            maintenance={stats.vehiclesInMaintenance ?? 0}
            onTrip={stats.vehiclesOnTrip ?? 0}
            retired={stats.retiredVehicles ?? 0}
          />
        </div>

        <div className="chart-panel">
          <h3>Fleet utilization</h3>
          <UtilizationChart utilization={Number(stats.fleetUtilization ?? 0)} />
        </div>
      </div>

      <div style={{ marginTop: "28px" }}>
        <RecentTrips />
      </div>
    </div>
  );
}

export default Dashboard;
