# Changelog

## 0.1.0

- Establish the first Aurelglyph cross-platform design-system workspace.
- Add GitHub Pages usage, components, and changelog pages.
- Add React component previews with theme and accent switching.
- Expand the Aurelglyph icon catalog for common web and iOS app surfaces.
- Add Rails and Swift icon-name helpers for cross-platform adoption.
- Correct the `git-branch` icon shape, add `thumbs-up`, `thumbs-down`,
  `help`, `notification`, `expand`, and `contract` icons, and temporarily remove
  `key` pending a better glyph.
- Add animated expandable section components for React and SwiftUI, plus a
  server-rendered Rails disclosure helper.
- Document generic icon usage and per-component React usage for Button,
  ExpandableSection, TextField, TextArea, and FileUpload.
- Package OFL WOFF2 files for Newsreader, IBM Plex Serif, IBM Plex Sans, and
  JetBrains Mono as the Aurelglyph font set.
- Copy the packaged font files into the generated GitHub Pages output so
  static docs use the same typography without external font requests.
- Replace the earlier bundled font stack with OFL-licensed packaged fonts so
  Aurelglyph code can stay MIT while font files retain their own license.
- Improve light-mode primary button contrast across supported accent themes.
