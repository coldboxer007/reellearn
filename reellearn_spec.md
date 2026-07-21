# ReelLearn — Product & Engineering Specification

> **One-liner:** Drop in your syllabus or study notes → ReelLearn maps out a study plan, then produces a scrollable feed of short vertical video reels, shareable infographic posts, and playable mini-game reels that teach every concept on that plan.
>
> **Audience for this document:** An LLM coding agent or engineering team building the system from zero. Read fully before writing code. Every schema, model choice, and pipeline stage here is normative unless marked *optional*.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Core User Flows](#2-core-user-flows)
3. [System Architecture](#3-system-architecture)
4. [AI Model Matrix (OpenAI)](#4-ai-model-matrix-openai)
5. [The Generation Pipeline](#5-the-generation-pipeline)
6. [The Render Service (Remotion)](#6-the-render-service-remotion)
7. [Theme System — Reel Visual Identities](#7-theme-system--reel-visual-identities)
8. [Infographic Post Generator](#8-infographic-post-generator)
9. [Playable Reels (Interactive Game Reels)](#9-playable-reels-interactive-game-reels)
10. [Study Plan Engine](#10-study-plan-engine)
11. [Social Layer](#11-social-layer)
12. [Data Model](#12-data-model)
13. [API Surface](#13-api-surface)
14. [Mobile-First Frontend](#14-mobile-first-frontend)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Build Roadmap](#16-build-roadmap)

---

## 1. Product Vision

Students don't fail because material is unavailable — they fail because material is **unstructured, unscheduled, and boring**. ReelLearn attacks all three:

| Problem | ReelLearn answer |
|---|---|
| "I don't know what to study or in what order" | **Study Plan Engine** — upload a syllabus, get a dated, dependency-ordered plan |
| "Reading PDFs is exhausting" | **Reels** — 30–60s vertical animated explainers, one concept each, auto-generated |
| "I forget everything after reading" | **Playable Reels** — micro-games that force active recall, and **Infographic Posts** for revision |
| "Studying alone kills motivation" | **Social Layer** — see classmates on the same plan, match study partners, share streaks |

**Content-generation philosophy — the load-bearing decision:**

The system does **not** stitch videos from stock clips, and it does **not** fill static templates with text. For every reel, a code-generation model writes a complete **React video composition** (a Remotion `.tsx` file) that programmatically animates the concept — SVG diagrams, plotted curves, step-by-step equation reveals, network graphs — synchronized to AI narration. A **theme contract file** (Section 7) constrains every visual decision, so output is consistent and swapping the theme file swaps the entire visual identity without touching the pipeline.

This gives unlimited visual flexibility (any concept can be animated) with production-grade consistency (the theme file is law).

---

## 2. Core User Flows

### Flow A — Syllabus → Study Plan → Reel Series (the flagship flow)

```
1. Student uploads syllabus PDF (or pastes topic list / exam date)
2. Syllabus Analyzer extracts units, topics, subtopics, weightage, dependencies
3. Study Plan Engine outputs a dated plan: "Day 1: Limits → Day 2: Derivatives → ..."
4. Student approves/edits the plan (drag to reorder, mark topics as known)
5. For each plan node, the Generation Pipeline produces:
   - 1 explainer reel (video)
   - 1 infographic post (image carousel, 1–5 slides)
   - 1 playable reel (mini-game) for testable concepts
6. Content lands in the student's feed in plan order, gated by date
   ("today's reels") with the option to binge ahead
```

### Flow B — Quick Drop (single document → reel series)

Upload any PDF / notes / lecture slides + pick a reel count (1–8) + pick a theme → get a series. No plan, no scheduling. This is the low-friction demo flow and must work end-to-end before Flow A is built.

### Flow C — Social

- Join a **class** (invite code or school directory)
- Feed shows "3 classmates studied *Integration by Parts* today"
- **Study Match**: opt-in pairing with a classmate at the same plan node this week
- Reels, posts, and game scores are shareable to the class feed

### Flow D — Revision Mode

Before an exam date on the plan, the system auto-schedules **revision reels**: compressed 20s remixes of earlier reels + a playable quiz reel spanning multiple topics. Generated from existing scene scripts (cheap — no new planning pass).

---

## 3. System Architecture

Three deployable services + a worker pool. Monorepo.

```
┌─────────────────────────────────────────────────────────────────┐
│  api/            FastAPI (Python 3.12)                          │
│  - Auth, uploads, plans, feed, social, job control              │
│  - SSE/WebSocket progress streaming                             │
│  - Enqueues generation jobs to Redis                            │
├─────────────────────────────────────────────────────────────────┤
│  pipeline/       Python worker pool (arq or Celery on Redis)    │
│  - Runs the stage graph in Section 5                            │
│  - Calls OpenAI (Responses API), writes artifacts to S3         │
│  - Deterministic asyncio orchestration — NOT an agent framework │
├─────────────────────────────────────────────────────────────────┤
│  render/         Node 22 + Remotion service (Docker)            │
│  - Receives .tsx code + assets, compiles, renders MP4           │
│  - Own HTTP API: /compile-check, /render, /health               │
│  - Horizontally scalable; each container ships headless Chrome  │
├─────────────────────────────────────────────────────────────────┤
│  app/            Mobile-first client (Section 14)               │
└─────────────────────────────────────────────────────────────────┘

Postgres  — users, classes, plans, content metadata, social graph
Redis     — job queue, progress pub/sub, rate limiting
S3-compatible object store — PDFs, WAVs, MP4s, WebP posters/infographics
```

**Why deterministic orchestration instead of an agent framework:** the pipeline is a *fixed DAG* — plan → script → voice → assets → code → compile → render. Nothing about it benefits from an LLM choosing the next step. Each stage is a typed async function that takes/returns Pydantic models; the LLM lives *inside* stages, never *between* them. This makes retries, caching, cost accounting, and partial failure handling trivial.

**Inter-stage contract:** every stage reads and writes a single `ReelJobState` object persisted to Postgres (JSONB) after each stage. A crashed worker resumes from the last completed stage. Stage outputs are content-addressed in S3 (`sha256(inputs)`) so identical regeneration requests hit cache.

---

## 4. AI Model Matrix (OpenAI)

All LLM calls go through the **OpenAI Responses API** with **Structured Outputs (strict mode)** wherever a schema exists. Model IDs are configuration, never hardcoded in stage logic.

| Config key | Model | Used by | Notes |
|---|---|---|---|
| `MODEL_REASONING` | `gpt-5.1` (reasoning effort: `high`) | Composition Coder (Remotion `.tsx` codegen), Syllabus Analyzer | The two hardest jobs: writing correct animated React code, and untangling messy syllabus PDFs |
| `MODEL_PLANNER` | `gpt-5.1` (effort: `medium`) | Series Planner, Study Plan Engine, Game Designer | Structural reasoning, JSON out |
| `MODEL_WRITER` | `gpt-5.1` (effort: `low`) or `gpt-4.1-mini` | Scene Planner, Script Writer, Infographic Copywriter | High volume, cheap, schema-constrained |
| `MODEL_FALLBACK` | `o4-mini` | Automatic retry target when a primary call fails twice | Wire the fallback for real — every LLM call goes through one `llm()` helper that owns retry/fallback/cost logging |
| `MODEL_IMAGE` | `gpt-image-1.5` | Infographic Post Generator, occasional in-reel illustrative assets | Do **not** target `gpt-image-1` (deprecated path) |
| `MODEL_TTS` | `gpt-4o-mini-tts` | Narration | Request **PCM/WAV 24 kHz** output; per-theme voice + style instruction (Section 7) |
| `MODEL_ALIGN` | `gpt-4o-transcribe` (word timestamps) | Caption Aligner | Transcribe the generated WAV back with word-level timestamps for **true** karaoke caption sync — never estimate timing by dividing duration evenly |
| `MODEL_MODERATION` | `omni-moderation-latest` | All user uploads + all generated scripts | Free; run before spending render money |

**PDF ingestion:** send the PDF to the Responses API as an `input_file` part (native file input). Fallback for oversized files: extract text per-page with `pypdf`, chunk, and pass as text.

**Structured Outputs rules (strict mode):** every schema field is `required`, `additionalProperties: false`, no defaults. All Pydantic models in Section 5 are written to satisfy this.

**Reasoning effort is a per-stage dial**, set in stage config: `{"syllabus": "high", "coder": "high", "series": "medium", "scenes": "low", "script": "low"}`.

---

## 5. The Generation Pipeline

The full stage graph for one generation job (Flow A or B):

```
                         ┌──────────────────┐
  PDF/syllabus ────────► │ 0 Moderation      │  reject early
                         └────────┬─────────┘
                         ┌────────▼─────────┐
                         │ 1 Series Planner  │  1 call → SeriesManifest
                         └────────┬─────────┘
              ┌──── per reel, all reels in parallel (asyncio.gather) ────┐
              │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
              │  │ 2 Scene       │──►│ 3 Script      │──►│ 4a Voice      │ │
              │  │   Planner     │   │   Writer      │   │ 4b Assets     │ │  4a/4b/4c run
              │  └──────────────┘   └──────────────┘   │ 4c Infographic│ │  concurrently
              │                                        │ 4d Game Design│ │
              │                                        └──────┬───────┘  │
              │                                        ┌──────▼───────┐  │
              │                                        │ 5 Caption     │  │
              │                                        │   Aligner     │  │
              │                                        └──────┬───────┘  │
              │                                        ┌──────▼───────┐  │
              │                                        │ 6 Composition │  │
              │                                        │   Coder       │  │
              │                                        └──────────────┘  │
              └──────────────────────────┬───────────────────────────────┘
                         ┌───────────────▼──────────────┐
                         │ 7 Registrar (compile gate)    │  sequential, one pass
                         └───────────────┬──────────────┘
                         ┌───────────────▼──────────────┐
                         │ 8 Render Farm (parallel,      │  semaphore-capped
                         │   per-reel MP4)               │
                         └───────────────┬──────────────┘
                         ┌───────────────▼──────────────┐
                         │ 9 Collector → feed publish    │
                         └──────────────────────────────┘
```

Per-reel failure is **isolated**: one bad reel never blocks siblings. A reel's terminal states are `published | quarantined | failed`, and the Collector reports all three honestly.

### Stage 1 — Series Planner

Input: source document (file part) + `reel_count` + theme id + (Flow A) the plan node context.
Output schema:

```python
class ReelAssignment(BaseModel):
    reel_number: int
    topic: str
    covers: str                    # explicit scope
    excludes: str                  # explicit anti-scope — prevents overlap between reels
    key_points: list[str]          # 2–5
    hook: str                      # first-3-seconds opener; curiosity or misconception-bust
    prerequisites: list[int]       # reel numbers this depends on (narrative order)
    target_duration_seconds: int   # 30–60
    wants_game: bool               # is this concept quiz/game-able?
    wants_infographic: bool

class StyleContract(BaseModel):
    terminology: dict[str, str]    # domain term → plain-language phrasing, used series-wide
    concept_colors: dict[str, str] # concept → hex, consistent across ALL reels in series
    motifs: list[str]              # recurring visual metaphors

class SeriesManifest(BaseModel):
    series_title: str
    total_reels: int
    style: StyleContract
    reels: list[ReelAssignment]
```

Hard rules in the prompt: `total_reels` equals the user's request exactly; zero concept overlap between reels (`covers`/`excludes` are directional and explicit); foundational topics first; final reel closes the arc.

### Stage 2 — Scene Planner (per reel)

Breaks a reel into **4–8 scenes**, each tagged with a **scene pattern** from the theme's pattern library (Section 7.2): `graph-network`, `coordinate-plot`, `equation-steps`, `flowchart`, `comparison-split`, `timeline`, `state-machine`, `bar-ranking`, `anatomy-label`, `freeform`. Each scene gets `duration_seconds`, `visual_description`, `narration_direction`, and `asset_needs` (empty by default — most scenes are pure vector animation; raster images are the exception, not the rule).

### Stage 3 — Script Writer (per reel)

Per scene: `narration_text` (the exact spoken words), `caption_text` (≤60% of narration; key phrases), `visual_direction` (concrete motion/layout/color cues an engineer could implement). Pacing law: **2.5–3 words per spoken second**, ~0.5s breathing room at scene edges. Voice: first-person-plural, short sentences, one rhetorical question max per reel.

### Stage 4a — Voice

Concatenate scene narrations (join with `". "`), one TTS call per reel → WAV in S3. The TTS **style instruction comes from the theme** (Section 7 gives each theme a voice persona). Store `total_duration_seconds`.

### Stage 4b — Assets (usually a no-op)

Only if a scene declared `asset_needs`: call `gpt-image-1.5` per asset with the theme's image style suffix appended to the prompt; save as WebP to S3, `9:16` for backgrounds, `1:1` for insets. Failure of one asset is non-fatal (scene falls back to vector-only).

### Stage 4c — Infographic Generator → Section 8. Stage 4d — Game Designer → Section 9. Both run concurrently with 4a/4b; neither blocks the video path.

### Stage 5 — Caption Aligner

Transcribe the reel's WAV with `gpt-4o-transcribe` requesting word timestamps. Align the transcript words to script words (simple dynamic-programming alignment; the texts are near-identical). Output: `word_timestamps: [{word, start_s, end_s}]` and derived `scene_timestamps: [{scene, start_s, end_s}]` by consuming each scene's word count in order. This is what makes karaoke captions and scene-triggered animations feel *tight*.

### Stage 6 — Composition Coder (per reel) — the crown jewel

One `MODEL_REASONING` call. The prompt is assembled from four blocks, in this order:

1. **Remotion engineering guide** (`render/contracts/engineering.md`) — how to write correct Remotion code: `useCurrentFrame()`, `interpolate()`, `spring()`, `<Sequence>`, `<AbsoluteFill>`, `staticFile()`, frame math at 30fps.
2. **Active theme contract** (`render/themes/<theme>.md`) — the complete visual law (Section 7).
3. **Reel data** — the scene plan, script, `word_timestamps`, `scene_timestamps`, asset URLs, and the series `StyleContract`.
4. **Output contract** — the non-negotiables:

```
- Export exactly: `export const Reel{N}Video: React.FC = () => { ... }`
- Portrait 1080×1920, fps 30, svg viewBox="0 0 1080 1920"
- durationInFrames = ceil(audio_duration * 30) + 30   (30-frame global fade-out tail)
- Audio via <Audio src={staticFile("reel_{N}_audio.wav")} />
- Karaoke captions driven by the PROVIDED word_timestamps (never re-estimate)
- Scene animations trigger at scene_timestamps[i].start_s * 30
- Raster images: <Img> as absolutely-positioned SIBLINGS of the <svg>,
  never inside it (SVG-embedded media breaks at render time)
- Use ONLY color constants you define at the top of the file, sourced from
  the theme palette + the series concept_colors. No undefined references.
- No imports beyond: react, remotion, and (if theme allows) katex
- Output ONLY the code. No prose, no markdown fences.
```

Post-process the response: strip markdown fences defensively, verify the export name with a regex, verify balanced braces; on violation, one repair round-trip ("your output failed check X, emit corrected full file") before marking the reel `failed`.

### Stage 7 — Registrar (compile gate, sequential)

1. Write every surviving reel to `render/src/compositions/Reel{N}.tsx`, prefixed with `// @ts-nocheck` (the real gate is the render, not the type checker — but tsc still catches syntax-level disasters cheaply).
2. Regenerate `Root.tsx` **idempotently**: strip any previously generated reel imports/`<Composition>` blocks, then append the current set (id `Reel{N}`, `durationInFrames` parsed from the code, 30fps, 1080×1920). Non-generated compositions in Root.tsx are preserved verbatim.
3. Run `tsc --noEmit`. Parse diagnostics per file; **ignore lint-tier codes** (TS6133/TS6196/TS6198 unused-symbol noise).
4. Any reel with real errors → move its file to `compositions/_quarantine/`, rewrite `Root.tsx` without it, mark the reel `quarantined` with its diagnostics attached. One quarantine pass, then proceed — never loop.

### Stage 8 — Render Farm

Per surviving reel, POST to the render service: `npx remotion render src/index.ts Reel{N} out/reel-{N}.mp4 --log=error`. Concurrency capped by semaphore (`MAX_CONCURRENT_RENDERS`, default 2 per render container — Chrome is memory-hungry). 300s timeout per reel, kill + reap on expiry. Outcomes: `success | render_error(stderr) | render_timeout`.

### Stage 9 — Collector

Assemble `{series_title, requested, succeeded, reels:[{n, status, video_url, infographic_urls, game_id, error?}]}`, upload MP4s to S3 with poster frames (extract frame at t=1s via ffmpeg), write feed entries, publish `job.done` on Redis pub/sub → client SSE closes.

---

## 6. The Render Service (Remotion)

A standalone Node 22 project (`render/`), Dockerized with headless Chrome pre-fetched at image build (`npx remotion browser ensure`) plus Noto fonts (blank-text insurance).

```
render/
├── src/
│   ├── index.ts               # registerRoot
│   ├── Root.tsx               # machine-managed composition registry
│   ├── compositions/          # generated Reel{N}.tsx land here
│   │   └── _quarantine/
│   └── lib/                   # hand-written, stable helpers the coder MAY import
│       ├── Karaoke.tsx        # word-timestamp caption component
│       ├── math.tsx           # KaTeX wrapper for equation scenes
│       └── easing.ts
├── themes/                    # theme contract .md files (Section 7)
├── contracts/engineering.md   # Remotion how-to for the Composition Coder
├── server.mjs                 # /compile-check /render /health
└── package.json               # remotion@4.x, react@19, katex, tailwind v4
```

Design notes:

- `lib/` exists so the most failure-prone generated code (caption timing, KaTeX sizing) is **hand-written once** and merely *invoked* by generated code. The engineering guide documents these components' props and tells the coder to prefer them.
- The render container is **stateless**: the pipeline ships it the `.tsx` files, `public/` assets (WAV, WebP), and gets back MP4 bytes. Scale horizontally by adding containers; the semaphore lives pipeline-side per container.
- `remotion.config.ts` pins `Config.setVideoImageFormat("jpeg")` and concurrency suited to container CPU.

---

## 7. Theme System — Reel Visual Identities

A **theme** is a single markdown contract file that fully determines visual output. The pipeline never contains theme logic; it injects the file into the Composition Coder's prompt and the theme's voice persona into TTS. **Adding a theme = adding one file.** Every theme file has the same seven sections:

```
1. Palette        — named hex constants incl. background, 4-tier accent ramps
2. Typography     — font stack, sizes for title/body/caption/formula, weight rules
3. Motion         — easing curves, durations, what animates and what NEVER does
4. Layout         — safe areas (top 240px / bottom 300px reserved for UI + captions),
                    grid, caption block position
5. Scene patterns — the 10 pattern specs (7.2) rendered in this theme's language
6. Voice persona  — TTS voice id + style instruction + pacing modifier
7. Image style    — suffix appended to every gpt-image prompt for in-theme rasters
```

### 7.1 The Launch Themes (five)

#### Theme `slate` — *"Slate"* (math / physics / CS theory) — **default**
- **World:** a dark lecture-slate where ideas glow. Background `#2E3138` (near-black warm grey, never pure black — pure black crushes on OLED and kills layering).
- **Palette:** ink ramps — `AZURE {#1E6E8C, #2FA8C9, #63C7E0, #A8E1F0}`, `MINT {#3E8E6E, #57BE92, #8CDBB4}`, `AMBER {#C99A2E, #EFC94C, #F7E19A}`, `CORAL {#B4533A, #E4735A, #F2A48F}`, text `#ECECEC`. Yellow-tier is reserved for *emphasis moments only* (the traveling dot, the boxed result).
- **Typography:** system serif for narrative titles, `Inter` for labels, KaTeX for all mathematics — formulas are *rendered math*, never plain text approximations.
- **Motion:** ideas **draw themselves** — SVG paths animate via `strokeDashoffset` over 0.8–1.2s with ease-in-out; objects fade+drift-up 20px on entry; a highlighted term pulses once, never loops. Camera is static; the *content* moves.
- **Signature:** every equation derivation ends with the result boxed in a 3px AMBER stroke that draws itself.
- **Voice persona:** calm, curious, slightly wry male-neutral voice; TTS instruction: *"measured pace, warm, like sharing a secret insight with a friend; slight upward energy on questions."*
- **Image style suffix:** *"minimalist vector-style illustration on dark slate background, thin luminous outlines, no text."*

#### Theme `folio` — *"Folio"* (history / literature / humanities)
- **World:** aged paper and ink. Background `#F3EBDA` (warm parchment), text `#2B2118` (iron-gall ink).
- **Palette:** `SEPIA #8A6B4B`, `OXBLOOD #7A2E2E`, `VERDIGRIS #4E7A6A`, `GOLDLEAF #B98F2E`.
- **Typography:** high-contrast serif (Playfair-class) for titles, humanist serif body; pull-quotes get oversized hanging quotation marks.
- **Motion:** slower (1.2–1.6s reveals), horizontal wipes like turning pages; timeline scenes scroll a ribbon left-to-right; images arrive with a subtle Ken-Burns drift inside a gold-leaf frame.
- **Signature:** dates and names get an animated underline "penstroke."
- **Voice persona:** warm storyteller; instruction: *"narrative documentary tone, unhurried, with gravity on dates and names."*
- **Image suffix:** *"engraved etching style, sepia and oxblood ink on parchment texture, archival illustration, no text."*

#### Theme `circuit` — *"Circuit"* (programming / AI / tech systems)
- **World:** a dark terminal with electric accents. Background `#0D1117`, panel surfaces `#161B22` with 1px `#30363D` borders (card-on-dark, glassmorphism-lite).
- **Palette:** `VOLT #3FDC97`, `CYAN #35C9E8`, `VIOLET #A78BFA`, `SIGNAL #F97316`, text `#E6EDF3`. Data flows are always VOLT; errors/warnings always SIGNAL.
- **Typography:** monospace (`JetBrains Mono`-class) for code and labels, geometric sans for titles. Code blocks render with syntax-highlight colors from the palette and **type on** character-by-character at 30–40 chars/s.
- **Motion:** snappy (0.3–0.5s), spring physics on panels; animated dashes flow along connection edges; state changes flash the node border.
- **Signature:** flowchart/pipeline scenes look like glowing circuit traces; a packet-dot travels the active path.
- **Voice persona:** energetic, precise; instruction: *"clear and quick, techie enthusiasm without shouting; crisp consonants."*
- **Image suffix:** *"dark UI isometric tech illustration, neon green and cyan accents on near-black, clean geometry, no text."*

#### Theme `sprout` — *"Sprout"* (biology / chemistry / earth science, younger learners)
- **World:** bright, rounded, friendly. Background `#FDFBF4` (paper cream), rounded-corner everything (radius 24px).
- **Palette:** `LEAF #57A85C`, `SKY #4FA3D8`, `SUN #F4B942`, `BERRY #D65A7E`, `SOIL #8A6349`, ink `#33393B`.
- **Typography:** rounded sans (Nunito-class), larger sizes than other themes (+15%), maximum two text elements on screen at once.
- **Motion:** bouncy springs (overshoot 1.1), elements "pop" in with scale 0→1.05→1; molecules and cells are blob-friendly shapes with soft shadows; wiggle-on-mention (±3° rotate) for the concept being narrated.
- **Signature:** labeled-diagram scenes (`anatomy-label` pattern) with leader lines that grow from the part to the label.
- **Voice persona:** bright and encouraging; instruction: *"friendly teacher energy, smiling voice, extra clarity on new words."*
- **Image suffix:** *"flat rounded children's-textbook illustration, soft shadows, cheerful palette, white-cream background, no text."*

#### Theme `ledger` — *"Ledger"* (economics / business / statistics / exam-cram)
- **World:** crisp editorial data-journalism. Background `#FFFFFF`, ink `#111418`, hairline grid `#E3E6EA`.
- **Palette:** `NAVY #1E3A5F`, `TEAL #2A9D8F`, `MUSTARD #E9C46A`, `BRICK #C1442E`. One accent per chart, ever.
- **Typography:** condensed grotesk headlines (uppercase, tight tracking), tabular-numeral body. **Numbers are the heroes**: stat callouts render at 160px and count up.
- **Motion:** restrained — bars grow with ease-out 0.6s, one element at a time, everything else instant. No decoration that isn't data.
- **Signature:** the "big number" scene — a single counted-up statistic with a one-line caption; every reel gets at most one.
- **Voice persona:** confident analyst; instruction: *"newsroom clarity, deliberate emphasis on figures, no filler."*
- **Image suffix:** *"minimal editorial infographic illustration, flat color blocks, generous whitespace, no text."*

### 7.2 Scene Pattern Library (theme-independent IDs, theme-dependent rendering)

Every theme file must specify how it renders these ten patterns; the Scene Planner tags scenes with pattern IDs, the Composition Coder implements them in the active theme's language:

| ID | Pattern | Typical use |
|---|---|---|
| `graph-network` | nodes + edges, growth/traversal animation | graphs, networks, org/dependency structures |
| `coordinate-plot` | axes + curve draw-on + moving point | functions, trends, distributions |
| `equation-steps` | derivation lines appearing one transform at a time, changed term highlighted | math, physics, econ derivations |
| `flowchart` | boxes + arrows with a traveling pulse | processes, algorithms, pipelines |
| `comparison-split` | vertical split screen, mirrored layouts | X vs Y, before/after, strong-vs-weak |
| `timeline` | horizontal ribbon with milestone pins | history, project phases, evolution |
| `state-machine` | labeled states, animated transitions | automata, lifecycle, chemistry states |
| `bar-ranking` | animated ranked bars | comparisons with magnitude |
| `anatomy-label` | central figure + leader-line labels | biology, hardware, geography |
| `freeform` | anything bespoke within theme law | whatever doesn't fit above |

### 7.3 Theme selection

The user picks a theme per series; **"auto" is the default**, where the Series Planner selects the theme from subject detection (`math/physics/cs-theory → slate`, `humanities → folio`, `tech/programming → circuit`, `bio/chem + reading level ≤ grade 9 → sprout`, `business/stats/econ → ledger`).

---

## 8. Infographic Post Generator

Every reel can ship with a **post** — a 1–5 slide image carousel designed for saving and sharing (this is both a study artifact and the organic-growth engine: posts carry a small wordmark).

**Stage 4c, two steps:**

1. **Copywriter** (`MODEL_WRITER`, structured output): from the reel's key points, produce
   ```python
   class InfographicSlide(BaseModel):
       slide_number: int
       layout: Literal["cover", "concept", "steps", "compare", "recall"]
       headline: str          # ≤ 8 words
       body_lines: list[str]  # ≤ 4 lines, ≤ 9 words each
       visual_brief: str      # what the image should depict
   class InfographicPost(BaseModel):
       slides: list[InfographicSlide]   # 1–5; slide 1 is always "cover"
       caption: str                     # feed caption incl. 3 topical hashtags
   ```
2. **Renderer** — two modes, config-switchable:
   - **`mode=image` (launch):** one `gpt-image-1.5` call per slide, `1024×1536` (2:3 portrait), prompt = visual brief + exact headline/body text to render + the theme's image suffix + a fixed layout scaffold ("bold headline top, supporting visual center, ≤4 short lines bottom"). Modern image models render short text reliably; keep per-line text ≤9 words and regenerate a slide once on garbled-text detection (OCR spot-check with `gpt-4.1-mini` vision: "does this image contain exactly these words?").
   - **`mode=composed` (v2, pixel-perfect text):** generate only the imagery with `gpt-image-1.5`, then compose text over it with Pillow using theme fonts/colors. Deterministic typography, image model handles art only.

The **recall** slide type is special: it renders a question with the answer upside-down or on the next slide — active-recall bait that makes posts worth saving.

---

## 9. Playable Reels (Interactive Game Reels)

A playable reel is a **60–120 second micro-game** that appears in the feed like any reel, but is interactive. Rule #1: **games are parameterized templates, not generated code.** The LLM designs *content* (questions, pairs, sequences, distractors); the game *engines* are five hand-built, heavily-polished TypeScript components shipped inside the app. This keeps quality high, cost near-zero, and the attack surface closed (no arbitrary generated code executes on user devices).

### 9.1 The five launch engines

| Engine | Mechanic | Best for |
|---|---|---|
| `tap-quiz` | timed multiple choice, 3–5 questions, streak multiplier | definitions, facts, formula recognition |
| `pair-match` | drag/tap to match two columns (term ↔ meaning, formula ↔ name) under a timer | vocabulary, mappings |
| `order-up` | drag steps into correct sequence | processes, derivations, historical order |
| `slider-predict` | "set the slider to your prediction" → animated reveal of the true value | quantities, magnitudes, graph intuition |
| `bug-hunt` | a worked solution with one planted error; tap the wrong line | math derivations, code, grammar |

### 9.2 Game Designer stage (4d)

For each reel with `wants_game=true`, `MODEL_PLANNER` produces:

```python
class GameSpec(BaseModel):
    engine: Literal["tap-quiz", "pair-match", "order-up", "slider-predict", "bug-hunt"]
    title: str
    intro_line: str                 # one-line challenge framing, e.g. "Think you know AR(1)?"
    payload: dict                   # engine-specific, validated against per-engine schema
    difficulty: Literal["warmup", "standard", "spicy"]
    concept_tags: list[str]         # links results back to plan nodes
```

Each engine has its own strict payload schema (e.g. `tap-quiz`: `questions: [{prompt, options[4], correct_index, explanation}]` — the `explanation` shows after answering, right or wrong; that's where the teaching happens). The designer prompt requires **plausible distractors derived from real misconceptions**, not random wrong answers.

### 9.3 Runtime & scoring

- Engines render in the app's feed (React components; on native, in the same JS runtime — no WebView needed since engines ship with the app).
- Results post to `POST /games/{id}/result` `{score, accuracy, duration_ms}` → feeds streaks, plan-node mastery, and (opt-in) class leaderboards.
- Mastery model (simple, v1): a plan node is `mastered` after ≥80% accuracy on two game sessions on different days. Mastered nodes compress in Revision Mode.

---

## 10. Study Plan Engine

**Input:** a syllabus PDF (or pasted topic list), optional exam date, optional hours/week, optional "I already know these" selections.

**Stage S1 — Syllabus Analyzer** (`MODEL_REASONING`, file input, structured output):

```python
class TopicNode(BaseModel):
    id: str                      # slug
    title: str
    unit: str                    # parent unit/chapter name
    subtopics: list[str]
    depends_on: list[str]        # topic ids — prerequisite edges
    exam_weight: Literal["high", "medium", "low", "unknown"]  # from marks distribution if present
    estimated_study_minutes: int
class SyllabusMap(BaseModel):
    course_title: str
    nodes: list[TopicNode]       # a DAG — validate acyclicity in code, not by trusting the model
```

Pipeline code validates the DAG (cycle check via topological sort; on cycle, drop the back-edge and log).

**Stage S2 — Scheduler (pure code, no LLM):** topological order weighted by exam weight and date pressure → dated plan. Spaced repetition built in: each node gets a **review slot** 3 days after first study and a **revision slot** in exam week. If hours/week can't fit all nodes before the exam, low-weight nodes are flagged `stretch` rather than silently dropped, and the user is told.

**Stage S3 — Lazy content generation:** reels/posts/games for a plan node are generated **2 days before the node's scheduled date** (batch, off-peak), not all upfront — a 40-node syllabus generated eagerly would cost real money for content the student may never reach. "Generate now" per node is available as a paid-tier/manual override.

Plan mutations: mark done, snooze node (reflows schedule), mark known (skips generation), pull forward.

---

## 11. Social Layer

Deliberately **light** — this is a study tool with ambient social warmth, not a social network.

### Entities
- **Class** — a container with an invite code. Members see each other's *study activity*, never each other's *content library*.
- **Study signal** — auto-emitted, coarse events: "Aisha completed *Ordinary Differencing*", "3 classmates are on Unit 2 this week". No timestamps finer than a day, no watch-time, no scores unless the user opts into leaderboards.
- **Study Match** *(opt-in)* — weekly pairing of two classmates within ±1 plan node of each other; the app suggests a shared playable reel as an icebreaker ("You both study *Ljung-Box tests* this week — race this quiz").
- **Shares** — any reel/post/game can be shared to the class feed with a one-line note; recipients get it in their feed without affecting their plan.
- **Streaks** — personal daily streak (any node progress counts); class-visible only if opted in.

### Privacy defaults (non-negotiable)
- Everything social is **opt-in at class-join time**, per toggle: activity visibility / leaderboards / study match.
- Minors' classes (school-created): leaderboards off by default, matches require teacher enablement, no cross-class visibility ever.
- Full anonymous mode: participate in a class as "Anonymous Axolotl"-style handles.

---

## 12. Data Model

Postgres. Key tables (abridged — id/created_at/updated_at everywhere):

```sql
users            (id, handle, display_name, email, avatar_url, privacy_flags jsonb)
classes          (id, name, invite_code, school_id?, settings jsonb)
class_members    (class_id, user_id, role: member|teacher, social_optins jsonb)

documents        (id, user_id, s3_key, kind: syllabus|notes|slides, title, page_count,
                  moderation_status)
plans            (id, user_id, document_id, exam_date?, hours_per_week?, status)
plan_nodes       (id, plan_id, topic_id, title, unit, depends_on text[], exam_weight,
                  scheduled_date, review_date?, status: pending|generating|ready|done|
                  mastered|skipped|stretch)

jobs             (id, user_id, kind: series|node_content|revision, status, stage,
                  state jsonb, cost_cents, error?)
series           (id, job_id, plan_node_id?, title, theme, style_contract jsonb)
reels            (id, series_id, number, topic, status: published|quarantined|failed,
                  video_s3?, poster_s3?, duration_s?, scene_data jsonb,
                  word_timestamps jsonb, error jsonb?)
posts            (id, reel_id, slides jsonb, slide_s3_keys text[], caption)
games            (id, reel_id, engine, spec jsonb, difficulty, concept_tags text[])
game_results     (id, game_id, user_id, score, accuracy, duration_ms)

feed_items       (id, user_id, kind: reel|post|game|share|signal, ref_id,
                  available_on date, seen_at?, source: plan|quickdrop|share)
study_signals    (id, class_id, user_id, plan_node_title, day)
matches          (id, class_id, user_a, user_b, week, node_title, status)
```

S3 layout: `docs/{id}.pdf`, `series/{id}/reel-{n}/{audio.wav,video.mp4,poster.webp,asset-*.webp}`, `series/{id}/post-{n}/slide-{k}.webp`.

---

## 13. API Surface

FastAPI, JWT auth, versioned under `/v1`. Highlights:

```
POST /v1/documents                      multipart upload → moderation → document id
POST /v1/plans                          {document_id, exam_date?, hours_per_week?} → SyllabusMap + draft plan
PATCH /v1/plans/{id}/nodes/{node_id}     mark done/known/snooze/pull-forward
POST /v1/quickdrop                      {document_id, reel_count, theme} → job id   (Flow B)
POST /v1/jobs/{id}/cancel
GET  /v1/jobs/{id}/events               SSE: stage transitions + per-reel status + log lines
GET  /v1/feed?date=today                paginated feed items (reels, posts, games, shares)
GET  /v1/reels/{id}/stream              MP4 with HTTP Range support (seek/scroll-scrub)
POST /v1/games/{id}/result
POST /v1/classes / POST /v1/classes/join {invite_code, social_optins}
GET  /v1/classes/{id}/pulse             study signals + optional leaderboard
POST /v1/shares                         {class_id, ref_kind, ref_id, note}
GET  /v1/matches/current                this week's match, if opted in
```

**Progress streaming contract** (SSE event shapes the client renders as a live "building your reels" screen):

```json
{"type":"stage","job":"…","stage":"series_planner","status":"done"}
{"type":"reel","job":"…","n":3,"stage":"composition_coder","status":"running"}
{"type":"reel","job":"…","n":2,"status":"published","video_url":"…"}
{"type":"done","job":"…","succeeded":4,"quarantined":1,"failed":0}
```

---

## 14. Mobile-First Frontend

*(Directional spec — backend contracts above are the source of truth.)*

- **Stack:** React Native (Expo) for iOS/Android + the same codebase exported as a PWA. Portrait-locked feed.
- **The feed IS the app.** Home is a full-screen vertical pager (TikTok-grammar): swipe up = next item; reels autoplay muted with karaoke captions (audio on tap); posts render as horizontally swipeable carousels inside the vertical feed; playable reels show a "Tap to play" cover and take over gesture handling while active.
- **Tab bar (4):** `Feed` · `Plan` (calendar/DAG view of plan nodes with status colors) · `Class` (pulse, matches, shares) · `You` (streak, mastery map, library).
- **Generation UX:** after upload, a "building" card pins to feed top, driven by the SSE stream — stage checklist plus per-reel tiles flipping from skeleton → poster as each publishes. Users can leave; push notification on `done`.
- **Design system:** typography-first, 8pt grid, one accent color per theme surface (reels carry their theme; app chrome stays neutral), dark and light app modes independent of reel themes. Thumb-zone: all primary actions in the bottom 40% of screen.
- **Offline:** today's plan-node reels pre-download on Wi-Fi; games are offline-native (spec is local JSON); results sync later.
- **Performance budgets:** feed scroll 60fps; first reel playable < 2s from cold start on a mid-range Android; MP4s served H.264 1080×1920 ~3–4 Mbps with 540p fallback variant.

---

## 15. Non-Functional Requirements

**Cost envelope per reel** (order-of-magnitude targets, enforce via per-job `cost_cents` accounting):

| Item | Est. |
|---|---|
| Planning + script calls (4–6 small calls) | $0.02–0.05 |
| Composition Coder (1 large reasoning call) | $0.05–0.15 |
| TTS (~45s audio) | ~$0.01 |
| Transcription alignment | ~$0.005 |
| Infographic (3 slides) | ~$0.10–0.25 |
| Render compute (2 vCPU-min) | ~$0.01 |
| **Total per reel + post + game** | **≈ $0.20–0.50** |

Per-user daily generation quota (free tier: e.g. 1 plan node or 1 quickdrop/day) is a launch requirement, not an afterthought.

**Reliability:** every stage idempotent + resumable from persisted `ReelJobState`; LLM calls retried ×2 then fall back to `MODEL_FALLBACK`; a reel's failure never blocks siblings; the Collector always reports truthfully (`succeeded/quarantined/failed`), and quarantined reels are one-tap re-generatable (re-runs stages 6–8 only).

**Safety:** moderation on every upload and every generated script before spending render money; generated game payloads validated against strict per-engine schemas (never `eval` anything); social content limited to short notes, also moderated; COPPA/FERPA posture for school classes (minimal PII, teacher controls, no ads).

**Observability:** per-stage latency/cost/success metrics tagged by model + theme; sampled storage of failed Composition Coder outputs with their tsc/render errors — this corpus is gold for improving the engineering guide and theme contracts over time.

**Testing:** golden-path integration test that runs a 2-page fixture PDF → 2 reels end-to-end against recorded LLM cassettes; render service contract-tested with a known-good and known-bad `.tsx` pair; scheduler property-tested (never schedules a node before its prerequisites; always fits or flags).

---

## 16. Build Roadmap

**M1 — Spine (weeks 1–3):** render service + engineering guide + `slate` theme; pipeline stages 1–3, 4a, 5–9; Flow B (quickdrop) end-to-end via CLI; golden-path test green. *Exit: PDF → 3 published MP4s, honest failure reporting.*

**M2 — Product core (weeks 4–6):** FastAPI + SSE + S3 + Postgres job state; mobile feed app with quickdrop, streaming build screen, reel playback; `circuit` + `ledger` themes; infographic generator (`mode=image`).

**M3 — The plan (weeks 7–9):** Syllabus Analyzer + scheduler + lazy node generation; Plan tab; Revision Mode; `folio` + `sprout` themes.

**M4 — Play & people (weeks 10–12):** five game engines + Game Designer stage + mastery; classes, signals, shares, streaks, Study Match; quotas, moderation hardening, leaderboards.

**Post-launch bets:** composed-mode infographics (pixel-perfect text), multi-language reels (re-run TTS + captions only), teacher dashboards, "explain it differently" regeneration (same scene plan, new script persona), user-tunable theme forks.

---

*This is a living document. Model IDs in Section 4 are configuration — revisit them quarterly; the architecture does not change when they do.*
