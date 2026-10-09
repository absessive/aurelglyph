import { NativeModules, Platform, findNodeHandle, type TextInputInstance, type TextInputProps } from "react-native";

type SecureEntryModule = {
  prepareSecureInput: (tag: number, expectedValue: string, selection: TextInputProps["selection"] | null) => void;
  registerSecureInput: (tag: number) => void;
  unregisterSecureInput: (tag: number) => void;
};

function iosEntry(input: TextInputInstance | null): { native: SecureEntryModule; tag: number } | undefined {
  if (Platform.OS !== "ios" || !input) return;
  const tag = findNodeHandle(input);
  if (tag == null) return;
  const native = NativeModules.AurelglyphSecureEntry as SecureEntryModule | undefined;
  if (!native?.prepareSecureInput || !native.registerSecureInput || !native.unregisterSecureInput) throw new Error("Aurelglyph PasswordField requires its iOS native module. Run pod install and rebuild the app after installing @aurelglyph/react-native.");
  return { native, tag };
}

/** Register before interaction; cleanup also prevents native pooled-view reuse. */
export function registerIosSecureEntry(input: TextInputInstance | null): (() => void) | undefined {
  const entry = iosEntry(input);
  if (!entry) return;
  entry.native.registerSecureInput(entry.tag);
  return () => entry.native.unregisterSecureInput(entry.tag);
}

/** Keep UIKit's secure editing storage synchronized without a JS value edit. */
export function prepareIosSecureEntry(input: TextInputInstance | null, value: string, selection?: TextInputProps["selection"]): void {
  const entry = iosEntry(input);
  if (!entry) return;
  const start = selection ? Math.max(0, Math.min(value.length, selection.start)) : 0;
  const range = selection ? { start, end: Math.max(start, Math.min(value.length, selection.end ?? selection.start)) } : null;
  entry.native.prepareSecureInput(entry.tag, value, range);
}
