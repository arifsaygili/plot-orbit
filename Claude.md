# Claude Project Guide: Plot Orbit

This file summarizes the repo for LLMs (Claude, GPT, etc). Keep it updated when architecture or workflows change.

## Product summary
- Multi-tenant web app that turns KML/KMZ + Cesium orbit renders into recorded videos.
- Users register/login, upload KML/KMZ, preview in Cesium, record orbit videos, and download/stream results.

## Tech stack
- Next.js 16 App Router, React 19, TypeScript (strict)
- Prisma + PostgreSQL 16
- Mantine + Tailwind CSS
- CesiumJS (client-only, SSR disabled)
- Auth: session cookie + argon2 password hashing

## Repository layout
- src/app: Next routes + API handlers
- src/components: UI components
- src/server: server-only services (auth, quota, files, videos, storage)
- src/client: browser-only recording + API clients
- src/lib: shared utilities (auth, cesium, prisma)
- prisma: schema, migrations, seed
- uploads: local file storage (gitignored)

## Local setup
1) npm install
2) cp .env.example .env
3) docker compose up -d
4) npm run db:generate
5) npm run db:migrate
6) npm run db:seed
7) npm run dev

## Key scripts
- npm run dev: start dev server
- npm run build: copy Cesium assets + build
- npm run copy-cesium: copy node_modules/cesium into public/cesium
- npm run db:generate / db:migrate / db:seed / db:studio

## Environment variables
- DATABASE_URL (see .env.example, docker-compose uses port 5433)
- NEXT_PUBLIC_CESIUM_ION_TOKEN (optional but recommended)
- DEFAULT_* seed vars (tenant name/slug/admin email/password/name)

Seed default login (if env vars not overridden):
- admin@example.com / changeme123

## Auth and tenant isolation
- Session cookie name: session_token (src/lib/auth/constants.ts)
- middleware.ts only checks cookie presence; real validation happens in server helpers.
- getAuth() loads session + user + tenant and deletes expired sessions.
- Use requireAuth() in server components and requireAuthApi() in API routes.
- Never take tenantId from the client. Use auth.tenant.id or createTenantDb(auth).

## Plans and quota
- Plan -> TenantPlan -> TenantUsage.
- /api/videos/create-intent calls canCreateVideo() and consumeVideoCredit() before creating a Video.

## Storage
- KML/KMZ files: LocalStorageProvider (src/server/storage).
  - Stored at uploads/<tenantId>/<fileId>.kml|kmz
- Video files: saved directly by videoService.
  - Stored at uploads/videos/<tenantId>/<videoId>_<uuid>.webm|mp4
- File metadata is stored in the File model.

## Cesium and recording flow
- Cesium assets are copied to public/cesium by scripts/copy-cesium-assets.mjs (postinstall + build).
- /viewer dynamically imports CesiumViewer with ssr: false.
- useRecordFlow orchestrates: create intent -> status RECORDING -> orbit -> MediaRecorder -> status RECORDED -> upload -> READY/FAILED.
- Recording uses canvas capture; composite recording is used when overlay text is enabled.

## Deployment and production notes
- Set DATABASE_URL to the production Postgres instance; run migrations (e.g. npx prisma migrate deploy).
- npm run build copies Cesium assets into public/cesium; ensure these static files are included in the deploy.
- Default storage writes to local disk under uploads/; for production use a persistent volume or swap to an S3 provider (src/server/storage).
- Video download/stream endpoints read from uploads/videos on the server filesystem.
- Set NEXT_PUBLIC_CESIUM_ION_TOKEN and restrict the token to your production domain.
- Ensure NODE_ENV=production so session cookies are marked secure.

## Core API endpoints
Auth:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me

Files:
- POST /api/files/kml
- GET  /api/files/kml
- GET  /api/files/[id]/download

Videos:
- GET  /api/videos
- POST /api/videos/create-intent
- GET  /api/videos/[id]
- PATCH /api/videos/[id]/status
- POST /api/videos/[id]/upload
- GET  /api/videos/[id]/download
- GET  /api/videos/[id]/stream

Parcel (TKGM Gateway):
- GET  /api/parcel/il (list provinces)
- GET  /api/parcel/ilce?ilId= (list districts)
- GET  /api/parcel/mahalle?ilceId= (list neighborhoods)
- GET  /api/parcel/query?mahalleId=&ada=&parsel= (query parcel, returns GeoJSON)

## Parcel query flow
- TKGM upstream endpoints (env: TKGM_IL_API, TKGM_CBS_API_BASE) proxied via Next.js API
- src/server/parcel: config, http, providers (il/ilce/mahalle/parsel), normalize, geo
- src/client/api/parcelClient.ts: browser API client
- src/components/cesium/ParcelLayer.ts: GeoJsonDataSource loader + auto-frame
- src/components/parcel/ParcelSearchForm.tsx: cascading selects UI
- /parcel page: full search + Cesium preview

## Conventions and gotchas
- Use @/ path aliases (tsconfig paths).
- Any DOM/window access must be in client components ("use client").
- Always tenant-scope DB queries.
- uploads/ and public/cesium are generated; do not commit.
