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

  if (data && typeof data === "object") {
    // ASP.NET ValidationProblemDetails: prefer the per-field messages over the
    // generic "One or more validation errors occurred." title.
    const fieldErrors = flattenValidationErrors(
      (data as { errors?: unknown }).errors
    );
    if (fieldErrors.length > 0) return fieldErrors.join(" ");

    if ("detail" in data && data.detail) return String(data.detail);
    if ("title" in data && data.title) return String(data.title);
  }

  return fallback;
}

function flattenValidationErrors(errors: unknown): string[] {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return [];

  const messages: string[] = [];
  for (const [field, value] of Object.entries(
    errors as Record<string, unknown>
  )) {
    const parts = Array.isArray(value) ? value : [value];
    for (const part of parts) {
      const text = String(part).trim();
      if (!text) continue;
      // Keep bare field names (e.g. "$.scene") out of the message when the
      // text is already a full sentence.
      const isGeneric = field.startsWith("$") || field === "";
      messages.push(isGeneric || /\s/.test(text) ? text : `${field}: ${text}`);
    }
  }
  return messages;
}

export function getErrorStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined;
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
