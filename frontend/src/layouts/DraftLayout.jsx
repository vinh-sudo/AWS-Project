import React from "react";
import { Outlet } from "react-router-dom";
import "./DraftLayout.css";

const DraftLayout = ({ children }) => {
  const awsAds = [
    "AWS - Build on the most trusted cloud platform",
    "Amazon EC2 - Secure and resizable compute capacity",
    "Amazon S3 - Store and retrieve any amount of data",
    "AWS Security - Protect your data with world-class security",
    "AWS Global Infrastructure - 32 Regions, 102 Availability Zones",
    "AWS Lambda - Run code without thinking about servers",
    "Amazon RDS - Set up, operate, and scale databases easily",
  ];

  return (
    <div className="draft-layout">
      <main className="draft-content">{children || <Outlet />}</main>

      <footer className="draft-footer">
        <div className="aws-banner">
          <div className="aws-banner-content">
            {awsAds.map((ad, index) => (
              <span key={index} className="aws-ad-item">
                {ad}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {awsAds.map((ad, index) => (
              <span key={`dup-${index}`} className="aws-ad-item">
                {ad}
              </span>
            ))}
          </div>
        </div>
        <div className="footer-info">
          <span>Powered by</span>
          <span className="aws-logo">Amazon Web Services</span>
        </div>
      </footer>
    </div>
  );
};

export default DraftLayout;
