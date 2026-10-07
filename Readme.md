# Dockerized Node.js & MongoDB Application

A lightweight Express backend connected to a MongoDB database, containerized using Docker and orchestrated using Docker Compose with live file-sync via Docker Compose Watch.

---

## 🚀 Quick Start with Docker Compose

### Standard Mode:
```bash
# Start all services in the background (detached mode) and build if needed
docker compose up -d --build
```

### Live Development Mode (with Docker Compose Watch):
```bash
# Automatically syncs code edits and rebuilds on dependency updates in real-time
docker compose up --watch
```

### Stop & Cleanup:
```bash
# Stop and remove containers and networks
docker compose down

# Stop and remove containers, networks, AND volumes (erases persistent DB data)
docker compose down -v
```

---

## 📄 Docker Compose File (`docker-compose.yaml`)

```yaml
services:
  backend:
    build: .
    container_name: backend_app
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      CONNECTION_STRING: mongodb://mongo_container:27017
    depends_on:
      - mongodb
    develop:
      watch:
        - action: sync
          path: ./routes
          target: /app/routes
        - action: rebuild
          path: ./package.json

  mongodb:
    image: mongo
    container_name: mongo_container
    ports:
      - "27017:27017"
    volumes:
      - vasu-volume:/data/db

volumes:
  vasu-volume:
```

---

## 🔍 Line-by-Line Breakdown of `docker-compose.yaml`

| Line(s) | Code Snippet | What It Does & Why It Is Used |
| :--- | :--- | :--- |
| **1** | `services:` | Defines the root section for all application containers (services) managed by Docker Compose. |
| **2** | `backend:` | The user-defined service name for the Node.js API container. Serves as a DNS hostname on the internal network. |
| **3** | `build: .` | Builds the Docker image from the `Dockerfile` in the current directory (`.`) instead of pulling from Docker Hub. |
| **4** | `container_name: backend_app` | Assigns a predictable name (`backend_app`) to the running container rather than an auto-generated one (`docker-learn_backend_1`). |
| **5-6** | `ports:`<br>`- "3000:3000"` | **Port Mapping (`HOST:CONTAINER`)**: Forwards traffic from port `3000` on your host machine to port `3000` inside the container (`http://localhost:3000`). |
| **7-9** | `environment:`<br>`PORT: 3000`<br>`CONNECTION_STRING: ...` | Injects runtime environment variables. Configures Mongoose to connect to `mongodb://mongo_container:27017`. |
| **10-11** | `depends_on:`<br>`- mongodb` | Controls container startup sequence: ensures the `mongodb` container is created and started before `backend` starts. |
| **12-13** | `develop:`<br>`watch:` | **Docker Compose Watch**: Defines developer-mode live file watching rules inside the `backend` service. |
| **14-16** | `- action: sync`<br>`path: ./routes`<br>`target: /app/routes` | **File Sync Rule**: Monitors host folder `./routes`. Whenever a file in `./routes` is created or modified, it is **instantly copied** to `/app/routes` in the container without rebuilding the image. |
| **17-18** | `- action: rebuild`<br>`path: ./package.json` | **Image Rebuild Rule**: Monitors `./package.json`. If a new npm package is installed or dependencies change, Compose automatically **rebuilds the image** (`npm install`) and restarts the container. |
| **20** | `mongodb:` | The user-defined service name for the database container. |
| **21** | `image: mongo` | Uses the official prebuilt `mongo` image from Docker Hub. |
| **22** | `container_name: mongo_container` | Explicitly names the container `mongo_container`. Matches the hostname used in `CONNECTION_STRING`. |
| **23-24** | `ports:`<br>`- "27017:27017"` | Exposes MongoDB's default port (`27017`) to the host for tools like MongoDB Compass. |
| **25-26** | `volumes:`<br>`- vasu-volume:/data/db` | Mounts the named volume `vasu-volume` to `/data/db` inside MongoDB so data persists across container lifecycles. |
| **28-29** | `volumes:`<br>`vasu-volume:` | Top-level volume declaration. Tells Docker engine to allocate and manage the standalone persistent volume. |

---

## 💾 Docker Volumes: Creation, Attachment & Management

Containers are ephemeral by default — if a container is stopped and deleted (`docker rm`), all data written inside it disappears. **Docker Volumes** decouple data storage from the container lifecycle.

### 📦 Step-by-Step: Creating & Using Volumes via Docker CLI

#### Step 1: Create a Named Volume
```bash
docker volume create vasu-volume
```

#### Step 2: Verify & List Existing Volumes
```bash
docker volume ls
```

#### Step 3: Inspect Volume Details (Host Storage Location)
```bash
docker volume inspect vasu-volume
```
*Output snippet:*
```json
[
  {
    "CreatedAt": "2026-10-07T12:00:00Z",
    "Driver": "local",
    "Mountpoint": "/var/lib/docker/volumes/vasu-volume/_data",
    "Name": "vasu-volume",
    "Scope": "local"
  }
]
```

