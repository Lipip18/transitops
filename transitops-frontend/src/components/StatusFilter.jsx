import "./SearchBar.css";

function StatusFilter({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange} className="status-filter">
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default StatusFilter;
