# ReelLearn Revamp — Living Contract

## Deliverable

A polished, responsive web app that demonstrates the complete ReelLearn loop: upload learning material, configure a learning goal and visual style, generate a study plan, browse/play reels and infographic posts, complete an interactive recall activity, and connect with a class/study partner.

## Acceptance criteria

- The primary upload-to-plan-to-content path works in the browser without a backend or credentials.
- PDF/text/notes input is accepted; the UI clearly distinguishes local demo generation from a connected AI pipeline.
- Generated results include a dated editable-looking plan, playable animated reel, multi-slide infographic post, and active-recall interaction.
- Multiple visual templates/styles are visibly previewable and affect generated content.
- A class/community area demonstrates joining, classmates' activity, a study-match flow, and a shared learning goal.
- The product looks intentionally designed on desktop and mobile, with responsive layout rather than a desktop phone mockup.
- Important controls have accessible labels, keyboard-visible focus, reduced-motion behavior, and usable contrast.
- `npm run lint` and `npm run build` pass; flagship interactions are browser-verified at desktop and mobile widths.

## Constraints copied from the request

- "complete revamp of it with a better UI"
- "app that works end-to-end"
- "posts would be the concepts in an understandable fashion in infographic style"
- "reels would have the motion videos"
- "uploading to create a goal plan"
- "different templates and different styles"
- "playable reel features"
- Demonstrate "other people connecting" and the "class connection thing."
- Use the supplied spec and rough reference as inputs, but make the result materially better.

## Explicit non-goals for this local build

- No production auth, billing, persistent database, render farm, or external social messages.
- No browser-side exposure of model API keys.
- No claim that simulated/local generation is a completed paid OpenAI/Remotion backend.

## Design candidates considered

1. Mobile-only social feed: strongest short-form-media familiarity, weakest syllabus workflow and desktop usability.
2. Desktop creator dashboard: strongest authoring controls, weakest student delight and consumption flow.
3. Responsive learning studio + immersive player: balances a clear creation workflow with captivating reels/posts and class collaboration. **Chosen.**

## Kill criterion

If the studio/player split makes the flagship upload-to-result path require more than one obvious primary action per stage, collapse it into a guided single-page creation flow. If animated content causes mobile interaction or reduced-motion failures, replace ornamental motion before cutting functional feedback.

## Decisions (append-only)

- 2026-07-21: Preserve the existing React/Vite stack; replacing the framework adds no product value.
- 2026-07-21: Build a credential-free local generation adapter for a truthful, testable end-to-end demo; leave the external AI/render boundary explicit.
- 2026-07-21: Use code-rendered educational visuals for core samples so reels and posts stay responsive and controllable.
- 2026-07-21: Use a finite Today session and explicit plan progress instead of an infinite feed; completion and retrieval are the product goal, not watch time.
- 2026-07-21: Render infographic posts at 4:5 and keep educational copy as HTML/SVG over artwork for editing, accessibility, and factual review.
- 2026-07-21: Treat uploaded material as the source of truth. Local generation adds no unlabelled outside claims; production enrichment must be explicit and cited.

## Verification log

- Verified `npm run lint` exits 0.
- Verified `npm run build` exits 0; PDF parsing is code-split from the initial bundle.
- Verified responsive layouts in WebKit at 1440×1000 and 390×844.
- Verified a real one-page PDF upload extracts 61 readable words in-browser.
- Verified sample source → goal → outputs → Neon Lab template → staged build → persisted generated workspace.
- Verified reel play/mute controls, infographic slide navigation, playable answer feedback, source drawer, class join, and Study Match interactions.
- Verified browser console reports zero errors and zero warnings.

## Follow-up contract — live OpenAI integration (2026-07-21)

- Keep `OPENAI_API_KEY` server-only; never expose it through Vite, browser JavaScript, responses, logs, or local storage.
- Replace the primary local generation path with a real OpenAI Responses API structured-output call.
- Generate at least one topic-relevant visual through the current GPT Image model and use it in the learning experience.
- Preserve the deterministic local adapter as a clearly reported fallback if the API is unavailable.
- Validate and cap source/request size, treat uploaded text as untrusted data, redact upstream errors, and prevent arbitrary model/parameter selection from the browser.
- Verify the credential with a bounded real API call, then browser-test the live creation path without printing the secret.

### Follow-up design candidates

1. Browser calls OpenAI directly: lowest code volume, rejected because it exposes the API key.
2. One server endpoint orchestrates structured planning plus one optional image: chosen for the smallest secure end-to-end vertical slice.
3. Full durable worker/render service now: strongest production architecture, deferred because it materially expands this direct-web integration beyond the requested credential connection.

### Follow-up kill criterion

If GPT Image failure prevents a valid text lesson from completing, publish the text-backed workspace with a visible warning and retain code-rendered visuals. If a source exceeds the bounded context policy, reject or truncate it explicitly before spending on a model request.

### Follow-up decisions (append-only)

- 2026-07-21: Default to the current resolved flagship text model `gpt-5.6-sol`; keep model selection server-owned and overridable only through server environment variables.
- 2026-07-21: Use `gpt-image-2` rather than the spec’s now-stale image model and keep generated art free of educational text/labels.
- 2026-07-21: Generate one first-topic WebP and one first-reel MP3, save both behind same-origin `/generated/` URLs, and persist only those URLs in the browser.
- 2026-07-21: Stream real moderation/planning/image/voice/collector events as NDJSON. Do not simulate progress percentages or silently fall back after a live failure.
- 2026-07-21: Permit manual local fallback for transient availability/schema/rate errors, never for moderation blocks or an insufficient/unrelated source.

### Follow-up verification

- Verified the server detects the terminal `OPENAI_API_KEY` without printing it.
- Verified `/api/health` reports OpenAI plus `gpt-5.6-sol`, `gpt-image-2`, and `tts-1`.
- Verified a bounded live smoke call returns five structured topics, a 1024×1536 WebP, and a 24 kHz MP3 with both asset URLs readable.
- Verified the complete browser creation flow streams real stages, persists `provider=openai`, and renders same-origin visual/narration URLs.
- Verified the generated reel artwork at desktop and 390×844 mobile widths; narration changes to an active mute control and requests the MP3 with HTTP 206 range responses.
- Verified browser console: zero errors and zero warnings after live generation/playback.

## Follow-up contract — semantic infographics and Remotion reels (2026-07-21)

### Deliverable and acceptance criteria

- Replace the repeated ornament/template treatment with topic-specific educational visual grammar.
- Use GPT Image 2 to render complete, detailed 4:5 infographic slides that include intentionally short learning text, not merely decorative art behind HTML.
- Have the text model first produce a typed, source-grounded infographic brief containing exact copy, layout grammar, hierarchy, illustration direction, and constraints; send that brief to GPT Image 2.
- Keep the exact generated learning copy as structured application data and accessible HTML because image text can still drift.
- Auto-select visual grammar from the concept (process flow, anatomy/cutaway, comparison, timeline, network, equation/steps, or system map); selected style templates may affect brand tokens but must not force identical layouts.
- Replace the generic CSS orbit reel with a real parameterized Remotion composition whose objects and motion express the topic. The ATP proof must visibly communicate energy transfer/cellular machinery rather than a palette swap.
- Use fixed, typed compositions and scene-plan data. Never execute model-generated TSX or permit browser-controlled paths/render options.
- Prove the path with live OpenAI infographic generation, a playable Remotion preview, and an actual rendered video asset; then re-run lint, build, responsive browser, and security checks.

### Design candidates considered

