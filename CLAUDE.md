# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voca Web is a vocabulary learning application with an Excel-like interface for managing words. It's built as a Next.js web app with Capacitor for iOS/Android mobile apps. The app fetches word definitions from the Free Dictionary API and stores user vocabulary in PostgreSQL.

## Common Commands

```bash
# Development
npm run dev              # Start dev server on port 7024
npm run lint             # Run ESLint

# Build
npm run build            # Production build (runs prisma generate first)
npm run build:static     # Static export for Capacitor mobile apps

# Database
npx prisma migrate dev   # Run migrations in development
npx prisma generate      # Generate Prisma client

# Mobile (Capacitor)
npm run cap:sync         # Sync web assets to native projects
npm run cap:open:ios     # Open iOS project in Xcode
npm run cap:open:android # Open Android project in Android Studio
npm run build:ios        # Build iOS app
npm run build:ios:ipa    # Build iOS IPA for App Store
npm run build:android    # Build Android app

# Icons
npm run icon:all         # Generate app icons for both platforms
```

## Architecture

### Web Application (Next.js 15 App Router)

- **Single-page app with hash routing**: The main page (`src/app/page.tsx`) handles all views via URL hash (`#home`, `#vocabulary`, `#study`, `#statistics`, `#ipa`, `#more`)
- **API routes**: All backend logic in `src/app/api/` - vocabulary CRUD, auth, groups, statistics, widget endpoints
- **Middleware** (`src/middleware.ts`): Handles CORS for API routes, allowing requests from Chrome extension and Capacitor app

### Data Layer

- **Prisma ORM** with PostgreSQL
- **Models**: User, Word, Definition, Example, Vocabulary (user's word list), StudySession, Group
- **Vocabulary** links User to Word with additional metadata (level, review counts, notes, tags, group)

### Mobile App (Capacitor)

- **Static export**: Mobile builds use `BUILD_MODE=static` to generate `out/` directory
- **API routing**: Mobile app calls production API (`https://voca.ysw.kr`) via `src/config/api.ts`
- **Native projects**: `ios/` and `android/` contain Capacitor-generated native code
- **Widgets**: iOS widget in `ios/App/VocaWidget/`, Android widget in `android/app/src/main/java/kr/ysw/voca/widget/`

### Authentication

- JWT-based auth with tokens stored in localStorage
- `src/lib/auth.ts` - client-side auth helpers
- `src/lib/jwt.ts` - JWT token generation/verification
- `src/hooks/useAuth.ts` - React hook for auth state

### Key Libraries

- `ipa-hangul`: IPA to Korean phonetic conversion
- `idb`: IndexedDB wrapper for offline storage
- `framer-motion`: Animations
- `lucide-react`: Icons

## Path Aliases

Use `@/*` to import from `src/*` (configured in tsconfig.json).

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (required)
- `JWT_SECRET`: Secret for JWT signing
- `NODE_ENV`: development/production
