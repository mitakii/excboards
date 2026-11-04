# excboards

A place to create, share and collaborate on Excalidraw boards.

- **Boards** — draw on an Excalidraw canvas; scenes autosave, pasted images upload straight to object storage
- **Real-time collaboration** — invite users as viewers or editors and edit together live (SignalR)
- **World board** — one shared public board per month that anyone can draw on
- **Discover** — publish boards, tag them, search boards/users/tags, like and bookmark
- **Accounts** — email/password or Google sign-in, profiles at `/u/<username>`

Live at **https://excb.mitakiilab.com**

## Stack

| Part | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, TanStack Query, Tailwind, `@excalidraw/excalidraw` |
| API | ASP.NET Core (.NET 10), EF Core, SignalR, JWT in httpOnly cookies |
| Workers | .NET worker running Hangfire jobs (orphaned-file cleanup, deleted boards, expired tokens) |
| Data | PostgreSQL, Redis (cache, SignalR backplane, rate limits), S3-compatible storage (Cloudflare R2 in prod, RustFS/MinIO locally), Cloudinary (profile pictures) |
| Deployment | Self-hosted k3s cluster, MetalLB + Traefik ingress, Cloudflare proxy in front, GitHub Actions CI/CD over Tailscale |

```
excboards-api/        backend solution: Domain → Application → Infrastructure → Api, plus Workers and Tests
excboards-frontend/   React app, one folder per feature under src/features/
k8s/                  Kubernetes manifests (kustomize) — see "Deployment"
.github/workflows/    CI/CD pipeline (deploy.yml)
```

## Running locally

**Prerequisites:** .NET 10 SDK, Node 24 (npm 11.21+), Docker.

1. **Start Postgres, Redis and RustFS (S3)**
   ```bash
   cd excboards-api
   docker compose -f docker-compose.local.yml up -d
   ```

2. **Configure the backend** — create `Api/appsettings.Development.json` and `Workers/appsettings.Development.json` (both gitignored). `appsettings.json` lists every key; the ones you must fill in:
   - `ConnectionStrings:DefaultConnection` — e.g. `Host=localhost;Port=5432;Database=excboards_dev;Username=excboards;Password=devpassword`
   - `S3` — `ServiceURL: http://localhost:9000`, the RustFS keys from the compose file, a `BucketName`, `AutoCreateBucket: true`
   - `Redis` — `localhost:6379,abortConnect=false` (optional; without it the API runs single-instance)
   - `JwtOptions` — `Issuer`, `Audience` and a long random `SigningKey`
   - `CloudinarySettings` — `CloudName`, `ApiKey`, `ApiSecret` (the auth/profile endpoints need them to be set)
   - `GoogleAuth:ClientId` — only needed for Google sign-in
   - `Cors:AllowedOrigins` — `["http://localhost:5173"]`

3. **Apply migrations and run the API and workers**
   ```bash
   dotnet tool restore
   dotnet ef database update --project Infrastructure --startup-project Api
   dotnet run --project Api        # http://localhost:5076
   dotnet run --project Workers    # background jobs (separate terminal)
   ```
   Optional: `scripts/seed-dev-data.sh` creates demo users and boards (needs `curl` and `jq`).

4. **Run the frontend**
   ```bash
   cd excboards-frontend
   cp .env.example .env.local      # set VITE_API_BASE_URL, and VITE_GOOGLE_CLIENT_ID for Google sign-in
   npm ci
   npm run dev                     # http://localhost:5173
   ```

**Tests:** `dotnet test excboards-api/Tests/Tests.csproj` · **Lint:** `npm run lint` in `excboards-frontend/`

## Docker images

Backend — one Dockerfile, three targets (run from `excboards-api/`):
```bash
docker build --target api        -t excboards-api .
docker build --target workers    -t excboards-workers .
docker build --target migrations -t excboards-migrations .
docker run --rm excboards-migrations --connection "<postgres connection string>"   # apply migrations
```

