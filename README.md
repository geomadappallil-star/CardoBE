# CardoBE — Spice Intelligence Fastify API Service

High-performance Node.js API backend for **Cardo Board**, powering time series analytics, climate correlation, and parameterized scenario extrapolations.

## Tech Stack
- **Node.js + Fastify**
- **TypeScript**
- **Zod validation**
- **better-sqlite3 & PostgreSQL / Supabase client**

## Endpoints
- `GET /health`: Health status
- `GET /api/v1/dashboard/summary`: Executive KPIs & recent verified auctions
- `GET /api/v1/prices`: Filtered price dynamics (daily, monthly, annual unweighted & weighted means)
- `GET /api/v1/weather`: Idukki precipitation, anomaly vs 1991–2020 normal baseline
- `GET /api/v1/production`: Area (ha), Production (MT), Yield (kg/ha)
- `GET /api/v1/trade`: Bilateral import/export flows & apparent consumption
- `POST /api/v1/extrapolate`: Parameterized scenario modeling engine
- `GET /api/v1/quality`: Data provenance audit & quality verification runs

## Supabase Deployment
The PostgreSQL schema migration is located in `supabase/migrations/20260916000000_init_cardo_board.sql`.
Run it in your Supabase SQL Editor or apply via Supabase CLI.

## Quick Start
```bash
npm install
npm run dev
```
