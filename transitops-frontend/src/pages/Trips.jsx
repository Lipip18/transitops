import { useCallback, useEffect, useState } from "react";
import TripForm from "../components/TripForm";
import API from "../services/api";
import { hasRole } from "../data/roles";

function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingTripId, setPendingTripId] = useState("");
  const canManageTrips = hasRole("Fleet Manager");

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const { data } = await API.get("/trips", { params: { limit: 100 } });
      setTrips(data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load trips.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const dispatchTrip = async (id) => {
    try {
      setPendingTripId(id);
      await API.put(`/trips/${id}/dispatch`);

      alert("Trip dispatched successfully");

      fetchTrips();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to dispatch trip"
      );
    } finally {
      setPendingTripId("");
    }
  };

  const completeTrip = async (id) => {
    try {
      const finalOdometer = prompt(
        "Final Odometer (km)"
      );

      if (finalOdometer === null) return;

      const fuelConsumed = prompt(
        "Fuel Consumed (Litres)"
      );

      if (fuelConsumed === null) return;

      const fuelCost = prompt(
        "Fuel Cost"
      );

      if (fuelCost === null) return;

      const revenue = prompt(
        "Revenue Earned"
      );

      if (revenue === null) return;

      const remarks = prompt(
        "Remarks (optional)"
      );

      setPendingTripId(id);
      await API.put(`/trips/${id}/complete`, {
        finalOdometer: Number(finalOdometer),
        fuelConsumed: Number(fuelConsumed),
        fuelCost: Number(fuelCost),
        revenue: Number(revenue),
        remarks,
      });

      alert("Trip completed successfully");

      fetchTrips();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to complete trip"
      );
    } finally {
      setPendingTripId("");
    }
  };

  const cancelTrip = async (id) => {
    try {
      if (
        !window.confirm(
          "Cancel this trip?"
        )
      )
        return;

      setPendingTripId(id);
      await API.put(`/trips/${id}/cancel`);

      alert("Trip cancelled");

      fetchTrips();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to cancel trip"
      );
    } finally {
      setPendingTripId("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Trip Management</h1>

      {canManageTrips && <TripForm onTripAdded={fetchTrips} />}

      <br />
      {errorMessage && (
        <div role="alert">
          <p>{errorMessage}</p>
          <button onClick={fetchTrips} disabled={loading}>Retry</button>
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
            <th>Source</th>
            <th>Destination</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Status</th>
            <th width="280">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr><td colSpan="6" style={{ textAlign: "center", padding: 20 }}>Loading trips...</td></tr>
          ) : trips.length > 0 ? (
            trips.map((trip) => (
              <tr key={trip._id}>
                <td>{trip.source}</td>

                <td>{trip.destination}</td>

                <td>
                  {trip.vehicle?.vehicleName ||
                    "-"}
                </td>

                <td>
                  {trip.driver?.name || "-"}
                </td>

                <td>{trip.status}</td>

                <td>
                  {canManageTrips && trip.status === "Draft" && (
                    <button
                      onClick={() =>
                        dispatchTrip(trip._id)
                      }
                      disabled={pendingTripId === trip._id}
                    >
                      Dispatch
                    </button>
                  )}

                  {canManageTrips && trip.status ===
                    "Dispatched" && (
                    <>
                      <button
                        onClick={() =>
                          completeTrip(
                            trip._id
                          )
                        }
                        disabled={pendingTripId === trip._id}
                      >
                        Complete
                      </button>

                      <button
                        style={{
                          marginLeft: 10,
                        }}
                        onClick={() =>
                          cancelTrip(trip._id)
                        }
                        disabled={pendingTripId === trip._id}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {canManageTrips && (trip.status ===
                    "Completed" ||
                    trip.status ===
                      "Cancelled") && (
                    <span>✔ Finished</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="6"
                style={{
                  textAlign: "center",
                  padding: 20,
                }}
              >
                No trips found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Trips;