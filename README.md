# Vocabulary Manager

A professional vocabulary learning application with Excel-like interface.

## Features

- 📚 Word dictionary with definitions from Free Dictionary API
- 📊 Excel-style table view for vocabulary management
- 💾 CSV export functionality
- 🔍 Search and filter capabilities
- 📱 Responsive design for professional use

## Quick Start with Docker

### Prerequisites
- Docker
- Docker Compose

### Production Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# The app will be available at http://localhost:7024
```

### Development with Docker

```bash
# Run development environment
docker-compose -f docker-compose.dev.yml up

# The app will be available at http://localhost:7024
# Changes will be reflected automatically
```

### Docker Commands

```bash
# Build the image
docker-compose build

# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Reset database
docker-compose down -v
docker-compose up -d
```

## Local Development (without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:7024

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development/production)

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: TailwindCSS
- **Database**: PostgreSQL with Prisma ORM
- **API**: Free Dictionary API for word definitions
- **Deployment**: Docker & Docker Compose

## Project Structure

```
.
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   └── lib/             # Utilities and helpers
├── prisma/              # Database schema
├── public/              # Static assets
├── docker-compose.yml   # Production Docker config
├── docker-compose.dev.yml # Development Docker config
├── Dockerfile           # Production Docker image
└── Dockerfile.dev       # Development Docker image
```

## License

MIT