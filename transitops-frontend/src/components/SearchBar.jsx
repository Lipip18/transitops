import { Search } from "lucide-react";
import "./SearchBar.css";

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar">
      <Search size={16} />
      <input type="text" placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );
}

export default SearchBar;
