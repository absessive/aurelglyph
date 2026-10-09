import { afterEach, describe, expect, it, vi } from "vitest";
import type { TextInputInstance } from "react-native";

const native = vi.hoisted(() => ({ platform: "ios", tag: 17 as number | null | undefined, prepare: vi.fn(), register: vi.fn(), unregister: vi.fn(), installed: true }));
vi.mock("react-native", () => ({
  Platform: { get OS() { return native.platform; } },
  findNodeHandle: () => native.tag,
  NativeModules: { get AurelglyphSecureEntry() { return native.installed ? { prepareSecureInput: native.prepare, registerSecureInput: native.register, unregisterSecureInput: native.unregister } : undefined; } }
}));
import { prepareIosSecureEntry, registerIosSecureEntry } from "./secure-entry.js";

const input = {} as TextInputInstance;
afterEach(() => { native.platform = "ios"; native.tag = 17; native.installed = true; native.prepare.mockClear(); native.register.mockClear(); native.unregister.mockClear(); });

describe("iOS secure-entry bridge contract", () => {
  it("registers the owned input and unregisters its original tag even after unmount", () => {
    const cleanup = registerIosSecureEntry(input);
    expect(native.register).toHaveBeenCalledWith(17);
    native.tag = null;
    cleanup?.();
    expect(native.unregister).toHaveBeenCalledWith(17);
  });
  it("preserves native selection unless an explicit UTF-16 range is supplied", () => {
    prepareIosSecureEntry(input, "ab🛠");
    expect(native.prepare).toHaveBeenLastCalledWith(17, "ab🛠", null);
    prepareIosSecureEntry(input, "ab🛠", { start: -3, end: 99 });
    expect(native.prepare).toHaveBeenLastCalledWith(17, "ab🛠", { start: 0, end: 4 });
    prepareIosSecureEntry(input, "ab", { start: 8, end: 1 });
    expect(native.prepare).toHaveBeenLastCalledWith(17, "ab", { start: 2, end: 2 });
  });
  it("leaves Android, other platforms, and unmounted or unresolved inputs alone", () => {
    for (const platform of ["android", "web"]) { native.platform = platform; prepareIosSecureEntry(input, "sample"); }
    native.platform = "ios";
    prepareIosSecureEntry(null, "sample");
    for (const tag of [null, undefined]) { native.tag = tag; prepareIosSecureEntry(input, "sample"); }
    expect(native.prepare).not.toHaveBeenCalled();
  });
  it("reports a missing iOS pod instead of silently claiming a working secure editor", () => {
    native.installed = false;
    expect(() => prepareIosSecureEntry(input, "sample")).toThrow("Run pod install and rebuild");
    expect(native.prepare).not.toHaveBeenCalled();
  });
});
