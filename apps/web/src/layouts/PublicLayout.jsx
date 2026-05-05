import { Outlet } from "react-router-dom";
import "./layouts.css";
import CustomerHeader from "./CustomerHeader";

export default function PublicLayout() {
  return (
    <div className="public-layout">
      <CustomerHeader />
      <Outlet />
    </div>
  );
}
