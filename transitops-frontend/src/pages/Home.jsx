import {
  ArrowRight,
  BarChart3,
  Fuel,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Home.css";

const features = [
  {
    icon: Truck,
    title: "Fleet management",
    description: "Keep vehicle records, availability, and lifecycle status in one place.",
    accent: "blue",
  },
  {
    icon: ArrowRight,
    title: "Trip operations",
    description: "Plan and dispatch trips with driver, vehicle, and capacity checks.",
    accent: "teal",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description: "Track service work and keep vehicles under repair out of dispatch.",
    accent: "amber",
  },
  {
    icon: Fuel,
    title: "Fuel and expenses",
    description: "Record operating costs against vehicles and review stored transactions.",
    accent: "blue",
  },
  {
    icon: ShieldCheck,
    title: "Driver safety",
    description: "Review driver availability, license details, and compliance information.",
    accent: "teal",
  },
  {
    icon: BarChart3,
    title: "Operational reporting",
    description: "Explore fleet and cost summaries calculated from recorded activity.",
    accent: "amber",
  },
];

function Home() {
  return (
    <div className="home-page">
      <header className="home-nav">
        <a className="home-brand" href="#home" aria-label="TransitOps home">
          <span className="brand-mark-dot" />
          <span>TransitOps</span>
        </a>
        <nav className="home-nav-links" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>
        <div className="home-nav-actions">
          <Link className="home-login-link" to="/login">Login</Link>
          <Link className="primary-btn home-signup-link" to="/signup">Sign up</Link>
        </div>
      </header>

      <main>
        <section className="home-hero" id="home">
          <div className="home-hero-copy">
            <span className="home-eyebrow">
              <span /> Smart transport operations
            </span>
            <h1>Run your fleet with clarity and control.</h1>
            <p>
              Coordinate vehicles, drivers, trips, maintenance, and operating
              costs from one dependable fleet operations portal.
            </p>
            <div className="home-hero-actions">
              <Link className="primary-btn" to="/signup">
                Create your account <ArrowRight size={16} />
              </Link>
              <Link className="home-secondary-link" to="/login">
                Sign in to TransitOps
              </Link>
            </div>
            <div className="home-hero-proof">
              <span><Truck size={16} /> Fleet visibility</span>
              <span><ShieldCheck size={16} /> Rule-aware operations</span>
              <span><BarChart3 size={16} /> Data-backed reporting</span>
            </div>
          </div>
          <div className="home-hero-art" aria-label="Illustration of a delivery truck on its route">
            <div className="home-art-status"><i /> Fleet operations connected</div>
            <svg viewBox="0 0 680 390" role="img" aria-label="A transport truck traveling on a route">
              <rect width="680" height="390" rx="22" fill="#EFF6FF" />
              <circle cx="558" cy="78" r="39" fill="#CCFBF1" />
              <path d="M0 282c94-34 142-48 218-31 91 20 121 7 208-32 82-36 154-13 254-58v229H0z" fill="#DBEAFE" />
              <path d="M0 320c98-38 174-12 258-31 90-21 171-64 250-38 58 18 99 7 172-23v162H0z" fill="#D1FAE5" />
              <path d="M0 343c122-19 184-20 278-5 119 19 216-17 402-9v61H0z" fill="#E2E8F0" />
              <path d="M42 324c109-50 162-53 243-31 103 28 151-60 248-72 51-6 84 10 119 24" fill="none" stroke="#94A3B8" strokeDasharray="9 12" strokeLinecap="round" strokeWidth="4" />
              <path d="M76 235h50v75H76zM132 211h39v99h-39zM546 178h37v99h-37zM588 200h52v77h-52z" fill="#BFDBFE" />
              <path d="M93 252h15M144 230h14M558 195h13M601 217h25" stroke="#93C5FD" strokeLinecap="round" strokeWidth="4" />
              <rect x="163" y="168" width="264" height="108" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="3" />
              <path d="M182 191h225M182 254h225" stroke="#E2E8F0" strokeWidth="3" />
              <rect x="202" y="209" width="49" height="33" rx="6" fill="#DBEAFE" />
              <path d="M214 225h25M226.5 212v27" stroke="#2563EB" strokeLinecap="round" strokeWidth="4" />
              <path d="M427 207h73l42 40v29H427z" fill="#2563EB" />
              <path d="M451 218h40l29 27h-69z" fill="#BFDBFE" />
              <path d="M513 253h19" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="4" />
              <path d="M173 275h365" stroke="#172B4D" strokeLinecap="round" strokeWidth="8" />
              <circle cx="231" cy="279" r="25" fill="#172B4D" />
              <circle cx="231" cy="279" r="10" fill="#F8FAFC" />
              <circle cx="478" cy="279" r="25" fill="#172B4D" />
              <circle cx="478" cy="279" r="10" fill="#F8FAFC" />
              <rect x="436" y="78" width="126" height="44" rx="12" fill="#FFFFFF" stroke="#E2E8F0" />
              <circle cx="457" cy="100" r="6" fill="#16A34A" />
              <path d="M472 100h71" stroke="#64748B" strokeLinecap="round" strokeWidth="4" />
              <circle cx="558" cy="78" r="10" fill="#0F9D8A" />
              <path d="M553 78h10M558 73v10" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2.5" />
            </svg>
            <div className="home-art-caption">
              <span className="home-art-caption-icon"><Users size={18} /></span>
              <span><strong>Connected operations</strong><small>People, vehicles, and trips in sync</small></span>
            </div>
          </div>
        </section>

        <section className="home-features" id="features">
          <div className="home-section-heading">
            <span className="home-eyebrow">Built for fleet teams</span>
            <h2>Everything your operation needs to stay moving</h2>
            <p>One shared view of the records and workflows that keep transport operations running.</p>
          </div>
          <div className="home-feature-grid">
            {features.map(({ icon: Icon, title, description, accent }) => (
              <article className="home-feature-card" key={title}>
                <span className={`home-feature-icon ${accent}`}><Icon size={20} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-about" id="about">
          <div>
            <span className="home-eyebrow">A clearer way to operate</span>
            <h2>Better coordination starts with reliable information.</h2>
          </div>
          <p>
            TransitOps brings core fleet workflows together while preserving
            role-based access to operational, safety, and financial records.
            Views reflect information recorded in the system.
          </p>
        </section>
      </main>

      <footer className="home-footer">
        <a className="home-brand" href="#home">
          <span className="brand-mark-dot" />
          <span>TransitOps</span>
        </a>
        <span>Smart transport operations, in one place.</span>
        <div><Link to="/login">Login</Link><Link to="/signup">Sign up</Link></div>
      </footer>
    </div>
  );
}

export default Home;
