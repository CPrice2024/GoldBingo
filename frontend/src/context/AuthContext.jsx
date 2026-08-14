import {
  useEffect,
  useState,
} from "react";

import { AuthContext } from "./auth-context";

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] = useState(() => {
    const storedUser =
      localStorage.getItem("user");

    try {
      return storedUser
        ? JSON.parse(storedUser)
        : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] =
    useState(() => {
      return localStorage.getItem(
        "accessToken"
      );
    });

  const login = (
    token,
    userData
  ) => {
    localStorage.setItem(
      "accessToken",
      token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    setAccessToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem("user");

    setAccessToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    try {
      const payload = JSON.parse(
        atob(accessToken.split(".")[1])
      );

      const expiresAt =
        payload.exp * 1000;

      const remaining =
        expiresAt - Date.now();

      if (remaining <= 0) {
        logout();
        return;
      }

      const timer = setTimeout(
        () => {
          logout();
        },
        remaining
      );

      return () =>
        clearTimeout(timer);
    } catch (error) {
      console.error(
        "Invalid access token:",
        error
      );

      logout();
    }
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated:
          Boolean(
            accessToken && user
          ),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};