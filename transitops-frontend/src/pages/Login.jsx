import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Fuel,
  Home,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import API from "../services/api";
import { roles } from "../data/roles";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
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
          <Link className="brand-mark" to="/" aria-label="TransitOps home">
            <span className="brand-mark-dot" />
            TransitOps
          </Link>
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

        <div className="login-illustration" aria-hidden="true">
          <svg viewBox="0 0 680 270" role="img">
            <rect width="680" height="270" rx="16" fill="#EFF6FF" />
            <circle cx="565" cy="62" r="27" fill="#CCFBF1" />
            <path d="M0 211h680v59H0z" fill="#E2E8F0" />
            <path d="M0 220h680" stroke="#CBD5E1" strokeWidth="2" />
            <path
              d="M34 224c75-22 95-84 174-84 53 0 69 37 113 37 54 0 64-79 136-79 62 0 78 66 189 54"
              fill="none"
              stroke="#94A3B8"
              strokeDasharray="7 10"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <path d="M78 167h43v43H78zM127 150h32v60h-32zM516 140h36v70h-36zM558 160h54v50h-54z" fill="#DBEAFE" />
            <path d="M93 178h12M139 163h8M528 153h11M571 173h16" stroke="#93C5FD" strokeLinecap="round" strokeWidth="3" />
            <rect x="167" y="103" width="258" height="102" rx="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
            <path d="M183 126h222M183 184h222" stroke="#E2E8F0" strokeWidth="3" />
            <rect x="196" y="142" width="42" height="27" rx="5" fill="#DBEAFE" />
            <path d="M207 153h20M217 143v25" stroke="#2563EB" strokeLinecap="round" strokeWidth="3" />
            <path d="M425 139h67l35 37v29H425z" fill="#2563EB" />
            <path d="M445 148h39l23 25h-62z" fill="#BFDBFE" />
            <path d="M502 174h24" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3" />
            <path d="M178 204h346" stroke="#172B4D" strokeLinecap="round" strokeWidth="6" />
            <circle cx="226" cy="207" r="21" fill="#172B4D" />
            <circle cx="226" cy="207" r="9" fill="#E2E8F0" />
            <circle cx="475" cy="207" r="21" fill="#172B4D" />
            <circle cx="475" cy="207" r="9" fill="#E2E8F0" />
            <circle cx="565" cy="62" r="8" fill="#0F9D8A" />
            <path d="M561 64h8M565 60v8" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2" />
            <rect x="483" y="53" width="56" height="24" rx="12" fill="#FFFFFF" stroke="#DCE8F7" />
            <circle cx="496" cy="65" r="4" fill="#16A34A" />
            <path d="M506 65h22" stroke="#64748B" strokeLinecap="round" strokeWidth="3" />
          </svg>
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

      </aside>

      <main className="login-form-side">
        <div className="login-form-wrap">
          <Link className="auth-home-link" to="/">
            <Home size={15} /> Back to home
          </Link>
          <div className="login-form-head">
            <h2>Sign in to TransitOps</h2>
            <p>Your account role determines the workspace you can access.</p>
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
              New to TransitOps? <Link to="/signup">Create an account</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;
