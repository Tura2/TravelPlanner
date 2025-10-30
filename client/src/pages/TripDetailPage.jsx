import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const dayColors = ['#1976D2', '#8E24AA', '#2E7D32', '#FB8C00', '#E53935'];

function InfoChip({ label, value }) {
    return (
        <div className="card" style={{ padding: 12, display: "grid", gap: 4 }}>
            <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
        </div>
    );
}

// helper – make sure geometry is [[lat,lng], ...]
function toLatLngGeometry(geometry) {
    if (!geometry) return [];
    if (Array.isArray(geometry) && Array.isArray(geometry[0])) {
        // could already be [[lat,lng]]
        if (geometry.length && geometry[0].length === 2) return geometry;
    }
    if (Array.isArray(geometry.coordinates)) {
        return geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    }
    return [];
}

export default function TripDetailPage() {
    const { id } = useParams();
    const { token } = useAuth();

    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // נבנה סגמנטים לפי ימים אם קיימים; אם לא – ניפול לנתיב אחד ישן (points)
    const daySegments = useMemo(() => {
        if (trip?.days?.length) {
            return trip.days.map((d) => ({
                title: d.title,
                narrative: d.narrative,
                distanceKm: d.distanceKm ?? d.distance_km,
                geometry: toLatLngGeometry(d.geometry),
                waypoints: d.waypoints || []
            }));
        }
        if (trip?.points?.length) {
            const geom = trip.points.map((p) => (Array.isArray(p) ? p : [p.lat, p.lng]));
            return [{ title: trip.name, narrative: trip.aiDescription || "", distanceKm: trip.totalDistanceKm, geometry: geom, waypoints: [] }];
        }
        return [];
    }, [trip]);

    const mapCenter = useMemo(() => {
        const first = daySegments[0]?.geometry?.[0];
        return first || [32.0853, 34.7818];
    }, [daySegments]);

    const startPos = daySegments[0]?.geometry?.[0];
    const lastSeg = daySegments[daySegments.length - 1];
    const endPos = lastSeg?.geometry?.[lastSeg.geometry.length - 1];

    useEffect(() => {
        const fetchTrip = async () => {
            if (!token) { setErr("Please login first."); setLoading(false); return; }
            try {
                setLoading(true);
                setErr("");
                const res = await axios.get(`/api/trips/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTrip(res.data.trip);
            } catch (e) {
                console.error(e);
                setErr("Failed to load trip.");
            } finally {
                setLoading(false);
            }
        };
        fetchTrip();
    }, [id, token]);

    // רענון תמונה+מז״א – לפי המדינה + סוג
    const handleRefreshInfo = async () => {
        if (!startPos) return;
        setRefreshing(true);
        try {
            const [lat, lng] = startPos;

            // weather
            const w = await axios.get(`/api/weather?lat=${lat}&lng=${lng}`);

            // image (country + type, randomize + force to bypass cache)
            const img = await axios.post("/api/image/generate", {
                country: trip?.country || trip?.name || "travel",
                tripType: trip?.type,
                randomize: true,
                force: true
            });

            // bust browser cache by appending ?t=
            const rawUrl = img.data.imageUrl || trip.imageUrl || "";
            const bustUrl = rawUrl ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}t=${Date.now()}` : rawUrl;

            setTrip(t => ({
                ...t,
                weatherForecast: w.data.forecast || [],
                imageUrl: bustUrl,
            }));
        } catch (e) {
            console.error(e);
            alert("Failed to refresh weather/image.");
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) return <div className="card" style={{ padding: 16 }}>Loading…</div>;
    if (err) return <div className="card" style={{ padding: 16, color: "#b30000" }}>{err}</div>;
    if (!trip) return null;

    return (
        <div className="stack" style={{ gap: 18 }}>
            <div className="grid">
                <InfoChip label="Type" value={trip.type || "-"} />
                <InfoChip label="Distance" value={`${(trip.totalDistanceKm ?? 0).toFixed(2)} km`} />
                <InfoChip label="Created" value={new Date(trip.createdAt).toLocaleString()} />
            </div>

            <div className="card" style={{ padding: 18 }}>
                <h2 style={{ marginTop: 0 }}>{trip.name}</h2>
                {/* התיאור שלך */}
                {trip.description && <p style={{ marginTop: 6 }}>{trip.description}</p>}
                {/* תיאור כללי של GROQ (אם שמור) */}
                {trip.aiDescription && (
                    <div className="card" style={{ padding: 12, background: "#f8fafc" }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>AI Summary</div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{trip.aiDescription}</div>
                    </div>
                )}
            </div>

            {/* מפה: כל יום בצבע אחר – בול כמו PlanPage */}
            <div className="card" style={{ padding: 0 }}>
                <MapContainer center={mapCenter} zoom={7} style={{ height: 520, width: "100%" }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                    />
                    {startPos && <Marker position={startPos} />}
                    {endPos && endPos !== startPos && <Marker position={endPos} />}

                    {daySegments.map((seg, idx) =>
                        Array.isArray(seg.geometry) && seg.geometry.length > 1 ? (
                            <Polyline
                                key={idx}
                                positions={seg.geometry}
                                pathOptions={{
                                    color: dayColors[idx % dayColors.length],
                                    weight: 5,
                                    opacity: 0.9,
                                }}
                            />
                        ) : null
                    )}
                </MapContainer>
            </div>

            {/* חלוקה לימים + נרטיב של GROQ לכל יום */}
            {daySegments.length > 0 && (
                <div className="card" style={{ padding: 18 }}>
                    <h3 style={{ marginTop: 0 }}>Route Summary</h3>
                    <div className="stack" style={{ gap: 10 }}>
                        {daySegments.map((d, i) => {
                            const dist = typeof d.distanceKm === "number" ? `${d.distanceKm.toFixed(1)} km` : "N/A";

                            // ניסיון להוציא From/To מתוך waypoints/title (כמו PlanPage)
                            let from = "Start", to = "End";
                            if (d.title?.includes("->")) {
                                const parts = d.title.split(":").pop().split("->").map(s => s.trim());
                                if (parts.length === 2) { from = parts[0]; to = parts[1]; }
                            } else if (d.waypoints?.length) {
                                from = d.waypoints[0]?.name || from;
                                to = d.waypoints[d.waypoints.length - 1]?.name || to;
                            }

                            return (
                                <div key={i} className="card" style={{ padding: 14, borderLeft: `6px solid ${dayColors[i % dayColors.length]}` }}>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                        {`Day ${i + 1}: ${from} → ${to}`}
                                    </div>
                                    <div style={{ color: "#555", marginBottom: 6 }}>
                                        <b>Distance:</b> {dist}
                                    </div>
                                    <div style={{ color: "#333", whiteSpace: "pre-wrap" }}>
                                        {d.narrative || "—"}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* תמונה עם כותרת */}
            {trip.imageUrl && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <figure style={{ margin: 0 }}>
                        <img
                            src={trip.imageUrl}
                            alt={trip.name}
                            style={{ width: "100%", maxHeight: 420, objectFit: "cover" }}
                        />
                        <figcaption
                            style={{
                                display: "flex", justifyContent: "space-between", gap: 8,
                                padding: "10px 12px", fontSize: 14, background: "rgba(248,250,252,.9)"
                            }}
                        >
                            <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {trip.country ? `Typical scene in ${trip.country}` : trip.name}
                            </strong>
                        </figcaption>
                    </figure>
                </div>
            )}

            {/* מז״א – אותו חישוב תאריכים כמו ב-PlanPage (+i יום) */}
            {Array.isArray(trip.weatherForecast) && trip.weatherForecast.length > 0 && (
                <div className="card" style={{ padding: 18 }}>
                    <h3 style={{ marginTop: 0 }}>3-Day Forecast</h3>
                    <div className="grid">
                        {trip.weatherForecast.slice(0, 3).map((w, i) => {
                            const raw = w.date || w.datetime?.split(" ")[0];
                            let base;
                            if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                                const [y, m, d] = raw.split("-").map(Number);
                                base = new Date(y, m - 1, d);
                            } else {
                                base = raw ? new Date(raw) : new Date();
                            }
                            const shown = new Date(base);
                            shown.setDate(shown.getDate() + i);
                            const dateStr = shown.toLocaleDateString("en-CA");
                            return (
                                <div key={i} className="card" style={{ padding: 14 }}>
                                    <div style={{ fontWeight: 600 }}>{dateStr}</div>
                                    <div style={{ fontSize: 28, margin: "6px 0" }}>
                                        {w.temp != null ? Math.round(w.temp) : "—"}°C
                                    </div>
                                    <div style={{ textTransform: "capitalize", color: "#555" }}>
                                        {w.weather || w.description}
                                    </div>
                                    {w.icon && (
                                        <img
                                            alt="icon"
                                            src={`https://openweathermap.org/img/wn/${w.icon}@2x.png`}
                                            style={{ width: 60, height: 60 }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" onClick={handleRefreshInfo} disabled={refreshing}>
                    {refreshing ? "Refreshing…" : "Refresh weather & image"}
                </button>
            </div>
        </div>
    );
}
