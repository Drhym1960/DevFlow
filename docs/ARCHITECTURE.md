# DevFlow AI Advertising Studio — Product Architecture

DevFlow is a premium AI marketing video platform. A business uploads brand materials, chooses or creates a realistic virtual presenter, and the studio produces a complete advertisement: script, scenes, product placement, captions, branding, music, and a call to action.

The presenter is one element of the advertisement, not the product.

## Product thesis

1. **Choose your presenter. Upload your brand. Let AI create the advertisement.**
2. **Create your presenter. Build your brand ambassador. Use them again and again.**

## Platform

- Responsive web application (desktop, tablet, mobile)
- PWA-ready (installable manifest + service worker)
- Premium creative-studio interface, not a generic marketing site

## System layers

```
┌─────────────────────────────────────────────────────────────┐
│  Web App (Next.js App Router)                               │
│  Landing · Auth · Dashboard · Wizard · Editor · Library     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Application Services                                       │
│  Auth · Plans · Brand Kits · Assets · Projects · Presenters │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Advertisement Engine                                       │
│  Analyze → Script → Storyboard → Voice → Compose → Render   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Provider Registry (swappable)                              │
│  LLM · Translate · TTS · Image · Avatar · LipSync · Video   │
│  Storage · Payments                                         │
└─────────────────────────────────────────────────────────────┘
```

Providers are selected by environment configuration. No feature is hard-wired to a single vendor.

## User flow

```
Landing → Sign in
   │
   ├─ Dashboard
   ├─ Presenter Library
   ├─ Create My Presenter → My Presenters
   ├─ Brand Kits
   ├─ Assets / Templates / Account / Billing
   │
   └─ Create New Video
        1. What are you advertising?
        2. Upload brand materials (or apply Brand Kit)
        3. Choose presenter (library or My Presenter)
        4. Choose marketing goal + format
        5. AI understands the product
        6. Script review / rewrite / translate
        7. Compose scenes + render (background job)
        8. Scene editor + export
```

## Database (Prisma / SQLite by default, Postgres-ready)

- **User** — account, plan, usage counters
- **Presenter** — library + custom brand ambassadors
- **BrandKit** — reusable brand identity
- **Asset** — uploaded logos, photos, screenshots, clips
- **Project** — one advertisement campaign
- **Scene** — storyboard unit with layout, copy, assets
- **Video** — rendered output
- **Job** — background pipeline progress
- **Template** — reusable campaign structures

See `prisma/schema.prisma`.

## AI provider architecture

All providers implement typed ports in `src/lib/ai/ports.ts` and are resolved by `src/lib/ai/registry.ts`.

| Port | Responsibility | Default adapters |
| --- | --- | --- |
| `LlmProvider` | Script, analysis, rewrite | OpenAI-compatible, Studio Copy Engine |
| `TranslationProvider` | Script + caption translation | OpenAI-compatible, Studio translator |
| `TtsProvider` | Voice audio | OpenAI TTS, ElevenLabs (config) |
| `ImageProvider` | Presenter / scene stills | OpenAI Images (config) |
| `MotionProvider` | Photo or model + audio → talking performance | SadTalker (local), D-ID, Fal |
| `AvatarProvider` | Consistent presenter identity | Studio portrait engine |
| `LipSyncProvider` | Speech-aligned mouth/face cues | Studio viseme mapper |
| `VideoComposer` | Scene layouts + ffmpeg render | Local compositor |
| `StorageProvider` | Files | Local disk (S3-shaped port) |
| `PaymentsProvider` | Plans + checkout | Studio billing (Stripe-shaped port) |

Credentials are read from environment variables. Missing credentials never invent a completed third-party generation — the registry reports `configured: false` and the UI states what is required.

The **Studio Copy Engine** is a first-class on-device marketing writer. It produces original advertising copy from structured brand analysis. It is not a stub that echoes the brief.

## Advertisement engine stages

1. **Analyzing Brand** — extract product, audience, benefits, best assets, CTA
2. **Writing Script** — original ad copy, not a restatement of the brief
3. **Creating Voice** — TTS for the selected language / accent / tone
4. **Generating Presenter** — consistent identity frames + motion cues
5. **Building Scenes** — intelligent layouts around product assets
6. **Adding Branding** — colors, logo, captions, music, CTA card
7. **Rendering Video** — ffmpeg composition to 9:16 / 16:9 / 1:1

Jobs persist stage + percent so the client can poll progress.

## Scene layouts

The compositor never parks the presenter center-frame for the entire ad.

- Presenter full screen
- Presenter left / product right
- Presenter right / product left
- Presenter picture-in-picture
- Floating screenshots
- Product video with presenter overlay
- Product-only
- Presenter in studio
- Presenter in lifestyle environment
- Logo + CTA finale

Layout choice is driven by script beats and available assets.

## Plans

| Capability | Starter | Studio | Agency |
| --- | --- | --- | --- |
| Custom presenters | 1 | 5 | 25 |
| Videos / month | 3 | 30 | 200 |
| Max resolution | 1080p | 1080p | 4K |
| Voice catalog | Core | Full | Full + custom |
| Commercial usage | Personal | Commercial | Commercial + white-label depth |
| Customization depth | Standard | Advanced | Director |

## Security notes

- Passwords hashed with bcrypt
- Session cookies httpOnly / same-site
- Uploads stored outside the source tree with type checks
- Provider keys never sent to the browser
- No celebrity likenesses in the presenter library
