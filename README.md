# Goal Tracker PWA

Production-ready mobile-first goal-tracking app built with Next.js 14 + Supabase.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Radix UI
- Framer Motion (micro-interactions)
- React Hook Form + Zod
- TanStack Query
- next-pwa
- Supabase Auth + Postgres + RLS

## Node Version (Required)

- Node.js `v18.17.0` only
- Enforced in:
  - `.nvmrc`
  - `package.json` `engines.node`

## Setup

1. Use Node 18.17.0:

	```bash
	nvm use
	```

2. Install dependencies:

	```bash
	npm install
	```

3. Configure environment variables:

	```bash
	cp .env.example .env.local
	```

	Fill:

	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `SUPABASE_SERVICE_ROLE_KEY` (optional for admin scripts)

4. Run Supabase SQL migration:

	- Execute `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

5. Start app:

	```bash
	npm run dev
	```

## App Features

- Big Goals → Medium Goals → Daily Tasks hierarchy
- Completion percentage tracking at each level
- Today-first dashboard with next incomplete task
- Email/password auth + OAuth-ready Google sign-in
- Session persistence across refresh and PWA install
- Protected routes via middleware
- Offline-friendly today task viewing (cached fallback)
- Widget summary API for iOS Scriptable integration

## iOS PWA + Widgets

- Install to Home Screen from Safari Share menu.
- PWA manifest + icons are included.
- Widget endpoint:
  - `GET /api/widgets/summary` (requires authenticated session)
- Scriptable sample:
  - `public/widgets/ios-scriptable-widget.js`

## Source of Truth

All future development rules, UI system, behavior, and structure requirements are defined in `agent.md`.