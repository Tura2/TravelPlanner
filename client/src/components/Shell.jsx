// components/Shell.jsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Modern, responsive navbar + app shell
 * - sticky, translucent bar
 * - active route styles
 * - right-side auth actions
 */
export function NavBar() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();            // במקום setToken(null)
        navigate("/login");
    };

    return (
        <header className="navbar">
            <Link to="/" className="brand" aria-label="Travel Planner Home">
                🌍 TravelPlanner
            </Link>

            <nav className="links">
                <NavLink
                    to="/plan"
                    className={({ isActive }) => (isActive ? "link-active" : undefined)}
                >
                    Plan
                </NavLink>
                <NavLink
                    to="/history"
                    className={({ isActive }) => (isActive ? "link-active" : undefined)}
                >
                    History
                </NavLink>
            </nav>

            <div className="links">
                {!token ? (
                    <>
                        <Link to="/login" className="btn">Log in</Link>
                        <Link to="/register" className="btn btn-primary">Sign up</Link>
                    </>
                ) : (
                    <>
                        <span className="muted" aria-hidden>
                            Signed in
                        </span>
                        <button className="btn" onClick={handleLogout}>
                            Log out
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}

/**
 * AppShell wraps every page with consistent padding & max-width
 */
export function AppShell({ children }) {
    return (
        <div className="container">
            <section className="section" style={{ paddingTop: 18 }}>
                {children}
            </section>
        </div>
    );
}
