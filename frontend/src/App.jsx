import { Outlet } from "react-router-dom";
import "./App.css";
import NavItems from "./components/NavItems";
import Footer from "./components/Footer";
import AIChatbot from "./components/AIChatbot";

import AuthProvider from "./contexts/AuthProvider";
import WishlistProvider from "./contexts/WishlistContext";

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <>
          <NavItems />

          {/* MAIN CONTENT AREA */}
          <div
            className="min-vh-100"
            style={{
              overflow: "visible",
              position: "relative",
              zIndex: 1,
              backgroundColor: "#f9f9f9",
            }}
          >
            <Outlet />
          </div>

          <AIChatbot />
          <Footer />
        </>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