1. Let the model generate arbitrary React/Remotion code: maximally flexible, rejected because syntax validation is not a security boundary and reliability would depend on compiling untrusted code.
2. Keep one generic composition and swap copy/colors: easy to maintain, rejected because it reproduces the exact topic-agnostic failure being corrected.
3. Use a typed semantic scene engine with specialized visual grammars and a safe fallback: **chosen**. GPT produces constrained scene/infographic specifications; reviewed code renders them differently by concept.

For infographic rendering:

1. Render all text in HTML over a decorative image: accurate/editable but explicitly insufficient for the requested generated infographic artifact.
2. Put all lesson copy only inside a GPT-generated image: visually cohesive but factual review, accessibility, and text fidelity are fragile.
3. Generate a complete text-bearing infographic from a concise typed brief, while retaining the same exact copy as accessible structured data: **chosen**.

### Kill criteria

- If two different visual grammars produce only a color/copy swap, the architecture has failed and must be revised before completion.
- If the ATP composition does not visibly show a pathway, transfer, or cellular process using topic-specific objects, do not call it a Remotion implementation.
- If image-rendered copy cannot be reconciled with the structured exact copy, label the image as illustrative and surface the authoritative copy next to it; never silently treat uncertain image text as the lesson source.
- If server rendering cannot complete reliably in the installed environment, keep the in-browser Remotion Player working and report the renderer blocker; do not substitute a CSS animation and claim success.

### Decisions (append-only)

- 2026-07-21: Follow official GPT Image guidance: prompts use labeled sections in the order context/use → subject/content → composition/hierarchy → exact text → style → constraints.
- 2026-07-21: Generate three purposefully distinct first-topic infographic slides (concept map, mechanism/process, and retrieval recap) instead of three copies of one visual.
- 2026-07-21: Treat visual templates as style tokens (palette, typography mood, texture, motion character), while concept grammar owns spatial layout and motion choreography.
- 2026-07-21: Reuse the same parameterized Remotion composition data for the web Player and MP4 renderer so preview and export cannot drift structurally.
- 2026-07-21: Auto Director is the default. It selects a concrete brand skin per topic, while the semantic router independently selects each post and motion grammar.
- 2026-07-21: Bound eager image cost to three slides for the first topic plus one hero infographic for every remaining topic; unrendered secondary slides keep distinct semantic diagram fallbacks.
- 2026-07-21: Pin `remotion`, `@remotion/player`, `@remotion/renderer`, `@remotion/bundler`, and `@remotion/media` to the same verified version (`4.0.495`).
- 2026-07-21: Use a fixed validated scene DSL and eight hand-built semantic renderers; never compile model-authored code.
- 2026-07-21: Serialize local Chrome exports and cache the static Remotion bundle. Production durability, cancellation, distributed workers, and licensing remain deployment work.
- 2026-07-21: Lazy-load Player/media/composition code; the dashboard shell must not pay the Remotion parse cost before its fallback can paint.

### Verification

- Verified official GPT Image 2 guidance supports text-heavy infographics and complex multi-panel compositions; prompts now use labeled deliverable, objective, source facts, grammar, art direction, exact text, typography, and constraints sections.
- Verified official Remotion APIs and installed 4.0.495 types for parameterized compositions, `Series`, `Sequence`, `interpolate`, `spring`, `Player`, `bundle`, `selectComposition`, and `renderMedia`.
- Verified all eight Remotion grammar renderers through real frame selection/renders; visually inspected ATP intro, proton-gradient/membrane/turbine mechanism, ADP + Pi → ATP result, and take-home frames.
- Verified a full H.264 export: 1080×1920, 30 fps, 360 frames, 12.053 seconds, AAC audio track.
- Verified a complete browser workflow using the connected OpenAI key: sample syllabus → goal → Auto Director → six grounded topics → eight unique GPT Image WebPs → TTS MP3 → Remotion MP4 → persisted workspace.
- Verified the live workspace reports three first-topic infographic images, one image for every other topic, motion plans for every topic, and unique URLs for all eight images.
- Verified live routing diversity: six topics use multiple post grammars and `neon-lab`, `editorial`, `kinetic`, and `field-notes` styles selected automatically.
- Visually inspected the eight-image live montage: ATP energy flow, ATP transfer anatomy, retrieval equation, enzyme comparison, membrane transport, carrier cycle, fermentation response, and glycolysis spatial process are structurally distinct.
- Verified generated assets return 200 with `image/webp`, `audio/mpeg`, and `video/mp4` content types.
- Verified Remotion Player play/pause, unmute/mute, seek/progress, fullscreen control presence, and MP4 link; narration returns HTTP 206 range content.
- Verified generated infographics and Remotion Player at 1440×1000 and 390×844; browser console reports zero errors and zero warnings after switching to `@remotion/media` audio.
- Verified the final live chemiosmosis plan opens a topic-specific Remotion reel showing the inner mitochondrial membrane, H+ gradient, moving protons, rotating ATP synthase, and a fitted carrier → ATP equation.
- Verified the initial production JS chunk fell from 1,016.95 kB (291.04 kB gzip) to 281.83 kB (86.36 kB gzip); the Remotion engine is isolated in a lazy chunk.
- Verified final `npm run lint`, `npm run build`, and `npm audit --omit=dev` exit 0.

## Follow-up contract — Remotion style direction and composition audit (2026-07-22)

### Deliverable and acceptance criteria

- Audit how the EduScroll reference creates its strongest Remotion styles: planning data, visual registry, scene composition, typography, motion curves, semantic primitives, pacing, and narrative payoff.
- Improve ReelLearn's actual Remotion compositions, not only the surrounding feed. The four existing brand styles must differ through composition, typography, stage treatment, texture, motion character, and transitions—not merely palette values.
- Keep semantic grammar and brand direction independent: maths equations and physics diagrams remain exact and subject-native under every brand style.
- Make the four narrative beats affect visible direction and staging. A beat change must alter hierarchy, framing, emphasis, or visual construction, not only swap a caption at the bottom.
- Preserve the fixed typed visual DSL, Player/export parity, narration-derived duration, active-only feed playback, generated assets, and existing source truth.
- Reuse scalable deterministic primitives from the reference where they improve quality; do not copy one-off compositions or execute generated React/TSX/SVG paths.
- Verify representative frames for at least maths, physics, cycle/network, and energy-transfer content across multiple styles at 1080×1920 and in the 390 px feed.
- Keep captions readable, diagrams inside the safe stage, motion deterministic, and browser/MP4 outputs visually aligned.

### Design candidates considered

1. Change only theme colours and fonts: smallest change, rejected because the existing reels already prove that palette swaps do not create meaningfully different direction.
2. Generate a bespoke Remotion component for every topic: flexible, rejected because arbitrary executable visual code is unsafe, hard to validate, and impossible to keep preview/export consistent.
3. Add a deterministic direction layer that combines semantic grammar + brand motion profile + narrative beat staging: **chosen provisionally**, because it can create genuinely different reels while preserving the validated MotionSpec boundary.

### Kill criteria

- If two brand styles still share the same stage silhouette, typography hierarchy, transition pattern, and camera behavior after recolouring screenshots to grayscale, the direction layer is incomplete.
- If beat changes only update caption copy while the central visual remains unchanged, narrative staging is incomplete.
- If any style hides an exact equation, detaches a physics vector, clips a diagram, or changes the semantic relation, revert that style treatment before completion.
- If Player and MP4 receive different direction data or render different structures, consolidate before completion.
- If the implementation requires model-authored code or raw SVG/HTML/CSS, return to the deterministic registry design.

### Decisions (append-only)

