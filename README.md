# ExTrack - Production Ready Expense Tracker

A mobile-first personal finance tracker built with Next.js 16, Prisma 7, and PostgreSQL.

## Features
- **Dashboard**: Monthly summary, budget progress, upcoming recurring bills.
- **Quick Add**: Fast transaction entry with category chips and numpad.
- **Recurring Rules**: Auto-generated monthly bills (Rent, Microfinance) with "Mark Paid" workflow.
- **Goals**: Visual saving goals tracking.
- **Tech Stack**: Next.js 16 (App Router), Tailwind CSS, shadcn/ui, Prisma 7, Docker.

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+

### Setup

1. **Start Database**
   ```bash
   docker compose up -d
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Initialize Database**
   This will push the schema and seed default categories/rules.
   ```bash
   # If you have existing data you want to keep:
   # npx prisma migrate dev

   # For a fresh reset (Recommended for first run):
   npx prisma db push --accept-data-loss
   npx tsx prisma/seed.ts
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access App**
   Open [http://localhost:3000](http://localhost:3000) (or 3001 if 3000 is taken).

## Project Structure
- `src/app`: Page routes and layouts.
- `src/components`: UI components (shadcn/ui) and feature components.
- `src/server/actions`: Server Actions for mutations and data fetching.
- `src/lib`: Utilities and Prisma client.
- `prisma`: Database schema and seed script.

## Customization
- Edit `prisma/seed.ts` to change default categories or recurring rules.
- Edit `tailwind.config.ts` for theme colors.
