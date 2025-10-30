import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import { useAuth } from "./context/AuthContext";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import PlanPage from "./pages/PlanPage";
import HistoryPage from "./pages/HistoryPage";
import TripDetailPage from "./pages/TripDetailPage";
import { NavBar, AppShell } from "./components/Shell";

/** מסכים ציבוריים לא אמורים להציג NavBar/AppShell */
function PublicRoute({ children }) {
    const { token, user } = useAuth();
    if (token && user) return <Navigate to="/plan" replace />;
    return children;
}

/** Layout שמופיע רק אחרי אימות */
function ProtectedLayout() {
    return (
        <>
            <NavBar />
            <AppShell>
                <Outlet />
            </AppShell>
        </>
    );
}

export default function App() {
    return (
        <Routes>
            {/* public */}
            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />

            {/* protected layout + routes */}
            <Route
                element={
                    <PrivateRoute>
                        <ProtectedLayout />
                    </PrivateRoute>
                }
            >
                <Route path="/plan" element={<PlanPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/trip/:id" element={<TripDetailPage />} />
            </Route>

            {/* defaults */}
            <Route path="/" element={<Navigate to="/plan" replace />} />
            <Route path="*" element={<Navigate to="/plan" replace />} />
        </Routes>
    );
}
