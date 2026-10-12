import { useCallback, useEffect, useState } from "react";
import TripForm from "../components/TripForm";
import API from "../services/api";
import { hasRole } from "../data/roles";
import PageHeader from "../components/PageHeader";

function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingTripId, setPendingTripId] = useState("");
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
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

  const deleteDraftTrip = async (trip) => {
    if (!window.confirm("Delete this draft trip?")) return;
    try {
      setPendingTripId(trip._id);
      await API.delete(`/trips/${trip._id}`);
      await fetchTrips();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete draft trip.");
    } finally {
      setPendingTripId("");
    }
  };

  return (
    <div className="resource-page">
      <PageHeader
        title="Trip Management"
        subtitle={`${trips.length} recent trips`}
        action={canManageTrips && <button className="primary-btn" onClick={() => { setEditingTrip(null); setShowTripForm((visible) => !visible); }}>+ Create trip</button>}
      />

      {canManageTrips && (showTripForm || editingTrip) && <TripForm key={editingTrip?._id || "new-trip"} trip={editingTrip} onTripAdded={async () => { setShowTripForm(false); await fetchTrips(); }} onCancel={() => { setEditingTrip(null); setShowTripForm(false); }} />}

      {errorMessage && (
        <div className="notice notice-error" role="alert">
          <span>{errorMessage}</span>
          <button className="ghost-btn" onClick={fetchTrips} disabled={loading}>Retry</button>
        </div>
      )}

      <div className="table-container">
      <table className="data-table">
        <thead>
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

                <td><span className={`pill pill-${trip.status.toLowerCase().replaceAll(" ", "")}`}>{trip.status}</span></td>

                <td>
                  {canManageTrips && trip.status === "Draft" && (
                    <>
                    <button
                      className="edit-btn"
                      onClick={() => { setShowTripForm(false); setEditingTrip(trip); }}
                      disabled={pendingTripId === trip._id}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => dispatchTrip(trip._id)}
                      disabled={pendingTripId === trip._id}
                      className="primary-btn"
                    >
                      Dispatch
                    </button>
                    <button
                      className="ghost-btn"
                      style={{ marginLeft: 10 }}
                      onClick={() => cancelTrip(trip._id)}
                      disabled={pendingTripId === trip._id}
                    >
                      Cancel
                    </button>
                    <button
                      className="delete-btn"
                      style={{ marginLeft: 10 }}
                      onClick={() => deleteDraftTrip(trip)}
                      disabled={pendingTripId === trip._id}
                    >
                      Delete
                    </button>
                    </>
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
                        className="ghost-btn"
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
    </div>
  );
}

export default Trips;