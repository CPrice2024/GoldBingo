import {
  Navigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/useAuth";

const ProtectedRoute = ({
  children,
  loginPath =
    "/player/login",
}) => {
  const {
    isAuthenticated,
    authReady,
  } = useAuth();


  /*
   * Wait for Capacitor Preferences
   * to restore the saved session.
   */
  if (!authReady) {
    return null;
  }


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