import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

interface QueueItem {
  resolve: () => void;
  reject: (error: unknown) => void;
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

const processQueue = (error?: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | CustomAxiosRequestConfig
      | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/refresh")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      try {
        await api.post("/api/auth/refresh");

        processQueue();

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;

  const data = err.response?.data;
  if (Array.isArray(data)) return data.join(" ");
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "title" in data)
    return String(data.title);

  return fallback;
}

export function getFieldErrors(err: unknown): Record<string, string> | null {
  if (!axios.isAxiosError(err)) return null;

  const data = err.response?.data;
  if (!data || typeof data !== "object" || !("errors" in data)) return null;

  const errors = (data as { errors: unknown }).errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors))
    return null;

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(
    errors as Record<string, unknown>
  )) {
    result[key] = Array.isArray(value) ? String(value[0]) : String(value);
  }
  return result;
}
