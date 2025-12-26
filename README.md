# k8s-mini-store

A complete beginner-to-intermediate Kubernetes + Docker project demonstrating a simple counter application with a frontend, API, and Redis backend.

## Architecture

- **Frontend**: Next.js React application with API route proxies
- **API**: Node.js/Express service that manages a counter in Redis
- **Redis**: In-memory data store for the counter value

### Request Flow

1. **Browser** → Next.js Frontend (port 3000)
2. **Next.js API Routes** (`/api/count`, `/api/inc`) → Backend API Service (`http://api:3000`)
3. **Backend API** → Redis Service (`redis:6379`)

## Prerequisites

Before starting, ensure you have the following installed:

- **Docker** (version 20.10+)
- **kubectl** (Kubernetes CLI)
- **kind** (Kubernetes in Docker)

### Installation Quick Reference

**macOS (using Homebrew):**
```bash
brew install docker kubectl kind
```

**Linux:**
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

## Quick Start

### Step 1: Create a Kind Cluster

```bash
kind create cluster --name mini-store
```

Verify the cluster is running:
```bash
kubectl cluster-info --context kind-mini-store
```

### Step 2: Build Docker Images

Build the API image:
```bash
docker build -t mini-api:1 ./api
```

Build the frontend image:
```bash
docker build -t mini-frontend:1 ./frontend
```

**Note**: The frontend uses a multi-stage Docker build for optimized production images. The build process:
1. Installs dependencies
2. Builds the Next.js application
3. Creates a minimal production image with only necessary files

### Step 3: Load Images into Kind

Kind clusters run in containers and can't access your local Docker images directly. Load them:

```bash
kind load docker-image mini-api:1 --name mini-store
kind load docker-image mini-frontend:1 --name mini-store
```

**Note**: 
- You may see "not yet present on node" messages - this is normal and indicates the images are being loaded.
- Redis image (`redis:7-alpine`) will be pulled automatically from Docker Hub when you deploy.
- Verify images are loaded: `docker exec mini-store-control-plane crictl images | grep mini`

### Step 4: Deploy to Kubernetes

Apply all Kubernetes manifests:
```bash
kubectl apply -f k8s/
```

This creates:
- A namespace called `mini-store`
- Redis deployment and service
- API deployment (2 replicas) and service
- Frontend deployment and NodePort service

### Step 5: Verify Deployment

Check that all pods are running:
```bash
kubectl get pods -n mini-store
```

You should see output like:
```
NAME                        READY   STATUS    RESTARTS   AGE
api-xxxxxxxxxx-xxxxx         1/1     Running   0          30s
api-xxxxxxxxxx-xxxxx         1/1     Running   0          30s
frontend-xxxxxxxxxx-xxxxx    1/1     Running   0          30s
redis-xxxxxxxxxx-xxxxx       1/1     Running   0          30s
```

Wait until all pods show `READY 1/1` and `STATUS Running`.

### Step 6: Access the Application

#### Find the NodePort

Get the NodePort assigned to the frontend service:
```bash
kubectl get svc frontend -n mini-store
```

Look for the port mapping like `3000:3XXXX/TCP` where `3XXXX` is your NodePort.

#### Access via Browser

Since kind runs in Docker, you need to forward the port or use port-forward:

**Option 1: Port Forward (Recommended)**
```bash
kubectl port-forward svc/frontend 8080:3000 -n mini-store
```

Then open http://localhost:8080 in your browser.

**Option 2: Direct NodePort (if kind exposes it)**
```bash
# Get the kind container's IP
docker inspect kind-mini-store-control-plane | grep IPAddress

# Access via: http://<IP>:<NodePort>
```

#### Test API Endpoints Directly

Port-forward the API service:
```bash
kubectl port-forward svc/api 3000:3000 -n mini-store
```

Then test in another terminal:
```bash
# Health check
curl http://localhost:3000/healthz

# Get count
curl http://localhost:3000/count

# Increment count
curl -X POST http://localhost:3000/inc
```

## Project Structure

```
k8s-mini-store/
├── api/
│   ├── package.json      # Node.js dependencies (express, redis)
│   ├── index.js          # Entry point
│   ├── src/
│   │   └── server.js     # Express API server
│   ├── Dockerfile        # API container image
│   └── .dockerignore     # Docker ignore patterns
├── frontend/
│   ├── package.json      # Next.js dependencies
│   ├── next.config.js    # Next.js configuration
│   ├── public/           # Static assets directory (required by Next.js)
│   ├── pages/
│   │   ├── _app.js       # Next.js app wrapper
│   │   ├── index.js      # Main React page
│   │   └── api/
│   │       ├── count.js  # API route proxy for /count
│   │       └── inc.js    # API route proxy for /inc
│   ├── Dockerfile        # Next.js production image (multi-stage build)
│   └── .dockerignore     # Docker ignore patterns
├── k8s/
│   ├── namespace.yaml    # Kubernetes namespace
│   ├── redis.yaml        # Redis deployment & service
│   ├── api.yaml          # API deployment & service
│   └── frontend.yaml     # Frontend deployment & service
└── README.md             # This file
```

