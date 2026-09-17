# CAIRA — AI-Powered Interview Readiness Platform

CAIRA is a full-stack mock-interview platform for technical, behavioral, product, and leadership interview practice. It combines adaptive AI questioning, browser speech tools, webcam preview, turn-by-turn feedback, and final readiness reports.

## What CAIRA does

- Generates role-adaptive interview questions from a target role, resume, and optional job description.
- Uses Google Gemini for skill extraction, adaptive follow-ups, answer evaluation, and final reports.
- Defaults to `gemini-3.8-flash`; the model can be changed with `GEMINI_MODEL`.
- Supports voice answers through the browser Web Speech API and manual text editing.
- Provides a local webcam preview; camera video is not uploaded to CAIRA servers.
- Scores practice answers with structured strengths, gaps, and STAR-oriented feedback.
- Produces a final interview-practice readiness report and per-skill breakdown.
- Runs in an offline/demo fallback mode when Gemini or Supabase are not configured.

## Stack

- Next.js 14 App Router
- React 18 + TypeScript
- Tailwind CSS
- Google Gemini via `@google/generative-ai`
- Supabase Auth, Postgres, Storage, and Row Level Security
- Web Speech API + Web Audio API
- Lucide React

> **Dependency note:** the current application remains on Next.js 14 for compatibility with the original implementation. Next.js 14 is no longer an LTS release in 2026, so a framework upgrade should be handled as a dedicated migration before long-term production deployment.

## Project structure

```text
CAIRA/
├── app/
│   ├── api/
│   │   ├── interviews/
│   │   │   ├── create/route.ts
│   │   │   ├── [id]/answer/route.ts
│   │   │   ├── [id]/question/route.ts
│   │   │   └── [id]/report/route.ts
│   │   └── upload/
│   │       ├── resume/route.ts
│   │       └── jd/route.ts
│   ├── dashboard/
│   ├── interview/
│   ├── login/
│   ├── signup/
│   └── page.tsx
├── components/
├── lib/
│   ├── ai/
│   └── supabase/
├── supabase/migrations/
├── types/
├── middleware.ts
└── .github/workflows/ci.yml
```

## Local setup

### Requirements

- Node.js 22 recommended
- npm

### Install

```bash
git clone https://github.com/stutitiwari23/CAIRA.git
cd CAIRA
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

CAIRA can still run without live credentials; it falls back to its local demo/simulation path.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key

# Legacy projects may use the anon key instead of the publishable key.
NEXT_PUBLIC_SUPABASE_ANON_KEY=

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.8-flash
```

### Important security rule

Do **not** put a Supabase service-role/secret key into CAIRA's normal application environment. User-facing server requests use the signed-in user's cookie session and remain subject to Row Level Security.

## Supabase setup

Apply the SQL files in `supabase/migrations/` to the Supabase project in order.

The hardening migration:

- persists `target_questions` for 5–10 question sessions;
- explicitly grants the authenticated Data API permissions CAIRA needs;
- scopes interview/profile/question access to the signed-in owner through RLS;
- scopes private Storage uploads to `<auth.uid()>/...` folders;
- locks down the profile-creation trigger helper.

Resume and job-description buckets are private. Upload handlers use the authenticated user's folder and do not use `upsert`.

## Interview lifecycle

1. Candidate chooses a target role and optional resume/JD context.
2. CAIRA extracts target skills and creates an interview session.
3. Question 1 is generated.
4. Each submitted answer is evaluated once.
5. Follow-up generation reuses an existing unanswered question on retries instead of creating duplicates.
6. A report can only be generated after all required questions are answered.
7. Completed reports are reused rather than regenerated on repeated requests.

## Privacy

- Webcam video stays in the browser preview.
- CAIRA does not intentionally store raw microphone recordings.
- Speech-to-text depends on browser Web Speech API behavior and browser/vendor support.
- When Supabase is enabled, database access is protected by Row Level Security.
- Uploaded resume/JD files are placed in private per-user storage paths.

## Verification

The repository includes GitHub Actions CI. Every push/PR runs:

```bash
npm ci
npm run typecheck
npm run build
```

This keeps compiler errors and broken production builds from silently reaching `main`.

## Development scripts

```bash
npm run dev
npm run typecheck
npm run build
npm run start
```

## License

MIT — see `LICENSE`.
