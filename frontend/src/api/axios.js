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

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    console.log(
      "[API]",
      config.method?.toUpperCase(),
      config.url,
      "token:",
      token ? "YES" : "NO"
    );

    return config;
  },
  (error) =>
    Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status ===
      401
    ) {
      console.error(
        "[AUTH] 401:",
        error.config?.url
      );

      // Do NOT remove the current
      // access token automatically here.
    }

    return Promise.reject(error);
  }
);

export default api;