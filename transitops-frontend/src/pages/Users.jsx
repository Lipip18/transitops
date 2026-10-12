import { useCallback, useEffect, useState } from "react";
import API from "../services/api";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { getStoredRole } from "../data/roles";

const userRoles = [
  "Fleet Manager",
  "Driver",
  "Safety Officer",
  "Financial Analyst",
  "Admin",
];

const emptyForm = {
  name: "",
  email: "",
  role: "Driver",
  phone: "",
  password: "",
  isActive: true,
};

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState(null);
  const isAdmin = getStoredRole() === "Admin";
  const canDeleteUsers = isAdmin;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const { data } = await API.get("/admin/users");
      setUsers(data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (form._id) {
        await API.put(`/admin/users/${form._id}`, payload);
      } else {
        await API.post("/admin/users", payload);
      }
      setForm(null);
      await fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save user.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete user account ${user.email}?`)) return;
    try {
      setErrorMessage("");
      await API.delete(`/admin/users/${user._id}`);
      await fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to delete user.");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "phone", label: "Phone", render: (user) => user.phone || "—" },
    {
      key: "isActive",
      label: "Status",
      render: (user) => <span className={`pill ${user.isActive ? "pill-available" : "pill-suspended"}`}>{user.isActive ? "Active" : "Inactive"}</span>,
    },
  ];

  return (
    <div className="resource-page">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered accounts`}
        action={isAdmin && <button className="primary-btn" onClick={() => setForm({ ...emptyForm })}>+ Add user</button>}
      />

      {form && (
        <form className="record-form" onSubmit={submit}>
          <h3>{form._id ? "Edit user" : "Add user"}</h3>
          <input name="name" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input type="email" name="email" placeholder="Email address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <select name="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} required>
            {userRoles.map((role) => <option key={role}>{role}</option>)}
          </select>
          <input name="phone" placeholder="Phone (optional)" value={form.phone || ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input type="password" name="password" placeholder={form._id ? "New password (optional)" : "Temporary password"} value={form.password || ""} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!form._id} minLength={6} autoComplete="new-password" />
          {form._id && (
            <label className="checkbox-field">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              Account active
            </label>
          )}
          {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
          <div className="form-actions">
            <button type="submit" disabled={saving}>{saving ? "Saving..." : form._id ? "Save changes" : "Create user"}</button>
            <button type="button" className="ghost-btn" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      {errorMessage && !form && <div className="notice notice-error" role="alert"><span>{errorMessage}</span><button className="ghost-btn" onClick={fetchUsers} disabled={loading}>Retry</button></div>}
      {loading ? <p>Loading users...</p> : users.length === 0 ? <p className="empty-table">No user accounts found.</p> : (
        <DataTable
          columns={columns}
          data={users}
          actions={{
            ...(isAdmin ? { edit: (user) => setForm({ ...emptyForm, ...user, password: "" }) } : {}),
            ...(canDeleteUsers ? { delete: deleteUser } : {}),
          }}
        />
      )}
    </div>
  );
}

export default Users;