- 2026-07-22: Treat subject grammar as the lesson's truth and brand motion profile as its cinematic direction; neither may overwrite the other.
- 2026-07-22: Use the reference as evidence for reusable visual principles and timing patterns, not as a code source to transplant wholesale.
- 2026-07-22: Confirm the deterministic direction layer. Map the same four safe narrative beats to hook, model, worked example, and retrieval visual states; weight their frame allocation by narration copy instead of dividing time equally.
- 2026-07-22: Give Kinetic, Editorial, Field Notes, and Neon Lab independent typography, background texture, stage geometry, transition physics, caption chrome, and progress treatment while every style reuses the same semantic renderer.
- 2026-07-22: Use generated artwork only as a low-opacity mood layer. Exact equations, paths, vectors, labels, and relationships remain deterministic code-rendered truth.
- 2026-07-22: Reserve separate vertical zones for the concept stage, narrative caption, and Player controls. In physics, reserve a vector legend rail and annotation columns instead of attaching long labels to moving arrowheads.

### Verification

- Verified the installed Remotion 4.0.495 APIs and audited EduScroll's bespoke equation, trajectory, wave, bonding, and scene-router compositions. The transferable pattern is typed scenes plus subject-native primitives and local scene time, not generated TSX.
- Verified all four directions at the same physics example frame. Their typography, backgrounds, stage silhouettes, transition/caption systems, and progress chrome are visibly distinct; the final comparison is `.generated/remotion-style-audit/final3-four-direction-physics-montage.png`.
- Verified math hook → construction → worked transformation → retrieval frames preserve the supplied expressions; physics setup → monotonic trajectory → tangent velocity/gravity → retrieval frames keep vectors anchored and labels collision-free.
- Verified cycle, network, energy-transfer, maths, and physics stills at 1080×1920. Recall hides its payoff until the delayed reveal instead of displaying the answer with the prompt.
- Verified the 390×844 WebKit feed with visible native Player controls: the caption ends at y=663 and controls begin at y=694, leaving a clean gap; browser console reports zero errors and zero warnings.
- Verified an actual final H.264/AAC export: 1080×1920, 30 fps, 360 frames, 12.053 seconds, 2,597,457 bytes. Player and export both receive the same `MotionSpec`, resolved theme, and `directionId`.
- Verified `npm run smoke:direction`, `npm run smoke:remotion`, `npm run lint`, `npm run build`, and `npm audit --omit=dev` exit successfully; the production dependency audit reports zero vulnerabilities.

## Follow-up contract — EduScroll-inspired finite reel learning feed (2026-07-21)

### Deliverable and acceptance criteria

- Opening Watch from any topic must enter a finite vertical feed backed by `CourseWorkspace.topics`, starting on that exact topic.
- One concept occupies one snap viewport. Wheel, touch, Arrow/Page keys, Home, End, and explicit previous/next controls must move through the learning path.
- Mount and autoplay exactly one active Remotion Player; inactive topics use lightweight, subject-aware covers so multiple videos or narration tracks never coexist.
- Preserve the active topic when switching Watch → Swipe → Play → Watch. The header, source context, infographic, and recall question must always describe that same topic.
- Preserve the existing exact-equation maths renderer, labelled motion-diagram physics renderer, generated infographics, source provenance, and rendered MP4 access.
- A narrated MP4 must be long enough to contain its real audio plus an ending hold, with 24–45 seconds as the authoring target rather than a destructive hard cap; never silently truncate narration at the old fixed 12-second default.
- Carry the existing four authored reel scenes into the typed motion plan as timed hook → model → example → retrieval captions, while keeping all visual execution deterministic.
- Make the feed visibly finite and learning-oriented: concept position, unit context, completion progress, key takeaway, and a clear end-of-path retrieval action. Do not add infinite-scroll or social engagement mechanics.
- Give inactive covers genuinely different semantic visuals for maths, physics, and general concept grammars rather than changing only copy or accent colour.
- Keep one vertical scroll owner inside reel mode at desktop and 390 px mobile widths, with no horizontal overflow, hidden close control, or competing modal scroll.
- Respect reduced-motion preferences and retain usable keyboard/focus semantics.
- Implement Save as a local bookmark state and Share through the native share API with a clipboard fallback so visible theater actions are not inert.

### Explicit non-goals

- Do not replace the current app with the legacy mock `FeedScreen`, copy EduScroll wholesale, execute model-authored visual code, add an infinite social feed, or change the generation/render backend in this follow-up.
- Do not fabricate narration for topics that do not have a topic-specific audio asset.

### Design candidates considered

1. Revive the retired mock feed: rejected because its `FeedItem`/CSS-animation model would discard the current generated workspace and real Remotion Player.
2. Add a separate reels route: rejected because it would split Watch from the existing posts, playables, sources, and entry points.
3. Upgrade `ContentTheater` with a workspace-backed finite feed: **chosen** because every existing topic entry point works and topic context stays unified across formats.

For narrated duration: keeping 12 seconds is incorrect; estimating only from word count can drift; reading the generated MP3 duration with the installed Remotion media parser and adding a one-second ending hold is **chosen**, with 12 seconds retained as the minimum for silent or very short reels and no hard cap that can truncate audio.

### Kill criteria

- If more than one Remotion Player or narration track exists at once, switch to active-only mounting before completion.
- If the active topic changes when switching format, lift topic state above every format before completion.
- If the modal and feed compete for vertical scrolling or mobile content exceeds the viewport width, fix layout ownership before completion.
- If covers differ only in title or colour, add grammar- and subject-specific visual structure before completion.
- If an exported video's duration is shorter than its narration, or if the four narrative beats are absent from the stored motion plan, the pacing adaptation is incomplete.

### Decisions (append-only)

- 2026-07-21: Reuse EduScroll's native vertical scroll-snap interaction and its subject-native visual principle, not its one-off hard-coded compositions or UI code.
- 2026-07-21: Use an intersection observer rooted on the feed to select the active concept and mount only its real Player.
- 2026-07-21: Keep the learning path finite, source-backed, and retrieval-led; the final concept hands off to the active topic's playable instead of looping engagement.
- 2026-07-21: Keep topic position in `ContentTheater` so Watch, Swipe, and Play share one source of truth.
- 2026-07-21: Derive narrated render length from parsed MP3 metadata, add a one-second closing hold, and clamp the result to 12–45 seconds so visual pacing remains bounded.
- 2026-07-21: Attach the already validated four `reelScenes` to `MotionSpec.narrativeBeats`; do not ask the model to emit code or a second incompatible storyboard.
- 2026-07-21: Supersede the proposed 45-second hard clamp when narration runs longer: 24–45 seconds remains the authoring target, but the exported video must use the measured audio length plus its closing hold rather than truncate a valid source-grounded beat.
- 2026-07-21: Allow cross-origin reads only for immutable generated assets so Remotion's localhost render origin can decode narration without a CORS fallback; API responses keep their existing origin policy.

### Verification

