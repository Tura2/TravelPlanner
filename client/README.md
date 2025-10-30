# Myweb — Final Project

A full‑stack web application built by **Offir Tura** and **Liad Nave**. The project includes a **Node.js/Express** backend with **MongoDB Atlas** and a **React** frontend. It implements token‑based authentication and a set of REST endpoints for core domain features.

## Tech Stack
- **Frontend:** React (SPA)
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas (NoSQL)
- **Auth:** JSON Web Tokens (JWT)
- **Tooling:** dotenv, axios, cors

## Features
- Full‑stack MERN application (MongoDB, Express, React, Node.js).
- REST API with Express and MongoDB (Atlas).
- React client with protected routes and token-based auth.

## Repository Structure
```
final_project_extracted/
└── FinalProject
    └── MyWeb
        ├── .vs
        ├── .vscode
        ├── client
        ├── models
        ├── obj
        ├── routes
        ├── .env
        ├── app.js
        ├── authMiddleware.js
        ├── CHANGELOG.md
        ├── eslint.config.js
        ├── MyWeb.esproj
        ├── MyWeb.sln
        ├── package-lock.json
        ├── package.json
        └── server.js
```
> (Truncated view — heavy directories omitted)

### Client
Directory: `FinalProject/MyWeb/client`

### Server
Directory: `FinalProject/MyWeb`

## Environment Variables
Create a `.env` file in the **server** directory with:
PORT=5000
GROQ_API_KEY=**************
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
OSRM_BASE=https://router.project-osrm.org
MONGO_URI=mongodb+srv://**********:********
JWT_SECRET=***********
WEATHER_API_KEY=***********
UNSPLASH_ACCESS_KEY=********


- `MONGODB_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any strong random string
- `PORT` — backend port (default suggested in code: 3000)
- `CLIENT_URL` — origin allowed by CORS (e.g., `http://localhost:5173`)

If the client needs its own environment variables, create a `.env` in the client folder (for Vite prefix with `VITE_` and for CRA use `REACT_APP_`).

## Local Development

Open two terminals (server & client) unless the root provides a combined dev script.

**Server**
```bash
cd FinalProject/MyWeb
npm install
npm start      # or: node server.js
```

**Client**
```bash
cd FinalProject/MyWeb/client
npm install
npm start
```

API Overview
Method	    Path	                        Source file
POST	/api/auth/login	        FinalProject/MyWeb/routes/auth.js
GET	    /api/auth/me	        FinalProject/MyWeb/routes/auth.js
POST	/api/auth/register	    FinalProject/MyWeb/routes/auth.js
GET	    /api/geocode/reverse	FinalProject/MyWeb/routes/geocode.js
POST	/api/image/generate	    FinalProject/MyWeb/routes/image.js
POST	/api/llm/plan	        FinalProject/MyWeb/routes/llm.js
POST	/api/routes/osrm	    FinalProject/MyWeb/routes/osrm.js
GET	    /api/test	            FinalProject/MyWeb/server.js
GET	    /api/trips/	            FinalProject/MyWeb/routes/trips.js
POST	/api/trips/	            FinalProject/MyWeb/routes/trips.js
DELETE	/api/trips/:id	        FinalProject/MyWeb/routes/trips.js
GET	    /api/trips/:id	        FinalProject/MyWeb/routes/trips.js
GET	    /api/weather/	        FinalProject/MyWeb/routes/weather.js


## Production
- **Client:** `npm run build` generates a production bundle.
- **Server:** Set environment variables on the host and run with a process manager (PM2) or a host like Render/Heroku. Configure CORS/CLIENT_URL.

## Notes
- MongoDB Atlas is **NoSQL**.
- Keep secrets in `.env` (never commit to git).

## Contributors
- **Offir Tura**
- **Liad Nave**