Frontend — static build served by nginx on port 8080 (run from `excboards-frontend/`). `VITE_*` values are compiled in, so build one image per environment:
```bash
docker build -t excboards-frontend \
  --build-arg VITE_API_BASE_URL=https://eapi.mitakiilab.com \
  --build-arg VITE_GOOGLE_CLIENT_ID=<client id> .
```

In containers, configure the backend with environment variables (`__` replaces `:`), e.g. `ConnectionStrings__DefaultConnection`, `JwtOptions__SigningKey`, `S3__SecretKey`, `Cors__AllowedOrigins__0`.

**Health endpoints:** API `/health/live` and `/health/ready` (Postgres, Redis, S3) · frontend `/healthz`.

## Deployment

### Architecture

```
 browser
    │ https://excb.mitakiilab.com / https://eapi.mitakiilab.com
    ▼
 Cloudflare (proxied DNS, Always Use HTTPS)
    │ 
    ▼
 router ── port-forward 8443 ──▶ MetalLB IP 192.168.100.240:443
    ▼
 Traefik (k3s ingress, TLS with a Cloudflare Origin CA certificate)
    ├── excb.  ──▶ excboards-frontend  (2 × nginx)
    └── eapi.  ──▶ excboards-api       (2 × ASP.NET Core, sticky sessions for SignalR)
                        │
       excboards-workers (Hangfire) · excboards-redis
                        │
       PostgreSQL (LAN host, outside the cluster) · Cloudflare R2 · Cloudinary
```

- **Cluster:** k3s on machines in one LAN — a master node plus worker nodes. Pods are spread across workers
- **Ingress:** MetalLB (layer 2) gives k3s's bundled Traefik a fixed LAN IP; 
- **Browser uploads** go directly to R2 through pre-signed URLs 
- **Auth cookies** are `Secure`, scoped to `.mitakiilab.com`

### Manifests (`k8s/`)

| Path | Contents |
|---|---|
| `kustomization.yaml` | Namespace, ConfigMap, API, Workers, Frontend, Redis, Ingress; image names/tags |
| `migrations/` | One-off Job running the EF Core migrations bundle |
| `configmap.yaml` | Non-secret settings (JWT issuer/audience, CORS, cookie domain, bucket name, Google client ID) |
| `secret.example.yaml` | — | Template for `excboards-secrets`: DB connection, JWT signing key, R2 endpoint + keys, Cloudinary credentials. The real `secret.yaml` is gitignored and applied by hand. |
| `admin/ci-access.yaml` | Admin, once | `github-actions` ServiceAccount, limited to deploying in the `excboards` namespace |
| `admin/metallb-pool.yaml` | Admin, once | MetalLB address pool for the LAN |

| Workload | Replicas | Notes |
|---|---|---|
| `excboards-api` | 2 | Probes: liveness `/health/live`, readiness `/health/ready`; PodDisruptionBudget; Redis carries SignalR messages and rate limits between replicas |
| `excboards-frontend` | 2 | nginx on 8080, probes on `/healthz` |
| `excboards-workers` | 1 | Hangfire server; Postgres-backed locks keep recurring jobs from running twice |
| `excboards-redis` | 1 | Cache/backplane only, no persistent volume |
| `excboards-migrate` (Job) | — | Runs before every rollout, so API pods never migrate on startup |

All containers run as non-root with a read-only root filesystem (`/tmp` is an `emptyDir`).

### CI/CD (`.github/workflows/deploy.yml`)

On every push to `master`:

1. **Test** — `dotnet test` and frontend `lint` + `build`, in parallel
2. **Build** — four images (`api`, `workers`, `migrations`, `frontend`) pushed to `ghcr.io/mitakii/excboards-*:<commit sha>`
3. **Deploy** — the runner joins the tailnet as `tag:ci` (Tailscale), so the k3s API never has to be exposed to the internet, then:
   runs the migrations Job → `kubectl apply -k k8s/` with the new image tags → waits for every rollout
