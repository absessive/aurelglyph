# @aurelglyph/react-native

React Native token and typography adapters for Aurelglyph.

```bash
npm install @aurelglyph/react-native
```

The main export provides native-safe family aliases rather than CSS font
stacks:

```ts
import { aurelglyphTheme } from "@aurelglyph/react-native";

const bodyStyle = {
  color: aurelglyphTheme["color.mode.dark.text"],
  fontFamily: aurelglyphTheme["font.family.body"]
};
```

The optional font subpath exposes static Metro requires for the five packaged
TTF assets. With Expo Font:

```tsx
import { useFonts } from "expo-font";
import {
  aurelglyphFontAssets,
  aurelglyphFontFamilies
} from "@aurelglyph/react-native/fonts";

const [fontsLoaded] = useFonts(aurelglyphFontAssets);

const labelStyle = {
  fontFamily: aurelglyphFontFamilies.uiBold
};
```

Bare React Native projects can link the files from `assets/fonts` with their
normal asset pipeline. The aliases keep Expo and linked-font usage explicit;
use the bold aliases for 600–700 weight text.
