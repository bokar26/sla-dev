# SLA Monorepo

This monorepo contains both web and mobile applications for the SLA platform.

## Dev servers

- **Mobile (native)**: `pnpm dev:mobile` → QR in Expo Go
- **Web (Vite)**: `pnpm dev:web` → http://localhost:5173

Run them in separate terminals. Avoid `expo start --web` during normal dev to prevent port confusion.

## Structure

- `apps/web/` - React web application (Vite)
- `apps/mobile/` - React Native mobile application (Expo)
- `packages/shared/` - Shared TypeScript utilities

## Getting Started

1. Install dependencies: `pnpm install`
2. Start web app: `pnpm dev:web`
3. Start mobile app: `pnpm dev:mobile` (scan QR with Expo Go)

## Port Configuration

- Web app: Fixed to port 5173 (Vite)
- Mobile app: Uses Expo's default ports (8081, etc.)
- No port collisions between web and mobile development