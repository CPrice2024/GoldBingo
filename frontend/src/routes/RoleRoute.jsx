import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const RoleRoute = ({
  allowedRoles,
  children,
}) => {
  const {
    user,
    isAuthenticated,
  } = useAuth();

  // Not logged in
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/management/login"
        replace
      />
    );
  }

  // Role is not allowed
  if (
    !user ||
    !allowedRoles.includes(user.role)
  ) {
    // Admin should go to Admin Dashboard
    if (user?.role === "admin") {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }

    // Agent should go to Agent Dashboard
    if (user?.role === "agent") {
      return (
        <Navigate
          to="/agent/dashboard"
          replace
        />
      );
    }

    // Player
    if (user?.role === "player") {
      return (
        <Navigate
          to="/player/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/management/login"
        replace
      />
    );
  }

  return children;
};

export default RoleRoute;