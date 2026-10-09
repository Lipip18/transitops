import "./StatCard.css";

const palette = {
  amber: "#f2a93c",
  teal: "#2fd3c0",
  red: "#f0555b",
  ink: "#10151f",
};

function KPIcard({ title, value, icon, tone = "ink" }) {
  return (
    <div className="stat-card">
      {icon && (
        <div className="stat-icon" style={{ background: palette[tone] || palette.ink }}>
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
