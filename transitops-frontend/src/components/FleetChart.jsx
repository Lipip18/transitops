import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function FleetChart({
  available = 0,
  maintenance = 0,
  active = 0,
}) {
  const data = [
    {
      name: "Available",
      value: Number(available),
    },
    {
      name: "Maintenance",
      value: Number(maintenance),
    },
    {
      name: "On Trip",
      value: Number(active),
    },
  ];

  const COLORS = [
    "#16A34A",
    "#D97706",
    "#0F9D8A",
  ];

  const hasData = data.some(
    (item) => item.value > 0
  );

  return (
    <div
      style={{
        width: "100%",
        height: 320,
      }}
    >
      {hasData ? (
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label={({ name, value }) =>
                `${name}: ${value}`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "var(--ink-500)",
            fontSize: "16px",
          }}
        >
          No fleet data available
        </div>
      )}
    </div>
  );
}

export default FleetChart;