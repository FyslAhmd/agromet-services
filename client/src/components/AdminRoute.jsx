import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "./context/AuthProvider";

const AdminRoute = ({ children }) => {
  const { authUser, loadingUser } = useAuthContext();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but not admin, redirect to home
  if (authUser.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // If admin, render the children
  return children;
};

export default AdminRoute;
