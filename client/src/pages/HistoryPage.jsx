import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function HistoryPage() {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [notice, setNotice] = useState("");

    const [typeFilter, setTypeFilter] = useState("");
    const [textFilter, setTextFilter] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const fetchTrips = async () => {
            if (!token) { setErr("Please login first."); setLoading(false); return; }
            setLoading(true);
            setErr("");
            try {
                const res = await axios.get("/api/trips", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTrips(res.data.trips || []);
            } catch (e) {
                console.error(e);
                setErr("Failed to load trips.");
            } finally {
                setLoading(false);
            }
        };
        fetchTrips();
    }, [token]);

    const filtered = useMemo(() => {
        const q = textFilter.trim().toLowerCase();
        return trips.filter((t) => {
            if (typeFilter && t.type !== typeFilter) return false;
            if (!q) return true;
            const haystack = [
                t.name || "",
                t.description || "",
                t.imageUrl || "",
                ...(t.weatherForecast || []).map((w) => `${w.weather || w.description || ""}`),
            ].join(" ").toLowerCase();
            return haystack.includes(q);
        });
    }, [trips, typeFilter, textFilter]);

    const handleDelete = async (id) => {
        if (!token) return;
        const ok = window.confirm("Delete this trip? This cannot be undone.");
        if (!ok) return;
        try {
            setDeletingId(id);
            await axios.delete(`/api/trips/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTrips((prev) => prev.filter((t) => t._id !== id));
            setNotice("Trip deleted.");
            setTimeout(() => setNotice(""), 2500);
        } catch (e) {
            console.error(e);
            alert("Failed to delete trip.");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="card" style={{ padding: 16 }}>Loading...</div>;
    if (err) return <div className="card" style={{ padding: 16, color: "#b30000" }}>{err}</div>;

    return (
        <div className="stack" style={{ gap: 16 }}>
            <div className="card" style={{ padding: 18 }}>
                <h2 style={{ marginTop: 0 }}>Your Trips</h2>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                    Find saved routes, filter by type, and open details.
                </p>
            </div>

            {notice && (
                <div className="card" style={{ padding: 12, background: "#ecfdf5", color: "#065f46" }}>
                    {notice}
                </div>
            )}

            <div className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12
                }}>
                    <div className="stack">
                        <label>Type</label>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="">All</option>
                            <option value="hiking">Hiking</option>
                            <option value="biking">Biking</option>
                        </select>
                    </div>
                    <div className="stack">
                        <label>Search (name / description / weather)</label>
                        <input
                            value={textFilter}
                            onChange={(e) => setTextFilter(e.target.value)}
                            placeholder="e.g. Italy, sunny, family"
                        />
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="card" style={{ padding: 18 }}>No trips found.</div>
            ) : (
                <div
                    className="grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))", // exactly 3 per row
                        gap: 12
                    }}
                >
                    {filtered.map((t) => (
                        <div key={t._id} className="card" style={{ padding: 12, display: "grid", gap: 10 }}>
                            {t.imageUrl && (
                                <div style={{ overflow: "hidden", borderRadius: 10 }}>
                                    <img
                                        src={t.imageUrl}
                                        alt={t.name}
                                        style={{ width: "100%", height: 140, objectFit: "cover" }}
                                    />
                                </div>
                            )}
                            <div style={{ fontWeight: 800, fontSize: 18 }}>{t.name}</div>
                            <div style={{ color: "#666" }}>{t.description || "No description"}</div>
                            <div style={{ fontSize: 14 }}>
                                <strong>Type:</strong> {t.type}
                                <span aria-hidden="true" style={{ margin: "0 8px", color: "#94a3b8" }}>
                                    {"\u00B7"}   {/* middle dot · */}
                                </span>
                                <strong>Distance:</strong> {(t.totalDistanceKm ?? 0).toFixed(1)} km
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/trip/${t._id}`)}
                                >
                                    View
                                </button>
                                <button
                                    className="btn"
                                    style={{ background: "#fee2e2", borderColor: "#fecaca", color: "#7f1d1d" }}
                                    onClick={() => handleDelete(t._id)}
                                    disabled={deletingId === t._id}
                                    title="Delete"
                                >
                                    {deletingId === t._id ? "Deleting…" : "Delete"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
