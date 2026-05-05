import { Outlet } from "react-router-dom";
import "./layouts.css";
import CustomerHeader from "./CustomerHeader";

export default function CustomerLayout() {
  return (
    <div className="customer-layout">
      <CustomerHeader />
      <Outlet />
    </div>
  );
}
