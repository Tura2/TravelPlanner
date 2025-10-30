
# 🌍 **MyWeb Travel Planner**

> **Plan smarter trips.**  
> A full-stack MERN app built with **React**, **Node/Express**, and **MongoDB**, integrating **OSRM routing**, **OpenWeather**, **Unsplash**, and optional **Groq LLM** assistance for AI-powered route planning.

<p align="center">
  <img src="https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20MongoDB-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/license-ISC-lightgrey?style=for-the-badge"/>
</p>

---

## ✨ **Features**

✅ **Authentication**
- Secure email/password login using JWT

🗺️ **Trip Planning**
- Hiking loops around landmarks (OSRM *foot* mode)  
- Biking city-to-city with distance constraints (OSRM *bike* mode)  
- Optional **AI-assisted itinerary planning** (Groq Llama-3.1)

☀️ **Weather Integration**
- Real-time forecasts per location (OpenWeather API)

🖼️ **Dynamic Imagery**
- Fetch representative hero image (Unsplash → Wikipedia fallback)

📜 **Trip History**
- Persistent trip data with stored waypoints, geometry & metadata

---

## 🧩 **Tech Stack**

| Layer | Technologies |
|:------|:--------------|
| **Frontend** | React, React Router, React Leaflet |
| **Backend** | Node.js, Express, JWT |
| **Database** | MongoDB (Mongoose) |
| **Routing** | OSRM (public API by default) |
| **Weather** | OpenWeather |
| **Images** | Unsplash (fallback: Wikipedia) |
| **LLM (optional)** | Groq — Llama 3.1 Instant |

---

## 📚 **Documentation**

📄 [**TravelPlanner.pdf**](./docs/TravelPlanner.pdf) — full technical documentation & architecture overview.

---

## ⚙️ **Requirements**

| Dependency | Minimum Version | Purpose |
|:------------|:----------------|:---------|
| **Node.js** | ≥ 18 | Runtime environment |
| **MongoDB** | — | Database (Atlas or local) |
| *(Optional)* | — | OpenWeather / Unsplash / Groq API keys |

---

## 🗂️ **Project Structure**

```text
MyWeb/
├── server.js              # Express app entry point
├── routes/                # API routes (auth, trips, llm, weather, osrm, geocode, image)
├── models/                # Mongoose models (User, Trip)
├── client/                # React application (Vite or CRA)
├── .env                   # Local environment vars (ignored by git)
├── .env.example           # Template for env vars
├── docs/                  # Docs & PDFs
└── README.md              # This file
````

---

## 🔐 **Environment Variables**

Copy `.env.example` → `.env` and fill in:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=strong_random_secret
WEATHER_API_KEY=optional
UNSPLASH_ACCESS_KEY=optional
GROQ_API_KEY=optional
OSRM_BASE_URL=https://router.project-osrm.org
```

> ⚠️ **Note:** `.env` is ignored by git. Never commit secrets.

---

## 🧑‍💻 **Installation & Local Run (Windows PowerShell)**

From the project root (`MyWeb/`):

### 1️⃣ Install backend dependencies

```powershell
npm install
```

### 2️⃣ Install frontend dependencies

```powershell
cd .\client
npm install
cd ..
```

### 3️⃣ Start the backend (Terminal A)

```powershell
npm start
```

### 4️⃣ Start the frontend (Terminal B)

```powershell
cd .\client
npm start
```

**Local URLs**

* 🌐 **Client:** [http://localhost:3000](http://localhost:3000)
* 🔌 **API:** [http://localhost:5000](http://localhost:5000)

---

## 🔎 **API Quick Check**

Confirm backend is live:

```bash
GET http://localhost:5000/api/test
```

Response → `OK`

---

## 🛠️ **Troubleshooting**

* **MongoDB SRV errors** → use a non-SRV connection string or local Mongo instance
* **DNS issues** → change resolver (e.g., `8.8.8.8` / `1.1.1.1`)
* **CORS errors** → ensure `CLIENT_URL` is whitelisted in server config

## 👥 **Contributors**

| Name | LinkedIn |
|:-----|:----------|
| **Offir Tura** | [linkedin.com/in/offir-tura](https://www.linkedin.com/in/offir-tura) |
| **Liad Nave** | [linkedin.com/in/liad-nave-504072367](https://www.linkedin.com/in/liad-nave-504072367/) |
