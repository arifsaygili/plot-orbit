# Plot Orbit

Next.js + Prisma + PostgreSQL projesi.

## Gereksinimler

- Node.js 20+
- Docker Desktop (PostgreSQL için)

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Environment değişkenlerini ayarla

```bash
cp .env.example .env
```

### 3. PostgreSQL'i başlat

```bash
docker compose up -d
```

### 4. Prisma migration ve seed çalıştır

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Geliştirme sunucusunu başlat

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build |
| `npm start` | Production sunucu |
| `npm run copy-cesium` | Cesium assets kopyala |
| `npm run db:migrate` | Prisma migration |
| `npm run db:seed` | Seed verileri oluştur |
| `npm run db:studio` | Prisma Studio (DB GUI) |
| `docker compose up -d` | PostgreSQL başlat |
| `docker compose down` | PostgreSQL durdur |

## CesiumJS

3D globe viewer `/viewer` adresinde çalışır.

### Cesium Assets

Cesium static assets `npm install` sırasında otomatik olarak `public/cesium` klasörüne kopyalanır.

Manuel kopyalamak için:
```bash
npm run copy-cesium
```

### Notlar

- Cesium sadece client-side render edilir (SSR yok)
- Assets `/cesium` path'inden servis edilir
- Cesium versiyon güncellemesinde `npm install` assets'i yeniler

## Database URL Formatı

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

Örnek (local):
```
postgresql://postgres:postgres@localhost:5432/plot_orbit?schema=public
```

## Seed Verileri

Seed script varsayılan bir tenant ve admin kullanıcı oluşturur.

Environment değişkenleri ile özelleştirilebilir:

| Değişken | Varsayılan |
|----------|------------|
| `DEFAULT_TENANT_NAME` | Demo Organization |
| `DEFAULT_TENANT_SLUG` | demo |
| `DEFAULT_ADMIN_EMAIL` | admin@example.com |
| `DEFAULT_ADMIN_PASSWORD` | changeme123 |
| `DEFAULT_ADMIN_NAME` | Admin User |

Seed idempotent'tir - birden fazla çalıştırılabilir, duplicate oluşturmaz.

## Authentication

Uygulama session-based authentication kullanır.

### Sayfalar

| Sayfa | Açıklama |
|-------|----------|
| `/register` | Yeni tenant + kullanıcı kaydı |
| `/login` | Giriş |
| `/dashboard` | Ana panel (login gerekli) |

### API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/auth/register` | POST | Yeni tenant + kullanıcı oluştur |
| `/api/auth/login` | POST | Giriş yap |
| `/api/auth/logout` | POST | Çıkış yap |
| `/api/auth/me` | GET | Mevcut kullanıcı bilgisi |

### Varsayılan Giriş Bilgileri (Seed)

- **Email:** admin@example.com
- **Password:** changeme123

## Authorization & Tenant Isolation

### Route Protection

| Route Pattern | Koruma |
|---------------|--------|
| `/dashboard/**` | Auth gerekli (redirect → /login) |
| `/api/**` (korumalı) | Auth gerekli (401 JSON) |
| `/`, `/login`, `/register`, `/viewer` | Public |
| `/api/auth/*` | Public |

### Server Component Auth

```typescript
import { requireAuth } from "@/server/auth";

export default async function ProtectedPage() {
  const { user, tenant } = await requireAuth();
  // redirect to /login if not authenticated
}
```

### API Route Auth

```typescript
import { requireAuthApi } from "@/server/auth";

export async function GET() {
  const { auth, error } = await requireAuthApi();
  if (error) return error; // 401 response

  // auth.user, auth.tenant available
}
```

### Tenant-Scoped Database

```typescript
import { requireAuth } from "@/server/auth";
import { createTenantDb } from "@/server/db/tenantDb";

export default async function Page() {
  const auth = await requireAuth();
  const db = createTenantDb(auth);

  const users = await db.user.findMany(); // only tenant's users
}
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **3D Globe:** CesiumJS
- **Auth:** Custom session (argon2 + httpOnly cookies)
- **Validation:** Zod
- **Styling:** Tailwind CSS
