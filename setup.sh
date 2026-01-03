#!/bin/bash

echo "🚀 Setting up ExTrack..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env << 'ENVEOF'
# Database
POSTGRES_USER=extrack_user
POSTGRES_PASSWORD=extrack_password
POSTGRES_DB=extrack_db
POSTGRES_PORT=5433
DATABASE_URL="postgresql://extrack_user:extrack_password@localhost:5433/extrack_db"

# NextAuth.js
AUTH_SECRET="vP2ayDGTbfWkIsDEyKJujmDEcbINyCcwbTbVBtPyqSk="
NEXTAUTH_URL="http://localhost:3000"

# App
PORT=3000
ENVEOF
  echo "✅ .env file created"
else
  echo "✅ .env file already exists"
fi

# Start database
echo "🐘 Starting PostgreSQL database..."
docker compose -f docker-compose.dev.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is ready
until docker compose -f docker-compose.dev.yml exec -T db pg_isready -U extrack_user > /dev/null 2>&1; do
  echo "⏳ Still waiting for database..."
  sleep 2
done

echo "✅ Database is ready!"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev

# Seed database (optional)
read -p "Do you want to seed the database with default data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🌱 Seeding database..."
  npx prisma db seed
fi

echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "Database is running on port 5433"
echo "App will run on http://localhost:3000"
