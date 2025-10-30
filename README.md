# MyWeb Travel Planner

Build smarter trips with a React + Node/Express + MongoDB stack: plan routes (OSRM, optional LLM assist), check weather, fetch images, and save your trip history.

![Stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20MongoDB-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

## Features

- Email/password auth with JWT
- Trip planning
  - Hiking loops around landmarks (OSRM foot)
  - Biking city-to-city with distance limits (OSRM bike)
  - Optional LLM planning (Groq) with hard constraints
- Weather forecast per location (OpenWeather)
- Representative hero image (Unsplash → Wikipedia fallback)
- Trip history with waypoints and geometry

## Documentation

- Project PDF: [docs/TravelPlanner.pdf](./docs/TravelPlanner.pdf)

## Requirements

- Node.js 18+
- MongoDB (Atlas or local)
- Optional API keys: OpenWeather, Unsplash, Groq

## Project structure

```text
MyWeb/
  server.js            # Express server
  routes/              # API routes (auth, trips, llm, weather, osrm, geocode, image)
  models/              # Mongoose models (User, Trip)
  client/              # React app
  .env                 # Local env (NOT committed). See .env.example
  .env.example         # Template for env vars
  README.md            # This file
  docs/                # Project docs (e.g., PDF)
```

## Environment variables

Copy `.env.example` to `.env` and set values:

- PORT=5000
- MONGO_URI=your mongodb connection string
- JWT_SECRET=any strong random string
- WEATHER_API_KEY=optional for weather
- UNSPLASH_ACCESS_KEY=optional for images
- GROQ_API_KEY=optional for LLM planning
- OSRM_BASE_URL=<https://router.project-osrm.org> (default)

Note: `.env` is ignored by git. Keep secrets out of version control.

## Install & run (Windows PowerShell)

From the MyWeb folder:

1. Install backend deps

```powershell
npm install
```

1. Install frontend deps

```powershell
cd .\client
npm install
cd ..
```

1. Start backend (terminal A)

```powershell
npm start
```

1. Start frontend (terminal B)

```powershell
cd .\client
npm start
```

- Client: <http://localhost:3000>
- API: <http://localhost:5000>

## API quick check

- GET <http://localhost:5000/api/test> → OK

## Troubleshooting

- MongoDB SRV (mongodb+srv) DNS errors: use a non-SRV connection string, or local MongoDB, or adjust DNS (8.8.8.8/1.1.1.1), then retry.

## Security

- Do not commit `.env` or any secrets (use `.env.example`).

## Tech stack

- Frontend: React, React Router, React Leaflet
- Backend: Node.js, Express, JWT
- DB: MongoDB (Mongoose)
- Routing: OSRM (public server by default)
- Weather: OpenWeather
- Images: Unsplash (optional) with Wikipedia fallback
- Optional LLM: Groq (Llama 3.1) for seed plans

