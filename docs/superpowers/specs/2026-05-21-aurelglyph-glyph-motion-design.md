# Aurelglyph GlyphMotion Design

## Goal

Ship Aurelglyph `0.4.0` with a production-style motion subsystem for SwiftUI and React/web. GlyphMotion should cover the major transition capabilities expected from shared-element transition systems while using Aurelglyph-native names, APIs, tokens, documentation, examples, and implementation.

## Non-Copying Rule

GlyphMotion may cover the same product category as existing transition libraries, including identity matching, matched element transitions, fades, scaling, path motion, stagger, snapshots, and interactive progress. It must not copy code, API names, class names, repo structure, docs structure, examples, or branding from Hero or any other library.

## Scope For 0.4.0

Production API and examples:

- `GlyphMotion`: shared namespace for motion definitions and helpers.
- `GlyphSpring`: named spring presets: `quiet`, `standard`, `expressive`.
- `GlyphTransition`: named transition vocabulary: `bloom`, `drift`, `collapse`, `glass`, `thread`, `tilt`, `arc`, `none`.
- `GlyphState`: conditional phase vocabulary: `matched`, `presenting`, `dismissing`, `appearing`, `disappearing`.
- `GlyphDirection`: `up`, `down`, `leading`, `trailing`, `forward`, `back`.
- `GlyphSnapshotStrategy`: `live`, `optimized`, `layer`, `none`.
- `GlyphInteractive`: progress model with update, finish, and cancel state.
- Cross-platform tokens for duration, delay, spring, depth, blur, scale, opacity, drift distance, arc intensity, and stagger.
- SwiftUI modifiers:
  - `.glyphMatch(_:in:)`
  - `.glyphTransition(_:)`
  - `.glyphSpring(_:)`
- React/web adapter:
  - `GlyphMotionProvider`
  - `GlyphMatch`
  - `GlyphTransition`
  - `useGlyphMotion`
  - `data-glyph-match`, `data-glyph-transition`, and CSS variables
  - View Transition API detection with graceful CSS fallback
- Examples:
  - card expand/collapse
  - tab drift
  - persistent background layer
  - interactive progress explanation

## Out Of Scope For 0.4.0

- Full custom UIKit navigation controller replacement.
- visionOS-specific implementation.
- Pixel-perfect parity with any third-party transition library.
- Runtime DOM snapshot cloning on web beyond safe View Transition API integration and CSS fallback attributes.

These can be added later as platform-specific adapters without changing the core vocabulary.

## Architecture

The canonical motion vocabulary lives in tokens and platform source files. React renders data attributes and CSS classes that can use browser View Transitions when available and tokenized transform/opacity fallbacks otherwise. SwiftUI exposes type-safe values and modifiers that wrap `matchedGeometryEffect`, `transition`, and animation presets where supported by SwiftUI.

The implementation should prioritize the waiting iOS app: SwiftUI APIs must compile and be documented. React/web must remain useful and graceful without assuming every browser supports View Transitions.

## Testing

- Token tests assert motion token names and generated output.
- React tests assert exports, provider behavior, data attributes, and View Transition fallback contract.
- Swift tests assert all GlyphMotion symbols and modifiers are available.
- Pages tests continue to pass.
- Release verification must include `npm run verify`, `swift test`, Rails tests if Rails docs/generated files change, and `git diff --check`.