## API Endpoints

### Backend API (Node.js/Express)

- `GET /healthz` - Health check endpoint (returns `{status: "ok"}`)
- `GET /count` - Get current counter value (returns `{count: <number>}`)
- `POST /inc` - Increment counter (returns `{count: <number>}`)

### Frontend API Routes (Next.js)

The frontend exposes Next.js API routes that proxy to the backend:
- `GET /api/count` - Proxies to backend `/count`
- `POST /api/inc` - Proxies to backend `/inc`

These routes are accessible from the browser and handle the communication with the backend API service.

## Troubleshooting

### Pods Not Starting

**Check pod status:**
```bash
kubectl get pods -n mini-store
kubectl describe pod <pod-name> -n mini-store
kubectl logs <pod-name> -n mini-store
```

**Common issues:**
- **ImagePullBackOff**: Image not found. Ensure you've built and loaded images into kind.
- **CrashLoopBackOff**: Check logs for errors. Common causes: missing env vars, Redis connection issues.
- **Pending**: Check if nodes have resources. Run `kubectl describe node`.

### API Can't Connect to Redis

**Check Redis is running:**
```bash
kubectl get pods -n mini-store | grep redis
kubectl logs <redis-pod-name> -n mini-store
```

**Test Redis connection from API pod:**
```bash
kubectl exec -it <api-pod-name> -n mini-store -- sh
# Inside pod, test Redis connection
```

### Frontend Can't Reach API

**Check API service:**
```bash
kubectl get svc api -n mini-store
kubectl get endpoints api -n mini-store
```

**Test from frontend pod:**
```bash
kubectl exec -it <frontend-pod-name> -n mini-store -- sh
# Inside pod
wget -O- http://api:3000/healthz
# Or test Next.js API routes
wget -O- http://localhost:3000/api/count
```

### Port Forward Not Working

- Ensure the service is running: `kubectl get svc -n mini-store`
- Check if port is already in use: `lsof -i :8080` (macOS/Linux) or `netstat -ano | findstr :8080` (Windows)
- Try a different port: `kubectl port-forward svc/frontend 8081:3000 -n mini-store`
- If port-forward keeps disconnecting, run it in the background or use a tool like `kubectl port-forward` with `--address 0.0.0.0` for network access

### Docker Build Issues

**Frontend build fails with "public directory not found":**
- The `public/` directory is required by Next.js (even if empty)
- It should already exist in the project, but if missing, create it: `mkdir -p frontend/public`

**Images not loading into kind:**
- Verify images exist: `docker images | grep mini`
- Rebuild if needed: `docker build -t mini-api:1 ./api && docker build -t mini-frontend:1 ./frontend`
- Reload into kind: `kind load docker-image mini-api:1 --name mini-store && kind load docker-image mini-frontend:1 --name mini-store`

### Clean Up and Start Fresh

Delete everything and start over:
```bash
kubectl delete namespace mini-store
kind delete cluster --name mini-store
kind create cluster --name mini-store
# Then rebuild images and redeploy
```

## Viewing Your Cluster

### In Docker Desktop

1. Open Docker Desktop
2. Go to the **Containers** tab
3. You'll see `mini-store-control-plane` - this is your kind cluster node
4. Click on it to view logs, exec into it, or inspect it
5. Note: Pods run inside this container, so they won't appear as separate containers

### Using kubectl

```bash
# View all resources
kubectl get all -n mini-store

# View pods with details
kubectl get pods -n mini-store -o wide

# View services
kubectl get svc -n mini-store

# View deployments
kubectl get deployments -n mini-store

# Describe a specific resource
kubectl describe pod <pod-name> -n mini-store
```

### View Pods Inside Kind Container

```bash
# List all containers running in the kind cluster
docker exec mini-store-control-plane crictl ps
```

## Cleanup

To remove the entire setup:

```bash
# Delete Kubernetes resources
kubectl delete namespace mini-store

# Delete the kind cluster
kind delete cluster --name mini-store

# Optional: Remove Docker images
docker rmi mini-api:1 mini-frontend:1
```

## Learning Points

This project demonstrates:

1. **Containerization**: Docker images for each component
2. **Kubernetes Deployments**: Managing application replicas
3. **Services**: Internal networking between pods
4. **Namespaces**: Organizing resources
5. **Health Probes**: Liveness and readiness checks
6. **Resource Management**: CPU and memory limits
7. **Next.js API Routes**: Server-side API proxies
8. **Service Discovery**: Pods finding each other via service names
9. **React Frontend**: Modern React-based UI with Next.js

## Next Steps

- Add ConfigMaps for configuration
- Add Secrets for sensitive data
- Implement horizontal pod autoscaling
- Add ingress controller for external access
- Set up monitoring and logging
- Add CI/CD pipeline

## License

This is a learning project. Feel free to use and modify as needed.

# k8s-docker-project
