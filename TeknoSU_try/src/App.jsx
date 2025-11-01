import { Outlet } from "react-router-dom";
import "./App.css";
import NavItems from "./components/NavItems";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <NavItems />
      {/* Buradaki div mesajların görünmesini engelliyordu → düzeltildi */}
      <div
        className="min-vh-100"
        style={{
          overflow: "visible", // 🔥 mesaj kutularını gizlemeyi engeller
          position: "relative",
          zIndex: 1,
          backgroundColor: "#f9f9f9",
        }}
      >
        <Outlet />
      </div>
      <Footer />
    </>
  );
}

export default App;
