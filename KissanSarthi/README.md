# KissanSarthi 🌾 
### Smart Agriculture Decision Support System

**KissanSarthi** is a professional-grade React application designed to bridge the gap between technology and traditional farming. Developed to provide actionable intelligence to farmers (specifically in the Jammu & Kashmir region), it focuses on farm health, market trends, AI crop recommendations, and a community space.

---

## 🚀 Key Features & Pages

The application is structured into several key pages, accessible via a sidebar and routed through `react-router-dom`:

- **`/` (Dashboard)**: A high-level overview of farm health (Temperature, Soil Moisture, Active Yield, Market Index), live telemetry, system alerts, and AI advisor insights.
- **`/weather` (Smart Weather Forecast)**: Farming-specific weather insights, including irrigation needs and spray windows.
- **`/crop` (AI Crop Advisor)**: Analyzes field parameters (Soil, Season, Nitrogen, Temperature, Rainfall) to recommend the highest yield crop along with agronomic tips.
- **`/market` (Mandi Price Tracker)**: Real-time visualization of commodity prices (Wheat, Rice, Tomato, Onion) across local Mandis with trend analysis.
- **`/fertilizer` (Precision Fertilizer Calculator)**: NPK dosage calculations based on crop growth stages.
- **`/community` (Farmer Community)**: A social space for farmers to share posts, knowledge, and verified agricultural tips.
- **`/admin` (Admin Panel)**: System administration and data management interface.
- **Chatbot (Global)**: An integrated NLP-based KissanBot AI available across all pages to answer farming queries.

---

## 🏗️ Tech Stack & Architecture

- **Frontend Framework**: React.js (Vite)
- **Routing**: `react-router-dom`
- **Styling**: Tailwind CSS & Custom CSS (`index.css`, `App.css`) with a Design System approach (`src/constants/theme.js`).
- **Data Visualization**: `chart.js` and `react-chartjs-2`
- **Animations**: `framer-motion`
- **HTTP Client**: `axios`
- **Icons**: `react-icons`

---

## 📂 Folder Structure

```text
src/
├── components/
│   ├── charts/      # Data visualization components (LineChart, etc.)
│   ├── chat/        # KissanBot AI UI components
│   ├── common/      # Reusable UI Atoms (Cards, Icons, Badges, StatPills)
│   └── layout/      # Application shell (Navbar, Sidebar)
├── constants/       # Global Theme and Navigation config
├── hooks/           # Custom React hooks
├── pages/           # Individual Page Components (Dashboard, Market, Crop, etc.)
├── utils/           # Helper functions, AI logic, mock data
├── App.jsx          # Central Controller & Routing setup
└── main.jsx         # Application Entry Point
```

---

## 🔮 Future Backend Integration Guide

Currently, the application runs entirely on the frontend with mocked data. If you intend to build a backend (e.g., Node.js/Express, Python/Django) in the future, you will only need this README to understand the necessary data models and RESTful API routes.

### 1. Required Data Models (Database Collections/Tables)

- **Users / Farmers**: `id`, `name`, `location`, `farmSize`, `preferences`.
- **Telemetry / Sensor Data**: `nodeId`, `temperature`, `soilMoisture`, `nitrogen`, `pH`, `timestamp`.
- **Weather Forecasts**: `location`, `date`, `temp`, `condition`, `humidity`, `rainfallForecast`.
- **Crop Recommendations**: `soilType`, `season`, `nitrogenRange`, `tempRange`, `rainfallRange` -> `recommendedCrop`, `yield`, `variety`, `tips`.
- **Market Prices**: `commodity`, `mandiName`, `price`, `date`, `trend`.
- **Community Posts**: `id`, `authorId`, `content`, `timestamp`, `likes`, `comments`.
- **Alerts**: `type` (warning/info/success), `message`, `timestamp`, `userId`.

### 2. Proposed API Endpoints

**Dashboard & Telemetry:**
- `GET /api/dashboard/summary` - Fetch top-level KPIs (temp, moisture, active yield, market index).
- `GET /api/sensors/soil` - Fetch historical and live soil health data for charts.
- `GET /api/alerts/active` - Fetch current active alerts for the user's farm.

**Crop Advisor:**
- `POST /api/ai/predict-crop` 
  - *Payload*: `{ soil, season, nitrogen, temp, rainfall }`
  - *Response*: `{ crop, variety, yield, time, confidence, tips[] }`

**Market Data:**
- `GET /api/market/prices?commodity=wheat&mandi=samba` - Fetch historical price data for charts.
- `GET /api/market/summary` - Fetch today's prices for major commodities.

**Community:**
- `GET /api/community/posts` - Fetch the forum feed.
- `POST /api/community/posts` - Create a new post.
- `POST /api/community/posts/:id/comment` - Add a comment to a post.

**Weather:**
- `GET /api/weather/forecast?location=jammu` - Fetch 7-day farming weather forecast.

**Chatbot:**
- `POST /api/chat/message`
  - *Payload*: `{ query: "When to sow wheat?" }`
  - *Response*: `{ reply: "..." }`

---

## 🛠️ Getting Started (Local Development)

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Create backend environment variables** in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/kissansarthi
   JWT_SECRET=your_jwt_secret
   EMAIL=your_gmail_address
   EMAIL_PASSWORD=your_gmail_app_password
   CLIENT_URL=http://localhost:5173
   OTP_RESEND_COOLDOWN_MS=60000
   ```

4. **Start MongoDB** and then run the backend:
   ```bash
   cd backend
   npm run dev
   ```

5. **Start the frontend:**
   ```bash
   npm run dev
   ```

6. **Open the app** and navigate to `/register` for the OTP-based authentication flow.

### Authentication endpoints
- Register: `/api/auth/register`
- Verify OTP: `/api/auth/verify-otp`
- Resend OTP: `/api/auth/resend-otp`
- Login: `/api/auth/login`
- Forgot password: `/api/auth/forgot-password`
- Verify reset OTP: `/api/auth/verify-reset-otp`
- Reset password: `/api/auth/reset-password`

### API documentation
- Backend docs: [backend/README.md](backend/README.md)
- Postman collection: [backend/docs/auth-api-postman.json](backend/docs/auth-api-postman.json)

<!-- NOTE: Set your `MONGO_URI` inside `backend/.env` or in your environment. Do NOT commit credentials. -->