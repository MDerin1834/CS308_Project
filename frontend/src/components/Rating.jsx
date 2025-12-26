import React from "react";

const Rating = ({ value = 0, count }) => {
  const safeValue = Math.max(0, Math.min(5, Number(value) || 0));
  const filled = Math.floor(safeValue);
  const hasHalf = safeValue - filled >= 0.25 && safeValue - filled < 0.75;
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < filled) return "full";
    if (i === filled && hasHalf) return "half";
    return "empty";
  });

  return (
    <span className="ratting">
      {stars.map((state, idx) => (
        <span
          key={idx}
          style={{
            position: "relative",
            display: "inline-block",
            width: "16px",
            height: "16px",
            marginRight: "2px",
          }}
        >
          <i
            className="icofont-star"
            style={{ color: "#d3d3d3", position: "absolute", left: 0, top: 0 }}
          ></i>
          {state !== "empty" && (
            <i
              className="icofont-star"
              style={{
                color: "#f8c51c",
                position: "absolute",
                left: 0,
                top: 0,
                width: state === "half" ? "50%" : "100%",
                overflow: "hidden",
                display: "inline-block",
              }}
            ></i>
          )}
        </span>
      ))}
      {typeof count === "number" ? <span className="ms-1">({count})</span> : null}
    </span>
  );
};

export default Rating;
