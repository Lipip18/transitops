import { useEffect, useState } from "react";
import KPIcard from "../components/KPIcard";
import API from "../services/api";

function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data } = await API.get("/reports/analytics");

      setAnalytics(data);
      setErrorMessage(
        error.response?.data?.message || "Failed to load analytics. Check the API connection and retry."
      );
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!analytics) return;

    const rows = [
      ["Metric", "Value"],
      ["Total Trips", analytics.totalTrips ?? 0],
      ["Total Distance (km)", analytics.totalDistance ?? 0],
      ["Total Fuel (L)", analytics.totalFuel ?? 0],
      ["Fuel Efficiency (km/L)", analytics.fuelEfficiency ?? 0],
      ["Revenue", analytics.revenue ?? 0],
      ["Fuel Cost", analytics.fuelCost ?? 0],
      ["Maintenance Cost", analytics.maintenanceCost ?? 0],
      ["Operational Cost", analytics.operationalCost ?? 0],
      ["Fleet Utilization (%)", analytics.fleetUtilization ?? 0],
      ["Vehicle ROI", analytics.vehicleROI ?? 0],
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "transitops-report.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Loading Reports...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <h1>Reports & Analytics</h1>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          style={{
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {errorMessage && (
        <div role="alert" style={{ marginBottom: "16px" }}>
          <p>{errorMessage}</p>
          <button onClick={fetchAnalytics} disabled={loading}>Retry</button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "20px",
        }}
      >
        <KPIcard
          title="Total Trips"
          value={analytics?.totalTrips ?? 0}
        />

        <KPIcard
          title="Total Distance"
          value={`${analytics?.totalDistance ?? 0} km`}
        />

        <KPIcard
          title="Fuel Used"
          value={`${analytics?.totalFuel ?? 0} L`}
        />

        <KPIcard
          title="Fuel Efficiency"
          value={`${analytics?.fuelEfficiency ?? 0} km/L`}
        />

        <KPIcard
          title="Revenue"
          value={`₹${Number(analytics?.revenue ?? 0).toLocaleString()}`}
        />

        <KPIcard
          title="Fuel Cost"
          value={`₹${Number(
            analytics?.fuelCost ?? 0
          ).toLocaleString()}`}
        />

        <KPIcard
          title="Maintenance Cost"
          value={`₹${Number(
            analytics?.maintenanceCost ?? 0
          ).toLocaleString()}`}
        />

        <KPIcard
          title="Operational Cost"
          value={`₹${Number(
            analytics?.operationalCost ?? 0
          ).toLocaleString()}`}
        />

        <KPIcard
          title="Fleet Utilization"
          value={`${analytics?.fleetUtilization ?? 0}%`}
        />

        <KPIcard
          title="Vehicle ROI"
          value={`${analytics?.vehicleROI ?? 0}%`}
        />
      </div>

      <button
        onClick={exportCSV}
        disabled={!analytics}
        style={{
          marginTop: "30px",
          padding: "12px 20px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Export Report CSV
      </button>
    </div>
  );
}

export default Reports;