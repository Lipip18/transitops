import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Fuel,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";

import API from "../services/api";
import { roles } from "../data/roles";
import "./Login.css";

const roleIcon = {
  "Fleet Manager": Truck,
  Driver: ArrowRight,
  "Safety Officer": ShieldCheck,
  "Financial Analyst": Fuel,
  Admin: ShieldCheck,
};

function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  const pickRole = (role) => {
    setSelectedRole(role.id);
  };

  const handleChange = (e) => {
    setSelectedRole(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const completeLogin = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    const matchedRole = roles.find((r) => r.id === user.role);
    navigate(matchedRole ? matchedRole.landing : "/");
  };

  const login = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await API.post("/auth/login", formData);
      completeLogin(data.user, data.token);
      return;
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <aside className="login-brand">
        <div className="login-brand-top">
          <div className="brand-mark">
            <span className="brand-mark-dot" />
            TransitOps
          </div>
          <span className="dispatch-clock">
            {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            {" · "}
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="login-brand-mid">
          <p className="eyebrow">Smart Transport Operations Platform</p>
          <h1>
            One dispatch board for every vehicle,
            driver and mile on the road.
          </h1>
          <p className="lede">
            Replace spreadsheets and paper logbooks with live fleet status,
            enforced dispatch rules, and cost visibility across your entire
            operation.
          </p>
        </div>

        <ul className="brand-stats">
          <li>
            <Truck size={16} />
            Vehicle registry &amp; lifecycle status
          </li>
          <li>
            <Users size={16} />
            Driver compliance &amp; safety scoring
          </li>
          <li>
            <ShieldCheck size={16} />
            Rule-enforced dispatch, every trip
          </li>
          <li>
            <Fuel size={16} />
            Fuel, maintenance &amp; ROI reporting
          </li>
        </ul>

        <div className="route-line" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </aside>

      <main className="login-form-side">
        <div className="login-form-wrap">
          <div className="login-form-head">
            <h2>Sign in to your console</h2>
            <p>Select your role and sign in with your TransitOps account credentials.</p>
          </div>

          <div className="role-grid">
            {roles.map((role) => {
              const Icon = roleIcon[role.id];
              const active = selectedRole === role.id;
              return (
                <button
                  type="button"
                  key={role.id}
                  className={`role-ticket accent-${role.accent} ${active ? "role-ticket-active" : ""}`}
                  onClick={() => pickRole(role)}
                >
                  <span className="role-ticket-tag">{role.ticket}</span>
                  <span className="role-ticket-body">
                    <span className="role-ticket-icon">
                      <Icon size={18} />
                    </span>
                    <span className="role-ticket-label">{role.label}</span>
                    <span className="role-ticket-summary">{role.summary}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={login} className="credentials-form">
            <label>
              Work email
              <input
                type="email"
                name="email"
                required
                placeholder="you@transitops.io"
                value={formData.email}
                onChange={handleChange}
                autoComplete="username"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </label>

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
              <ArrowRight size={16} />
            </button>

            <p className="login-hint">
              Sign in with an account registered in TransitOps.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;
