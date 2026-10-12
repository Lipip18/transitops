import { useState } from "react";
import { ArrowRight, Fuel, ShieldCheck, Truck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import "./Login.css";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registered, setRegistered] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (form.password !== form.confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setRegistered(true);
      toast.success("Account created. Sign in to continue.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to create your account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-screen">
      <aside className="login-brand">
        <div className="login-brand-top">
          <Link className="brand-mark" to="/" aria-label="TransitOps home">
            <span className="brand-mark-dot" />
            TransitOps
          </Link>
        </div>
        <div className="login-brand-mid">
          <p className="eyebrow">Join your transport operation</p>
          <h1>Bring your fleet work into one clear view.</h1>
          <p className="lede">
            Create a secure TransitOps account to access the tools your
            organization has enabled for you.
          </p>
        </div>
        <ul className="brand-stats">
          <li><Truck size={16} /> Vehicle registry and lifecycle</li>
          <li><Users size={16} /> Driver operations and compliance</li>
          <li><ShieldCheck size={16} /> Account roles set securely</li>
          <li><Fuel size={16} /> Fuel and operating records</li>
        </ul>
      </aside>

      <main className="login-form-side">
        <div className="login-form-wrap">
          <Link className="auth-home-link" to="/">← Back to home</Link>
          <div className="login-form-head">
            <h2>Create your account</h2>
            <p>Public sign-ups receive the standard Driver role. Administrators manage elevated access.</p>
          </div>

          {registered ? (
            <div className="signup-success" role="status">
              Your account has been created with the standard Driver role.{" "}
              <Link to="/login">Sign in to continue</Link>.
            </div>
          ) : (
            <form onSubmit={submit} className="credentials-form">
              <label>
                Full name
                <input
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={updateField}
                />
              </label>
              <label>
                Work email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={updateField}
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={updateField}
                />
              </label>
              <label>
                Confirm password
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Enter the same password again"
                  value={form.confirmPassword}
                  onChange={updateField}
                />
              </label>
              <p className="signup-password-hint">
                Use at least 8 characters with uppercase, lowercase, and a number.
              </p>
              {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
              <button className="login-submit" type="submit" disabled={saving}>
                {saving ? "Creating account..." : "Create account"} <ArrowRight size={16} />
              </button>
              <p className="login-hint">
                Already registered? <Link to="/login">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default Signup;
