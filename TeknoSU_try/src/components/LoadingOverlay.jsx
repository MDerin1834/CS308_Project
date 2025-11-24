const LoadingOverlay = () => {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(255,255,255,0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}>
      <div className="spinner-border" style={{ width: "4rem", height: "4rem" }} />
    </div>
  );
};

export default LoadingOverlay;
