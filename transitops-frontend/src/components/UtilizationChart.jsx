import {
    Pie,
    PieChart,
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
    <PieChart
      width={400}
      height={300}
    >
      <Pie
        data={data}
        dataKey="value"
        outerRadius={100}
        label
      />

      <Tooltip />
    </PieChart>
  );
}

export default UtilizationChart;