import { useEffect, useState } from "react";
import API from "../services/api";
import PageHeader from "../components/PageHeader";

function Profile() {
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setErrorMessage("");
      const { data } = await API.get("/users/profile");
      setUser(data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p aria-live="polite">Loading profile...</p>;

  return (
    <div className="resource-page">
      <PageHeader
        title="My Profile"
        subtitle="Your TransitOps account details."
      />
      {errorMessage && (
        <div className="notice notice-error" role="alert">
          <span>{errorMessage}</span>
          <button className="ghost-btn" onClick={fetchProfile}>Retry</button>
        </div>
      )}
      {user && (
        <section className="panel profile-panel">
          <dl className="profile-details">
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Role</dt><dd>{user.role}</dd></div>
            <div>
              <dt>Joined</dt>
              <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}

export default Profile;