- Audited the EduScroll prototype by source and browser: adopted ordered 9:16 series navigation, native snap pages, 0.66 visibility activation, and subject-native visual composition; rejected its arbitrary generated TSX, all-video mounting, missing assets, and unsafe production shortcuts.
- Verified at 1440×1000 that ten wheel events in one continuous gesture advance exactly one 705 px topic page; a later gesture advances the next page. The header, rail, counter, and active reel update together and exactly one `.remotion-reel` exists.
- Verified opening concept 3 directly from Plan starts at `03 / 05`, scrollTop `1412` for a 706 px page, and the correct active heading.
- Verified concept 2 survives Watch → Swipe → Play → Watch with the matching infographic and recall labels and the same feed position.
- Verified Home/End/Page navigation, a player-free finite completion page, PageUp back to the final topic, Escape/close body-scroll restoration, and focus return to the exact opening button.
- Verified the background Today preview is replaced by a lightweight cover while the theater is open, preventing the previous two-player autoplay collision.
- Verified at 390×844: document width `390`, dialog height `844`, one 706 px feed scroll owner, a 326×579 active reel, 44×44 save/share/close controls, 44 px format controls, body overflow locked, and no horizontal overflow.
- Verified reduced-motion mode mounts the Player paused, reports `scroll-behavior: auto`, and performs immediate keyboard topic changes.
- Verified Save persists and removes the active topic's local bookmark; Share calls the native share payload and falls back to copying the active topic/link when native sharing is unavailable.
- Verified maths in the feed preserves `x² − 5x + 6 = 0` → `(x − 2)(x − 3) = 0` → `x = 2 or x = 3`. Verified physics moves the projectile from `(247.65, 484.10)` to `(364.8, 249.13)` while the velocity vector origin matches the body's coordinates at both samples.
- Verified a real 18.96-second MP3 parses through installed `@remotion/media-parser` and renders a 599-frame 1080×1920 H.264 MP4 whose final duration is 20.0107 seconds with both video and AAC streams; visually inspected its fourth retrieval beat.
- Verified a new live connected-OpenAI reel-only generation returns three algebra topics, `math-equation`, four stored narrative beats, real narration and MP4, zero warnings, and matching motion/video frame counts. Its 10.488-second narration produces a 12.000-second MP4 rather than being cut off.
- Verified immutable generated assets return `Access-Control-Allow-Origin: *` for the Remotion render origin while API origin behavior remains unchanged.
- Verified fresh desktop and mobile browser sessions report zero console errors and zero warnings.
- Verified final `npm run lint`, `npm run build`, and `npm audit --omit=dev` exit 0; the intentionally lazy Remotion engine remains isolated from the main application chunk.

## Follow-up contract — maths/physics Remotion and direct pasted-source continuation (2026-07-21)

### Deliverable and acceptance criteria

- Mathematics reels must display the actual equation or derivation supplied by the learning plan, with exact expression text dominant and transformations revealed step by step.
- Physics reels must render an actual labelled diagram with deterministic moving bodies, vectors, paths, waves, circuits, or rays as appropriate to the topic.
- Never infer a maths equation by concatenating generic node labels; retain the existing `equation` grammar for non-mathematical transformations and add a dedicated maths grammar.
- Never send physics energy topics through the ATP/mitochondria-specific renderer merely because they mention energy transfer.
- Keep subject-specific motion as a fixed, typed DSL. The model may provide bounded labels, coordinates, vectors, and allowlisted path kinds, but never React, CSS, SVG paths, HTML, or executable expressions.
- Preserve generic semantic motion as the fallback for older workspaces and topics without a valid specialist payload.
- A pasted source with at least the server’s existing 20-character minimum must enable the footer Continue button immediately; clicking Continue must trim and commit it as the source without requiring the separate `Use pasted notes` button.
- Empty, whitespace-only, and shorter-than-20-character pasted sources must remain blocked with visible threshold guidance.
- File upload, sample source, explicit `Use pasted notes`, OpenAI generation, local generation, Player preview, and MP4 export paths must remain operational.

### Design candidates considered

1. Infer equations and physics motion from generic node labels at render time: smallest diff, rejected because it produces plausible-looking but incorrect diagrams and repeats the current failure.
2. Allow the model to author Remotion/React/SVG: flexible, rejected because generated code and paths are not a safe or reliable rendering contract.
3. Add `math-equation` and `physics-diagram` grammars with bounded specialist payloads and deterministic renderers: **chosen** because it is truthful, reusable, preview/export consistent, and backwards compatible.

### Kill criteria

- If a maths fixture does not visibly preserve its exact equation text and ordered transformations, the maths renderer is not complete.
- If a physics fixture contains only cards/text or its body does not move along the declared path while vectors remain anchored, the physics renderer is not complete.
- If a physics reel shows mitochondria, H+, or ATP without biological source content, routing has failed.
- If valid pasted text still requires `Use pasted notes` before Continue, the source fix has failed.
- If Player and server render consume different motion structures, consolidate before completion.

### Decisions (append-only)

- 2026-07-21: Keep the old `equation` grammar for semantic/chemical transformations; add a separate `math-equation` grammar with exact textual steps.
- 2026-07-21: Represent physics with allowlisted diagram kinds, normalized body coordinates, vectors, and computed motion paths; do not accept raw SVG path data.
- 2026-07-21: Match the existing server boundary of 20 trimmed source characters and centralize pasted-source commitment for both Continue and `Use pasted notes`.
- 2026-07-21: Make specialist payloads required-but-nullable in new live structured plans while keeping them optional in the shared client type so existing saved workspaces retain generic fallbacks.
- 2026-07-21: Use literal Unicode/plain-text maths rendered as React text; never evaluate expressions or inject equation markup.
- 2026-07-21: Make the decorative Today hero note pointer-transparent and use a zero-minimum responsive dashboard track after browser QA exposed blocked reel clicks and mobile overflow.
- 2026-07-21: Make the Today motion tile reflect its real grammar and rendered duration (`fx`, vector arrow, or ATP where appropriate) instead of a hard-coded ATP/36-second preview.

### Verification

- Verified a real connected-OpenAI maths plan returns three `math-equation` topics with exact expressions including `y = mx + b`, the distance formula, and the complete quadratic factoring derivation.
- Verified a real connected-OpenAI physics plan returns `physics-diagram` topics for projectile motion, waves, and circuits; every topic includes a valid diagram kind, vector(s), and motion path(s).
- Verified the local adapter routes equation-bearing Mathematics notes to `math-equation`, routes Physics notes to `physics-diagram`, selects multiple physics diagram kinds, and contains no mitochondria/H+/ATP labels.
- Verified two final H.264 exports from the specialist DSL: each is 1080×1920, 30 fps, 180 frames, and 6.059 seconds.
- Visually inspected final exported maths and physics frames. Maths preserves `x² − 5x + 6 = 0 → (x − 2)(x − 3) = 0 → x = 2 or x = 3`; physics shows a projectile, parabolic path, velocity vector, and downward gravity vector.
- Verified in the browser Player that the projectile body transform changes over 700 ms and the velocity vector origin changes to the exact same coordinates, proving the vector remains anchored to the moving body.
- Verified desktop Player previews for maths and physics, plus a 390×844 physics Player. At mobile width the document and viewport are both 390 px and the reel is 315×560 px.
- Verified the compact reel `Open reel` button is clickable after making its decorative overlay pointer-transparent.
- Verified Today uses `fx` for maths and `→` for physics and reports a fixture’s real 6-second duration instead of `ATP / 36 sec`.
- Verified 19 trimmed pasted characters keep Continue disabled and announce `1 more character needed`; a 29-character topic list enables Continue immediately.
- Verified one Continue click commits the trimmed pasted source and opens Step 02; Back shows the source-ready card and normalized readable-word count. The explicit `Use pasted notes` route still works.
- Verified direct pasted-source continuation at 390×844 with no horizontal overflow before or after advancing.
- Verified browser console contains zero errors and zero warnings.
- Verified final `npm run lint`, `npm run build`, and `npm audit --omit=dev` exit 0.

## Follow-up contract — interactive class demo (2026-07-21)

### Deliverable and acceptance criteria

- Keep Class as a clearly labelled, local-only social demo; do not imply that classmates, messages, scores, or activity are coming from a live service.
- Add an interactive opt-in leaderboard with weekly/all-time periods, a highlighted current-user row, rank movement, and visually distinct top positions.
- Make class activity reactions toggle with visible counts and accessible pressed state.
- Let the user compose and publish a simulated study update; the new update must appear immediately in the pulse.
- Let the user join the class challenge before opening its playable round, and reflect the participation count/state.
- Complete the Study Match demo with a stateful study-hello action.
- Show restrained, dismissible class notifications after relevant demo actions and one timed ambient event; notifications must not obstruct mobile controls or leak outside Class.
- Derive topic/challenge copy from the active workspace so a generated non-Biology course does not produce a contradictory class page.
- Preserve the upload, generation, reel, post, playable, plan, and library paths unchanged.

