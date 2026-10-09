import {
    Cell,
    Pie,
    PieChart,
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

  const COLORS = [
    "#22c55e",
    "#f59e0b",
    "#3b82f6",
    "#ef4444",
  ];

  return (
    <PieChart width={350} height={250}>
      <Pie
        data={data}
        dataKey="value"
        outerRadius={90}
        label
      >
        {data.map((entry, index) => (
          <Cell
            key={index}
            fill={COLORS[index]}
          />
        ))}
      </Pie>

      <Tooltip />
    </PieChart>
  );
}

export default VehicleStatusChart;