# TaskFlow API

> **Scalable REST API with JWT Auth & Role-Based Access Control**  
> Backend Developer Intern Assignment | Node.js + Express + PostgreSQL + React

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (recommended) **or** PostgreSQL 15+ installed locally

---

### Option A: Docker Compose (Recommended — no PostgreSQL install needed)

```bash
# 1. Clone / navigate to the project
cd assignment/

# 2. Start PostgreSQL via Docker
docker compose up postgres -d

# 3. Set up backend
cd backend
cp .env.example .env
# Generate a strong JWT secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Paste the output as JWT_SECRET in .env

npm install
npx prisma migrate dev --name init
npm run dev
# → API running at http://127.0.0.1:3001

# 4. In a new terminal — set up frontend
cd ../frontend
npm install
npm run dev
# → UI running at http://localhost:5173
```

### Option B: Local PostgreSQL

```bash
# 1. Create database and user
psql -U postgres -c "CREATE USER taskflow_user WITH PASSWORD 'taskflow_pass';"
psql -U postgres -c "CREATE DATABASE taskflow_db OWNER taskflow_user;"

# 2. Backend setup (same as above from step 3)
```

---

## 📋 API Documentation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/health` | None | Health check |
| **Auth** | | | |
| POST   | `/api/v1/auth/register` | None | Register new user |
| POST   | `/api/v1/auth/login` | None | Login, returns JWT |
| GET    | `/api/v1/auth/me` | JWT | Get own profile |
| POST   | `/api/v1/auth/logout` | JWT | Logout |
| **Tasks** | | | |
| GET    | `/api/v1/tasks` | JWT | List tasks (paginated, filterable) |
| POST   | `/api/v1/tasks` | JWT | Create task |
| GET    | `/api/v1/tasks/:id` | JWT | Get task by ID |
| PUT    | `/api/v1/tasks/:id` | JWT | Update task |
| DELETE | `/api/v1/tasks/:id` | JWT | Delete task |
| **Admin** | | | |
| GET    | `/api/v1/admin/users` | JWT + ADMIN | List all users |
| GET    | `/api/v1/admin/tasks` | JWT + ADMIN | List all tasks |
| DELETE | `/api/v1/admin/users/:id` | JWT + ADMIN | Delete user |
| PATCH  | `/api/v1/admin/users/:id/role` | JWT + ADMIN | Update user role |

### Interactive Docs (Swagger UI)
```
http://127.0.0.1:3001/api/docs
```

### Postman Collection
Import `TaskFlow_API.postman_collection.json` into Postman.

---

## 🗄️ Database Schema

```
User
  id           UUID (PK)
  email        String (unique)
  passwordHash String
  role         USER | ADMIN
  createdAt    DateTime
  updatedAt    DateTime

Task
  id           UUID (PK)
  title        String (max 200)
  description  String? (max 2000)
  status       TODO | IN_PROGRESS | DONE
  priority     LOW | MEDIUM | HIGH
  ownerId      UUID → User.id (cascade delete)
  createdAt    DateTime
  updatedAt    DateTime
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt with 12 salt rounds |
| Weak password detection | zxcvbn score ≥ 2 required |
| JWT signing | HS256, hardcoded algorithm |
| JWT secret | 3-tier env/file/random fallback (no hardcoded secrets) |
| JWT storage (frontend) | React in-memory state (NOT localStorage) |
| Token expiry | Configurable (default: 7 days) |
| RBAC | Middleware-enforced role guards |
| Ownership validation | Server-side on every task operation |
| SQL injection | Prevented by Prisma ORM (parameterized queries) |
| XSS | React JSX auto-escaping, no `dangerouslySetInnerHTML` |
| Security headers | Helmet (CSP, HSTS, X-Frame-Options, nosniff) |
| CORS | Strict allowlist, no wildcards |
| Rate limiting | 10/15min (login), 5/hr (register), 100/15min (general) |
| Error handling | Generic messages to client, full details in Winston logs |
| Body size limit | 10kb max to prevent DoS |

---

## 🏗️ Project Structure

```
assignment/
├── backend/
│   ├── prisma/schema.prisma      # Database schema
│   ├── src/
│   │   ├── config/               # DB, Swagger config
│   │   ├── middleware/           # auth, rbac, validate, rateLimit, errorHandler
│   │   ├── routes/v1/            # auth, task, admin routes (Swagger annotated)
│   │   ├── controllers/          # Thin request handlers
│   │   ├── services/             # Business logic + ownership checks
│   │   ├── schemas/              # Zod validation schemas
│   │   ├── utils/                # JWT secret resolver, Winston logger
│   │   └── app.js               # Express app setup
│   └── server.js                # Entry point (localhost:3001)
├── frontend/
│   └── src/
│       ├── api/axiosClient.js    # Axios with in-memory token injection
│       ├── context/AuthContext   # JWT state management
│       ├── components/           # Sidebar, TaskModal, ProtectedRoute
│       └── pages/                # Login, Register, Dashboard, Tasks, Admin
├── docker-compose.yml
├── TaskFlow_API.postman_collection.json
└── SCALABILITY_NOTE.md
```

---

## 🧪 Testing the APIs

### 1. Register & Login
```bash
# Register
curl -X POST http://127.0.0.1:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Str0ngP@ss!"}'

# Login (save the token)
curl -X POST http://127.0.0.1:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Str0ngP@ss!"}'
```

### 2. Create & List Tasks
```bash
export TOKEN="<your-jwt-token>"

curl -X POST http://127.0.0.1:3001/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","priority":"HIGH"}'

curl http://127.0.0.1:3001/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Promote to Admin
```bash
# First, get user IDs from admin panel (requires another ADMIN account)
# Or use Prisma Studio: npx prisma studio
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes (prod) | Min 32-char secret. Auto-generated if missing (dev only) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `PORT` | No | Server port (default: `3001`) |
| `NODE_ENV` | No | `development` \| `production` |
| `ALLOWED_ORIGIN` | No | CORS origin (default: `http://localhost:5173`) |
