# sunmul.app Handoff Document

> Generated: 2026-06-23
> Project: task-crusher (sunmul.app)
> Repo: github.com/odddottt-netizen/tick
> Deploy: tick-one-sigma.vercel.app / sunmul.app (pending DNS propagation)

---

## 1. Project Overview

sunmul.app is a curated web-app platform that delivers small, delightful tools for everyday life. Think of it as a "gift shop" of micro-apps.

The platform currently hosts **4 apps**:

1. **Tick.** — Hierarchical task decomposition / "crusher" (the original app)
2. **Terminal Focus** — Developer-themed pomodoro timer with terminal build-log simulation
3. **Stardust Vent** — Stress-relief text-to-physics-block emotional venting tool
4. **Tab Slayer** — Tinder-style swipe-to-organize browser tab/file cleanup game

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.9 (Turbopack) |
| React | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x (via `@import "tailwindcss"`) |
| Icons | Lucide React | 0.510+ |
| AI API | Anthropic SDK | 0.105.0 |
| Physics | Matter.js | 0.20.x (for Stardust Vent) |
| Build Output | Static + Edge | `output: 'export'` compatible |

---

## 3. Directory Structure

```
app/
├── page.tsx              # Landing page (sunmul.app)
├── layout.tsx            # Root layout (Outfit + Noto Sans KR fonts)
├── globals.css           # Tailwind v4 + glassmorphism + custom animations
├── api/
│   └── crush/
│       └── route.ts      # Claude API route (claude-haiku-4-5)
├── tick/
│   └── page.tsx          # Tick. app (1,535 lines)
├── terminal/
│   └── page.tsx          # Terminal Focus app
├── stardust/
│   └── page.tsx          # Stardust Vent app
├── tabslayer/
│   └── page.tsx          # Tab Slayer app

public/                    # Static assets
.env.local                 # ANTHROPIC_API_KEY (git-ignored)
package.json
next.config.ts
tailwind.config.ts         # Not present (Tailwind v4 uses CSS-only config)
```

---

## 4. Design System (sunmul.app Concept)

### 4.1 Color Palette

```
Background:   linear-gradient(135deg, #F0EBE5 0%, #E8E2D9 50%, #E0D8D0 100%)
Accent:       #E85D04 (warm orange)
Accent Hover: #D14000
Accent Light: rgba(232,93,4,0.12)
Accent Muted: rgba(232,93,4,0.08)
Stone:        #1E1B18 (near-black)
Stone Muted:  #6B6560
Stone Sub:    #9E9995
Border:       rgba(0,0,0,0.08)
Border Light: rgba(0,0,0,0.06)
Card BG:      rgba(255,255,255,0.72)
```

### 4.2 Typography

- **Primary**: `Outfit, system-ui` (headings, numbers, brand)
- **Korean**: `Noto Sans KR, system-ui` (body text)
- **Korean mobile**: `word-break: keep-all` for all Korean text

### 4.3 Glassmorphism Utilities (globals.css)

```css
.glass         /* rgba(255,255,255,0.55) + blur(20px) saturate(180%) */
.glass-strong  /* rgba(255,255,255,0.72) + blur(24px) saturate(180%) */
.glass-card    /* rgba(255,255,255,0.58) + blur(16px) saturate(180%) + hover lift */
```

All glass utilities have:
- `backdrop-filter: blur(...) saturate(180%)`
- Soft white border with `inset 0 1px 0 rgba(255,255,255,0.4)` highlight
- Layered box-shadows for depth

### 4.4 Custom Animations

```css
animate-fade-in, animate-fade-in-up, animate-scale-in
animate-spin-slow, animate-pulse-soft
animate-float, animate-shimmer, animate-gradient-shift
animate-celebration-float
```

Keyframes defined in `globals.css` for all of the above.

### 4.5 Shared Components (Patterns)

No shared component library — each app is self-contained in its own `page.tsx`. Common patterns include:

- `glass`, `glass-strong`, `glass-card` for card containers
- `rounded-3xl` for large card radius
- `rounded-2xl` for medium elements
- `rounded-full` for pills and badges
- Hover transitions: `transition-all duration-200/300`
- Active micro-interaction: `active:scale-[0.98]` on primary buttons
- Progress bars: `.progress-spring` with `cubic-bezier(0.22, 1, 0.36, 1)` easing

---

## 5. App Descriptions

### 5.1 Tick. (`/app/tick/page.tsx`)

**Concept**: Decompose overwhelming tasks into tiny hierarchical sub-tasks. Gamified progress tracking with ASMR sounds and celebratory effects.

