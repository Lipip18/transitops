import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip
} from "recharts";

function UtilizationChart({
  utilization,
}) {
  const data = [
    {
      name: "Utilized",
      value: Number(
        utilization
      ),
    },
    {
      name: "Idle",
      value:
        100 -
        Number(utilization),
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" outerRadius={100} label>
          <Cell fill="#2563EB" />
          <Cell fill="#E2E8F0" />
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default UtilizationChart;