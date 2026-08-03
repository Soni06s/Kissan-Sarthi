# KissanSarthi API Documentation

Base URL: `http://localhost:5000/api`

All authenticated requests require header:
```
Authorization: Bearer <accessToken>
```

---

## Auth

### Register
```
POST /auth/register
Body: { name, email, password, phone?, location?, farmSize? }
```

### Login
```
POST /auth/login
Body: { emailOrPhone, password }
Response data: { user, accessToken }
```

### Logout
```
POST /auth/logout
```

### Refresh Token
```
POST /auth/refresh-token
Cookie: refreshToken (httpOnly)
```

### Forgot Password
```
POST /auth/forgot-password
Body: { email }
```

### Reset Password
```
POST /auth/reset-password
Body: { token, password }
```

### Profile
```
GET  /auth/profile
PUT  /auth/profile
Body: { name?, location?, farmSize?, phone?, preferences? }
Multipart: profileImage (file)
```

---

## Dashboard

```
GET /dashboard/summary   — KPIs, charts, alerts, AI insights
GET /dashboard/live      — Latest sensor + weather snapshot
```

---

## Sensors

```
GET    /sensors
POST   /sensors          — { temperature, soilMoisture, nodeId, nitrogen?, ph?, humidity? }
PUT    /sensors/:id
DELETE /sensors/:id
```

---

## Weather

```
GET  /weather?location=Bari Brahmana, J&K
POST /weather            — Admin only
```

---

## Crop Recommendation

```
POST /crop/recommend     — { soilType, season, nitrogen?, temperature?, rainfall? }
GET  /crop/history
```

---

## Market Prices

```
GET    /market?commodity=Wheat&mandi=Samba Mandi
POST   /market           — Admin: { commodity, mandi, price, trend? }
PUT    /market/:id
DELETE /market/:id
```

---

## Fertilizer Calculator

```
POST /fertilizer/calculate  — { crop, stage, soilPH?, deficiency? }
GET  /fertilizer/history
```

---

## Community Posts

```
GET    /posts?page=1
POST   /posts               — { content } + optional image file
PUT    /posts/:id
DELETE /posts/:id
POST   /posts/:id/like
POST   /posts/:id/comment   — { text }
```

---

## Alerts

```
GET  /alerts
POST /alerts                — Admin: { user?, type?, message }
PUT  /alerts/:id/read
```

---

## Chatbot

```
POST /chat                  — { question }
GET  /chat/history
```

---

## Admin

```
GET    /admin/users?page=1
DELETE /admin/users/:id
GET    /admin/dashboard
```

---

## Health Check

```
GET /health
```
