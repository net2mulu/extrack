# ExTrack - Personal Expense Tracker

Production-ready personal expense tracker built with Next.js, Prisma, and PostgreSQL.

## Features

- 📊 Monthly financial tracking
- 💰 Transaction management (income/expenses)
- 🔄 Recurring bills management
- 📈 Budget tracking per category
- 🎯 Savings goals
- 🔐 User authentication

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Auth**: NextAuth.js

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

## Quick Start with Docker

### Option 1: Automated Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd extrack
   ```

2. **Run the setup script**
   ```bash
   ./setup.sh
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the app**
   - Open http://localhost:3000
   - Sign up for a new account
   - Start tracking your expenses!

### Option 2: Manual Setup

1. **Start the database**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. **Create `.env` file** (use `.env.local` as template or create new):
   ```env
   DATABASE_URL="postgresql://extrack_user:extrack_password@localhost:5433/extrack_db"
   AUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   PORT=3000
   ```
   
   Generate AUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

3. **Install dependencies and run migrations**
   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed  # Optional: seed default data
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Production Deployment

### Using Docker Compose

1. **Set up environment variables in `.env`**
   ```env
   DATABASE_URL="postgresql://extrack_user:extrack_password@db:5432/extrack_db"
   AUTH_SECRET="your-production-secret"
   NEXTAUTH_URL="https://your-domain.com"
   PORT=3000
   ```

2. **Build and start services**
   ```bash
   docker compose up -d --build
   ```

3. **Run migrations**
   ```bash
   docker compose exec app sh -c "cd /app && prisma migrate deploy"
   ```

4. **Access the app**
   - Open http://localhost:3000 (or your configured port)

### Manual Migration (if needed)

If migrations don't run automatically, exec into the container:

```bash
docker compose exec app sh
cd /app
prisma migrate deploy
exit
```

## Development

### Database Commands

```bash
# Start database
docker compose -f docker-compose.dev.yml up -d

# Stop database
docker compose -f docker-compose.dev.yml down

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

### Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── server/           # Server actions
├── lib/              # Utilities and Prisma client
└── auth.ts           # NextAuth configuration

prisma/
├── schema.prisma     # Database schema
└── migrations/       # Database migrations
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `AUTH_SECRET` | NextAuth.js secret key | Required |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `PORT` | Application port | `3000` |
| `POSTGRES_USER` | Database user | `extrack_user` |
| `POSTGRES_PASSWORD` | Database password | `extrack_password` |
| `POSTGRES_DB` | Database name | `extrack_db` |
| `POSTGRES_PORT` | Database port (external) | `5433` |

**Note**: For local development, database runs on port `5433` externally but `5432` internally in Docker.

## License

MIT
