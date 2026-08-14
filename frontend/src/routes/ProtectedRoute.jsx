import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const ProtectedRoute = ({
  children,
  loginPath = "/player/login",
}) => {
  const {
    isAuthenticated,
  } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={loginPath}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;