// client/src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
    const { token, user } = useAuth();
    if (!token || !user) return <Navigate to="/login" replace />;
    return children;
}
