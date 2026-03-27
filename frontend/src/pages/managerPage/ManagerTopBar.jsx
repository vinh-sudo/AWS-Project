import React, { useEffect, useState } from "react";
import "./ManagerTopBar.css";

const ManagerTopBar = ({
  title = "Manager Workspace",
  subtitle,
  searchPlaceholder = "Search...",
  onSearch,
}) => {
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (typeof onSearch === "function") {
      onSearch(searchValue.trim());
    }
  }, [searchValue, onSearch]);

  return (
    <header className="manager-topbar">
      <div className="manager-topbar-left">
        <h2 className="manager-topbar-title">{title}</h2>
        {subtitle ? (
          <p className="manager-topbar-subtitle">{subtitle}</p>
        ) : null}
      </div>

      <div className="manager-topbar-right">
        <input
          type="text"
          className="manager-topbar-search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          aria-label={searchPlaceholder}
        />
      </div>
    </header>
  );
};

export default ManagerTopBar;
