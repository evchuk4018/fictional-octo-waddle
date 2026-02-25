# agent.md

This file is the single source of truth for all future development in this repository.

## 1) Project Rules

- Node.js must be pinned to `v18.17.0`.
  - Enforced via `.nvmrc` and `package.json` `engines.node`.
  - Node 20+ is not allowed.
- Architecture must remain modular and feature-based.
  - No god files.
  - Business logic belongs in `hooks/`.
  - Components under `components/` are presentational by default.
- File size limit: no file should exceed approximately 500 lines.
- Mobile-first UI is mandatory.
  - Layouts and spacing are optimized for narrow viewports first.
- Required stack must remain unchanged:
  - Next.js 14 App Router, TypeScript, Tailwind CSS, Radix UI, Framer Motion (micro-interactions), React Hook Form + Zod, TanStack Query, next-pwa.
  - Supabase Auth + Postgres + RLS with persistent sessions.

## 2) File Structure

```text
/app
  /api/widgets/summary
  /dashboard
  /goals
  /login
  /offline
/components
  /goals
  /providers
  /tasks
  /ui
/hooks
/lib
  auth.ts
  supabase.ts
/styles
/types
/public
  /icons
  /widgets
/supabase
  /migrations
```

Folder purposes:

- `/app`: route layer (pages, route handlers, loading/error boundaries, manifest).
- `/components/ui`: reusable visual primitives (buttons, cards, progress, nav).
- `/components/goals`: goal-related presentational components/forms.
- `/components/tasks`: task-related presentational components/forms.
- `/components/providers`: global providers (Auth + React Query).
- `/hooks`: business logic, Supabase fetch/mutation orchestration, cache/offline fallback.
- `/lib`: framework/service integration code (`supabase.ts`, `auth.ts`, utilities).
- `/styles`: global styling entry and Tailwind layering.
- `/types`: shared domain types.
- `/public/icons`: PWA and iOS app icons.
- `/public/widgets`: iOS Scriptable widget integration assets.
- `/supabase/migrations`: schema + RLS SQL migrations.

## 3) Design System

Color palette (exact hex):

- Primary: `#2F5D5A`
- Accent: `#A7C9C5`
- Background: `#E6F0EE`
- Card: `#FFFFFF`
- Text Primary: `#1F2D2B`
- Text Secondary: `#6B7F7C`
- Progress Filled: `#2F5D5A`
- Progress Empty: `#D5E4E1`

Spacing rules:

- Screen padding: `16px`
- Card padding: `16px`
- Card gap: `12px`
- Section gap: `24px`
- Button height: `48px`
- Input height: `48px`

Radius rules:

- Cards: `16px`
- Buttons: `12px`
- Pills: `999px`

Button styles:

- Primary button
  - Background: `#2F5D5A`
  - Text: `#FFFFFF`
  - Font weight: `600`
  - Height: `48px`
  - Radius: `12px`
- Secondary button
  - Background: transparent
  - Border: `1px solid #A7C9C5`
  - Text: `#2F5D5A`

Typography:

- Sans-serif system stack with strong readability.
- Heading weights: 600.
- Body copy uses primary/secondary text colors as semantic roles.

Card layout rules:

- White card surface on background color.
- 16px padding inside cards.
- 12px vertical internal spacing.
- Use cards for all grouped content and states (loading/empty/error).

## 4) UI Behavior

Progress behavior:

- Big Goals use circular progress visualization with visible `%` text.
- Medium Goals use horizontal animated bars with visible `%` text.
- Progress updates animate with Framer Motion micro-interactions only.

Goal hierarchy logic:

- `big_goals` are long-term outcomes.
- `medium_goals` are ordered milestones linked to a big goal.
- `daily_tasks` are accountability checkboxes linked to a medium goal.

Task completion rules:

- Checking a task updates `completed` state in Supabase.
- Completion percentages recalculate from task states.
- Dashboard highlights the next incomplete active task across incomplete medium goals.
- Offline mode shows cached active tasks when network fetch fails.

Animation rules:

- Use Framer Motion only for lightweight transitions (progress fills, list item mount/layout).
- Avoid heavy or decorative animations.
- Preserve accessibility and motion clarity.
