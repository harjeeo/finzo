# Finzo

Cloud Accounting & Business Management SaaS for Indian retailers, wholesalers, distributors and SMEs — accounting, GST-ready billing, inventory, sales, purchase and reports in one platform.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Hugeicons
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Cache / Queues**: Redis + BullMQ
- **File Storage**: Cloudflare R2
- **Auth**: JWT

## Project Structure

```
frontend/   React + Vite dashboard app
backend/    NestJS API + Prisma schema
```

## Getting Started

### 1. Start Postgres & Redis

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # adjust DATABASE_URL if needed
npx prisma migrate dev
npm run start:dev       # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env     # adjust VITE_API_URL if needed
npm run dev              # http://localhost:5173
```

## Development Phases

- **Phase 1 (MVP)**: Auth & onboarding, business setup, dashboard, customers/suppliers, products/inventory, sales/purchase, billing/invoices, expenses, basic GST, basic reports, staff & permissions.
- **Phase 2**: Full accounting engine, POS/barcode, multi-branch, WhatsApp integration, advanced GST reports.
- **Phase 3**: E-invoice/e-way bill integration, mobile apps, public APIs, advanced analytics, industry-specific modules.
