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

# Database
npx prisma migrate dev   # Run migrations in development
npx prisma generate      # Generate Prisma client

# Mobile (Capacitor)
npm run cap:sync         # Sync web assets to native projects
npm run cap:open:ios     # Open iOS project in Xcode
npm run cap:open:android # Open Android project in Android Studio
npm run build:ios        # Build iOS app
npm run build:ios:appstore  # Build iOS IPA for App Store
npm run build:android    # Build Android app

# Icons
npm run icon:all         # Generate app icons for both platforms
```

## Architecture

### Web Application (Next.js 15 App Router)

- **Single-page app with hash routing**: The main page (`src/app/page.tsx`) handles all views via URL hash (`#home`, `#vocabulary`, `#study`, `#statistics`, `#ipa`, `#more`)
- **API routes**: All backend logic in `src/app/api/` - vocabulary CRUD, auth, admin, dictionary, statistics, widget endpoints
- **Admin dashboard**: `/admin` route with separate auth (uses `ADMIN_PASSWORD` env var)
- **Middleware** (`src/middleware.ts`): Handles CORS, rate limiting, and security (honeypot paths, scanner blocking, prototype pollution protection)

### Data Layer

- **Prisma ORM** with PostgreSQL
- **Models**: User, Word, Definition, Example, Vocabulary (user's word list), StudySession, Feedback
- **Vocabulary** links User to Word with additional metadata (level, review counts, notes, tags)

### Internationalization

- Uses `next-intl` with translation files in `messages/` (ko, en, ja, zh)
- Config in `src/i18n/request.ts`

### Mobile App (Capacitor)

- **WebView mode**: Mobile app loads production web (`https://voca.ysw.kr`) via WebView, no static build needed
- **Native projects**: `ios/` and `android/` contain Capacitor-generated native code
- **Widgets**: iOS widget in `ios/App/VocaWidget/` calls API directly for word data
- **Token sync**: `src/lib/token-storage.ts` syncs auth token to iOS App Groups for widget access

### Chrome Extension

- A companion Chrome extension exists (ID: `ajflgkmapedegaokdcmpdepmchfbeo`)
- Extension is allowed CORS access via middleware

### Authentication

- JWT-based auth with httpOnly cookies (web) and token storage (widgets)
- `src/lib/auth.ts` - client-side auth helpers
- `src/lib/jwt.ts` - JWT token generation/verification
- `src/lib/token-storage.ts` - token storage for widget sync (iOS App Groups)
- `src/hooks/useAuth.ts` - React hook for auth state

### Key Libraries

- `ipa-hangul`: IPA to Korean phonetic conversion
- `cmu-pronouncing-dictionary`: Fallback pronunciation for 134k+ words
- `idb`: IndexedDB wrapper for offline storage
- `framer-motion`: Animations
- `lucide-react`: Icons

## Pre-commit Hooks

Husky + lint-staged runs ESLint fix and TypeScript check on staged `.ts/.tsx` files.

## Path Aliases

Use `@/*` to import from `src/*` (configured in tsconfig.json).

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (required)
- `JWT_SECRET`: Secret for JWT signing (required)
- `ADMIN_PASSWORD`: Password for admin dashboard (required in production)
- `NODE_ENV`: development/production
