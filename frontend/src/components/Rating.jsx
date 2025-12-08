import React from "react";

const Rating = ({ value = 0, count }) => {
  const filled = Math.max(0, Math.min(5, Math.round(value || 0)));
  const stars = Array.from({ length: 5 }, (_, i) => i < filled);

  return (
    <span className="ratting">
      {stars.map((isFilled, idx) => (
        <i
          key={idx}
          className="icofont-star"
          style={{ color: isFilled ? "#f8c51c" : "#d3d3d3" }}
        ></i>
      ))}
      {typeof count === "number" ? <span className="ms-1">({count})</span> : null}
    </span>
  );
};

export default Rating;
