# WildPulse AI 🔥

> **Monitor • Predict • Protect**
>
> A MERN stack web application for wildfire monitoring, AI-based risk prediction, and community incident reporting.

---

## Project Overview

WildPulse AI is a **Semester 7 Mini Project** that demonstrates a full-stack MERN application integrated with real external APIs:

- **NASA FIRMS** — Near-real-time satellite wildfire hotspot data
- **Open-Meteo** — Current weather data (free, no API key required)
- **AI Risk Engine** — Explainable weighted scoring model (ready for ML replacement)
- **MongoDB** — Community fire report storage

---

## Features

| Feature | Description |
|---------|-------------|
| 🛰️ Live Fire Map | Interactive Leaflet map showing NASA FIRMS satellite hotspots |
| 🌡️ Weather Data | Real-time temperature, humidity, wind, precipitation via Open-Meteo |
| 🧠 Risk Prediction | Explainable AI-based wildfire risk (LOW / MODERATE / HIGH / EXTREME) |
| 📝 Fire Reports | Community reporting with MongoDB persistence |
| 📊 Analytics | Recharts visualizations of fire activity and report statistics |
| 🌍 Location Analysis | Click anywhere on the map for instant risk and weather assessment |

---

## Technology Stack

### Frontend
- React 18 + Vite
- Tailwind CSS v4
- React Router v6
- Leaflet + React-Leaflet (interactive maps)
- Recharts (analytics charts)
- Lucide React (icons)
- Axios (HTTP client)

### Backend
- Node.js + Express.js
- Mongoose (MongoDB ODM)
- Helmet (security headers)
- CORS, Morgan, dotenv

### Database
- MongoDB Atlas (cloud)

### External APIs
- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/) — wildfire hotspots
- [Open-Meteo](https://open-meteo.com/) — weather data (free, no key)
- OpenStreetMap — map tiles (free)

---

## Architecture

```
WildPulse-AI/
├── backend/               ← Node.js + Express API
│   ├── src/
│   │   ├── config/        ← DB connection, constants (weights, thresholds)
│   │   ├── controllers/   ← Route handler logic
│   │   ├── models/        ← Mongoose schemas (FireReport)
│   │   ├── routes/        ← Express route definitions
│   │   ├── services/      ← firmsService, weatherService, riskService
│   │   ├── middleware/    ← Error handling
│   │   ├── app.js         ← Express app configuration
│   │   └── server.js      ← Entry point
│   └── .env               ← Secrets (never committed)
│
└── frontend/              ← React + Vite
    ├── src/
    │   ├── components/    ← Reusable UI components
    │   ├── pages/         ← Route-level page components
    │   ├── layouts/       ← MainLayout (Navbar + Sidebar)
    │   ├── services/      ← api.js (Axios functions)
    │   └── App.jsx        ← Router setup
    └── .env               ← VITE_API_BASE_URL
```

---

## Installation

### Prerequisites
- Node.js v18+ (tested on v24.18.1)
- npm v9+
- MongoDB Atlas account (free tier works)
- NASA FIRMS API key (free registration)

### 1. Clone / Navigate to project
```bash
cd WildPulse-AI
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and NASA FIRMS API key
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/wildpulse

# NASA FIRMS Map Key (get from https://firms.modaps.eosdis.nasa.gov/api/)
NASA_FIRMS_MAP_KEY=your_key_here

# Dataset: VIIRS_SNPP_NRT | VIIRS_NOAA20_NRT | MODIS_NRT
NASA_FIRMS_DATASET=VIIRS_SNPP_NRT
NASA_FIRMS_DAYS=1

FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## NASA FIRMS Setup

1. Go to https://firms.modaps.eosdis.nasa.gov/api/
2. Click "Get MAP_KEY"
3. Register with your email
4. You'll receive a MAP_KEY (e.g., `abc123def456`)
5. Add it to `backend/.env` as `NASA_FIRMS_MAP_KEY=abc123def456`
6. The app uses VIIRS (Visible Infrared Imaging Radiometer Suite) satellite data by default

> **Without the API key:** The app still runs. Weather, risk prediction, and fire reporting all work. Only the live fire hotspot map won't show real satellite data.

---

## MongoDB Setup

1. Go to https://cloud.mongodb.com (free tier)
2. Create a new project and cluster
3. Create a database user (username + password)
4. Whitelist your IP (or `0.0.0.0/0` for development)
5. Click "Connect" → "Drivers" → copy the connection string
6. Replace `<password>` with your actual password
7. Add to `backend/.env` as `MONGODB_URI=<your connection string>`

---

## Running the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:5173
```

Visit: **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server and database status |
| GET | `/api/fires` | NASA FIRMS fire hotspots |
| GET | `/api/weather?latitude=&longitude=` | Open-Meteo weather |
| GET | `/api/risk?latitude=&longitude=` | Wildfire risk analysis |
| POST | `/api/risk` | Risk via JSON body |
| GET | `/api/reports` | List community reports |
| POST | `/api/reports` | Submit new report |
| GET | `/api/reports/:id` | Get single report |
| PATCH | `/api/reports/:id` | Update report status |

---

## Risk Calculation

The risk engine in `backend/src/services/riskService.js` uses a **weighted scoring model**:

| Factor | Weight | Reasoning |
|--------|--------|-----------|
| Temperature | 25% | Higher temps dry out vegetation fuel |
| Humidity | 20% | Low humidity increases fire risk |
| Wind Speed | 20% | Wind spreads fire and supplies oxygen |
| Precipitation | 15% | Recent rain moistens fuel |
| Nearby Fire Activity | 20% | Satellite-detected nearby hotspots |

Output: Score (0–100), Level (LOW/MODERATE/HIGH/EXTREME), human-readable explanations.

---

## Future Machine Learning Integration

The risk engine exposes a clean interface:

```javascript
const { score, level, factors } = predictRisk({
  temperature, humidity, windSpeed, precipitation, nearbyFires
});
```

To replace with a trained ML model (Random Forest, etc.):
1. Train model on historical wildfire datasets
2. Export model (e.g., ONNX or TensorFlow SavedModel)
3. Replace scoring logic inside `riskService.js` while keeping the same `predictRisk(features)` signature
4. No changes needed in any other file

---

## Limitations

- The risk model is a prototype — not validated against historical wildfire data
- NASA FIRMS data has a ~3 hour delay from actual satellite pass
- Free Open-Meteo API has rate limits for very high traffic
- No user authentication (suitable for demo/college purposes)
- No real-time WebSocket updates (uses manual refresh)

---

## Pages

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/dashboard` | Main dashboard |
| `/map` | Interactive fire map |
| `/risk` | Risk prediction tool |
| `/reports` | Fire report list |
| `/report` | Submit fire report |
| `/analytics` | Charts and statistics |
| `/about` | Project information |

---

## Team

Built as a Semester 7 Mini Project — MERN Stack Application