### Explicit non-goals

- No real messaging, public leaderboard, network writes, class persistence, production identity, moderation, or notification service.
- No broad redesign of the app shell or global notification bell in this follow-up.

### Design candidates considered

1. Replace the global notification and social system: broad reach, rejected because it would blur a self-contained demo into nonexistent production functionality.
2. Add a local state model inside `ClassroomView`: **chosen** because every interaction is reversible, truthful, testable, and isolated from generation.
3. Add a backend class service now: strongest production direction, deferred because auth, persistence, moderation, and real users are outside the requested demo scope.

### Kill criteria

- If a notification hides a primary control at 390px or reappears aggressively, move it to a mobile-safe position or reduce it to action feedback.
- If simulated class state appears after leaving Class or is presented as live data, the boundary has failed and must be corrected.
- If class copy remains tied to Biology after the active workspace changes, derive it from workspace data before completion.

### Decisions (append-only)

- 2026-07-21: Label the space `DEMO CLASS · LOCAL ONLY` and keep all social state in the mounted Class view.
- 2026-07-21: Preserve the existing hero/pulse/match hierarchy; add one leaderboard card and progressive interaction states instead of rebuilding the page.
- 2026-07-21: Show one delayed ambient notification plus action-triggered feedback, with automatic dismissal and a manual close control.
- 2026-07-21: Use up to four existing workspace recall questions for the class challenge; the first completion contributes 80 demo XP and moves the learner from weekly rank 4 to 3.
- 2026-07-21: Render the fixed notification beside, not inside, the animated page wrapper so mobile transforms cannot trap it in the document flow.

### Verification

- Verified reaction state toggles `aria-pressed`, changes Maya’s count from 12 to 13, and is reversible.
- Verified a 140-character-bounded study update posts immediately to the pulse and reports that nothing was sent online.
- Verified weekly/all-time leaderboard tabs, opt-out privacy state, and current-user highlighting.
- Verified the four-question source-grounded class round scores 4/4, adds 80 XP, prepends a pulse event, and moves the current learner to weekly rank 3 with 1,020 XP.
- Verified Study Match transitions after 1.2 seconds; Study Hello becomes a disabled `Hello added` state and explicitly says no real message was sent.
- Verified the demo join flow, dynamic subject-derived invite code, and local-only disclosure.
- Verified a temporary World History workspace renders `World History · Cohort A`, `WOR-204`, and Silk Road activity with no stale Biology, ATP, or Glycolysis class copy; the original workspace was restored afterward.
- Verified at 390×844: document width equals viewport width, interactive reactions are 48×44 px, primary class actions are 44 px tall, and the floating notice ends at y=752 while the mobile navigation begins at y=764.
- Visually inspected the 1440×1000 desktop class and 390×844 mobile class, including the floating notice.
- Verified browser console contains zero errors and zero warnings.
- Verified final `npm run lint`, `npm run build`, and `npm audit --omit=dev` exit 0.

## Follow-up contract — study-time-sized connected reel arcs (2026-07-22)

### Deliverable and acceptance criteria

- Make `Study time each week` materially control the number of reels generated instead of being passive metadata. The UI must show the resulting reel count before generation.
- Keep the relationship bounded and legible across the existing 2–14 hour range: larger time commitments produce larger learning drops, up to the report's eight-reel series boundary.
- Make `Current level` materially control conceptual depth, examples, terminology, and motion density; it must not remain a label stored only on the workspace.
- Require the generated reels to form one prerequisite-ordered learning arc: foundation first, each later reel explicitly bridges from prior knowledge, and the last reel synthesizes the arc.
- Let the LLM direct motion only through validated, allowlisted data: semantic grammar, objects, equations/diagrams, beat emphasis, tempo, and transition energy. Never execute model-authored React, TSX, SVG paths, CSS, or timing code.
- Preserve source grounding, exact maths, valid physics geometry, Player/export parity, local fallback, finite scrolling, and all existing formats.

### Design candidates considered

1. Mention weekly hours and level only in the model prompt: rejected because the output count could still drift and the controls would have no deterministic product meaning.
2. Add a separate manual reel-count control: rejected because the request is specifically that weekly study time should drive reel quantity, and two competing capacity controls would be confusing.
3. Derive an exact 3–8 reel target from weekly hours in shared code, constrain the structured plan to that exact length, let level choose an explicit depth profile, and let the LLM author only a safe typed motion direction: **chosen**.

### Kill criteria

- If increasing weekly hours across a displayed threshold does not increase the pre-generation reel count and final topic count, the capacity control is still decorative.
- If a live or local result contains fewer/more topics than its declared reel target, reject or repair it before publishing the workspace.
- If later reels have no valid dependency on an earlier reel, or the feed cannot explain how one reel leads to the next, the arc is not connected.
- If level changes only visible copy while the prompt and motion constraints remain identical, level handling is incomplete.
- If motion direction requires executable model output, omit the new control and retain the deterministic renderer.

### Decisions (append-only)

- 2026-07-22: Use the report's eight-reel series maximum. Map 2 hours to 3 reels and increase through explicit capacity bands until 12–14 hours produces 8 reels.
- 2026-07-22: Keep reel count driven by weekly capacity; use level to change depth and representation rather than conflating difficulty with workload.
- 2026-07-22: Preserve deterministic rendering. The LLM may choose bounded motion semantics and pacing weights, while reviewed code owns all execution.
- 2026-07-22: Validate the model's 1-based prerequisite indices, require every reel after the first to include its immediate predecessor, and require foundation/synthesis endpoints before publishing.
- 2026-07-22: Represent four beat-emphasis values as a fixed-length homogeneous array in the structured schema. The tuple form emitted an API-invalid JSON Schema; the fixed-length array preserves the same runtime boundary and is accepted by the live API.
- 2026-07-22: Scale only the planning-call timeout from 90 seconds for three reels up to 215 seconds for eight reels; a fixed 90-second boundary can terminate a valid larger structured arc before completion.

### Verification

- Verified shared capacity bands: 2h→3 reels, 3–4h→4, 5–6h→5, 7–9h→6, 10–11h→7, and 12–14h→8.
- Verified the local adapter publishes exactly 3, 5, and 8 topics for 2, 5, and 14 weekly hours respectively; every result starts with `foundation`, ends with `synthesis`, and each later topic references the immediately previous topic id.
- Verified level changes local motion direction: Middle school uses measured/gentle construction, High school balanced construction/application, Undergraduate denser formal emphasis, and Professional brisk/punchy case emphasis.
- Verified an actual connected-OpenAI planning call with expensive image/audio/video stages disabled returns exactly three reels for 2h/week, roles `foundation → build → synthesis`, valid prerequisite bridges, and distinct safe LLM motion directions from measured/gentle to brisk/punchy.
- Verified LLM beat emphasis changes deterministic Remotion timing: with equal narration copy and `[1,4,1,1]`, the model beat receives 148 frames while hook/example/recall receive 71/71/70.
- Verified the 390×844 creation flow displays `5 connected reels` beside the 5-hour slider, updates the level description to `Formal model and derivation`, and repeats both values in Step 04 before generation.
- Verified the plan labels its count as reels, explains that weekly capacity shaped the arc, and visibly shows `Builds from reel 01` bridges between existing lessons.
- Verified browser console reports zero errors and zero warnings during the mobile creation and connected-plan checks.
- Verified a real Remotion export with safe LLM-style direction enabled (`brisk`, `punchy`, beat weights `[2,4,3,3]`): H.264, 1080×1920, 30 fps, 360 frames, 2,666,175 bytes.
- Verified final `npm run lint`, `npm run build`, `npm run smoke:planning`, `npm run smoke:direction`, `npm run smoke:remotion`, and `npm audit --omit=dev` pass; the production dependency audit reports zero vulnerabilities.

