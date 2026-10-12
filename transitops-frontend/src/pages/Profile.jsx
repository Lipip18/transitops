import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import PageHeader from "../components/PageHeader";

function Profile() {
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setErrorMessage("");
      const { data } = await API.get("/users/profile");
      setUser(data.user || data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSavingProfile(true);
    try {
      const { data } = await API.put("/users/profile", {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      });
      const updatedUser = data.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage("The new passwords do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      const { data } = await API.put("/users/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success(data.message || "Password changed.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to change your password.");
    } finally {
      setChangingPassword(false);
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
        <>
          <form className="record-form profile-form" onSubmit={saveProfile}>
            <h3>Personal information</h3>
            <label>
              Full name
              <input
                value={user.name || ""}
                onChange={(event) => setUser({ ...user, name: event.target.value })}
                minLength={2}
                maxLength={100}
                required
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                value={user.email || ""}
                onChange={(event) => setUser({ ...user, email: event.target.value })}
                required
              />
            </label>
            <label>
              Phone
              <input
                value={user.phone || ""}
                onChange={(event) => setUser({ ...user, phone: event.target.value })}
                maxLength={30}
              />
            </label>
            <label>
              Role
              <input value={user.role || ""} readOnly aria-readonly="true" />
            </label>
            <p className="profile-joined">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
            <div className="form-actions">
              <button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>

          <form className="record-form profile-form" onSubmit={updatePassword}>
            <h3>Change password</h3>
            <label>
              Current password
              <input
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm({
                  ...passwordForm,
                  currentPassword: event.target.value,
                })}
                required
              />
            </label>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm({
                  ...passwordForm,
                  newPassword: event.target.value,
                })}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm({
                  ...passwordForm,
                  confirmPassword: event.target.value,
                })}
                required
              />
            </label>
            <p className="signup-password-hint">
              Use at least 8 characters with uppercase, lowercase, and a number.
            </p>
            <div className="form-actions">
              <button type="submit" disabled={changingPassword}>
                {changingPassword ? "Updating..." : "Change password"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default Profile;