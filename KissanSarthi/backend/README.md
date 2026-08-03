# KissanSarthi Backend API

Production-ready REST API for the **KissanSarthi** Smart Agriculture Decision Support System.

## Tech Stack

- Node.js + Express.js
- MongoDB (local) + Mongoose
- JWT Authentication (Access + Refresh tokens)
- MVC Architecture (Routes → Controllers → Services → Repositories → Models)
- Security: Helmet, CORS, Rate Limiting, Mongo Sanitization, XSS Protection
- Validation: express-validator
- Logging: Morgan + Winston
- File Upload: Multer
- Realtime: Socket.io (stub for future use)

## Prerequisites

- Node.js 18+
- MongoDB running locally on `mongodb://127.0.0.1:27017`

## Installation

```bash
cd backend
npm install
cp .env.example .env
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection | `mongodb://127.0.0.1:27017/kissansarthi` |
| `JWT_SECRET` | JWT signing secret | — |
| `EMAIL` | Gmail address used for OTP delivery | — |
| `EMAIL_PASSWORD` | Gmail app password | — |
| `EMAIL_USER` | Alternate env key for Gmail address | — |
| `EMAIL_PASS` | Alternate env key for Gmail app password | — |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `OTP_RESEND_COOLDOWN_MS` | OTP resend cooldown | `60000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

## MongoDB Setup

1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB

   # macOS/Linux
   sudo systemctl start mongod
   ```
3. Verify: `mongosh` → `show dbs`

## Seed Database

```bash
npm run seed
```

**Default credentials after seed:**

| Role | Email | Phone | Password |
|------|-------|-------|----------|
| Admin | admin@kissansarthi.com | 9876543210 | Admin@123 |
| Farmer | sahil@kissansarthi.com | 9876543211 | Farmer@123 |
| Farmer | ramesh@kissansarthi.com | 9876543212 | Farmer@123 |

## Run Development

```bash
npm run dev
```

API: `http://localhost:5000/api`  
Health: `http://localhost:5000/api/health`

## Run Production

```bash
NODE_ENV=production npm start
```

## Folder Structure

```
backend/
├── src/
│   ├── config/          # Database, logger, constants
│   ├── controllers/     # HTTP request handlers
│   ├── middlewares/     # Auth, validation, security, upload
│   ├── models/          # Mongoose schemas
│   ├── repositories/    # Database access layer
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── sockets/         # Socket.io handlers
│   ├── utils/           # Helpers, JWT, error classes
│   ├── validators/      # express-validator rules
│   ├── uploads/         # Uploaded files
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── seed/                # Database seeder
├── docs/                # API documentation
├── logs/                # Application logs
├── .env
└── package.json
```

## API Response Format

**Success:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Error:**
```json
{ "success": false, "message": "...", "errors": [] }
```

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user and send OTP |
| POST | `/api/auth/verify-otp` | No | Verify email with 6-digit OTP |
| POST | `/api/auth/resend-otp` | No | Resend verification OTP |
| POST | `/api/auth/login` | No | Login after email verification |
| POST | `/api/auth/forgot-password` | No | Send password reset OTP |
| POST | `/api/auth/verify-reset-otp` | No | Verify password reset OTP |
| POST | `/api/auth/reset-password` | No | Reset password with verified OTP |
| POST | `/api/auth/logout` | Yes | Logout |
| POST | `/api/auth/refresh-token` | Cookie | Refresh access token |
| GET | `/api/auth/profile` | Yes | Get profile |
| PUT | `/api/auth/profile` | Yes | Update profile |

### Dashboard
| GET | `/api/dashboard/summary` | Yes | KPIs, charts, alerts |
| GET | `/api/dashboard/live` | Yes | Live sensor + weather |

### Sensors
| GET/POST | `/api/sensors` | Yes | List / Create |
| PUT/DELETE | `/api/sensors/:id` | Yes | Update / Delete |

### Weather
| GET | `/api/weather?location=` | Optional | 7-day forecast |
| POST | `/api/weather` | Admin | Add weather record |

### Crop
| POST | `/api/crop/recommend` | Yes | AI crop recommendation |
| GET | `/api/crop/history` | Yes | Past recommendations |

### Market
| GET | `/api/market?commodity=&mandi=` | Optional | Price data |
| POST/PUT/DELETE | `/api/market/:id` | Admin | CRUD |

### Fertilizer
| POST | `/api/fertilizer/calculate` | Yes | NPK calculator |
| GET | `/api/fertilizer/history` | Yes | Past calculations |

### Community
| GET/POST | `/api/posts` | Optional/Yes | Feed / Create |
| PUT/DELETE | `/api/posts/:id` | Yes | Update / Delete |
| POST | `/api/posts/:id/like` | Yes | Toggle like |
| POST | `/api/posts/:id/comment` | Yes | Add comment |

### Alerts
| GET | `/api/alerts` | Yes | User alerts |
| POST | `/api/alerts` | Admin | Create alert |
| PUT | `/api/alerts/:id/read` | Yes | Mark as read |

### Chatbot
| POST | `/api/chat` | Yes | Send message |
| GET | `/api/chat/history` | Yes | Chat history |

### Admin
| GET | `/api/admin/users` | Admin | List users |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| GET | `/api/admin/dashboard` | Admin | Admin stats |

## Frontend Integration

In the React frontend root, create `.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Use `src/services/api.js`:

```javascript
import { authAPI, dashboardAPI } from './services/api';

const { data } = await authAPI.login({ emailOrPhone: '9876543211', password: 'Farmer@123' });
localStorage.setItem('accessToken', data.data.accessToken);
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT access (15m) + refresh (7d) tokens
- HttpOnly refresh token cookie
- Role-based authorization (admin/farmer)
- Rate limiting on all routes + stricter on auth
- Input validation on every endpoint
- MongoDB injection & XSS protection

## Future Integrations

- **Weather**: Set `OPENWEATHER_API_KEY` — plug into `weather.service.js`
- **Market**: Set `MANDI_API_KEY` — plug into `market.service.js`
- **Chatbot**: Set `OPENAI_API_KEY` — plug into `chatbot.service.js`
- **Realtime**: Socket.io handlers in `src/sockets/index.js`

## License

MIT
