import { Outlet } from "react-router-dom";
import { Navbar } from "../Navbar/Navbar";
import "./Layout.css";

export function Layout() {
  return (
    <div>
      <Navbar />
      <div className="layout__content">
        <Outlet />
      </div>
    </div>
  );
}
