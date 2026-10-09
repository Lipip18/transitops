import { useCallback, useEffect, useState } from "react";
import API from "../services/api";

function Notifications() {
  const [notifications, setNotifications] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setErrorMessage("");
      const { data } = await API.get("/notifications");
      setNotifications(data);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}`);
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to update notification."
      );
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Notifications</h1>
      {loading && <p>Loading notifications...</p>}
      {errorMessage && (
        <div role="alert">
          <p>{errorMessage}</p>
          <button onClick={fetchNotifications}>Retry</button>
        </div>
      )}

      {notifications.map((n) => (
        <div
          key={n._id}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            marginTop: 15,
            borderRadius: 8,
            background: n.isRead
              ? "#fff"
              : "#e0f2fe",
          }}
        >
          <h3>{n.title}</h3>

          <p>{n.message}</p>

          <small>
            {new Date(
              n.createdAt
            ).toLocaleString()}
          </small>

          {!n.isRead && (
            <button
              onClick={() =>
                markRead(n._id)
              }
            >
              Mark Read
            </button>
          )}
        </div>
      ))}
      {!loading && !errorMessage && notifications.length === 0 && (
        <p>No notifications.</p>
      )}
    </div>
  );
}

export default Notifications;