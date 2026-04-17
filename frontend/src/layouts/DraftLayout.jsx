import React from "react";
import { Outlet } from "react-router-dom";
import "./DraftLayout.css";

const DraftLayout = ({ children }) => {
  return (
    <div className="draft-layout">
      <main className="draft-content">{children || <Outlet />}</main>
    </div>
  );
};

export default DraftLayout;