**Key Features**:
- Claude AI task decomposition (via `/api/crush`)
- Hierarchical phases (Phase → Sub-tasks)
- Overall + per-phase progress tracking
- 5 ASMR check-off sounds (Web Audio API): axial, waxball, crystal, pencil, ppopgi
- Celebration effects: ta-da fanfare + Canvas confetti particles on 100% completion
- Mission Clear modal on all tasks done
- LocalStorage persistence (`tc-v2` key)
- JSON backup / restore
- Double-click inline editing for tasks
- Boss key (Esc×2) → blank document camouflage
- Office mode (Excel/Notion view tabs)
- Company settings modal (company name, department)
- Mobile-optimized Korean typography (`word-break: keep-all`)
- Custom donation link: `https://ctee.kr/place/gavinkim`

**Checkbox Design**: 28px circular checkbox with 2.5px border. Completed state: filled with accent color + white Check icon. Uncompleted: soft gray border with hover accent.

**API**: `POST /api/crush` — sends `task` and `granularity` to Claude Haiku 4.5, returns JSON phases. Fallback `generatePhases()` template if API fails.

**LocalStorage Keys**:
- `tc-v2` — task data
- `tc-settings` — company name, department
- `tc-office-theme` — office theme preference
- `sound-type` — selected ASMR sound
- `volume` — master volume
- `muted` — mute state

---

### 5.2 Terminal Focus (`/app/terminal/page.tsx`)

**Concept**: Developer-themed pomodoro timer that disguises focus time as a terminal build process. Gamified with Git contribution graph and ASMR sounds.

**Key Features**:
- **Hacker Terminal View**: Dark theme (`#0a0a0a`) with green/orange terminal font. Build logs scroll in real-time at 1-2 lines/sec, progressing from `[BUILD] Compiling asset tree... (14%)` to 100% as the timer advances.
- **Timer Modes**: 25min Focus / 5min Break. Start/Pause/Reset via buttons or terminal commands (`start`, `pause`, `clear`, `focus`, `break`, `help`).
- **Git Contribution Graph**: 7×7 grid in sidebar. Today's completed pomodoro sessions light up cells from right to left. Persistent via `localStorage` (`terminal-focus-sessions`).
- **ASMR Sound**: Web Audio API synthesized sounds — mechanical keyboard "Thock!" (sine wave + noise with rapid decay) and server rack cooler low-frequency white noise (LowPass filter). No external MP3.
- **Camouflage Mode**: F2 key or button toggles full-screen "Confidential Sales Analysis.xlsx" Excel camouflage. Toggle back with F2 again.
- **Design**: Terminal dark mode with glass overlay controls, monospace font stack, custom dark scrollbar.

**LocalStorage Key**:
- `terminal-focus-sessions` — date-indexed pomodoro completion counts

---

### 5.3 Stardust Vent (`/app/stardust/page.tsx`)

**Concept**: Emotional stress relief tool. Type angry/stressful thoughts into a physics-enabled text block arena, then "vent" them into stardust particles.

**Key Features**:
- **Matter.js Physics**: Text input becomes rounded physical blocks that fall from top with gravity, stack and collide realistically. Mouse drag interaction supported.
- **Stardust Dissolution**: "Vent" button triggers Canvas 2D particle explosion — each block's text disintegrates into 40+ sand/dust particles flying outward with gravity, air resistance, rotation, and fade-out.
- **ASMR Sound**: Brown noise + LowPass(800Hz) + HighPass(120Hz) + Gain envelope via Web Audio API. Creates sand/wind crumbling sound.
- **Zero-Data Security**: "Zero-Data: No text is sent to any server. Text exists only in this browser tab's memory." with lock icon.
- **Boss Escape**: Double-tap ESC within 500ms replaces all block text with business English planning documents (e.g., "Q3 Market Expansion Strategy") with smooth fade-in animation.
- **Design**: Warm ivory (`#fcfbf9`) background, soft sand beige, delicate gray-brown text. Rounded-3xl buttons. Essay magazine / handmade gift card aesthetic.

**Dependencies**: `matter-js`, `@types/matter-js`

**CSS Additions** (globals.css): `.stardust-page`, `.stardust-input`, `.stardust-vent-btn`, `.physics-block`, `.boss-mode`, `.stardust-canvas-overlay`, `@keyframes boss-replace`, `@keyframes stardust-fade`

---

### 5.4 Tab Slayer (`/app/tabslayer/page.tsx`)

**Concept**: Tinder-style swipe card game to declutter browser tabs and download files. Organize into Trash, Archive, or Keep.