## Follow-up contract — topic-only web research enrichment (2026-07-22)

### Deliverable and acceptance criteria

- Accept a short plain-language topic such as `adipis rex comprehensive overview` without requiring the user to supply complete notes.
- Clearly distinguish research mode from uploaded/pasted-source mode before generation. Never silently mix outside facts into a document-grounded lesson.
- In research mode, use the OpenAI Responses API `web_search` tool to resolve the topic, collect a concise evidence brief, and feed that brief into the existing structured learning-plan generator.
- Preserve clickable source provenance in the generated workspace and learning-content source drawer. Web-derived educational claims must not be presented as source-backed without citations.
- Keep the API key server-only, moderate the user query, cap research input/output, disable Responses application-state storage, redact upstream errors, and retain the local fallback without fabricating researched facts.
- If the query is ambiguous or search produces no usable evidence, report a research-specific failure instead of inventing a comprehensive overview.

### Design candidates considered

1. Let the existing source-only planner answer short topics from model memory: rejected because the request explicitly asks for research and the result would lack current evidence and citations.
2. Give web search to the large structured planner call directly: possible, but citation extraction from a large JSON response is harder to audit and couples research failure to every downstream artifact.
3. Add a bounded research stage first, retain its URLs, then pass the cited evidence brief into the existing validated planner: **chosen** because research provenance and structured generation remain independently inspectable.

### Kill criteria

- If uploaded notes trigger web research without an explicit research-mode signal, the routing boundary has failed.
- If the workspace uses researched facts but exposes no clickable sources, do not publish it as researched content.
- If a research result has no completed web-search call or no usable source URLs, stop before plan generation.
- If search content can override system constraints or cause executable output, discard it as untrusted data.

### Decisions (append-only)

- 2026-07-22: Auto-route a short single-line pasted prompt to research mode while keeping uploaded files, multiline notes, and the sample syllabus in provided-source mode.
- 2026-07-22: Follow the current official Responses API path: `tools: [{type: "web_search"}]`, `include: ["web_search_call.action.sources"]`, and visible clickable citations in the UI.
- 2026-07-22: Force the bounded research call with `tool_choice: "required"`; require a completed search, a substantive evidence brief, and at least one safe HTTP(S) source URL before structured planning starts.
- 2026-07-22: Keep provided-source local generation intact, but disable the local fallback for research mode because it cannot truthfully claim web research or provide provenance.
- 2026-07-22: Treat short topics down to a recognizable single term as research input while retaining the 20-character minimum for source notes.

### Verification

- Verified the exact phrase `Adipis Rex comprehensive overview` enters research mode in the creation UI, changes the action to `Research this topic`, advances with Continue, and remains labeled `FROM WEB RESEARCH` through the setup flow.
- Verified a live OpenAI request for that exact phrase completes web search with ten consulted URLs, resolves the likely intended topic to `Oedipus Rex`, and returns three connected research-grounded reels for the selected two-hour capacity.
- Verified the final live workspace persists the original query, search timestamp, ten safe clickable URLs, `sourceKind: Web research · 10 sources`, and a source note explaining the spelling resolution.
- Verified uploaded/multiline outline detection remains in provided-source mode; deterministic routing tests also cover `Oedipus Rex`, `Photosynthesis`, a unit heading, a multiline topic list, and an underspecified `ATP` input.
- Visually inspected the desktop creation flow through Step 04. The review explicitly explains web research, server-side key handling, disabled Responses state storage, and clickable source provenance before generation.
- Verified final `npm run build`, `npm run lint`, `npm run smoke:research-mode`, `npm run smoke:planning`, and `npm audit --omit=dev` exit 0. The production dependency audit reports zero vulnerabilities.

## Follow-up contract — judge-facing comprehensive README (2026-07-22)

### Deliverable and acceptance criteria

- Replace the terse README with a complete, technically accurate guide to the current ReelLearn implementation, user flows, architecture, OpenAI pipeline, data-quality controls, Remotion system, setup, commands, tests, repository map, and production boundaries.
- Make the development story a first-class section: clearly explain that GPT-5.6 at Ultra reasoning effort was used through Codex to build the project, while the running app separately defaults to `gpt-5.6-sol`, `gpt-image-2`, `tts-1`, and `omni-moderation-latest`.
- Identify where Codex accelerated the workflow with concrete repository evidence and verification outcomes, not generic AI-assistance claims.
- Identify the key human product decisions and the alternatives rejected, especially source grounding, topic research separation, capacity-sized connected reels, deterministic typed Remotion, subject-native maths/physics motion, and the explicitly local-only class demo.
- Give judges a fast evaluation path and reproducible setup instructions without implying that demo social state, browser-local persistence, or the serialized local render worker are production services.

### Design candidates considered

1. Extend the existing feature list: rejected because it would not explain technical judgment, data quality, or how Codex materially changed the build workflow.
2. Write a chronological build diary: useful evidence but too hard for judges to scan and weak as project documentation.
3. Use a judge-first README with a quick proof path, product/architecture narrative, explicit AI collaboration ledger, decision record, setup, verification, and honest boundaries: **chosen**.

### Kill criteria

- If the README conflates the Codex development model/reasoning setting with runtime API models, the attribution is misleading and must be corrected.
- If a claimed feature has no current implementation path or is only aspirational in `reellearn_spec.md`, label it as a boundary rather than current functionality.
- If “Codex accelerated” claims do not name the task, human decision, concrete output, and validation, rewrite them as evidence-backed entries.
- If setup depends on hidden local state or omits the server-only API key boundary, it is not reproducible.

### Decisions (append-only)

- 2026-07-22: Present `reellearn_spec.md` as the original product/scale blueprint and README.md as the source of truth for what this direct web-app implementation currently does.
- 2026-07-22: Link OpenAI product choices to official documentation, while grounding ReelLearn-specific implementation claims in local files and executable verification commands.
- 2026-07-22: Put the GPT-5.6 Ultra/Codex collaboration section before setup so the evaluation-critical development narrative is not buried below operational documentation.
- 2026-07-22: Use a four-column acceleration ledger—challenge, human decision, Codex acceleration, repository evidence—to keep the AI contribution specific and auditable.

### Verification

- Replaced the original 74-line feature/setup note with a 672-line, 5,203-word current-implementation README covering evaluation, flows, architecture, generation, data quality, Remotion, AI collaboration, decisions, setup, commands, security, repository structure, and production boundaries.
- Verified all 20 relative README links resolve to real repository files or directories.
- Verified the README includes no real API key and clearly warns against exposing the key through a `VITE_` variable.
- Verified the README distinguishes the Codex development configuration (GPT-5.6 with Ultra reasoning effort) from runtime API defaults.
- Verified every major Codex acceleration claim links to concrete code, smoke tests, or the append-only decision log.
- Verified official links cover Responses web search, Structured Outputs, image generation, text-to-speech, moderation, and Codex best practices.
- Verified `npm run lint` exits 0 after the documentation change.

## Follow-up contract — topic-input polish and complete reel narration (2026-07-22)

### Deliverable and acceptance criteria

- Correct the visible `Adipis Rex` typo to `Oedipus Rex` and rewrite the topic/notes input copy so the research-versus-provided-source behavior is immediately clear and visually cleaner.
- Preserve the intentionally misspelled phrase only where it documents the historical live typo-resolution test; do not keep it as a recommended example.
- Improve the actual reel experience by generating narration for every connected reel, not only reel one, while keeping the first-reel MP4 export boundary.
- Align each reel's Remotion duration to its own narration track when available.
- Add deterministic paced word emphasis to captions without claiming true word-level timestamps.
- Keep partial TTS failure non-blocking and cap narration concurrency to avoid a burst of up to eight simultaneous speech requests.

