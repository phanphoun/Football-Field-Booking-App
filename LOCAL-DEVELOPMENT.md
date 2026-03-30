# Local Development & Testing with Docker Compose

Before deploying to AWS, test your application locally using Docker Compose.

## Prerequisites

- Docker Desktop installed (includes docker-compose)
- Git
- AWS CLI configured (optional, for AWS deployment after testing)

## Quick Start (5 minutes)

```bash
# Navigate to project root
cd Football-Field-Booking-App

# Create .env for local development
cp .env.example .env

# Edit .env with local values:
# NODE_ENV=development
# DB_HOST=db
# DB_PASSWORD=dev_password
# JWT_SECRET=dev_secret_32_chars_minimum_here
# REDIS_URL=redis://redis:6379 (optional)

# Start all services
docker-compose up

# Wait for "listening on port 5000" message
# Application will be available at: http://localhost
```

## Service Details

### Services Running

```
Frontend: http://localhost
Backend API: http://localhost:5000
MySQL Database: localhost:3306
```

### Service Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend (Nginx) | 80 | http://localhost | React app |
| Backend (Node.js) | 5000 | http://localhost:5000/api | API endpoints |
| MySQL | 3306 | localhost:3306 | Database |

## Development Workflow

### 1. Start Services
```bash
docker-compose up
```

### 2. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### 3. Stop Services
```bash
docker-compose down

# Stop and remove volumes (clean database)
docker-compose down -v
```

### 4. Rebuild Images
```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

## Testing Features

### Run Backend Tests
```bash
docker-compose exec backend npm test
```

### Run Frontend Tests
```bash
docker-compose exec frontend npm test
```

### Database Commands
```bash
# Access MySQL CLI
docker-compose exec db mysql -u appuser -p football_booking_db

# Run migrations
docker-compose exec backend npm run db:create

# Seed database
docker-compose exec backend npm run seed
```

### API Health Check
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# List available endpoints (if implemented)
curl http://localhost:5000/api/
```

## Development Tips

### Hot Reload (Backend)
The backend uses `nodemon` in development. Changes to files auto-restart the server.

### Hot Reload (Frontend)
The frontend uses React's development server. Changes auto-refresh in browser.

### Access MySQL Directly
```bash
# Connect with MySQL Workbench
# Host: localhost
# Port: 3306
# Username: appuser
# Password: appuser_password (from .env)
# Database: football_booking_db
```

### Debug Mode
Add `DEBUG=express:*` to see detailed logs:
```bash
DEBUG=express:* docker-compose up
```

### Check Container Health
```bash
docker-compose ps

# Output:
# NAME          COMMAND        STATE      PORTS
# football_db   "docker-entrypoint" Up  3306/tcp
# football_backend   "node server.js"   Up  5000/tcp
# football_frontend  "nginx"            Up  80/tcp
```

## Common Development Tasks

### Install New Backend Dependency
```bash
docker-compose exec backend npm install package-name
```

### Install New Frontend Dependency
```bash
docker-compose exec frontend npm install package-name
```

### Reset Database
```bash
# Remove volume and restart
docker-compose down -v
docker-compose up
```

### View Environment Variables
```bash
docker-compose exec backend env | grep DB
docker-compose exec frontend env | grep REACT_APP
```

### Execute Custom Commands
```bash
# Run arbitrary backend command
docker-compose exec backend node -e "console.log(process.env.JWT_SECRET)"

# Run arbitrary frontend command
docker-compose exec frontend npm run lint
```

## Troubleshooting

### Port Already in Use
```bash
# If port 80, 3306, or 5000 in use:
# Option 1: Kill the process
lsof -ti:80 | xargs kill -9

# Option 2: Change ports in docker-compose.yml
# Change ports: ["8080:80"] for frontend, etc.
```

### Database Connection Error
```bash
# Wait a bit longer (MySQL takes time to start)
# Or check logs:
docker-compose logs db

# Reset with fresh database:
docker-compose down -v
docker-compose up
```

### Frontend Can't Connect to Backend
```bash
# Check backend is running:
curl http://localhost:5000/api/health

# Check frontend environment:
docker-compose exec frontend env | grep REACT_APP_API_URL

# Should be: REACT_APP_API_URL=/api or http://backend:5000/api
```

### Memory Issues
```bash
# Increase Docker memory in Docker Desktop settings
# Settings → Resources → Memory: 4GB or more recommended
```

### Containers Won't Stop
```bash
# Force stop
docker-compose kill

# Remove all containers
docker-compose down -v --remove-orphans
```

## Database Seeding

### Load Sample Data
```bash
docker-compose exec backend npm run seed

# This creates:
# - Sample users (player, captain, owner, admin)
# - Sample fields
# - Sample teams
# - Sample bookings
```

### Reset to Clean State
```bash
docker-compose down -v
docker-compose up
docker-compose exec backend npm run db:create
```

## Performance Tuning

### Increase Resource Limits
Edit `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Enable Database Query Logging
Set `DEBUG` environment variable:
```bash
DEBUG=sequelize:* docker-compose up backend
```

## Integration Testing

### Test Full User Flow
```bash
# 1. Start services
docker-compose up -d

# 2. Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123",
    "name":"Test User"
  }'

# 3. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }'

# 4. Browse frontend
# Open http://localhost in browser
```

## CI/CD Local Testing

### Test Docker Build
```bash
# Simulate production build
docker build -t football-booking-backend:test ./backend
docker build -t football-booking-frontend:test ./frontend

# Run tests
docker run --rm football-booking-backend:test npm test
```

### Test Production Images
```bash
# Stop dev containers
docker-compose down

# Build production images
docker build -t football-booking-backend:prod ./backend
docker build -t football-booking-frontend:prod ./frontend

# Test run (can't easily run with docker-compose without DB)
docker run --rm football-booking-backend:prod node server.js
```

## Cleanup

### Remove All Containers and Volumes
```bash
docker-compose down -v --remove-orphans
```

### Clean Up Docker Resources
```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove all unused resources
docker system prune -a
```

## Next Steps

After testing locally:

1. **Verify everything works** - Register, login, create resources
2. **Check logs** for any errors
3. **Test database** operations
4. **Review application** in browser

Then proceed to **[AWS-QUICK-START.md](./AWS-QUICK-START.md)** for AWS deployment.

## Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
- [Node.js Docker Image](https://hub.docker.com/_/node)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

---

**Happy local development!** 🐳

Once you've tested locally, you're ready for AWS deployment!
