import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// Fix default marker icons for Leaflet (CRA/Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const dayColors = ["#1976D2", "#8E24AA", "#2E7D32", "#FB8C00", "#E53935"];

function Stat({ label, value }) {
    return (
        <div className="card" style={{ padding: 14 }}>
            <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{value}</div>
        </div>
    );
}

// מרכזים גיאוגרפיים למדינות נפוצות לטיול
const COUNTRY_CENTERS = {
    Israel: [32.0853, 34.7818],
    Italy: [41.9028, 12.4964],
    Japan: [35.6762, 139.6503],
    USA: [40.7128, -74.006],
    Canada: [45.4215, -75.6972],
    Mexico: [19.4326, -99.1332],
    Brazil: [-22.9068, -43.1729],
    Argentina: [-34.6037, -58.3816],
    UK: [51.5074, -0.1278],
    France: [48.8566, 2.3522],
    Spain: [40.4168, -3.7038],
    Portugal: [38.7223, -9.1393],
    Germany: [52.52, 13.405],
    Netherlands: [52.3676, 4.9041],
    Switzerland: [46.948, 7.4474],
    Austria: [48.2082, 16.3738],
    Greece: [37.9838, 23.7275],
    Turkey: [41.0082, 28.9784],
    Morocco: [33.5731, -7.5898],
    Egypt: [30.0444, 31.2357],
    South_Africa: [-33.9249, 18.4241],
    UAE: [25.2048, 55.2708],
    Thailand: [13.7563, 100.5018],
    Vietnam: [21.0278, 105.8342],
    India: [28.6139, 77.209],
    Australia: [-33.8688, 151.2093],
    New_Zealand: [-36.8485, 174.7633],
};
const COUNTRY_OPTIONS = Object.keys(COUNTRY_CENTERS);

function Recenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center && Array.isArray(center) && center.length === 2) {
            map.setView(center, Math.max(7, map.getZoom() || 7), { animate: true });
        }
    }, [center, map]);
    return null;
}

// המרה: GeoJSON -> [lat,lng]
function toLatLngGeometry(geometry) {
    if (!geometry) return [];
    if (Array.isArray(geometry)) return geometry; // כבר במבנה [lat,lng]
    if (Array.isArray(geometry.coordinates)) {
        // GeoJSON [lon,lat] -> [lat,lng]
        return geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    }
    return [];
}

// יוצר סיכום AI כללי מתוך הנרטיבים של הימים (אם אין שדה ייעודי מהשרת)
function buildAiSummary(days) {
    const parts = (days || [])
        .map((d, i) => {
            const t = d.title ? `${d.title}: ` : `Day ${i + 1}: `;
            return `${t}${(d.narrative || "").trim()}`;
        })
        .filter(Boolean);
    return parts.join("\n\n");
}

