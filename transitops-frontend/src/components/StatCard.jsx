import "./StatCard.css";

function StatCard({ title, value, icon, color = "#10151f", trend }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div className="stat-info">
        <h4>{title}</h4>
        <h2>{value}</h2>
        {trend && <small>{trend}</small>}
      </div>
    </div>
  );
}

export default StatCard;