**Key Features**:
- **Tinder Swipe Game**: 15 virtual tab/file cards. Swipe directions:
  - ← Left (Trash): Red badge. White noise + crackle + bandpass filter + low-shelf ASMR.
  - → Right (Archive): Sage green badge. Sawtooth wave + 70Hz modulation + zipper noise texture ASMR.
  - ↑ Up (Keep): Sky blue badge. White noise + low-pass filter + gentle attack/decay wind sound.
- **Physical Drag Feel**: CSS bezier curve elastic bounce-back (`cubic-bezier(0.34, 1.56, 0.64, 1)`) and friction. `touchstart/touchmove/touchend` + `pointer-events` + `touch-action: none` for perfect mobile one-hand swiping.
- **Cleanup Report**: After all 15 cards are processed, generates a dopamine-style markdown report with stats (e.g., "You cleaned 14.2GB of unnecessary resources and archived 5 core values, freeing up 35% brain capacity"). Includes clipboard copy button.
- **Keyboard Support**: Arrow keys (← → ↑) also trigger card actions.
- **Design**: Mud ivory (`#faf9f6`) background, silk-like 1px soft gray borders, earth garden mint (`#e2efeb`) and brick terracotta (`#c45d3e`) micro-highlights. Healing ritual feel.

**CSS Additions** (globals.css): Tab Slayer card styles, swipe animations, friction/bounce transitions, progress bar, report styles, mobile touch optimizations.

---

## 6. API Endpoints

### `POST /api/crush`

**Request**:
```json
{
  "task": "string (max 500 chars)",
  "granularity": 1 | 2 | 3
}
```

**Response**:
```json
{
  "phases": [
    {
      "number": 1,
      "title": "string",
      "subTasks": ["string", "string", ...]
    }
  ]
}
```

**Model**: `claude-haiku-4-5` (was `claude-sonnet-4-6`, cost ~67% reduced)
- Input: $1/MTok, Output: $5/MTok

**Rate Limit**: IP-based, 5 req/min (in-memory Map). Production: consider migrating to Upstash KV.

**Fallback**: If Anthropic API fails, returns 502 + triggers `generatePhases()` template function in the client.

---

## 7. Environment Variables

```bash
# .env.local (git-ignored)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 8. Build & Deploy

```bash
# Development
npm run dev        # localhost:3000

# Production build
npm run build      # Static export with all pages
npm run start      # Production server
```

**Deployment**:
- Vercel auto-deploy from `main` branch
- GitHub: `github.com/odddottt-netizen/tick`
- Custom domain: `sunmul.app` (nameserver propagation pending)

---

## 9. Known Issues & TODO

| Issue | Location | Status | Notes |
|-------|----------|--------|-------|
| Anonymous feedback form submission | `page.tsx` (Tick) | TODO | `// TODO` — Tally/Google Forms endpoint not connected |
| Rate limit storage | `route.ts` | Future | In-memory Map → Upstash KV recommended for production |
| PostCSS CVE | `npm audit` | Moderate | 2 moderate severity issues. Run `npm audit fix` or upgrade PostCSS |
| `tabslayer` dummy data only | `/app/tabslayer/page.tsx` | Done | 15 hardcoded sample cards. No real browser tab integration |
| `stardust` Matter.js SSR | `/app/stardust/page.tsx` | Note | `matter-js` imported dynamically to avoid SSR issues. Works fine. |

---

## 10. Design Philosophy (sunmul.app)

1. **Whitespace is luxury**: Generous padding, breathing room between elements
2. **Micro-interactions matter**: Every hover, every click, every transition should feel considered
3. **Warmth over coldness**: No neon colors, no harsh contrasts. Earth tones, soft gradients, gentle shadows
4. **Glassmorphism as a signature**: Not overused, but applied consistently to cards and modals with `saturate(180%)` and `inset` highlights
5. **Korean typography first**: `word-break: keep-all` everywhere. Mobile-first responsive design
6. **Sound is a feature**: ASMR, Tingle, ambient — every app has a sound design layer via Web Audio API
7. **Camouflage is a feature**: Boss key, office mode, F2 camouflage — every productivity tool needs an escape hatch
8. **Zero data**: No login, no server storage, no tracking. Everything is local

---

## 11. Contact / Links

- **Donation**: `https://ctee.kr/place/gavinkim` (replaced from `https://toss.me/your-id`)
- **Feedback**: Anonymous feedback button in footer (not yet connected to external form)
- **GitHub**: `github.com/odddottt-netizen/tick`
- **Live**: `tick-one-sigma.vercel.app` / `sunmul.app`

---

*End of Handoff Document*
