import { createBrowserRouter, Navigate } from "react-router-dom";
import DashboardLayout from "../Layout/DashboardLayout";
import AWS from "../pages/AWS/AWS";
import HistoricalData from "../pages/HistoricalData/HistoricalData";
import Login from "../pages/Login/Login";
import Registration from "../pages/Registration/Registration";
import PrivateRoute from "../components/PrivateRoute";
import AdminRoute from "../components/AdminRoute";
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
import Profile from "../pages/Profile/Profile";

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
        element: <Navigate to="/aws" replace />,
      },
      {
        path: "aws",
        element: <AWS />,
      },
      {
        path: "historical-data",
        element: <HistoricalData />,
      },
      {
        path: "secondary-source",
        element: <DCRSSecondarySource />,
      },
      {
        path: "cis",
        element: <CISTable />,
      },
      {
        path: "add-data",
        element: <AddData />,
      },
      {
        path: "view-data",
        element: <ViewData />,
      },
      {
        path: "dcrs-add-data",
        element: <DCRSAddData />,
      },
      {
        path: "dcrs-view-data",
        element: <DCRSViewData />,
      },
      {
        path: "user-management",
        element: (
          <AdminRoute>
            <UserManagement />
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
        element: <Profile />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "weather-forecast",
        element: <WeatherForecast />,
      },
    ],
  },
]);

export default router;