#### Step 4: Attach the Volume to a Container
Use the `-v <volume_name>:<container_path>` flag:
```bash
docker run -d \
  --name mongo-container \
  -p 27017:27017 \
  -v vasu-volume:/data/db \
  mongo
```

#### Step 5: Test Data Persistence
1. Insert some records through the API or Mongo shell.
2. Stop and delete the container:
   ```bash
   docker stop mongo-container && docker rm mongo-container
   ```
3. Start a brand new container mounting the **same volume**:
   ```bash
   docker run -d --name mongo-container -p 27017:27017 -v vasu-volume:/data/db mongo
   ```
4. Query the database — **all previous records are preserved!**

#### Step 6: Remove / Clean Up Volumes
```bash
# Remove a specific unused volume
docker volume rm vasu-volume

# Remove all unused (dangling) volumes across the system
docker volume prune
```

---

### 📦 Step-by-Step: Creating Volumes in Docker Compose

When using Docker Compose, you don't even need to run `docker volume create` manually!

1. Declare the volume at the top level:
   ```yaml
   volumes:
     vasu-volume:
   ```
2. Mount the volume under the service:
   ```yaml
   services:
     mongodb:
       image: mongo
       volumes:
         - vasu-volume:/data/db
   ```
3. Run `docker compose up -d` — Docker Compose will **automatically create** `<project_name>_vasu-volume` if it doesn't already exist.
4. **Volume Lifecycle in Compose**:
   - `docker compose down` leaves the volume intact (safe for restarts).
   - `docker compose down -v` deletes containers **AND the volume** (use when you want a fresh, empty DB).

---

### 🗂️ Summary of Docker Storage Types

| Type | Syntax Example | Stored On Host | Best Used For |
| :--- | :--- | :--- | :--- |
| **Named Volume** | `-v vasu-volume:/data/db` | Docker-managed internal storage (`/var/lib/docker/volumes/`) | Databases (MongoDB, Postgres, MySQL) and persistent production data. |
| **Bind Mount** | `-v ./routes:/app/routes` | Explicit directory on your host machine | Local source code during live development. |
| **Anonymous Volume** | `-v /data/db` | Generated random hash folder | Temporary storage where volume name doesn't matter. |
| **tmpfs Mount** | `--tmpfs /tmp` | Host system RAM (never written to disk) | Sensitive tokens, session secrets, or ultra-fast scratch data. |

---

## ⚡ Docker Compose Watch (`develop.watch`) Explained

**Docker Compose Watch** (introduced in Docker Compose v2.22+) provides a modern, high-performance developer experience for live code editing without mounting slow host bind-mounts or manually rebuilding images.

```
 [ Developer edits ./routes/user.js ]
                  │
                  ▼
   [ Docker Compose Watch Daemon ]
                  │
     action: sync │ (Instant copy into container)
                  ▼
 [ /app/routes/user.js inside backend_app ]
```

### The 3 Watch Actions:

| Action | Description | Best Used For |
| :--- | :--- | :--- |
| `action: sync` | Instantly copies changed files from the host `path` to the container `target` in real-time. No container restart. | Static assets, route handlers, front-end assets, or backend apps running with live-reload (e.g., `nodemon`). |
| `action: sync+restart` | Syncs files into the container and immediately restarts the container process. | Backend servers (e.g. Node/Express, Python/Flask) running without a file-watcher like `nodemon`. |
| `action: rebuild` | Rebuilds the entire Docker image from scratch and replaces the running container with the new version. | Dependency configuration files (`package.json`, `package-lock.json`, `requirements.txt`, `Dockerfile`). |

### How to use Compose Watch:
```bash
# Start services with watch mode enabled:
docker compose up --watch

# Or start services first in detached mode, then run watch:
docker compose up -d
docker compose watch
```

---

## 🌐 Docker Compose Networking Explained

Docker Compose makes inter-container communication effortless through **automatic internal networking and DNS resolution**.

### 1. Automatic Default Network Creation
- When you run `docker compose up`, Compose automatically creates a single default bridge network (named `<project-folder>_default`).
- Every service listed under `services:` is automatically joined to this shared network.
- You **do not need** to manually run `docker network create`.

### 2. Automatic DNS Service Discovery
- Containers on the Compose network can discover and communicate with each other using:
  1. **The Service Name** (e.g., `mongodb` -> `mongodb://mongodb:27017`)
  2. **The Custom Container Name** (e.g., `mongo_container` -> `mongodb://mongo_container:27017`)
- Docker's embedded DNS server automatically translates these names to the container's private internal IP.

