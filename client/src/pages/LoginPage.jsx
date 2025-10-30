import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 14,
    boxSizing: "border-box",
};

export default function LoginPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth(); // שימוש ב-AuthContext מסודר

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError("");
        try {
            const { data } = await axios.post("/api/auth/login", form);
            login(data.token, data.user);
            navigate("/plan");
        } catch (err) {
            setError(err?.response?.data?.error || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg,#dbeafe,#f0fdf4)",
                padding: 16,
            }}
        >
            <form
                onSubmit={onSubmit}
                style={{
                    background: "#fff",
                    padding: 24,
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    width: "100%",
                    maxWidth: 400,
                    position: "relative",
                }}
            >
                {/* header */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 36 }}>🔐</div>
                    <h2 style={{ margin: "8px 0", fontWeight: 600 }}>Welcome back</h2>
                    <p style={{ color: "#555", fontSize: 14 }}>Sign in to plan your next adventure</p>
                </div>

                {/* email */}
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={onChange}
                    required
                    autoFocus
                    style={inputStyle}
                />

                {/* password + toggle */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                    <input
                        id="password"
                        name="password"
                        type={showPwd ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={onChange}
                        required
                        style={{ ...inputStyle, paddingRight: 40, marginBottom: 0 }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        aria-label={showPwd ? "Hide password" : "Show password"}
                        style={{
                            position: "absolute",
                            right: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 16,
                        }}
                    >
                        {showPwd ? "🙈" : "👁️"}
                    </button>
                </div>

                {/* error (same style as register) */}
                {error && (
                    <div style={{ color: "#b91c1c", marginBottom: 12, fontSize: 14 }}>
                        {error}
                    </div>
                )}

                {/* submit */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        padding: "10px 16px",
                        borderRadius: 8,
                        width: "100%",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    {loading ? "Signing in..." : "Sign in"}
                </button>

                {/* footer */}
                <div style={{ textAlign: "center", marginTop: 12, fontSize: 14 }}>
                    No account? <Link to="/register">Create one</Link>
                </div>
            </form>
        </div>
    );
}