### Design candidates considered

1. Fix only the spelling and helper copy: necessary but leaves the most important reel-quality gap untouched.
2. Add more decorative particles/transitions: rejected because the existing subject-native motion is already strong and decoration does not improve comprehension.
3. Narrate every reel and add beat-timed caption emphasis while retaining deterministic motion: **chosen** because it improves continuity, accessibility, and perceived production quality across the whole connected series.

### Kill criteria

- If one failed TTS track blocks the plan or sibling narrations, keep the previous graceful-degradation behavior instead.
- If narration calls exceed two concurrent requests, add a bounded worker queue before completion.
- If captions pretend to be acoustically aligned without word timestamps, remove the claim and keep the animation explicitly beat-timed.
- If per-reel audio changes Player/export props inconsistently, preserve the same MotionSpec/duration contract for both.

### Decisions (append-only)

- 2026-07-22: Use `Oedipus Rex — comprehensive overview` as the polished research example and explain beneath the field that short topics are researched with sources while notes stay source-grounded.
- 2026-07-22: Generate up to two narration tracks concurrently; attach successful tracks and durations independently to their matching topics.
- 2026-07-22: Pace caption emphasis from the validated storyboard beat duration rather than claiming acoustic word synchronization; retain true word-timestamp alignment as a future production enhancement.
- 2026-07-22: Move the caption safe area from 330px to 220px above the bottom edge after a real frame showed it obscuring lower diagram copy.

### Verification

- Verified the creation field now renders `What should we learn?`, the correctly spelled `Oedipus Rex — comprehensive overview` example, and a concise explanation of research versus source mode.
- Verified entering the example changes the helper to `Research mode · ReelLearn will search the web and attach its sources`, changes the action to `Research this topic`, and enables Continue.
- Verified browser diagnostics contain zero errors and zero warnings during the corrected creation flow.
- Verified a live three-reel OpenAI generation returns three distinct MP3 narration URLs and three narration-aligned MotionSpec durations: 560, 581, and 635 frames.
- Verified the same live run exported the first reel as H.264, 1080×1920, 30 fps, 560 frames, with no generation warnings.
- Verified a fresh Remotion smoke export is 2,798,777 bytes and visually inspected an original-resolution frame after the safe-area correction; the caption no longer overlaps the diagram content.
- Verified paced caption indices at the start, midpoint, and end of a six-word/90-frame beat.
- Verified final `npm run build`, `npm run lint`, `npm run smoke:research-mode`, `npm run smoke:direction`, and `npm run smoke:planning` pass. A fresh Remotion smoke process completed and produced the inspected MP4.

## Follow-up contract — reusable submission screenshot set (2026-07-22)

### Deliverable and acceptance criteria

- Exercise the direct web app and save a reusable set of polished PNG screenshots inside the repository for a later submission.
- Cover the product story rather than collecting random pages: learning dashboard, creation/research setup, capacity/style decisions, reel experience, posts/playables, connected plan, class interaction, and at least one mobile state.
- Capture intentional viewport sizes, stable post-animation states, and visually balanced scroll positions. Exclude loading failures, browser chrome, debug overlays, awkward clipped controls, and accidental transient states.
- Create a screenshot index containing the filename, state, suggested submission caption, and what the image proves.
- Verify every saved PNG exists, is readable, and has the intended dimensions before completion.

### Design candidates considered

1. Capture every page once: rejected because equal coverage does not produce a persuasive submission narrative.
2. Capture only the most colorful reel/post screens: visually strong but weak evidence of the end-to-end product.
3. Build a curated product-story set with hero, creation, learning, planning, social, and mobile proof: **chosen**.

### Kill criteria

- If a screenshot contains a loading state, error, accidental tooltip, hidden primary action, or clipped layout, retake it.
- If two screenshots communicate the same product claim without a meaningful visual difference, keep the stronger one.
- If a local-only social interaction could be mistaken for real users, ensure the `DEMO CLASS · LOCAL ONLY` disclosure is visible.
- If a screenshot cannot be tied to a precise state and caption later, omit it from the curated index.

### Decisions (append-only)

- 2026-07-22: Store final captures under `docs/screenshots/` with numbered descriptive filenames and a Markdown index.
- 2026-07-22: Use a consistent 1440×1000 desktop viewport plus a 390×844 mobile viewport for responsive proof.
- 2026-07-22: After the browser session reset, retain the learning-experience, plan, and class captures at the browser's native 1280×720 presentation format because that crop is stronger for modal/product proof; document the mixed formats explicitly instead of implying uniform dimensions.
- 2026-07-22: Preserve every screenshot as a true PNG—not merely a `.png` filename—after inspection showed the browser export bytes were JPEG-encoded.

### Verification

- Verified 12 curated captures exist and are indexed once each with a suggested caption and explicit product-proof claim.
- Verified `01`–`05` are 1440×1000, `06`–`11` are 1280×720, and `12` is 390×844.
- Verified all 12 files are readable, RGB, non-interlaced PNG images after lossless format normalization.
- Exercised research-mode detection, capacity and depth controls, visual-style selection, connected Remotion reel navigation, infographic switching, correct-answer recall feedback, connected planning, demo reactions, leaderboard/challenge states, and the responsive mobile shell.
- Verified browser diagnostics contained zero errors and zero warnings during the creation flow; no screenshot retains a loading, error, debug, or accidental transient state.
- Verified the screenshot index resolves all 12 unique image links.
- Verified final `npm run build`, `npm run lint`, `npm run smoke:research-mode`, `npm run smoke:planning`, and `npm run smoke:direction` pass. The build retains only its existing non-blocking large-chunk advisory.

## Follow-up contract — public GitHub release and GCP deployment (2026-07-22)

### Deliverable and acceptance criteria

- Remove the caption index from repository documentation and return it directly to the user for submission use.
- Refocus the root README for public GitHub visitors: fast product understanding, credible feature evidence, architecture, local setup, verification, security, current boundaries, and concise AI-development attribution.
- Audit the complete publish scope for credential material before staging; no API key, token, private environment file, or secret-bearing build artifact may enter Git or the deployed browser bundle.
- Publish the verified application to the connected GitHub repository through an intentional branch/commit/PR flow.
- Deploy the same application to the configured Google Cloud project and verify a publicly reachable working URL through both HTTP and an end-to-end browser interaction.
- Return complete, copy-ready hackathon project fields within their stated limits, including public demo and source links and the curated media filenames.

### Design candidates considered

1. Keep the existing long-form engineering README and add deployment links: evidence-rich, but too slow for a GitHub visitor to evaluate.
2. Replace it with a short marketing page: attractive, but it would weaken reproducibility and the judge-requested Codex/GPT-5.6 implementation evidence.
3. Use a layered public README—visual product opening, concise workflow, architecture/evidence, setup/security, and expandable technical detail: **chosen** because it serves both fast evaluators and technical reviewers.

### Deployment candidates considered

1. Static hosting: rejected because topic research, OpenAI planning/media, and server-owned credentials require a backend.
2. Split frontend hosting and a separate API service: viable at scale, but introduces avoidable CORS/configuration complexity for this submission.
3. One containerized Cloud Run service serving the built frontend and API: **chosen** if the existing server supports production static serving; otherwise use the smallest reversible configuration change required.

### Kill criteria

