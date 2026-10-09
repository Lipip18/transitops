import { useEffect, useState } from "react";
import API from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get("/users/profile");
      setUser(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Profile</h1>

      <table
        cellPadding="10"
        style={{
          marginTop: "20px",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          <tr>
            <td><strong>Name</strong></td>
            <td>{user.name}</td>
          </tr>

          <tr>
            <td><strong>Email</strong></td>
            <td>{user.email}</td>
          </tr>

          <tr>
            <td><strong>Role</strong></td>
            <td>{user.role}</td>
          </tr>

          <tr>
            <td><strong>Joined</strong></td>
            <td>
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Profile;