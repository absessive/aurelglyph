# AGENTS.md

## Scope

These instructions apply to the Aurelglyph design-system workspace.

## Project Goal

Aurelglyph is the library and design-system brand: a standalone, versioned UX
design language and component system for SwiftUI, React, React Native, and Ruby
on Rails apps. It uses a token-first architecture with platform-specific
adapters and examples.

## Aurelglyph: Ajit Interface Language

Use this section as the source of truth when generating UI, styling, tokens,
components, icons, layout, copy, or brand assets for Ajit Chakrapani /
`absessive` apps that use Aurelglyph. "Absessive UI" is not a public trademark,
package name, or design-system name; treat it as prompt context only. The public
library name is Aurelglyph. The goal is not to imitate Bootstrap, Material,
Apple Human Interface Guidelines, Linear, Vercel, or generic SaaS design. The UI
should feel like a crafted operating surface: precise, warm, technical,
editorial, and quietly premium.

Core brand phrase:

> Warm precision. Quiet systems. Obsessive details.

### Brand Personality

The interface should feel like:

- an engineering atelier
- a calibrated instrument panel
- an architectural notebook
- a refined systems dashboard
- a tactile workshop for software, automation, and infrastructure

Avoid:

- generic startup gradients
- plain Bootstrap cards
- Material Design defaults
- unmodified Tailwind demo aesthetics
- sterile white SaaS dashboards
- playful cartoon branding
- neon cyberpunk excess
- overly round "consumer app" softness

Prefer:

- smoked materials
- graphite and ink surfaces
- parchment and drafting-paper light mode
- subtle technical grids
- calibration marks
- precise borders
- restrained motion
- quiet but distinctive accent colors

### Naming and Identity

Primary personal identity: `Ajit Chakrapani`

Product/design alias: `absessive`

Preferred brand lockups:

- `Aurelglyph`
- `absessive.`
- `ab.`
- `absessive systems atelier`

Use `Aurelglyph` for the library and design-system brand. Use `absessive.` or
`ab.` only for Ajit/personal app identity. The dot is intentional in personal
identity lockups. It acts as a signal light and should inherit the active theme
accent. Avoid uppercase wordmarks unless required by context.

### Visual Motifs

- **Calibration marks:** use fine lines, crosshairs, axis ticks, corner guides,
  and measurement details. These should be subtle and functional-looking, not
  decorative clutter.
- **Drafting texture:** use very subtle paper grain, graphite texture, soft
  noise, or technical drawing overlays. Texture should never reduce readability.
- **Signal dot:** use small circular indicators for status, availability, sync
  state, current theme, and active navigation. The dot should use the current
  base accent.
- **Panel depth:** surfaces should feel like layered trays or instruments with
  thin borders, subtle inner highlights, restrained shadows, inset dividers, and
  slightly raised active states.
- **System language:** small labels and badges may use terms like `LIVE`,
  `SYNCED`, `DRAFT`, `LOCAL`, `QUIET`, `ACTIVE`, `ARCHIVED`, `NOW`, and
  `SYSTEMS OPERATIONAL`.

### Typography

Use open-source fonts by default.

```css
--font-display: "Cormorant Garamond", Georgia, serif;
--font-ui: "IBM Plex Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
```

- Use Cormorant Garamond for brand, hero headings, editorial moments, and large
  display text.
- Use IBM Plex Sans for UI labels, navigation, body text, forms, buttons, and
  dashboards.
- Use IBM Plex Mono for code, metrics, small labels, token names, timestamps,
  and system annotations.
- Headings should feel editorial, not corporate.
- Body copy should remain practical and readable.
- Labels should be small, spaced, and precise.
- Avoid generic oversized bold sans-serif hero text.
- Use mono sparingly for technical confidence.

Recommended type scale:

```css
--text-xs: 0.72rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-md: 1.125rem;
--text-lg: 1.35rem;
--text-xl: 1.75rem;
--text-2xl: 2.4rem;
--text-3xl: clamp(3rem, 7vw, 6rem);

--tracking-label: 0.12em;
--tracking-mono: 0.04em;
--tracking-tight: -0.035em;
```

### Theme Model

The design system must support light mode, dark mode, and multiple base accent
themes. Use `royal-purple` as the preferred personalized theme unless told
otherwise. Theme values should be implemented with CSS variables or equivalent
platform tokens. Do not hardcode component colors directly.

Active accent should drive primary buttons, active navigation, focus rings,
charts, status dots, the brand dot, selected tab underline, subtle glows, and
important links.

Core neutral tokens:

