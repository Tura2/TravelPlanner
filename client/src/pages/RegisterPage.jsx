import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
    const [form, setForm] = useState({ name: "", email: "", password: "", favoriteLandscape: "" });
    const [error, setError] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await axios.post("/api/auth/register", form); // מחזיר { token, user }
            login(data.token, data.user); // התחברות אוטומטית אחרי רישום
            navigate("/plan");
        } catch (err) {
            setError(err?.response?.data?.error || "Registration failed");
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
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 36 }}>🗺️</div>
                    <h2 style={{ margin: "8px 0", fontWeight: 600 }}>Create Account</h2>
                    <p style={{ color: "#555", fontSize: 14 }}>Join TravelPlanner today</p>
                </div>

                <input name="name" placeholder="Full Name" value={form.name} onChange={onChange} required style={inputStyle} />
                <input name="email" placeholder="Email" value={form.email} onChange={onChange} type="email" required style={inputStyle} />

                <div style={{ position: "relative", marginBottom: 12 }}>
                    <input
                        name="password"
                        type={showPwd ? "text" : "password"}
                        placeholder="Password"
                        value={form.password}
                        onChange={onChange}
                        required
                        style={{ ...inputStyle, paddingRight: 40 }}
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

                <input
                    name="favoriteLandscape"
                    placeholder="Favorite Landscape (optional)"
                    value={form.favoriteLandscape}
                    onChange={onChange}
                    style={inputStyle}
                />

                {error && <div style={{ color: "#b91c1c", marginBottom: 12, fontSize: 14 }}>{error}</div>}

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
                    {loading ? "Signing up..." : "Sign up"}
                </button>

                <div style={{ textAlign: "center", marginTop: 12, fontSize: 14 }}>
                    Already have an account? <Link to="/login">Log in</Link>
                </div>
            </form>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 14,
    boxSizing: "border-box",
};
