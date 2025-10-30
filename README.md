# MyWeb Travel Planner

A full-stack travel planner: React (client) + Node/Express + MongoDB. Features authentication, trip planning (OSRM-based with optional LLM assist), weather forecasts, image fetching (Unsplash/Wikipedia), and trip history.


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

1. Backend deps

```powershell
cd "c:\Users\offir\Afeka\WEB\Final\FinalProject\MyWeb"
npm install
```

1. Frontend deps

```powershell
cd ".\client"
npm install
```

1. Start backend

```powershell
cd "c:\Users\offir\Afeka\WEB\Final\FinalProject\MyWeb"
npm start
```

1. Start frontend (new terminal)

```powershell
cd "c:\Users\offir\Afeka\WEB\Final\FinalProject\MyWeb\client"
npm start
```

- Client on <http://localhost:3000>
- API on <http://localhost:5000>


## API quick check

- GET <http://localhost:5000/api/test> → OK


## Troubleshooting

- MongoDB SRV (mongodb+srv) DNS errors: use a non-SRV connection string, or local MongoDB, or adjust DNS (8.8.8.8/1.1.1.1), then retry.


## Security

- Do not commit `.env` or any secrets.


## License

ISC
