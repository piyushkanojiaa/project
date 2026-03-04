# Orbital Guard AI - Docker Deployment Guide

## 🐳 Quick Start

### Prerequisites
- Docker Desktop installed
- Docker Compose V2+

### One-Command Deployment

```bash
# Start the entire system
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the system
docker-compose down
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

---

## 📦 Architecture

```
┌─────────────────────────────────────────┐
│         Docker Compose Stack            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐ │
│  │   Frontend   │    │   Backend    │ │
│  │   (nginx)    │───▶│   (Python)   │ │
│  │   Port 3000  │    │   Port 8000  │ │
│  └──────────────┘    └──────────────┘ │
│         │                    │         │
│         └────────┬───────────┘         │
│                  │                     │
│         ┌────────▼────────┐            │
│         │   TLE Cache     │            │
│         │   (Volume)      │            │
│         └─────────────────┘            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 Container Details

### Backend Container
- **Base**: python:3.11-slim
- **Server**: Uvicorn (ASGI)
- **Port**: 8000
- **Health Check**: /api/health endpoint
- **Features**:
  - FastAPI REST API
  - WebSocket support
  - Live TLE data fetching
  - ML predictions
  - Conjunction analysis

### Frontend Container
- **Build**: Node 18 (multi-stage)
- **Serve**: nginx:alpine
- **Port**: 3000
- **Features**:
  - React SPA
  - Gzip compression
  - API/WebSocket proxy
  - Static asset caching
  - Security headers

---

## 🚀 Commands

### Development
```bash
# Build images
docker-compose build

# Start with rebuild
docker-compose up --build

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Production
```bash
# Start in detached mode
docker-compose up -d

# Check status
docker-compose ps

# View resource usage
docker stats
```

### Maintenance
```bash
# Restart services
docker-compose restart

# Stop and remove containers
docker-compose down

# Remove volumes too
docker-compose down -v

# Update and restart
docker-compose pull
docker-compose up -d
```

---

## 📊 Health Checks

Both services include health checks that monitor:
- **Backend**: HTTP GET to /api/health (every 30s)
- **Frontend**: HTTP GET to / (every 30s)

View health status:
```bash
docker-compose ps
```

---

## 🔐 Environment Variables

### Backend (.env)
```env
PYTHONUNBUFFERED=1
TLE_CACHE_DIR=/app/tle_cache
```

### Frontend
Configured in nginx.conf for API proxying.

---

## 📁 Volumes

### TLE Cache Volume
- **Purpose**: Persist downloaded satellite data
- **Location**: Docker managed volume
- **Refresh**: Every 6 hours automatically

Inspect volume:
```bash
docker volume inspect space-debris-ai_tle_cache
```

---

## 🌐 Networking

### Internal Network
- **Name**: orbital-guard-network
- **Type**: Bridge network
- **Communication**: Frontend → Backend (HTTP/WS)

Services communicate via container names:
```
frontend → http://backend:8000/api/
frontend → ws://backend:8000/ws/
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Port 8000 in use: Stop other services
# - Dependencies failed: docker-compose build --no-cache backend
```

### Frontend won't start
```bash
# Check build logs
docker-compose logs frontend

# Rebuild if needed
docker-compose build --no-cache frontend
```

### Can't connect to API
```bash
# Verify network
docker network inspect space-debris-ai_orbital-guard-network

# Check if backend is healthy
docker-compose ps
```

---

## 📈 Performance

### Resource Limits (add to docker-compose.yml if needed)
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        memory: 512M
```

---

## 🚢 Production Deployment

### Cloud Platforms

**AWS ECS**:
```bash
# Push to ECR
aws ecr get-login-password | docker login --username AWS
docker-compose build
docker tag orbital-guard-backend:latest <account>.ecr.region.amazonaws.com/backend
docker push <account>.ecr.region.amazonaws.com/backend
```

**Google Cloud Run**:
```bash
gcloud builds submit --tag gcr.io/<project>/backend
gcloud run deploy --image gcr.io/<project>/backend
```

**Railway/Render**:
- Connect GitHub repo
- Auto-deploys from docker-compose.yml

---

## ✅ Verification

After deployment, verify:

1. **Backend Health**:
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Frontend Load**:
   ```bash
   curl http://localhost:3000
   ```

3. **WebSocket**:
   ```javascript
   const ws = new WebSocket('ws://localhost:3000/ws/conjunctions');
   ```

4. **API Access**:
   ```bash
   curl http://localhost:3000/api/conjunctions
   ```

---

## 📝 Notes

- **TLE Data**: First run will fetch ~24K satellites (~30 seconds)
- **Build Time**: Initial build ~5-10 minutes
- **Startup Time**: Containers ready in ~30 seconds
- **Memory**: Total system uses ~1.5GB RAM

---

**Status**: ✅ Production-Ready Docker Setup
