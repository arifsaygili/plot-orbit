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

### 4. Prisma migration'ı çalıştır

```bash
npx prisma generate
npx prisma migrate dev --name init
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
| `npx prisma studio` | Prisma Studio (DB GUI) |
| `npx prisma migrate dev` | Yeni migration oluştur |
| `docker compose up -d` | PostgreSQL başlat |
| `docker compose down` | PostgreSQL durdur |

## Database URL Formatı

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

Örnek (local):
```
postgresql://postgres:postgres@localhost:5432/plot_orbit?schema=public
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Styling:** Tailwind CSS
