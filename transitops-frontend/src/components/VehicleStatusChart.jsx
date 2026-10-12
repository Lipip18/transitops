import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

function VehicleStatusChart({
  available,
  maintenance,
  onTrip,
  retired,
}) {
  const data = [
    {
      name: "Available",
      value: available,
    },
    {
      name: "Maintenance",
      value: maintenance,
    },
    {
      name: "On Trip",
      value: onTrip,
    },
    {
      name: "Retired",
      value: retired,
    },
  ];

  const COLORS = ["#16A34A", "#D97706", "#0F9D8A", "#94A3B8"];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" outerRadius={90} label>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default VehicleStatusChart;