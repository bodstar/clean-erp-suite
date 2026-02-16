import axios from "axios";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("clean-token");
  const teamId = localStorage.getItem("clean-team-id");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (teamId) config.headers["X-Team-ID"] = teamId;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem("clean-token");
      localStorage.removeItem("clean-team-id");
      window.location.href = "/login";
    } else if (status === 403) {
      toast.error("Access Denied", { description: "You don't have permission to perform this action." });
    }
    return Promise.reject(error);
  }
);

export default api;