- If secret scanning finds a credential in the intended Git history or staged diff, stop publication, remove/rotate as appropriate, and re-audit before any push.
- If the production build exposes the OpenAI key or any server secret in `dist`, stop deployment and correct the configuration boundary.
- If GitHub authentication, remote ownership, or Google Cloud project/region cannot be established from configured tools, stop that external publication rather than guessing a target.
- If the deployed URL does not pass health, asset, and browser-flow verification, do not describe it as working.

### Decisions (append-only)

- 2026-07-22: Keep captions as conversation-delivered submission copy and retain only a neutral visual gallery in repository documentation.
- 2026-07-22: Seed the empty public GitHub repository directly on `main`; an initial draft PR would have no base commit to review against.
- 2026-07-22: Deploy one same-origin Cloud Run service in `us-central1` with 2 vCPU, 4 GiB memory, concurrency 1, a 900-second timeout, and one maximum instance so Remotion jobs remain serialized and demo cost has an infrastructure cap.
- 2026-07-22: Store the OpenAI key in Secret Manager as `reellearn-openai-api-key` version 1 and pin the Cloud Run environment reference to that version; never pass the key as plaintext source or a browser environment variable.
- 2026-07-22: Regenerate npm's optional-package lock metadata after Cloud Build's clean install exposed missing `@emnapi` entries that the reused local install did not reveal.
- 2026-07-22: Keep original screenshots untouched and create separate 3:2 submission copies under `docs/submission-media/`.

### Verification

- Replaced the 675-line engineering narrative with a 317-line layered GitHub README that keeps product proof, architecture, setup, safety, verification, current boundaries, and the judge-critical GPT-5.6 Ultra/Codex acceleration ledger.
- Verified all 15 local README links resolve and the caption index no longer appears in repository documentation.
- Verified 12 submission PNGs are true PNG files, have 3:2 presentation dimensions (1440×960 or 1200×800), and are individually below the 5 MB gallery limit.
- Verified `npm run lint`, `npm run build`, `npm run smoke:research-mode`, `npm run smoke:planning`, and `npm run smoke:direction` pass.
- Verified `npm run smoke:remotion` produced a 2,791,123-byte H.264 MP4 at 1080×1920, 30 fps, and 360 frames.
- Verified `npm audit --omit=dev` reports zero vulnerabilities.
- Verified credential-pattern scans and exact-value comparison against `OPENAI_API_KEY` found zero matches in source, documentation, staged files, or the production browser bundle.
- Verified clean-install compatibility under npm 10 and npm 11 after the lockfile correction.
- Published the public repository at `https://github.com/coldboxer007/reellearn` and pushed the corrected Cloud Build lockfile on `main`.
- Deployed Cloud Run revision `reellearn-00001-9qg` with 100% traffic and a pinned Secret Manager reference; `GET /api/health` reports OpenAI configured without returning credential material.
- Verified the public browser flow at `https://reellearn-697390864676.us-central1.run.app/`: cold load, Create navigation, exact Oedipus Rex research routing, enabled Continue, capacity controls, Class navigation, reaction state change, and explicit local-demo notification.
- Verified one real playable-only cloud generation streamed meta/progress/result events, returned the exact three-topic arc for two weekly hours, emitted no warnings, and included a trace ID.

## Follow-up contract — neutral demo identity (2026-07-22)

### Deliverable and acceptance criteria

- Remove the developer's personal name and initials from every application-owned demo identity surface.
- Use one consistent, product-appropriate neutral identity across the greeting, navigation shell, profile affordance, mock data, and leaderboard.
- Refresh any public README/submission screenshots that still expose the previous identity.
- Re-run build/lint, publish the update, redeploy Cloud Run, and verify the public greeting and class leaderboard.

### Decisions (append-only)

- 2026-07-22: Use `Demo Learner` and initials `DL`; prefer `Welcome back, Demo Learner.` over a time-specific greeting so the public demo remains accurate in every timezone.

### Verification

- Verified no case-insensitive `Sahil`, `Sahil Tanna`, personalized greeting, `ST` avatar, or `ST` activity-initial pattern remains in application-owned text source.
- Verified the local browser renders `Welcome back, Demo Learner.`, `Demo Learner`, and `DL` in the dashboard shell and renders the same identity in the class leaderboard.
- Refreshed the nine affected original screenshots and their gallery-ready 3:2 copies; OCR found zero old-name matches across all 24 PNG files.
- Verified all 12 originals are true PNGs at 1280×720 (`01`–`11`) or 390×844 (`12`), and all 12 submission copies remain true PNGs below 5 MB.
- Verified `npm run lint`, `npm run build`, `npm run smoke:research-mode`, `npm run smoke:planning`, and `npm run smoke:direction` pass after the identity change.
- Published the neutral identity and refreshed media in GitHub commit `f93325b`.
- Deployed Cloud Run revision `reellearn-00002-24g` with 100% traffic and verified the live dashboard greeting, sidebar/profile initials, leaderboard entry, and Study Match identity all render as `Demo Learner` / `DL`.

## Follow-up contract — public demo API availability (2026-07-22)

### Deliverable and acceptance criteria

- Raise ReelLearn's self-imposed per-client generation allowance enough for repeated judging and demos without making the public endpoint unbounded.
- Increase Cloud Run capacity beyond one long-running generation while keeping each Remotion job isolated at concurrency one.
- Bound image-generation concurrency inside each request so additional service instances do not multiply a ten-image burst into an avoidable upstream rate-limit spike.
- Keep the OpenAI key server-only in Secret Manager, preserve graceful media degradation, and verify the live health/generation path after deployment.

### Design candidates considered

1. Remove application limits and raise Cloud Run scaling aggressively: rejected because it increases abuse, cost, and burst-related failure risk.
2. Keep one instance and only increase the per-IP counter: rejected because simultaneous judges can still be refused while a long generation occupies the only instance.
3. Raise per-client limits, allow three single-concurrency instances, and cap image workers per generation: **chosen** as the best availability/cost/rate-limit balance for a public submission demo.

### Kill criteria

- If a direct OpenAI probe shows the text allowance cannot support three planning calls with safe headroom, keep Cloud Run at one instance.
- If bounded image generation changes asset ordering or breaks graceful fallback, revert that implementation before deployment.
- If the public revision cannot complete a validated playable-only generation, do not describe the availability profile as verified.

### Decisions (append-only)

- 2026-07-22: Make the visitor limits configurable and default them to 10 generation starts per 10 minutes and 50 per day per client.
- 2026-07-22: Keep Cloud Run request concurrency at one, raise maximum instances from one to three, and cap GPT Image work at two concurrent jobs per generation.
- 2026-07-22: Treat the observed `gpt-5.6-sol` response headers—5,000 requests/minute and 1,000,000 tokens/minute—as verified text-model capacity only; do not infer image or speech limits from them.
- 2026-07-22: Retry once only when a parsed plan fails ReelLearn's semantic validators; leave SDK network retry behavior unchanged and do not retry genuinely insufficient source material.

### Verification

- Verified a direct server-side `gpt-5.6-sol` Responses probe completed successfully with observed headers of 5,000 requests/minute, 1,000,000 tokens/minute, 4,999 requests remaining, and the full token allowance remaining after the probe.
- Verified a three-reel playable-only live plan completed with foundation → build → synthesis roles and valid bounded motion directions.
- The first five-reel full-media attempt failed before media generation after 261 seconds, and a second failed after 72 seconds; this evidence prompted the semantic corrective-pass change rather than a false claim that quota alone guarantees availability.
- After the corrective pass and bounded image queue, a full live integration completed in 348,312 ms with exactly five connected topics, seven distinct GPT Image assets, per-reel TTS, a readable 1080×1920/30 fps Remotion MP4, and zero generation warnings.
- Verified final lint, build, research/planning/direction smoke checks, and the production dependency audit pass; the audit reports zero vulnerabilities.
