import { createBrowserRouter, Navigate } from "react-router-dom";
import DashboardLayout from "../Layout/DashboardLayout";
import AWS from "../pages/AWS/AWS";
import HistoricalData from "../pages/HistoricalData/HistoricalData";
import Login from "../pages/Login/Login";
import Registration from "../pages/Registration/Registration";
import PrivateRoute from "../components/PrivateRoute";
import AdminRoute from "../components/AdminRoute";
import RoleRoute from "../components/RoleRoute";
import CISTable from "../components/CISTable";
import AddData from "../pages/AddData/AddData";
import ViewData from "../pages/ViewData/ViewData";
import DCRSAddData from "../pages/DCRSAddData/DCRSAddData";
import DCRSViewData from "../pages/DCRSViewData/DCRSViewData";
import DCRSSecondarySource from "../pages/DCRSSecondarySource/SecondarySource";
import UserManagement from "../pages/UserManagement/UserManagement";
import DataAccessRequests from "../pages/DataAccessRequests/DataAccessRequests";
import Feedback from "../pages/Feedback/Feedback";
import FeedbackManagement from "../pages/FeedbackManagement/FeedbackManagement";
import About from "../pages/About/About";
import WeatherForecast from "../pages/WeatherForecast/WeatherForecast";
import WeatherAlert from "../pages/WeatherAlert/WeatherAlert";
import Profile from "../pages/Profile/Profile";
import ForecastSummary from "../pages/ForecastSummary/ForecastSummary";
import CombinedClimateOverview from "../pages/CombinedClimateOverview/CombinedClimateOverview";
import ForecastValidation from "../pages/ForecastValidation/ForecastValidation";
import ClimateProjection from "../pages/ClimateProjection/ClimateProjection";
import GuestLogs from "../pages/GuestLogs/GuestLogs";
import AddProjectionData from "../pages/AddProjectionData/AddProjectionData";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Registration />,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/weather-forecast" replace />,
      },
      {
        path: "aws",
        element: (
          <RoleRoute allowedRoles={["user", "admin"]}>
            <AWS />
          </RoleRoute>
        ),
      },
      {
        path: "historical-data",
        element: (
          <RoleRoute allowedRoles={["user", "admin"]}>
            <HistoricalData />
          </RoleRoute>
        ),
      },
      {
        path: "secondary-source",
        element: (
          <RoleRoute allowedRoles={["user", "admin"]}>
            <DCRSSecondarySource />
          </RoleRoute>
        ),
      },
      {
        path: "cis",
        element: (
          <RoleRoute allowedRoles={["user", "admin"]}>
            <CISTable />
          </RoleRoute>
        ),
      },
      {
        path: "add-data",
        element: (
          <RoleRoute allowedRoles={["user", "admin"]}>
            <AddData />
          </RoleRoute>
        ),
      },
      {
        path: "view-data",
        element: (
          <RoleRoute allowedRoles={["user", "admin"]}>
            <ViewData />
          </RoleRoute>
        ),
      },
      {
        path: "dcrs-add-data",
        element: (
          <RoleRoute allowedRoles={["user", "admin"]}>
            <DCRSAddData />
          </RoleRoute>
        ),
      },
      {
        path: "dcrs-view-data",
        element: (
          <RoleRoute allowedRoles={["user", "admin"]}>
            <DCRSViewData />
          </RoleRoute>
        ),
      },
      {
        path: "add-projection-data",
        element: (
          <AdminRoute>
            <AddProjectionData />
          </AdminRoute>
        ),
      },
      {
        path: "user-management",
        element: (
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        ),
      },
      {
        path: "guest-logs",
        element: (
          <AdminRoute>
            <GuestLogs />
          </AdminRoute>
        ),
      },
      // {
      //   path: "data-access-requests",
      //   element: (
      //     <AdminRoute>
      //       <DataAccessRequests />
      //     </AdminRoute>
      //   ),
      // },
      {
        path: "feedback",
        element: <Feedback />,
      },
      {
        path: "feedback-management",
        element: (
          <AdminRoute>
            <FeedbackManagement />
          </AdminRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <RoleRoute allowedRoles={["user", "admin"]}>
            <Profile />
          </RoleRoute>
        ),
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "climate-projection",
        element: <ClimateProjection />,
      },
      {
        path: "weather-forecast",
        element: <WeatherForecast />,
      },
      {
        path: "forecast-summary",
        element: <ForecastSummary />,
      },
      {
        path: "forecast-validation",
        element:
          <AdminRoute>
            <ForecastValidation />
          </AdminRoute> 
        ,
      },
      {
        path: "combined-climate-overview",
        element: (
          <RoleRoute allowedRoles={["user", "admin"]}>
            <CombinedClimateOverview />
          </RoleRoute>
        ),
      },
      {
        path: "weather-alert",
        element: <WeatherAlert />,
      },
    ],
  },
]);

export default router;