```css
:root[data-mode="dark"] {
  --color-bg: #0d0d0b;
  --color-bg-elevated: #12120f;
  --color-surface: #171714;
  --color-surface-2: #1f1e1a;
  --color-surface-3: #282620;
  --color-border: #34312b;
  --color-border-soft: rgba(231, 223, 209, 0.10);
  --color-text: #e7dfd1;
  --color-text-muted: #a59b8b;
  --color-text-subtle: #6e685e;
  --color-shadow: rgba(0, 0, 0, 0.55);
  --color-highlight: rgba(255, 255, 255, 0.06);
}

:root[data-mode="light"] {
  --color-bg: #ece4d8;
  --color-bg-elevated: #f3ecdf;
  --color-surface: #e2d8ca;
  --color-surface-2: #d8ccb9;
  --color-surface-3: #cdbda8;
  --color-border: #b9a993;
  --color-border-soft: rgba(42, 36, 30, 0.14);
  --color-text: #2a241e;
  --color-text-muted: #64594c;
  --color-text-subtle: #8c7e6c;
  --color-shadow: rgba(42, 36, 30, 0.18);
  --color-highlight: rgba(255, 255, 255, 0.45);
}
```

Accent theme tokens:

```css
:root[data-theme="amber"] {
  --accent-50: #f7ead5;
  --accent-100: #ecd1a7;
  --accent-200: #d9ad6a;
  --accent-300: #c88a3d;
  --accent-400: #a86f2c;
  --accent-500: #7a4d1d;
  --accent-600: #4d3015;
  --accent-rgb: 200, 138, 61;
}

:root[data-theme="forest"] {
  --accent-50: #e6eedf;
  --accent-100: #c8d7b7;
  --accent-200: #9ab676;
  --accent-300: #6f9a45;
  --accent-400: #557733;
  --accent-500: #334b24;
  --accent-600: #1d2f19;
  --accent-rgb: 111, 154, 69;
}

:root[data-theme="royal-purple"] {
  --accent-50: #efe4ff;
  --accent-100: #d8c0ff;
  --accent-200: #b88cff;
  --accent-300: #9358e8;
  --accent-400: #7a3fd1;
  --accent-500: #562a93;
  --accent-600: #2d174f;
  --accent-rgb: 147, 88, 232;
}

:root[data-theme="deep-blue"] {
  --accent-50: #e1ecff;
  --accent-100: #b6cdf7;
  --accent-200: #7ea4e8;
  --accent-300: #4d7fd0;
  --accent-400: #355da8;
  --accent-500: #243d72;
  --accent-600: #162544;
  --accent-rgb: 77, 127, 208;
}

:root[data-theme="cyan"] {
  --accent-50: #ddf6f8;
  --accent-100: #aee2e8;
  --accent-200: #75c7d0;
  --accent-300: #4aa7b3;
  --accent-400: #367f89;
  --accent-500: #24555c;
  --accent-600: #18363a;
  --accent-rgb: 74, 167, 179;
}

:root[data-theme="steel"] {
  --accent-50: #eeeeea;
  --accent-100: #d1d0ca;
  --accent-200: #aaa79f;
  --accent-300: #858176;
  --accent-400: #625e55;
  --accent-500: #424038;
  --accent-600: #25241f;
  --accent-rgb: 133, 129, 118;
}

--color-success: #7fad68;
--color-warning: #c88a3d;
--color-danger: #9f4e3d;
--color-info: #5b7c84;
```

Semantic colors should not be replaced by theme colors.

### Component Tokens

```css
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 18px;
--radius-xl: 24px;
--radius-panel: 28px;

--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;

--shadow-panel: 0 18px 60px var(--color-shadow);
--shadow-float: 0 28px 90px var(--color-shadow);
--shadow-inset: inset 0 1px 0 var(--color-highlight);

--duration-fast: 140ms;
--duration-base: 220ms;
--duration-slow: 420ms;
--ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
```

### Layout Rules

Use a disciplined grid. Desktop apps should generally use a left rail plus
content panels. Mobile should use a top wordmark with bottom or compact nav.
Dashboards should use nested cards in a 12-column grid. Portfolio screens
should combine editorial hero content with instrument cards. Settings should be
dense but readable grouped panels.

Spacing should be generous but not airy in a generic SaaS way. Cards and panels
should align to the same baseline grid. Avoid random component widths.

### Buttons

Buttons should feel like physical controls.

- Primary buttons use accent background, readable foreground, a thin
  accent-adjacent border, subtle inset top highlight, slight shadow, and a
  compact uppercase or small-title label.
- Secondary buttons use transparent or surface background, thin border, muted
  text, and hover state with faint accent tint.
- Tertiary buttons use a text/link style; a small arrow or command-style hint is
  acceptable.
- Avoid large pill buttons unless the platform specifically benefits from it.

### Cards and Panels

Cards should look like layered trays or precision modules.

```css
.card {
  background: linear-gradient(180deg, var(--color-surface), var(--color-bg-elevated));
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-inset);
}
```

