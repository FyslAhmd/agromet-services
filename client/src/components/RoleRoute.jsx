import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthContext } from "./context/AuthProvider";

const RoleRoute = ({ children, allowedRoles, redirectTo = "/weather-forecast" }) => {
  const { authUser, loadingUser } = useAuthContext();
  const location = useLocation();
  const isAllowed = authUser && allowedRoles.includes(authUser.role);

  useEffect(() => {
    if (!loadingUser && authUser && !isAllowed && authUser.role === "guest") {
      toast.error("Guest access is limited to public services.");
    }
  }, [authUser, isAllowed, loadingUser]);

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

  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RoleRoute;
