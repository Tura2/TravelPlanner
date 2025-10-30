import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(null);

    // מצמיד Authorization לכל בקשה
    useEffect(() => {
        const reqId = axios.interceptors.request.use(cfg => {
            if (token) cfg.headers.Authorization = `Bearer ${token}`;
            return cfg;
        });
        // ב-401/403 מנתק אוטומטית
        const resId = axios.interceptors.response.use(
            resp => resp,
            err => {
                const status = err?.response?.status;
                if (status === 401 || status === 403) {
                    localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                }
                return Promise.reject(err);
            }
        );
        return () => {
            axios.interceptors.request.eject(reqId);
            axios.interceptors.response.eject(resId);
        };
    }, [token]);

    // טעינת משתמש בעת עלייה / שינוי טוקן
    useEffect(() => {
        if (!token) {
            setUser(null);
            localStorage.removeItem("token");
            return;
        }
        localStorage.setItem("token", token);
        axios.get("/api/auth/me")
            .then(r => setUser(r.data.user))
            .catch(() => {
                setUser(null);
                localStorage.removeItem("token");
                setToken(null);
            });
    }, [token]);

    const login = (jwt, userFromServer) => {
        setToken(jwt);
        if (userFromServer) setUser(userFromServer);
    };
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const value = useMemo(() => ({ token, user, login, logout, setToken }), [token, user]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
