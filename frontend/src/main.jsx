import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";

const savedTheme =
  localStorage.getItem(
    "playerTheme"
  ) || "day";

document.documentElement.setAttribute(
  "data-theme",
  savedTheme
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>
);