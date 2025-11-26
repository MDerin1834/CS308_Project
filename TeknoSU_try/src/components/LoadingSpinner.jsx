import React from "react";
import "./LoadingSpinner.css"; // CSS for spinner

const LoadingSpinner = ({ size = 50 }) => {
  return (
    <div className="loading-spinner">
      <div
        className="spinner-circle"
        style={{ width: size, height: size }}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
