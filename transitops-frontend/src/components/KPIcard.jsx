import "./StatCard.css";

const palette = {
  amber: { background: "#FEF3C7", color: "#D97706" },
  teal: { background: "#CCFBF1", color: "#0F766E" },
  red: { background: "#FEE2E2", color: "#DC2626" },
  ink: { background: "#DBEAFE", color: "#2563EB" },
};

function KPIcard({ title, value, icon, tone = "ink" }) {
  return (
    <div className="stat-card">
      {icon && (
        <div
          className="stat-icon"
          style={palette[tone] || palette.ink}
        >
          {icon}
        </div>
      )}
      <div className="stat-info">
        <h4>{title}</h4>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

export default KPIcard;
