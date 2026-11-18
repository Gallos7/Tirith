import axios from "axios";

// Dynamically routes to the production API if deployed, or localhost during development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
    baseURL: API_URL,
});

/**
 * REQUEST INTERCEPTOR:
 * Intercepts every outgoing HTTP request and injects the OAuth2 Bearer token into the headers.
 * Seamlessly handles both persistent (localStorage) and session-based (sessionStorage) authentication.
 */
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR:
 * Globally monitors all incoming HTTP responses for 401 Unauthorized errors.
 * If a token expires, it silently intercepts the failure, requests a new access token 
 * using the refresh token, and replays the original failed request without interrupting the user.
 */
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Trigger refresh logic only on 401s, ensuring we don't trap ourselves in an infinite retry loop
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");

                if (!refreshToken) throw new Error("No refresh token available");

                // Execute the refresh using a raw Axios call to bypass the interceptors
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refresh_token: refreshToken
                });

                const newAccessToken = response.data.access_token;

                // Persist the new token in the exact storage medium the user originally selected
                if (localStorage.getItem("refresh_token")) {
                    localStorage.setItem("access_token", newAccessToken);
                } else {
                    sessionStorage.setItem("access_token", newAccessToken);
                }

                // Mutate the paused request with the fresh token and replay it
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Security fallback: If the refresh token is revoked or expired, purge all local state and force a re-login
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                sessionStorage.removeItem("access_token");
                sessionStorage.removeItem("refresh_token");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;