Optional details include top hairline dividers, active rails in accent color,
tiny corner calibration ticks, status dots, and mono metadata. Avoid flat white
cards with generic shadows.

### Inputs and Forms

Inputs should be calm, thin, and precise.

- Background should be slightly inset from the surrounding surface.
- Border should be visible but quiet.
- Focus ring should use the active accent.
- Labels should be small, uppercase, mono or UI sans.
- Helper and error text should be compact and clear.

```css
outline: 1px solid rgba(var(--accent-rgb), 0.75);
box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.12);
```

### Navigation

Preferred app navigation labels:

```text
Workbench
Notes
Systems
Lab
Archive
Settings
```

Preferred personal portfolio labels:

```text
Work
Writing
Systems
Lab
About
```

Active navigation items should use an accent dot or rail, subtle tinted
background, high-contrast text, and accent-shifted icon treatment. Do not
over-animate navigation.

### Iconography

Icons should be custom-feeling even when based on an existing library. Prefer
thin line icons that are geometric, diagrammatic, technical, minimal, and
slightly squared rather than bubbly. Good concepts include dashboard, system,
server, cloud, automation, terminal, code, database, security, monitor, home,
sensor, light, energy, camera, timeline, sync, flow, archive, and settings.

If using Lucide or similar, set consistent stroke widths and customize where
needed. Do not leave icons feeling like default template icons. Core UI controls
should use stable icon names and vector/system icons, not emoji. Emojis may be
used only as content accents, status labels, examples, or expressive-mode
details.

### Data Visualization

Charts should feel like instrument readings.

- Use active accent for primary data.
- Use muted grid lines.
- Avoid rainbow palettes.
- Prefer thin lines, soft area fills, small dots.
- Labels should use mono.
- Dashboard metrics should be calm, not flashy.

```css
--chart-primary: var(--accent-300);
--chart-secondary: var(--accent-100);
--chart-grid: var(--color-border-soft);
--chart-positive: var(--color-success);
--chart-warning: var(--color-warning);
--chart-danger: var(--color-danger);
```

### Motion

Motion should feel mechanical and calm. Use 140ms hover transitions, 220ms panel
transitions, 220-320ms modal or palette transitions, and very slow or no ambient
motion. Preferred motion includes panels rising 1-2px on hover, subtle active
state glows, very slow status-dot pulses, and command palettes fading and
scaling from 0.98 to 1. Avoid bouncy springs, large parallax, excessive page
transitions, and constant animation.

### Light and Dark Mode Guidance

Light mode should not be pure white. It should feel like parchment, drafting
paper, warm canvas, notebook pages, or architectural documents. Use dark ink,
muted clay borders, and accent color carefully. Keep the same component shapes
and calibration motifs.

Dark mode is the primary showcase mode. It should feel like graphite, smoked
glass, carbon, dim instrument panels, and a warm shadowed workbench. Never use
pure black for every surface. Layer multiple near-black tones.

### Platform Guidance

- **React / Next.js / Vercel:** use CSS variables for all tokens. Tailwind is
  allowed only if mapped to these tokens. Do not use default shadcn styling
  without adapting it to Aurelglyph. Components should be reusable and
  theme-aware.
- **Rails:** use CSS variables and server-rendered components. Prefer
  ViewComponent, Phlex, partials, or helpers that preserve the same token
  system. Avoid Bootstrap defaults.
- **iOS / macOS / watchOS:** translate tokens into SwiftUI color, radius,
  typography, and spacing constants. Use the same brand dot, calibration marks,
  typography spirit, and accent themes. watchOS should be simplified: dark
  surfaces, active accent, key metrics, compact cards.

### Implementation Requirements for Agents

When modifying or generating UI in this repo:

1. Reuse existing project conventions first.
2. Add or update design tokens before styling individual components.
3. Support both light and dark mode unless the project explicitly does not have
   them yet.
4. Support multiple base accent themes when feasible.
5. Use `royal-purple` as the preferred personalized theme unless told
   otherwise.
6. Avoid hardcoded colors in components.
7. Avoid copying Material, Bootstrap, Apple, Linear, or Vercel defaults.
8. Preserve accessibility and contrast.
9. Ensure keyboard focus states are visible.
10. Keep components responsive.
11. Favor small, precise details over decorative clutter.
12. Use real semantic HTML where applicable.
13. Do not introduce heavy dependencies for simple visual effects.
14. If introducing icons, keep stroke weight and geometry consistent.
15. If introducing fonts, use open-source fonts and load them efficiently.

### Starter CSS Variables

Use this as a starter if a consuming project lacks design tokens:

