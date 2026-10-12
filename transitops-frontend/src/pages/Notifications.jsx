import { useCallback, useEffect, useState } from "react";
import API from "../services/api";
import PageHeader from "../components/PageHeader";

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
    <div className="resource-page">
      <PageHeader
        title="Notifications"
        subtitle="Operational updates relevant to your role."
      />
      {loading && <p aria-live="polite">Loading notifications...</p>}
      {errorMessage && (
        <div className="notice notice-error" role="alert">
          <span>{errorMessage}</span>
          <button className="ghost-btn" onClick={fetchNotifications}>Retry</button>
        </div>
      )}

      <div className="notification-list">
        {notifications.map((n) => (
          <article
            key={n._id}
            className={`notification-item${n.isRead ? "" : " notification-unread"}`}
          >
            <div className="notification-copy">
              <h3>{n.title}</h3>
              <p>{n.message}</p>
              <small>{new Date(n.createdAt).toLocaleString()}</small>
            </div>
            {!n.isRead && (
              <button
                className="ghost-btn notification-read"
                onClick={() => markRead(n._id)}
              >
                Mark read
              </button>
            )}
          </article>
        ))}
      </div>
      {!loading && !errorMessage && notifications.length === 0 && (
        <div className="empty-state">
          <h2>You're all caught up</h2>
          <p>No notifications are available right now.</p>
        </div>
      )}
    </div>
  );
}

export default Notifications;