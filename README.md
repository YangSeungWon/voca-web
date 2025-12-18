# Voca Web

A vocabulary learning application with flashcard study mode and cross-platform support.

## Features

- 📚 Word dictionary with definitions from Free Dictionary API
- 🗣️ IPA pronunciation with CMU Dictionary fallback (134,000+ words)
- 📊 Excel-style table view for vocabulary management
- 🎴 Flashcard study mode with spaced repetition
- 📈 Learning statistics and progress tracking
- 📁 Word grouping and organization
- 🌐 Multi-language UI (Korean, English, Japanese, Chinese)
- 💾 CSV import/export
- 📱 iOS & Android apps via Capacitor
- 🔐 JWT authentication with secure API
- 🌙 Dark mode support

## Quick Start with Docker

### Prerequisites
- Docker
- Docker Compose

### Production Deployment

```bash
# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings (DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD)

# Build and run
docker compose up -d

# The app will be available at http://localhost:7024
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `ADMIN_PASSWORD` | Admin dashboard password | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL
- npm

### Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The app will be available at http://localhost:7024

## Mobile Development (Capacitor)

```bash
# Build for mobile
npm run build:static

# Sync to native projects
npm run cap:sync

# Open in Xcode/Android Studio
npm run cap:open:ios
npm run cap:open:android
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS
- **Database**: PostgreSQL with Prisma ORM
- **i18n**: next-intl
- **API**: Free Dictionary API + CMU Pronouncing Dictionary
- **Mobile**: Capacitor (iOS/Android)
- **Deployment**: Docker & Docker Compose

## Data Sources

- **Word Definitions**: [Free Dictionary API](https://dictionaryapi.dev/)
- **Pronunciations**: [CMU Pronouncing Dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict) (134,000+ words)
- **IPA Conversion**: Custom ARPAbet to IPA converter

## Project Structure

```
.
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   └── admin/        # Admin dashboard
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   └── i18n/             # Internationalization config
├── prisma/               # Database schema
├── messages/             # i18n translation files
├── ios/                  # iOS native project
├── android/              # Android native project
├── docker-compose.yml    # Docker config
└── Dockerfile            # Docker image
```

## Security Features

- JWT-based authentication
- Rate limiting on sensitive endpoints
- XSS protection on user inputs
- Docker container hardening (read-only filesystem, no-new-privileges)
- Resource limits on containers

## License

MIT
