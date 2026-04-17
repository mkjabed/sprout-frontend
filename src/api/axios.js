import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

function clearSession() {
  localStorage.removeItem("sprout_token");
  localStorage.removeItem("sprout_guardian");
  localStorage.removeItem("sprout_email");
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sprout_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    if (status === 401 && !requestUrl.includes("/auth/login")) {
      clearSession();

      if (window.location.pathname !== "/") {
        window.location.assign("/");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