```css
:root {
  color-scheme: dark light;

  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-ui: "IBM Plex Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;

  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --radius-panel: 28px;

  --duration-fast: 140ms;
  --duration-base: 220ms;
  --duration-slow: 420ms;
  --ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
}

:root[data-mode="dark"] {
  --color-bg: #0d0d0b;
  --color-bg-elevated: #12120f;
  --color-surface: #171714;
  --color-surface-2: #1f1e1a;
  --color-surface-3: #282620;
  --color-border: #34312b;
  --color-border-soft: rgba(231, 223, 209, 0.10);
  --color-text: #e7dfd1;
  --color-text-muted: #a59b8b;
  --color-text-subtle: #6e685e;
  --color-shadow: rgba(0, 0, 0, 0.55);
  --color-highlight: rgba(255, 255, 255, 0.06);
}

:root[data-mode="light"] {
  --color-bg: #ece4d8;
  --color-bg-elevated: #f3ecdf;
  --color-surface: #e2d8ca;
  --color-surface-2: #d8ccb9;
  --color-surface-3: #cdbda8;
  --color-border: #b9a993;
  --color-border-soft: rgba(42, 36, 30, 0.14);
  --color-text: #2a241e;
  --color-text-muted: #64594c;
  --color-text-subtle: #8c7e6c;
  --color-shadow: rgba(42, 36, 30, 0.18);
  --color-highlight: rgba(255, 255, 255, 0.45);
}

:root[data-theme="royal-purple"] {
  --accent-50: #efe4ff;
  --accent-100: #d8c0ff;
  --accent-200: #b88cff;
  --accent-300: #9358e8;
  --accent-400: #7a3fd1;
  --accent-500: #562a93;
  --accent-600: #2d174f;
  --accent-rgb: 147, 88, 232;
}
```

### Copywriting Tone

Use short, precise copy. Tone should be calm, direct, thoughtful, technical
without jargon bloat, and quietly confident.

Good examples:

```text
Building tools for smarter homes.
Systems operational.
Quiet mode enabled.
Architecture decision: 006.
View projects.
Signal over noise.
Designed to scale and make sense.
```

Avoid hype, generic AI/startup language, "unlock your potential" phrasing,
excessive emojis, and salesy marketing copy.

### Default Direction for New Screens

When asked to create a new UI screen, default to dark mode, royal purple accent,
left rail or compact top nav, graphite surfaces, Cormorant Garamond display
heading, IBM Plex Sans UI text, IBM Plex Mono labels and metadata, subtle
calibration marks, precise cards and panels, accessible focus states, and
responsive layout.

If the screen is public-facing, make it more editorial. If the screen is
app/dashboard-facing, make it more instrument-like.

### Quality Bar

A finished screen should feel like it belongs to the same Aurelglyph family.
For Ajit/personal apps, it should also feel compatible with the `absessive`
identity. Ask before shipping:

- Does it feel warm but technical?
- Does it avoid generic SaaS defaults?
- Are theme colors tokenized?
- Does it support dark and light mode?
- Could this be reused in React, Rails, iOS, macOS, and watchOS?
- Are details precise without being noisy?
- Does it feel like Aurelglyph?

If not, revise toward the brand phrase: "Warm precision. Quiet systems.
Obsessive details."

## Working Guidelines

- Prefer the approved design spec before introducing new patterns.
- Keep changes focused on the current task.
- Do not revert user changes unless explicitly asked.
- Read relevant files before editing.
- Use `rg` for searching when available.
- Use `apply_patch` for manual file edits.
- Keep generated artifacts reproducible from the canonical token source.

## Delivery Steps

- Treat linting and unit tests as first-class development requirements.
- Identify the relevant test command before code changes when a test framework
  exists.
- Identify the relevant lint command before code changes when one exists.
- Add or update tests for behavior changes.
- Run the narrowest relevant checks after implementation.
- Run lint checks after implementation when practical.
- Ask a QA agent to review changes that affect user-visible behavior, shared
  logic, data handling, generated artifacts, package contracts, or regression-
  prone code.
- Address QA findings before final handoff, or explain why a finding was not
  acted on.

## Design-System Rules

- The token source is canonical; platform outputs should be generated from it.
- UX changes must be applied across every affected platform surface in the same
  change set: CSS, React, React Native, SwiftUI, Rails, generated token outputs,
  examples, and static previews. Do not leave one platform visually or
  semantically behind when a shared pattern changes.
- Platform packages should feel native while preserving shared naming,
  semantics, variants, states, and accessibility expectations.
- Core controls should use stable icon names and vector/system icons, not emoji.
- Emojis may be used only as content accents, status labels, examples, or
  expressive-mode details.
- Accessibility is part of the component contract, not a later polish pass.

## Verification

- Start with targeted linting and unit tests for token generation or package
  behavior.
- Run package-level builds when changing public exports.
- Run visual or accessibility checks when changing components or styles.
- If checks cannot be run, explain why in the final response.

## Communication

- Summarize changed files and verification performed.
- Call out assumptions, skipped checks, and follow-up work clearly.
