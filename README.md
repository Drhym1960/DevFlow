# DevFlow AI Advertising Studio

Choose your presenter. Upload your brand. Let AI create the advertisement.

Create your presenter. Build your brand ambassador. Use them again and again.

DevFlow is a premium AI marketing video studio. A business uploads brand materials, chooses a library model or uploads a client photo, and the platform produces a complete advertisement — script, scenes, product placement, captions, branding, music, and a call to action. Every presenter performs like the Yuna Han cut: they walk, turn, point, and smile while they talk. The presenter is one element of the film, not the product.

## Stack

- Next.js 15 App Router + TypeScript + Tailwind
- Prisma + SQLite (Postgres-ready)
- Modular AI provider registry
- ffmpeg compositor + background render jobs
- PWA manifest + service worker

## Quick start

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Demo account: `studio@devflow.ai` / `studio1234`

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for database structure, user flow, provider ports, and the advertisement engine.

## AI providers

Providers live under `src/lib/ai` and are selected by environment configuration.

| Capability | Adapter | Credentials |
| --- | --- | --- |
| Script / analysis | Studio Copy Engine (always on) or OpenAI-compatible LLM | `OPENAI_API_KEY` optional |
| Translation | Studio translator + LLM when configured | `OPENAI_API_KEY` optional |
| Voice | OpenAI TTS / ElevenLabs (male presenters get a bold male voice) | `OPENAI_API_KEY` or `ELEVENLABS_API_KEY` |
| Photoreal stills | OpenAI Images | `OPENAI_API_KEY` |
| Full-body motion | Sora (Yuna flow: walk, turn, gesture, smile) | `OPENAI_API_KEY` — default for every model and every uploaded photo |
| Face-locked fallback | SadTalker / D-ID / Fal | `MOTION_PROVIDER=sadtalker` or hosted keys |
| Presenter identity | Studio portrait engine | none |
| Lip sync | Wav2Lip on the existing performance, then studio visemes | `WAV2LIP_DIR` optional |
| Video | ffmpeg compositor | local `ffmpeg` |
| Payments | Studio billing / Stripe-shaped | `STRIPE_SECRET_KEY` optional |

Missing vendor keys never invent a completed third-party generation. The Account screen lists each provider and the variables it needs.

## Product surfaces

- Presenter Library by marketing category and region
- Create My Presenter + My Presenters
- Advertisement wizard (brief → assets → presenter → goal → analysis → script review)
- Scene editor
- Brand kits, assets, templates, billing
- Render progress: Analyzing Brand → Writing Script → Creating Voice → Generating Presenter → Building Scenes → Adding Branding → Rendering Video

## Plans

Starter, Studio, and Agency plans limit custom presenters, monthly films, resolution, voice depth, and commercial usage.
