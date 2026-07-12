# Aurelglyph Rails

Rails asset and helper package for Aurelglyph design tokens.

## Install from Git

```ruby
gem "aurelglyph-rails",
  git: "https://github.com/absessive/aurelglyph",
  glob: "packages/rails/aurelglyph-rails.gemspec"
```

## Use the Stylesheet

Add the packaged stylesheet to your layout:

```erb
<%= stylesheet_link_tag "aurelglyph", "data-turbo-track": "reload" %>
```

Sprockets apps may also require the asset from an application stylesheet:

```css
/*
 *= require aurelglyph
 */
```

The gem packages Libre Baskerville, Atkinson Hyperlegible, and Space Mono
WOFF2 files under `app/assets/fonts/aurelglyph`. Keep that directory on the
same asset path as the stylesheet so its relative `@font-face` URLs resolve.
The full OFL and upstream notices ship beside the font files.

## Use Tokens in Views

```erb
<%= aurelglyph_token("color.accent.royal-purple.300") %>
```
