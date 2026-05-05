import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import GuestRoute from "./GuestRoute";
import ProtectedRoute from "./ProtectedRoute";
import { ROLES } from "../constants/roles";
import AdminLayout from "../layouts/AdminLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import PublicLayout from "../layouts/PublicLayout";
import AdminAuditLogsPage from "../pages/admin/AdminAuditLogsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminEventDetailPage from "../pages/admin/AdminEventDetailPage";
import AdminEventsPage from "../pages/admin/AdminEventsPage";
import AdminEventSeatingPage from "../pages/admin/AdminEventSeatingPage";
import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminRolesPage from "../pages/admin/AdminRolesPage";
import AdminTicketVerifyPage from "../pages/admin/AdminTicketVerifyPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import CheckoutFailurePage from "../pages/customer/CheckoutFailurePage";
import CheckoutPage from "../pages/customer/CheckoutPage";
import CheckoutSuccessPage from "../pages/customer/CheckoutSuccessPage";
import MyTicketsPage from "../pages/customer/MyTicketsPage";
import SeatSelectionPage from "../pages/customer/SeatSelectionPage";
import TicketDetailPage from "../pages/customer/TicketDetailPage";
import WaitingRoomPage from "../pages/customer/WaitingRoomPage";
import EventDetailsPage from "../pages/public/EventDetailsPage";
import EventListingPage from "../pages/public/EventListingPage";
import HomePage from "../pages/public/HomePage";
import LoginPage from "../pages/public/LoginPage";
import NotFoundPage from "../pages/public/NotFoundPage";
import RegisterPage from "../pages/public/RegisterPage";
import UnauthorizedPage from "../pages/public/UnauthorizedPage";

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <GuestRoute admin />,
    children: [{ path: "/admin/login", element: <AdminLoginPage /> }],
  },
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/events", element: <EventListingPage /> },
      { path: "/events/:eventId", element: <EventDetailsPage /> },
      { path: "/unauthorized", element: <UnauthorizedPage /> },
      { path: "/not-found", element: <NotFoundPage /> },
    ],
  },
  {
    element: <ProtectedRoute requiredRole={ROLES.CUSTOMER} loginPath="/login" />,
    children: [
      {
        element: <CustomerLayout />,
        children: [
          { path: "/events/:eventId/seats", element: <SeatSelectionPage /> },
          { path: "/orders/:orderId/checkout", element: <CheckoutPage /> },
          { path: "/checkout/success", element: <CheckoutSuccessPage /> },
          { path: "/checkout/failure", element: <CheckoutFailurePage /> },
          { path: "/my-tickets", element: <MyTicketsPage /> },
          { path: "/my-tickets/:ticketId", element: <TicketDetailPage /> },
          { path: "/events/:eventId/waiting-room", element: <WaitingRoomPage /> },
        ],
      },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "/admin/dashboard", element: <AdminDashboardPage /> },
          { path: "/admin/events", element: <AdminEventsPage /> },
          { path: "/admin/events/:eventId", element: <AdminEventDetailPage /> },
          { path: "/admin/events/:eventId/seating", element: <AdminEventSeatingPage /> },
          { path: "/admin/orders", element: <AdminOrdersPage /> },
          { path: "/admin/users", element: <AdminUsersPage /> },
          { path: "/admin/roles", element: <AdminRolesPage /> },
          { path: "/admin/audit-logs", element: <AdminAuditLogsPage /> },
          { path: "/admin/tickets/verify", element: <AdminTicketVerifyPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/not-found" replace /> },
]);
