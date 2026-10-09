import { describe, expect, it } from "vitest";
import { selectIphoneSimulator } from "../examples/react-native-smoke/scripts/ios-device.mjs";

const phone = (udid: string, state = "Shutdown", name = "iPhone 17 Pro", isAvailable = true) => ({ udid, state, name, isAvailable });

describe("native smoke simulator selection", () => {
  it("preserves the default booted, preferred-model, then first-phone order", () => {
    const first = phone("first"); const preferred = phone("preferred", "Shutdown", "iPhone 16 Pro"); const booted = phone("booted", "Booted");
    expect(selectIphoneSimulator({ devices: { iOS: [first, preferred, booted] } })).toBe(booted);
    expect(selectIphoneSimulator({ devices: { iOS: [first, preferred] } })).toBe(preferred);
    expect(selectIphoneSimulator({ devices: { iOS: [first] } })).toBe(first);
  });
  it("honors an explicit available iPhone instead of an unrelated booted app", () => {
    const requested = phone("requested");
    expect(selectIphoneSimulator({ devices: { iOS: [phone("other", "Booted"), requested] } }, "requested")).toBe(requested);
  });
  it("rejects explicit unavailable, non-iPhone, non-iOS, and missing destinations", () => {
    const inventory = { devices: { iOS: [phone("unavailable", "Shutdown", "iPhone 17 Pro", false), phone("tablet", "Shutdown", "iPad Pro")], tvOS: [phone("tv")] } };
    for (const id of ["unavailable", "tablet", "tv", "missing"]) expect(() => selectIphoneSimulator(inventory, id)).toThrow("must identify an available iPhone simulator");
    expect(selectIphoneSimulator(inventory)).toBeUndefined();
  });
});
