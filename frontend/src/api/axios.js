import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "accessToken"
      );

    const publicRoutes = [
      "/auth/login",
      "/auth/register",
      "/auth/reset-password",
    ];

    const isPublicRoute =
      publicRoutes.some((route) =>
        config.url?.includes(route)
      );

    /*
     * Never attach an old JWT
     * to login/register/reset requests.
     */
    if (
      token &&
      !isPublicRoute
    ) {
      config.headers.Authorization =
        `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    console.log(
      "[API]",
      config.method?.toUpperCase(),
      `${config.baseURL}${config.url}`,
      "public:",
      isPublicRoute,
      "token:",
      token && !isPublicRoute
        ? "YES"
        : "NO"
    );

    return config;
  },

  (error) =>
    Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error(
      "[API ERROR]",
      {
        url:
          error.config?.url,

        baseURL:
          error.config?.baseURL,

        status:
          error.response?.status,

        response:
          error.response?.data,

        message:
          error.message,
      }
    );

    return Promise.reject(error);
  }
);

export default api;