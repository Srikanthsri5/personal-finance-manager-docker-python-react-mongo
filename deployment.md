# Deployment Plan: FastAPI + React + Docker + MongoDB
### Full DevOps Learning Guide — Personal Use with Mobile Access

---

## How to Use This Document

This guide covers **everything**: from running the app on your laptop and accessing it on your phone, all the way to deploying on a cloud server. Each section explains **why** a step is done, then gives you the **exact commands** to run it. You don't need to do every section — follow the path that matches your current goal.

```
PATH A → Local machine + mobile access (Start here)
PATH B → Single VPS / Cloud Server (Learn production)
PATH C → Managed Cloud Services (AWS, GCP, etc.)
PATH D → Kubernetes (Advanced)
```

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Docker Configuration](#2-docker-configuration)
3. [Environment Variables](#3-environment-variables)
4. [PATH A — Local Machine + Mobile Access](#4-path-a--local-machine--mobile-access)
5. [PATH B — Single VPS Deployment](#5-path-b--single-vps-deployment)
6. [PATH C — Managed Cloud Services](#6-path-c--managed-cloud-services)
7. [PATH D — Kubernetes](#7-path-d--kubernetes)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [SSL & HTTPS](#9-ssl--https)
10. [Security Best Practices](#10-security-best-practices)
11. [Monitoring & Logging](#11-monitoring--logging)
12. [Backup & Recovery](#12-backup--recovery)
13. [Rollback Strategy](#13-rollback-strategy)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Project Structure

**Why this structure?**
Separating frontend, backend, and infra config into their own folders keeps things clean. Docker picks up each `Dockerfile` automatically when you point it to the right folder in `docker-compose.yml`.

```
project-root/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          ← FastAPI app entry point
│   │   ├── models.py        ← MongoDB data models
│   │   ├── routes.py        ← API route handlers
│   │   └── database.py      ← MongoDB connection logic
│   ├── requirements.txt     ← Python dependencies
│   └── Dockerfile           ← How to build the backend image
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json         ← Node dependencies
│   ├── nginx.conf           ← Web server config (serves React + proxies API)
│   └── Dockerfile           ← How to build the frontend image
│
├── docker-compose.yml       ← Dev environment (all services together)
├── docker-compose.prod.yml  ← Production environment
├── .env                     ← Secret values (never commit this!)
├── .env.example             ← Template to share with team / docs
└── .gitignore
```

---

## 2. Docker Configuration

### 2.1 Backend Dockerfile

**Why?**
This file tells Docker how to package your FastAPI app into a container. `python:3.11-slim` is a lightweight base image — "slim" means it strips out unnecessary OS tools to keep the image small.

```dockerfile
# backend/Dockerfile

# Start from an official Python image (slim = smaller size)
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy and install Python dependencies first (Docker caches this layer)
# If requirements.txt hasn't changed, Docker skips reinstalling on next build
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the actual application code
COPY ./app ./app

# Tell Docker this container listens on port 8000
EXPOSE 8000

# Command to run when the container starts
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

> **Key concept — Docker layers:** Each `RUN`, `COPY`, `FROM` line creates a cached layer. Put things that change rarely (like `pip install`) before things that change often (like your app code). This makes rebuilds much faster.

---

### 2.2 Frontend Dockerfile (Multi-stage Build)

**Why multi-stage?**
The first stage uses Node.js to build your React app into static HTML/CSS/JS files. The second stage uses a tiny Nginx web server to serve those files. The final image doesn't include Node.js at all — this makes it much smaller (often 10x smaller).

```dockerfile
# frontend/Dockerfile

# ── STAGE 1: Build the React app ──────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (cached if package.json hasn't changed)
COPY package*.json ./
RUN npm ci

# Copy source code and build for production
COPY . .
RUN npm run build
# Output goes to /app/build


# ── STAGE 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:alpine

# Copy only the built files from Stage 1 (Node.js is left behind)
COPY --from=builder /app/build /usr/share/nginx/html

# Use our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### 2.3 Nginx Configuration

**Why Nginx here?**
Nginx does two things in this setup:
1. Serves the React static files (HTML/CSS/JS)
2. Acts as a **reverse proxy** — when React calls `/api/...`, Nginx forwards that request to the FastAPI backend container. This means the browser only ever talks to one host (Nginx), which avoids CORS issues.

```nginx
# frontend/nginx.conf

server {
    listen 80;
    server_name localhost;

    # Where React's built files live
    root /usr/share/nginx/html;
    index index.html;

    # For React Router — always serve index.html for unknown paths
    # (React handles routing client-side)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Forward API requests to the FastAPI container
    # "backend" here is the Docker service name (Docker's internal DNS)
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Basic security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

### 2.4 Docker Compose — Development

**Why Docker Compose?**
Running `docker run` for each container manually with all the flags is tedious. Docker Compose lets you define all services in one YAML file and start everything with a single command. It also creates a shared network so containers can talk to each other by service name (e.g., `mongodb`, `backend`).

```yaml
# docker-compose.yml

version: '3.8'

services:

  # ── MongoDB ──────────────────────────────────────────────────────────────────
  mongodb:
    image: mongo:7.0               # Use official MongoDB image
    container_name: mongodb
    restart: unless-stopped        # Auto-restart if it crashes, but not if you stop it
    ports:
      - "27017:27017"              # host_port:container_port (expose for local dev tools)
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DATABASE}
    volumes:
      - mongodb_data:/data/db      # Persist data even if container is removed
    networks:
      - app-network

  # ── FastAPI Backend ───────────────────────────────────────────────────────────
  backend:
    build:
      context: ./backend           # Build from the backend/ folder
      dockerfile: Dockerfile
    container_name: fastapi-backend
    restart: unless-stopped
    ports:
      - "8000:8000"                # Expose for local testing/debugging
    environment:
      - MONGO_URL=mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/${MONGO_DATABASE}?authSource=admin
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - mongodb                    # Start MongoDB before backend
    volumes:
      - ./backend/app:/app/app     # Hot reload: code changes reflect without rebuild
    networks:
      - app-network

  # ── React Frontend ────────────────────────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: react-frontend
    restart: unless-stopped
    ports:
      - "80:80"                    # Access at http://localhost or http://YOUR_IP
    depends_on:
      - backend
    networks:
      - app-network

# Named volume — Docker manages this; data survives container removal
volumes:
  mongodb_data:

# All containers share this network so they can reach each other by name
networks:
  app-network:
    driver: bridge
```

---

### 2.5 Docker Compose — Production

**Why a separate prod file?**
Production has different needs: no hot-reload volumes, no exposed internal ports, always-restart policy, and tighter security. Using a separate file keeps dev simple and prod hardened.

```yaml
# docker-compose.prod.yml

version: '3.8'

services:

  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: always                # Always restart, even after server reboot
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DATABASE}
    volumes:
      - mongodb_data:/data/db
      - ./mongo-backup:/backup     # Mount backup folder
    networks:
      - app-network
    # ⚠️ No ports: exposed — MongoDB is only accessible inside Docker network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: fastapi-backend
    restart: always
    environment:
      - MONGO_URL=mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/${MONGO_DATABASE}?authSource=admin
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    depends_on:
      - mongodb
    networks:
      - app-network
    # ⚠️ No ports: exposed — only accessible via Nginx proxy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: react-frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"                  # For HTTPS
    depends_on:
      - backend
    volumes:
      - ./ssl:/etc/nginx/ssl:ro    # SSL certificates (read-only)
    networks:
      - app-network

volumes:
  mongodb_data:

networks:
  app-network:
    driver: bridge
```

---

## 3. Environment Variables

**Why .env files?**
Hard-coding passwords and secrets in code is dangerous — anyone who reads your code sees them. `.env` files keep secrets out of your codebase. The `.env.example` is a safe template you can commit to git.

```bash
# .env.example  ← Commit this to git
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=change_this_password
MONGO_DATABASE=myapp
SECRET_KEY=change_this_secret_key
```

```bash
# .env  ← NEVER commit this to git (add to .gitignore)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=Xk9#mP2$vL8@qR5n
MONGO_DATABASE=myapp
SECRET_KEY=generated_secret_here
```

```bash
# .gitignore
.env
*.env
```

**Generate a secure secret key:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 4. PATH A — Local Machine + Mobile Access

> **Goal:** Run the full stack on your PC and open it on your phone via your home WiFi.

**Why this works:** Your phone and PC on the same WiFi are on the same local network. Your PC gets an IP like `192.168.1.5` and your phone can reach it directly.

### Step 1 — Install Docker Desktop

Download from: https://www.docker.com/products/docker-desktop

Verify:
```bash
docker --version
docker compose version
```

### Step 2 — Set Up Your Project

```bash
# Clone or create your project
git clone https://github.com/yourname/your-project.git
cd your-project

# Create your .env file
cp .env.example .env

# Edit .env with your values (use any text editor)
nano .env
```

### Step 3 — Start Everything

```bash
# Build images and start all containers in the background (-d = detached)
docker compose up -d --build

# Watch the logs as they start up
docker compose logs -f

# Check all containers are running
docker compose ps
```

You should see `mongodb`, `fastapi-backend`, and `react-frontend` all with status `Up`.

### Step 4 — Test on Your Computer First

Open your browser: `http://localhost`

Your React app should load. Try your API: `http://localhost:8000/docs` (FastAPI's auto-generated docs).

### Step 5 — Find Your PC's Local IP

```bash
# Windows
ipconfig
# Look for "IPv4 Address" under your WiFi adapter → e.g., 192.168.1.5

# Mac
ipconfig getifaddr en0

# Linux
ip a | grep "inet " | grep -v 127
```

### Step 6 — Access on Your Phone

1. Connect your phone to the **same WiFi** as your PC
2. Open your phone's browser
3. Type: `http://192.168.1.5` (replace with your actual IP)
4. Your app loads on mobile!

**Tip:** Bookmark it on your home screen for easy access.

### Common Commands

```bash
# Stop everything
docker compose down

# Stop and delete data volumes (full reset)
docker compose down -v

# Restart a single service after code change
docker compose restart backend

# Rebuild and restart one service
docker compose up -d --build backend

# See what's running
docker compose ps

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

---

## 5. PATH B — Single VPS Deployment

> **Goal:** Deploy your app to a cloud server so it's accessible from anywhere, not just your home network.

**Why a VPS?** A VPS (Virtual Private Server) is a rented Linux machine that runs 24/7. Your app stays online even when your PC is off. Good for learning real production deployment.

**Recommended Providers:**
- **Hetzner** — Cheapest, great for learning (€4/month)
- **DigitalOcean** — Easy UI, good docs ($6/month)
- **Linode / Akamai** — Reliable ($5/month)
- **AWS EC2** — Industry standard, more complex (free tier available)

---

### Step 1 — Provision a Server

On any provider, create a new server (called "Droplet" on DigitalOcean, "Instance" on AWS):
- OS: **Ubuntu 22.04 LTS**
- RAM: **2GB minimum** (4GB recommended)
- Storage: 20GB+

You'll get an **IP address** (e.g., `45.12.34.56`) and SSH access.

---

### Step 2 — Connect via SSH

**Why SSH?** SSH (Secure Shell) is an encrypted way to remotely control a server from your terminal. You type commands on your PC, they execute on the server.

```bash
# Connect to your server (replace with your IP and username)
ssh root@45.12.34.56

# If using an SSH key file
ssh -i ~/.ssh/your_key.pem ubuntu@45.12.34.56
```

---

### Step 3 — Server Initial Setup

**Why these steps?** A fresh server needs updates and a non-root user for security. Running everything as root is risky — a mistake can break the whole system.

```bash
# Update all system packages
sudo apt update && sudo apt upgrade -y

# Create a non-root user (replace "deploy" with any username)
adduser deploy
usermod -aG sudo deploy          # Give sudo privileges

# Copy SSH keys to new user so you can log in as them
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Log out and log back in as the new user
exit
ssh deploy@45.12.34.56
```

---

### Step 4 — Install Docker

**Why Docker on the server?** Same reason as locally — it packages your app with all its dependencies so it runs consistently regardless of what else is on the server.

```bash
# Download and run the official Docker install script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to the docker group (so you don't need sudo for docker commands)
sudo usermod -aG docker $USER

# Apply group change (or log out and back in)
newgrp docker

# Verify Docker works
docker run hello-world

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y
docker compose version
```

---

### Step 5 — Configure Firewall

**Why a firewall?** By default, all server ports are open. A firewall (UFW = Uncomplicated Firewall) blocks everything except what you explicitly allow. This stops attackers from accessing MongoDB or other internal services.

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (do this BEFORE enabling, or you'll lock yourself out!)
sudo ufw allow 22/tcp

# Allow web traffic
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Check rules
sudo ufw status verbose
```

> ⚠️ **Always allow SSH before enabling UFW.** If you lock yourself out, you'll need to use your provider's web console to fix it.

---

### Step 6 — Deploy Your App

```bash
# Clone your repository onto the server
git clone https://github.com/yourname/your-project.git
cd your-project

# Create .env with production values
cp .env.example .env
nano .env

# Build and start in production mode
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

Your app is now live at `http://45.12.34.56`!

---

### Step 7 — Domain Name (Optional but Recommended)

**Why a domain?** `http://45.12.34.56` is hard to remember and looks unprofessional. A domain like `myapp.com` is user-friendly and required for HTTPS.

1. Buy a domain from Namecheap, Cloudflare, or Google Domains
2. In your domain's DNS settings, add an **A record**:
   - Type: `A`
   - Name: `@` (or `www`)
   - Value: `45.12.34.56` (your server IP)
   - TTL: 300

DNS changes take 5-30 minutes to propagate.

---

### Step 8 — Update Deployment

When you push new code:

```bash
# On your server
cd your-project
git pull                          # Get latest code
docker compose -f docker-compose.prod.yml up -d --build   # Rebuild and restart
docker system prune -f            # Clean up old unused images
```

---

## 6. PATH C — Managed Cloud Services

> **Goal:** Use cloud provider tools that handle infrastructure for you — no manual server management.

**Why managed services?** With a raw VPS, you manage everything: OS updates, Docker, scaling, backups. Managed services handle those for you in exchange for a higher price. Good for learning cloud-native concepts.

---

### Option C1 — DigitalOcean App Platform

**How it works:** You push code to GitHub, DigitalOcean builds and deploys automatically. No server management.

```bash
# Install DigitalOcean CLI
brew install doctl              # Mac
# or download from: https://github.com/digitalocean/doctl/releases

# Authenticate
doctl auth init

# Deploy from a GitHub repo (configure via their web UI at cloud.digitalocean.com)
# Point it to your repo, set environment variables, done.
```

DigitalOcean App Platform reads your `Dockerfile` and deploys each service. Set env vars in the web UI.

---

### Option C2 — AWS ECS (Elastic Container Service)

**How it works:** AWS runs your Docker containers in a managed cluster. You push images to ECR (like Docker Hub but private), then ECS pulls and runs them.

**Why ECR + ECS?** It's the standard enterprise approach. Learning this is very valuable for job market skills.

```bash
# Install AWS CLI
pip install awscli
aws configure    # Enter your AWS Access Key, Secret, Region

# Step 1: Create an ECR repository for each service
aws ecr create-repository --repository-name myapp-backend
aws ecr create-repository --repository-name myapp-frontend

# Step 2: Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Step 3: Build and tag images
docker build -t myapp-backend ./backend
docker tag myapp-backend:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/myapp-backend:latest

# Step 4: Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/myapp-backend:latest

# Step 5: Create ECS cluster (via AWS console or CLI)
aws ecs create-cluster --cluster-name myapp-cluster

# Then create Task Definitions and Services via AWS Console or Terraform
```

**For MongoDB on AWS:** Use **MongoDB Atlas** (managed MongoDB) or **AWS DocumentDB** instead of running MongoDB yourself in ECS.

---

### Option C3 — Google Cloud Run

**How it works:** Cloud Run runs containers on-demand. You only pay when requests are being processed. Great for personal projects (very cheap / free tier).

```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/myapp-backend ./backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/myapp-frontend ./frontend

# Deploy backend to Cloud Run
gcloud run deploy myapp-backend \
  --image gcr.io/YOUR_PROJECT_ID/myapp-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MONGO_URL=your_mongo_url,SECRET_KEY=your_key

# Deploy frontend
gcloud run deploy myapp-frontend \
  --image gcr.io/YOUR_PROJECT_ID/myapp-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

### Option C4 — Render.com (Easiest)

**How it works:** Connect your GitHub repo, Render detects your Dockerfiles and deploys them. Free tier available.

1. Go to render.com → New → Web Service
2. Connect your GitHub repo
3. Set environment variables
4. Deploy

No CLI needed for basic deployment. Good for starting out.

---

## 7. PATH D — Kubernetes

> **Goal:** Learn container orchestration — the industry-standard way to run applications at scale.

**Why Kubernetes (K8s)?** Kubernetes automates deployment, scaling, and recovery of containers. If one container crashes, K8s restarts it automatically. If traffic spikes, K8s scales up more containers. It's overkill for personal projects but essential knowledge for DevOps careers.

**Key Concepts:**
- **Pod** — Smallest unit; one or more containers running together
- **Deployment** — Defines desired state (e.g., "run 3 copies of backend")
- **Service** — Stable network address for a set of Pods
- **Namespace** — Logical isolation within a cluster
- **ConfigMap / Secret** — Store configuration and sensitive values

---

### Step 1 — Install kubectl and a Local Cluster

```bash
# Install kubectl (Kubernetes CLI)
# Mac
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install minikube (local Kubernetes cluster for learning)
# Mac
brew install minikube

# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start a local cluster
minikube start

# Verify
kubectl get nodes
```

---

### Step 2 — Kubernetes Manifests

**Why YAML manifests?** These files describe the desired state of your cluster. Kubernetes constantly works to match reality to what these files describe.

```yaml
# k8s/mongodb-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
spec:
  replicas: 1                    # Run 1 copy of MongoDB
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: mongo-secret  # Reference a K8s Secret
              key: username
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mongo-secret
              key: password
        volumeMounts:
        - name: mongo-storage
          mountPath: /data/db
      volumes:
      - name: mongo-storage
        persistentVolumeClaim:
          claimName: mongo-pvc   # Persistent storage claim
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
  clusterIP: None               # Headless service (direct Pod DNS)
```

```yaml
# k8s/backend-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi-backend
spec:
  replicas: 2                    # Run 2 copies (redundancy)
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: myapp-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: MONGO_URL
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: mongo-url
        livenessProbe:           # K8s checks this; restarts container if it fails
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
        resources:               # Resource limits prevent one pod from hogging the node
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
```

---

### Step 3 — Create Secrets

**Why K8s Secrets?** Similar to `.env` files but stored in the cluster and injected into Pods at runtime. Never put secrets directly in YAML files.

```bash
# Create a secret for MongoDB credentials
kubectl create secret generic mongo-secret \
  --from-literal=username=admin \
  --from-literal=password=your_secure_password

# Create a secret for app config
kubectl create secret generic app-secret \
  --from-literal=mongo-url="mongodb://admin:your_secure_password@mongodb:27017/myapp?authSource=admin" \
  --from-literal=secret-key="your_secret_key"

# Verify secrets exist (values are base64-encoded)
kubectl get secrets
```

---

### Step 4 — Apply Manifests

```bash
# Deploy everything
kubectl apply -f k8s/

# Watch Pods come up
kubectl get pods --watch

# Check status
kubectl get deployments
kubectl get services

# View logs
kubectl logs -f deployment/fastapi-backend

# Scale up/down manually
kubectl scale deployment fastapi-backend --replicas=3
```

---

### Step 5 — Deploy to a Managed K8s Cluster

For real cloud deployment:

```bash
# DigitalOcean Kubernetes
doctl kubernetes cluster create myapp-cluster --region nyc1 --node-pool "name=worker;size=s-2vcpu-4gb;count=2"
doctl kubernetes cluster kubeconfig save myapp-cluster

# AWS EKS
eksctl create cluster --name myapp --region us-east-1 --nodegroup-name workers --node-type t3.medium --nodes 2

# Google GKE
gcloud container clusters create myapp-cluster --num-nodes=2 --machine-type=e2-medium --region=us-central1
gcloud container clusters get-credentials myapp-cluster --region=us-central1
```

---

## 8. CI/CD Pipeline

**Why CI/CD?** CI (Continuous Integration) automatically tests your code when you push. CD (Continuous Deployment) automatically deploys it if tests pass. This removes human error from the deployment process and makes shipping faster.

**Flow:** Push code → GitHub → GitHub Actions runs → Tests pass → Deploy to server

---

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Build and Deploy

# Trigger: run this workflow when code is pushed to main branch
on:
  push:
    branches: [ main ]

jobs:

  # ── Job 1: Run Tests ──────────────────────────────────────────────────────────
  test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install -r backend/requirements.txt
        pip install pytest

    - name: Run tests
      run: pytest backend/tests/

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install and test frontend
      run: |
        cd frontend
        npm ci
        npm test -- --watchAll=false

  # ── Job 2: Deploy (only runs if tests pass) ───────────────────────────────────
  deploy:
    runs-on: ubuntu-latest
    needs: test                  # Only runs if "test" job succeeded

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    # Copy files to the server via SCP
    - name: Copy files to server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}       # Your server IP (stored in GitHub Secrets)
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}    # Your private SSH key
        source: "."
        target: "/home/deploy/app"

    # SSH into the server and run deploy commands
    - name: Deploy on server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /home/deploy/app
          docker compose -f docker-compose.prod.yml pull
          docker compose -f docker-compose.prod.yml up -d --build
          docker system prune -f
          echo "Deployment complete!"
```

**Setting up GitHub Secrets:**
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add:
   - `SERVER_HOST` → your server IP
   - `SERVER_USERNAME` → `deploy` (or your username)
   - `SSH_PRIVATE_KEY` → content of `~/.ssh/id_rsa` on your machine

---

## 9. SSL & HTTPS

**Why HTTPS?** HTTP sends data in plain text — anyone on the network can read it. HTTPS encrypts traffic. Browsers also show security warnings for HTTP sites. Required for any real deployment.

**How Let's Encrypt works:** It's a free certificate authority. Certbot is a tool that automatically gets and renews certificates from Let's Encrypt.

### Install SSL with Certbot

```bash
# Install Certbot and the Nginx plugin
sudo apt install certbot python3-certbot-nginx -y

# Get a certificate for your domain
# (Your domain's DNS must already point to this server)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will:
# 1. Verify you own the domain (via HTTP challenge)
# 2. Generate the certificate
# 3. Automatically modify your Nginx config to use HTTPS
# 4. Set up HTTP → HTTPS redirect

# Test automatic renewal (certificates expire after 90 days, auto-renew handles this)
sudo certbot renew --dry-run
```

### Nginx Config with SSL

```nginx
# Updated nginx.conf for HTTPS

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 10. Security Best Practices

**Why security matters even for personal projects?** Exposed servers get attacked by automated bots within minutes of going online. Basic security prevents your server from being used for spam, crypto mining, or worse.

### 10.1 SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Make these changes:
PermitRootLogin no              # Never log in as root remotely
PasswordAuthentication no       # Only allow SSH key login (no passwords)
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

> ⚠️ Make sure your SSH key is added to `~/.ssh/authorized_keys` before disabling password login.

### 10.2 MongoDB Hardening

```javascript
// Connect to MongoDB and create an app-only user
// Run this inside: docker exec -it mongodb mongosh -u admin -p yourpassword

use myapp
db.createUser({
  user: "appuser",
  pwd: "another_secure_password",
  roles: [{ role: "readWrite", db: "myapp" }]
})
// This user can only read/write myapp database — can't drop databases or create users
```

```bash
# Update your .env to use the restricted user
MONGO_URL=mongodb://appuser:another_secure_password@mongodb:27017/myapp
```

### 10.3 FastAPI Security

```python
# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS — only allow requests from your domain
# During dev: allow localhost; in production: restrict to your domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "https://yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Health check endpoint (used by K8s and monitoring tools)
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### 10.4 Rate Limiting

**Why?** Prevents someone from spamming your API with thousands of requests per second (DDoS / brute force).

```bash
pip install slowapi
```

```python
# backend/app/main.py

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/items")
@limiter.limit("30/minute")    # Max 30 requests per minute per IP
async def get_items(request: Request):
    return {"items": []}
```

---

## 11. Monitoring & Logging

**Why monitoring?** When something breaks at 3am, you want to know what happened and when. Logs tell you what your app was doing. Metrics tell you how it was performing.

### 11.1 View Docker Logs

```bash
# Live logs from all services
docker compose logs -f

# Logs from a specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# With timestamps
docker compose logs -f -t backend
```

### 11.2 Add Prometheus + Grafana (Optional, for learning)

**Prometheus** scrapes and stores metrics. **Grafana** visualizes them in dashboards.

```yaml
# Add to docker-compose.yml

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    networks:
      - app-network

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"              # 3001 on host (3000 is often used by React dev)
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - app-network
```

```yaml
# prometheus.yml

global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'fastapi'
    static_configs:
      - targets: ['backend:8000']
```

Access Grafana at `http://localhost:3001` — add Prometheus as a data source, then build dashboards.

### 11.3 FastAPI Metrics Endpoint

```bash
pip install prometheus-fastapi-instrumentator
```

```python
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()
Instrumentator().instrument(app).expose(app)
# Now Prometheus can scrape metrics at /metrics
```

---

## 12. Backup & Recovery

**Why backups?** Data loss is permanent. Hard drives fail, mistakes happen, containers get deleted. Backups are your safety net.

### 12.1 Manual MongoDB Backup

```bash
# Create a backup (runs mongodump inside the MongoDB container)
docker exec mongodb mongodump \
  --username=admin \
  --password=your_password \
  --authenticationDatabase=admin \
  --out=/backup/backup_$(date +%Y%m%d_%H%M%S)

# The backup goes to the /backup folder inside the container
# Which is mounted to ./mongo-backup on your host (from docker-compose.prod.yml)
```

### 12.2 Automated Daily Backups

```bash
# Create a backup script
nano /home/deploy/backup.sh
```

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/home/deploy/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="mongodb_$TIMESTAMP"

mkdir -p $BACKUP_DIR

# Run backup inside the container
docker exec mongodb mongodump \
  --username=$MONGO_ROOT_USERNAME \
  --password=$MONGO_ROOT_PASSWORD \
  --authenticationDatabase=admin \
  --out=/tmp/$BACKUP_NAME

# Copy from container to host
docker cp mongodb:/tmp/$BACKUP_NAME $BACKUP_DIR/

# Compress it
tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz -C $BACKUP_DIR $BACKUP_NAME
rm -rf $BACKUP_DIR/$BACKUP_NAME

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_NAME.tar.gz"
```

```bash
# Make it executable
chmod +x /home/deploy/backup.sh

# Schedule it to run every day at 2 AM
crontab -e
# Add this line:
0 2 * * * /home/deploy/backup.sh >> /home/deploy/backup.log 2>&1
```

### 12.3 Restore from Backup

```bash
# Extract the backup
tar -xzf backups/mongodb_20240101_020000.tar.gz -C /tmp/

# Copy into container
docker cp /tmp/mongodb_20240101_020000 mongodb:/tmp/restore

# Run mongorestore
docker exec mongodb mongorestore \
  --username=admin \
  --password=your_password \
  --authenticationDatabase=admin \
  --drop \                        # --drop replaces existing data
  /tmp/restore
```

---

## 13. Rollback Strategy

**Why plan for rollback?** Deployments can break things. Having a tested rollback process means you can recover in minutes instead of hours.

### 13.1 Git-Based Rollback

```bash
# See recent commits
git log --oneline -10

# Roll back to a specific commit
git checkout abc1234

# Redeploy
docker compose -f docker-compose.prod.yml up -d --build
```

### 13.2 Docker Image Tags

```bash
# Before deploying, tag the current running images as "backup"
docker tag myapp-backend:latest myapp-backend:backup
docker tag myapp-frontend:latest myapp-frontend:backup

# Deploy new version
docker compose -f docker-compose.prod.yml up -d --build

# If something's wrong, rollback to backup
docker tag myapp-backend:backup myapp-backend:latest
docker tag myapp-frontend:backup myapp-frontend:latest
docker compose -f docker-compose.prod.yml up -d
```

### 13.3 Zero-Downtime Deployment (Advanced)

```bash
# Start new container alongside old one, then switch traffic
docker compose -f docker-compose.prod.yml up -d --no-deps --build backend
# Old backend container keeps running until new one is healthy
# Nginx keeps routing to old container until health check passes
```

---

## 14. Troubleshooting

### Container Won't Start

```bash
# Check what went wrong
docker compose logs backend

# Inspect the container
docker inspect fastapi-backend

# Check if port is already in use
sudo lsof -i :8000
sudo lsof -i :80

# Kill process using the port
sudo kill -9 <PID>
```

### Can't Connect to MongoDB

```bash
# Enter the MongoDB container and test connection
docker exec -it mongodb mongosh -u admin -p yourpassword

# Check if backend can reach MongoDB
docker exec fastapi-backend ping mongodb

# Check environment variables inside container
docker exec fastapi-backend env | grep MONGO
```

### Phone Can't Access the App

```bash
# Verify your PC's IP
ipconfig        # Windows
ip a            # Linux/Mac

# Make sure Docker is binding to 0.0.0.0 (all interfaces), not just localhost
# In docker-compose.yml, "80:80" binds to all interfaces by default
# "127.0.0.1:80:80" would bind only to localhost — change this if set

# Check firewall (Windows Defender may block local network access)
# On Windows: allow Docker in Windows Firewall settings
```

### Out of Disk Space

```bash
# See disk usage
df -h

# See Docker disk usage breakdown
docker system df

# Clean up unused Docker resources (images, containers, networks, build cache)
docker system prune -a

# Remove unused volumes (WARNING: deletes data in unnamed volumes)
docker volume prune
```

### High Memory / CPU Usage

```bash
# See resource usage per container (live, like Task Manager)
docker stats

# Limit resources in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

---

## Quick Reference Card

```bash
# ── Daily Commands ────────────────────────────────────────────────────────────

docker compose up -d              # Start all services (background)
docker compose down               # Stop all services
docker compose ps                 # List running containers
docker compose logs -f            # Follow all logs
docker compose logs -f backend    # Follow backend logs only
docker compose restart backend    # Restart one service
docker compose exec backend bash  # Open shell inside container

# ── Build & Deploy ────────────────────────────────────────────────────────────

docker compose up -d --build             # Rebuild and start
docker compose build --no-cache          # Force full rebuild
docker system prune -f                   # Clean unused images/containers

# ── Production ────────────────────────────────────────────────────────────────

docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down

# ── Kubernetes ────────────────────────────────────────────────────────────────

kubectl apply -f k8s/             # Deploy all manifests
kubectl get pods                  # List pods
kubectl get services              # List services
kubectl logs -f deployment/backend
kubectl scale deployment backend --replicas=3
kubectl rollout undo deployment/backend    # Rollback
```

---

*Last updated: February 2026 | FastAPI + React + Docker + MongoDB Personal Deployment Guide*