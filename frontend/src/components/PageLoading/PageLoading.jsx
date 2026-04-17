import React from "react";
import "./PageLoading.css";

/**
 * PageLoading — Unified loading component for all pages.
 *
 * @param {"fullpage" | "inline" | "overlay"} variant
 *   - "fullpage"  → Full-screen centered spinner (initial page load)
 *   - "inline"    → Spinner inside a section/card
 *   - "overlay"   → Semi-transparent overlay on top of existing content
 * @param {string} text — Loading message (default: "Loading...")
 * @param {string} className — Extra class name
 */
const PageLoading = ({
  variant = "fullpage",
  text = "Loading...",
  className = "",
}) => {
  if (variant === "overlay") {
    return (
      <div className={`page-loading-overlay ${className}`}>
        <div className="page-loading-spinner" />
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`page-loading-inline ${className}`}>
        <div className="page-loading-spinner" />
        <span className="page-loading-text">{text}</span>
      </div>
    );
  }

  // fullpage (default)
  return (
    <div className={`page-loading-fullpage ${className}`}>
      <div className="page-loading-card">
        <div className="page-loading-spinner" />
        <p className="page-loading-text">{text}</p>
      </div>
    </div>
  );
};

export default PageLoading;
