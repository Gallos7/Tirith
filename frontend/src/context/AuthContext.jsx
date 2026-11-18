import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../services/apiClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    // 1. Initial State Hydration
    const initialToken = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

    const [token, setToken] = useState(initialToken);
    const [user, setUser] = useState(null);

    // Halts child rendering only if we actually possess a token that requires backend validation
    const [loading, setLoading] = useState(!!initialToken);

    /**
     * Authenticates the user session locally.
     * @param {string} accessToken - The short-lived JWT for API access.
     * @param {string} refreshToken - The long-lived JWT for session continuity.
     * @param {boolean} rememberMe - Dictates storage medium (localStorage vs sessionStorage).
     */
    const login = async (accessToken, refreshToken, rememberMe) => {
        if (rememberMe) {
            localStorage.setItem("access_token", accessToken);
            localStorage.setItem("refresh_token", refreshToken);
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("refresh_token");
        } else {
            sessionStorage.setItem("access_token", accessToken);
            sessionStorage.setItem("refresh_token", refreshToken);
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
        }
        setToken(accessToken);
    };

    /**
     * Terminates the session globally.
     * Executes a backend call to revoke the refresh token in the database before purging local state.
     */
    const logout = async () => {
        try {
            await apiClient.post("/auth/logout");
        } catch (error) {
            console.error("Backend logout failed. Forcing local state purge.", error);
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("refresh_token");
            setToken(null);
            setUser(null);
        }
    };

    // Synchronizes authentication state across multiple browser tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "access_token") {
                if (e.newValue === null) {
                    setToken(null);
                    setUser(null);
                } else {
                    setToken(e.newValue);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Fetches the unified User profile upon mount if a valid token exists
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await apiClient.get("/users/profile");
                setUser(response.data);
            } catch (error) {
                console.error("Authentication check failed. Invalidating session:", error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchUserProfile();
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook to expose context logic to feature components
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);