export default function PlanPage() {
    const { token } = useAuth();

    // בחירות משתמש
    const [country, setCountry] = useState("Israel");
    const [tripType, setTripType] = useState("hiking"); // hiking | biking

    // תכנון מהשרת (LLM+OSRM)
    const [days, setDays] = useState([]); // כפי שהגיעו מהשרת
    const [dayRoutes, setDayRoutes] = useState([]); // { geometry:[[lat,lng],...], distanceKm }
    const [totalDistance, setTotalDistance] = useState(0);

    // מידע נוסף
    const [image, setImage] = useState(null); // { url, title, credit, source }
    const [weather, setWeather] = useState([]);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [infoError, setInfoError] = useState("");

    // שמירה
    const defaultName = useMemo(() => `${country.replace(/_/g, " ")} ${tripType} trip`, [country, tripType]);
    const [tripName, setTripName] = useState(defaultName);
    const [tripDesc, setTripDesc] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    useEffect(() => {
        // לעדכן ברירת מחדל כאשר המדינה/סוג משתנים
        setTripName(`${country.replace(/_/g, " ")} ${tripType} trip`);
    }, [country, tripType]);

    // כללים להצגה (הוולידציה האמיתית נעשית בצד שרת)
    const LIMITS = {
        hiking: { min: 5, max: 15, maxDays: 2, loop: true, totalMax: 30 },
        biking: { min: 0, max: 60, maxDays: 2, loop: false },
    };

    // עזר: חלץ "From → To" מתוך הכותרת/נקודות
    function extractFromTo(day) {
        if (day?.title && day.title.includes("->")) {
            const parts = day.title.split(":").pop().split("->").map((s) => s.trim());
            if (parts.length === 2) return { from: parts[0], to: parts[1] };
        }
        const wps = day?.waypoints || [];
        const from = wps[0]?.name || "Start";
        const to = wps[wps.length - 1]?.name || "End";
        return { from, to };
    }

    function buildAiSummary(days, dayRoutes, tripType) {
        if (!Array.isArray(days) || days.length === 0) return "";
        return days.map((d, idx) => {
            const dist = dayRoutes?.[idx]?.distanceKm ??
                d?.distanceKm ?? d?.distance_km;
            const { from, to } = (() => {
                if (d?.title?.includes("->")) {
                    const parts = d.title.split(":").pop().split("->").map(s => s.trim());
                    if (parts.length === 2) return { from: parts[0], to: parts[1] };
                }
                const wps = d?.waypoints || [];
                return { from: wps[0]?.name || "Start", to: wps[wps.length - 1]?.name || "End" };
            })();
            const narrative = d?.narrative && d.narrative.trim()
                ? d.narrative.trim()
                : autoNarrative(d, dist, tripType);

            const distTxt = typeof dist === "number" ? ` (${dist.toFixed(1)} km)` : "";
            return `Day ${idx + 1}: ${from} → ${to}${distTxt} — ${narrative}`;
        }).join("\n");
    }

    // נרטיב אוטומטי אם חסר
    function autoNarrative(day, km, type) {
        const { from, to } = extractFromTo(day);
        const distTxt = typeof km === "number" ? `${km.toFixed(1)} km` : "unknown distance";
        if (type === "biking") {
            return `${from} → ${to}. A city-to-city cycling segment on paved and marked roads, passing through small towns and open scenery. Daily distance ~ ${distTxt}.`;
        }
        return `${from} → ${to}. A loop hike returning to the starting point on marked trails with viewpoints and local nature highlights. Daily distance ~ ${distTxt}.`;
    }

    // קריאה לשרת (כולל 3 ניסיונות — השרת ממילא עושה עד 5)
    async function planWithRetries(maxTries = 3) {
        const lim = LIMITS[tripType];
        const payload = {
            country,
            tripType: tripType === "biking" ? "bike" : "hike",
            limits: { min: lim.min, max: lim.max, maxDays: lim.maxDays, loop: lim.loop, totalMax: lim.totalMax },
        };

        for (let attempt = 1; attempt <= maxTries; attempt++) {
            try {
                const llmRes = await axios.post("/api/llm/plan", payload);
                const gotDays = Array.isArray(llmRes.data?.days) ? llmRes.data.days : [];
                if (!gotDays.length) throw new Error("No days");

                setDays(gotDays);

                const routes = gotDays.map((d) => {
                    const geometry = toLatLngGeometry(d.geometry);
                    const km =
                        typeof d.distanceKm === "number"
                            ? d.distanceKm
                            : typeof d.distance_km === "number"
                                ? d.distance_km
                                : null; // fallback
                    return { geometry, distanceKm: km };
                });
                setDayRoutes(routes);
                setTotalDistance(routes.reduce((s, r) => s + (r.distanceKm || 0), 0));

                return { ok: true, days: gotDays, routes };
            } catch (err) {
                console.warn("Plan attempt failed", attempt, err?.message || err);
            }
        }
        return { ok: false };
    }

    const handleGenerateRoute = async () => {
        try {
            setLoadingInfo(true);
            setInfoError("");
            setSaveMsg("");
            setDays([]);
            setDayRoutes([]);
            setTotalDistance(0);
            setWeather([]);
            setImage(null);

            const result = await planWithRetries(3);
            if (!result.ok) {
                setInfoError("Could not produce a valid plan after several attempts. Try another country.");
                return;
            }

            // ✅ use the returned days (not possibly-stale state)
            const firstStart = result.days?.[0]?.waypoints?.[0] || {};
            const lat = firstStart.lat;
            const lng = firstStart.lng ?? firstStart.lon;

            if (lat && lng) {
                try {
                    const weatherRes = await axios.get(`/api/weather?lat=${lat}&lng=${lng}`);
                    setWeather(weatherRes.data.forecast || []);
                } catch (e) {
                    console.error("weather fail", e);
                }
            }
            try {
                const imgRes = await axios.post("/api/image/generate", { country, tripType });
                const { imageUrl, title, credit, source } = imgRes.data || {};
                if (imageUrl) setImage({ url: imageUrl, title, credit, source });
            } catch (e) {
                console.error("image fail", e);
            }
        } catch (e) {
            console.error(e);
            setInfoError("Failed to generate route.");
        } finally {
            setLoadingInfo(false);
        }
    };

    const handleSaveTrip = async () => {
        try {
            if (!token) { setInfoError("Please login first."); return; }
            if (!days.length) { setInfoError("Generate a route first."); return; }
            if (!tripName?.trim()) { setInfoError("Please enter a trip name."); return; }

            setSaving(true);
            setSaveMsg("");
            setInfoError("");

            // תקציר AI
            const aiDescription = buildAiSummary(days, dayRoutes, tripType);

            // days מועשרים – נבטיח שיש נרטיב, מרחק וגאומטריה בפורמט [lat,lng]
            const enrichedDays = days.map((d, i) => ({
                title: d?.title || `Day ${i + 1}`,
                narrative: (d?.narrative && d.narrative.trim())
                    ? d.narrative.trim()
                    : autoNarrative(d, dayRoutes?.[i]?.distanceKm, tripType),
                distanceKm: d?.distanceKm ?? d?.distance_km ?? dayRoutes?.[i]?.distanceKm ?? null,
                waypoints: Array.isArray(d?.waypoints) ? d.waypoints : [],
                geometry: Array.isArray(dayRoutes?.[i]?.geometry)
                    ? dayRoutes[i].geometry
                    : toLatLngGeometry(d?.geometry)
            }));

            // קו כולל למסלול (מציירים כמו במפה)
            const points = dayRoutes.flatMap(r =>
                Array.isArray(r?.geometry) ? r.geometry.map(([lat, lng]) => ({ lat, lng })) : []
            );

            const payload = {
                name: tripName.trim(),
                description: tripDesc?.trim() || "",  // התיאור שלך
                aiDescription,                        // תיאור מסכם מה-AI
                country,
                type: tripType,                       // 'hiking' | 'biking'
                days: enrichedDays,
                points,
                totalDistanceKm: totalDistance,
                weatherForecast: weather,
                imageUrl: image?.url || ""
            };

            const res = await axios.post("/api/trips", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 200 && (res.data?.success || res.data?.tripId)) {
                setSaveMsg("✅ Trip saved successfully");
                setTimeout(() => setSaveMsg(""), 4000);
            } else {
                setInfoError(res.data?.error || "Failed to save trip.");
            }
        } catch (e) {
            console.error(e);
            setInfoError("Failed to save trip.");
        } finally {
            setSaving(false);
        }
    };



    const mapCenter = COUNTRY_CENTERS[country] || COUNTRY_CENTERS["Israel"];

    return (
        <div className="stack" style={{ gap: 20 }}>
            {/* Header */}
            <div className="card" style={{ padding: 18, display: "grid", gap: 8 }}>
                <h2 style={{ margin: 0 }}>Plan your trip</h2>
                <p style={{ margin: 0 }}>
                    Pick a country, choose hiking or biking, then generate a realistic route starting today.
                </p>
            </div>

            {/* Controls */}
            <div className="grid">
                <div className="card" style={{ padding: 18 }}>
                    <div className="stack" style={{ gap: 12 }}>
                        <label>Country</label>
                        <select value={country} onChange={(e) => setCountry(e.target.value)}>
                            {COUNTRY_OPTIONS.map((c) => (
                                <option key={c} value={c}>
                                    {c.replace(/_/g, " ")}
                                </option>
                            ))}
                        </select>

                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <input
                                    type="radio"
                                    name="tripType"
                                    value="hiking"
                                    checked={tripType === "hiking"}
                                    onChange={(e) => setTripType(e.target.value)}
                                />
                                Hiking
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <input
                                    type="radio"
                                    name="tripType"
                                    value="biking"
                                    checked={tripType === "biking"}
                                    onChange={(e) => setTripType(e.target.value)}
                                />
                                Biking
                            </label>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button className="btn btn-primary" onClick={handleGenerateRoute}>
                                Generate Real Route
                            </button>
                        </div>
                    </div>
                </div>

                {/* סטטוסים */}
                <div className="grid" style={{ alignItems: "stretch" }}>
                    <Stat label="Total distance" value={`${totalDistance.toFixed(2)} km`} />
                    <Stat label="Type" value={tripType} />
                </div>
            </div>

            {/* Map */}
            <div className="card" style={{ padding: 0 }}>
                <MapContainer center={mapCenter} zoom={7} style={{ height: 520, width: "100%" }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                    />
                    <Recenter center={mapCenter} />
                    {dayRoutes.map((d, idx) =>
                        d.geometry && d.geometry.length > 1 ? (
                            <Polyline
                                key={idx}
                                positions={d.geometry.map(([lat, lng]) => [lat, lng])}
                                pathOptions={{
                                    color: dayColors[idx % dayColors.length], // Day 1 כחול, Day 2 סגול
                                    weight: 5,
                                    opacity: 0.9,
                                }}
                            />
                        ) : null
                    )}
                </MapContainer>
            </div>

            {/* Route Summary */}
            {days.length > 0 && (
                <div className="card" style={{ padding: 18 }}>
                    <h3 style={{ marginTop: 0 }}>Route Summary</h3>
                    <div className="stack" style={{ gap: 10 }}>
                        {days.map((d, i) => {
                            const dist = dayRoutes[i]?.distanceKm;
                            const { from, to } = extractFromTo(d);
                            const narrative = d.narrative || autoNarrative(d, dist, tripType);
                            return (
                                <div key={i} className="card" style={{ padding: 14, borderLeft: `6px solid ${dayColors[i % dayColors.length]}` }}>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{`Day ${i + 1}: ${from} → ${to}`}</div>
                                    <div style={{ color: "#555", marginBottom: 6 }}>
                                        <b>Distance:</b> {typeof dist === "number" ? `${dist.toFixed(1)} km` : "N/A"}
                                    </div>
                                    <div style={{ color: "#333", whiteSpace: "pre-wrap" }}>{narrative}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Feedback */}
            {loadingInfo && <div className="card" style={{ padding: 12 }}>Loading weather & image…</div>}
            {infoError && (
                <div className="card" style={{ padding: 12, borderColor: "#fecaca", background: "#fff1f2", color: "#991b1b" }}>
                    {infoError}
                </div>
            )}
            {saveMsg && <div className="card" style={{ padding: 12, background: "#ecfdf5", color: "#065f46" }}>{saveMsg}</div>}

            {/* Weather */}
            {weather.length > 0 && (
                <div className="card" style={{ padding: 18 }}>
                    <h3 style={{ marginTop: 0 }}>3-Day Forecast</h3>
                    <div className="grid">
                        {weather.slice(0, 3).map((w, i) => {
                            // base date: prefer w.date or w.datetime; else today
                            const raw = w.date || w.datetime?.split(" ")[0];
                            let base;
                            if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                                const [y, m, d] = raw.split("-").map(Number);
                                base = new Date(y, m - 1, d); // parse as LOCAL date
                            } else {
                                base = raw ? new Date(raw) : new Date();
                            }

                            // add i days for each card
                            const shown = new Date(base);
                            shown.setDate(shown.getDate() + i);

                            // YYYY-MM-DD in local time
                            const dateStr = shown.toLocaleDateString("en-CA");

                            return (
                                <div key={i} className="card" style={{ padding: 14 }}>
                                    <div style={{ fontWeight: 600 }}>{dateStr}</div>
                                    <div style={{ fontSize: 28, margin: "6px 0" }}>
                                        {w.temp != null ? Math.round(w.temp) : "—"}°C
                                    </div>
                                    <div style={{ textTransform: "capitalize", color: "#555" }}>{w.weather || w.description}</div>
                                    {w.icon && (
                                        <img alt="icon" src={`https://openweathermap.org/img/wn/${w.icon}@2x.png`} style={{ width: 60, height: 60 }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Image with headline + credit */}
            {image?.url && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <figure style={{ margin: 0 }}>
                        <img
                            src={image.url}
                            alt={image.title || `${country} inspiration`}
                            style={{ width: "100%", maxHeight: 420, objectFit: "cover" }}
                        />
                        <figcaption
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 8,
                                padding: "10px 12px",
                                fontSize: 14,
                                background: "rgba(248,250,252,.9)",
                            }}
                        >
                            <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {image.title || `Typical scene in ${country}`}
                            </strong>
                            <span style={{ color: "#667085" }}>
                                {image.credit
                                    ? `Photo: ${image.credit}${image.source ? ` (${image.source})` : ""}`
                                    : image.source
                                        ? `Source: ${image.source}`
                                        : ""}
                            </span>
                        </figcaption>
                    </figure>
                </div>
            )}

            {/* Save trip (מתחת לתמונה) */}
            {days.length > 0 && (
                <div className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
                    <h3 style={{ margin: 0 }}>Save this trip</h3>
                    <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
                        <div className="stack">
                            <label>Trip name</label>
                            <input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="e.g. Italy biking weekend" />
                        </div>
                        <div className="stack">
                            <label>Description (your notes)</label>
                            <textarea
                                value={tripDesc}
                                onChange={(e) => setTripDesc(e.target.value)}
                                placeholder="Short description for yourself…"
                                rows={3}
                            />
                        </div>
                    </div>
                    <div>
                        <button className="btn btn-primary" onClick={handleSaveTrip} disabled={saving}>
                            {saving ? "Saving…" : "Save trip"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
