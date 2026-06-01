# TaskFlow — Scalability Note

This document outlines the architectural decisions and scaling strategies for the TaskFlow API.

---

## Current Architecture

TaskFlow is a **monolithic REST API** designed to be evolved into a distributed system. The current design already employs patterns that make scaling straightforward.

```
Client → React SPA → Express API → PostgreSQL
```

---

## Horizontal Scaling (Stateless Design)

The API is **fully stateless**. JWT authentication means no server-side session state — any instance can handle any request.

**To scale horizontally today:**
```bash
# Example: Run 4 API instances behind Nginx
docker compose up --scale backend=4
```

Add a **load balancer** (Nginx, AWS ALB, or Caddy) in front:
```nginx
upstream taskflow_api {
  least_conn;
  server backend_1:3001;
  server backend_2:3001;
  server backend_3:3001;
  server backend_4:3001;
}
```

---

## Database Scaling

### Connection Pooling (Immediate)
- **PgBouncer** in front of PostgreSQL handles connection storms
- Prisma supports `DATABASE_URL` with connection pool params: `?connection_limit=10&pool_timeout=20`

### Read Replicas (When needed)
- Route `SELECT` queries to read replicas, writes to primary
- Prisma supports this via `datasource db { url, directUrl }`

### Sharding (Future)
- Tasks can be sharded by `ownerId` (hash-based) when single-DB throughput is insufficient

---

## Caching Strategy (Redis)

```
TODO(scalability): Implement Redis caching for:
  - Rate limiting state (currently in-memory, not shared across instances)
  - Task list responses (cache with user-scoped keys, TTL ~30s)
  - JWT blacklisting on logout (enables true server-side invalidation)
```

Example Redis integration for rate limiting:
```bash
npm install rate-limit-redis ioredis
```
```js
const RedisStore = require('rate-limit-redis');
const rateLimit = require('express-rate-limit');
const redisClient = new Redis(process.env.REDIS_URL);

const limiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

---

## Microservices Migration Path

When the monolith needs to be split:

```
Current Monolith           →   Microservices
─────────────────────────────────────────────
auth.service.js            →   Auth Service (port 3001)
task.service.js            →   Task Service (port 3002)
admin.controller.js        →   Admin Service (port 3003)
```

The existing **service layer** (`/services/`) is already separated from controllers — clean boundaries that make extraction straightforward.

**Message Queue** (for async operations):
- Use **RabbitMQ** or **AWS SQS** for task event notifications (email alerts, audit logs)
- Pattern: Task Service emits `task.created` event → Notification Service consumes it

---

## Deployment Options

### Docker Compose (Current — single server)
```bash
docker compose up -d
```

### Kubernetes (Production)
```yaml
# Simplified k8s deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: taskflow-api
spec:
  replicas: 3        # Horizontal scaling
  selector:
    matchLabels:
      app: taskflow-api
  template:
    spec:
      containers:
        - name: api
          image: taskflow-api:latest
          env:
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:       # Secrets from k8s Secrets / Vault
                  name: taskflow-secrets
                  key: jwt-secret
```

### Managed Cloud (Easiest)
| Layer | AWS | GCP |
|-------|-----|-----|
| API | ECS Fargate / Lambda | Cloud Run |
| DB | RDS PostgreSQL | Cloud SQL |
| Cache | ElastiCache (Redis) | Memorystore |
| Secrets | AWS Secrets Manager | Secret Manager |
| Load Balancer | ALB | Cloud Load Balancing |

---

## API Performance

| Optimization | Status | Notes |
|---|---|---|
| Pagination on all list endpoints | ✅ Done | Max 100 per page |
| Database indexes on `ownerId`, `status`, `priority` | ⬜ TODO | Add via Prisma migration |
| Response compression (gzip) | ⬜ TODO | `npm install compression` |
| HTTP/2 | ⬜ TODO | Via Nginx or CDN |
| Query result caching | ⬜ TODO | Redis TTL cache |

---

## Logging & Observability

- **Winston** structured JSON logging (current)
- **TODO**: Add distributed tracing (OpenTelemetry) for microservices
- **TODO**: Export metrics to Prometheus + Grafana
- **TODO**: Centralized log aggregation (Datadog, CloudWatch, ELK)

---

## Summary

TaskFlow is built **scale-ready** from day one:
- ✅ Stateless JWT (horizontally scalable)
- ✅ Prisma ORM (easy DB migration/scaling)
- ✅ Dockerized (deploy anywhere)
- ✅ Clean service layer (microservices-ready)
- ✅ Rate limiting (DoS protection)
- ⬜ Redis (next step for multi-instance deployments)
- ⬜ Kubernetes (next step for orchestration)