```
       [ Host Machine / Browser / Postman ]
                        │
                        │ (Port 3000:3000)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Docker Compose Network (`docker-learn_default`)             │
│                                                             │
│   ┌─────────────────────┐       mongodb://mongo_container   │
│   │   backend_app       │ ────────────────────────────────► │
│   │   (Node.js / Express)│                                   │
│   └─────────────────────┘                                   │
│                                      ┌────────────────────┐ │
│                                      │  mongo_container   │ │
│                                      │  (MongoDB Database)│ │
│                                      └─────────┬──────────┘ │
└────────────────────────────────────────────────┼────────────┘
                                                 │
                                           Persists to:
                                        [ vasu-volume ]
```

### 3. Why `localhost` Does NOT Work Between Containers
- Inside `backend_app`, `localhost` points strictly to the loopback interface of the `backend_app` container itself.
- It does **not** point to the host machine, nor does it point to `mongo_container`.
- Hence, always use service or container names (`mongodb` or `mongo_container`) when connecting across containers.

---

## 🧰 Docker Compose Commands Cheat Sheet

| Command | Description |
| :--- | :--- |
| `docker compose up` | Starts all services in the foreground (shows all container logs). |
| `docker compose up -d` | Starts all services in detached (background) mode. |
| `docker compose up --watch` | Starts all services and activates real-time file watch and sync. |
| `docker compose watch` | Attaches file watcher to already-running compose services. |
| `docker compose up -d --build` | Rebuilds images before starting containers (use after modifying source code or `Dockerfile`). |
| `docker compose down` | Stops and removes containers, networks, and images created by `up`. |
| `docker compose down -v` | Stops containers and also **removes named volumes** (resets database). |
| `docker compose ps` | Lists the status of containers managed by the current compose file. |
| `docker compose logs -f` | Follows real-time logs from all services. |
| `docker compose logs -f backend` | Follows logs only for the `backend` service. |
| `docker compose restart` | Restarts all running services. |
| `docker compose restart backend` | Restarts only the `backend` service. |
| `docker compose exec backend sh` | Opens an interactive shell inside the `backend` container. |
| `docker compose config` | Validates and views the resolved Docker Compose configuration. |

> **Note**: Docker Compose V2 uses `docker compose` (with a space), which is integrated into the Docker CLI. The legacy standalone version was `docker-compose` (with a hyphen).

---

## ⚡ Manual Docker CLI Workflow (Without Compose)

For comparison and understanding the underlying CLI operations:

### 1. Create Network (First-time setup)
```bash
docker network create first-network
```

### 2. Create Volume (For persistent DB data)
```bash
docker volume create vasu-volume
```

### 3. Build Backend Docker Image
```bash
docker build -t node-backend:1.1 .
```

### 4. Run MongoDB Container with Volume
```bash
docker run -d -p 27017:27017 -v vasu-volume:/data/db --name mongo-backend --network first-network mongo
```

### 5. Run Node.js Backend Container
```bash
docker run -d --name app-backend --env-file .env -p 3000:3000 --network first-network node-backend:1.1
```

---

## 🐳 Dockerfile & Layer Caching Notes

```dockerfile
FROM node:latest

WORKDIR /app

# --- Layer Caching Optimization ---
# Copy package files first and run npm install
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
RUN npm install 

# Copy source code only after dependencies are installed
COPY . .

EXPOSE 3000  

CMD ["npm", "start"]
```

### Why order matters (Layer Caching):
- Each instruction (`COPY`, `RUN`, etc.) creates an intermediate image layer.
- Docker caches layers. If `package.json` has not changed, Docker skips `RUN npm install` and uses the cached layer, drastically speeding up build times.
- `EXPOSE 3000` documents the intended listening port (metadata only).
- `CMD ["npm", "start"]` defines the default executable instruction when the container boots.

---

## 📡 API Endpoints

Base URL: `http://localhost:3000/api`

### 1. Create User
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/user`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "username": "john_doe",
    "password": "secretpassword"
  }
  ```
- **Response** `(201 Created)`:
  ```json
  {
    "message": "user created successfully"
  }
  ```

### 2. Get All Users
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/allusers`
- **Response** `(200 OK)`:
  ```json
  {
    "data": [
      {
        "_id": "...",
        "username": "john_doe",
        "password": "secretpassword",
        "__v": 0
      }
    ],
    "error": ""
  }
  ```

---

## 🛠️ General Docker CLI Commands

| Action | Command |
| :--- | :--- |
| Check running containers | `docker ps` |
| Check all containers (including stopped) | `docker ps -a` |
| View container logs | `docker logs -f <container_name_or_id>` |
| Inspect network | `docker network inspect <network_name>` |
| List volumes | `docker volume ls` |
| Inspect volume | `docker volume inspect vasu-volume` |
| Remove specific volume | `docker volume rm vasu-volume` |
| Remove all unused volumes | `docker volume prune` |
| Stop a container | `docker stop <container_name_or_id>` |
| Remove a container | `docker rm <container_name_or_id>` |
| List local images | `docker images` |
| Remove an image | `docker rmi <image_name_or_id>` |
