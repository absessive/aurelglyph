import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Button } from "./Button";
import { Icon } from "./Icon";

describe("Button", () => {
  it("exports a function component", () => {
    expect(typeof Button).toBe("function");
  });

  it("renders native button props and variant classes", () => {
    const element = Button({
      children: "Save",
      disabled: true,
      type: "submit",
      variant: "secondary"
    }) as ReactElement<Record<string, unknown>>;
    const props = element.props;
    const children = props.children as ReactElement<Record<string, unknown>>[];
    const content = children[1];

    expect(element.type).toBe("button");
    expect(content.type).toBe("span");
    expect(content.props.className).toBe("ag-button__content");
    expect(content.props.children).toBe("Save");
    expect(props.disabled).toBe(true);
    expect(props.type).toBe("submit");
    expect(props.className).toContain("ag-button");
    expect(props.className).toContain("ag-button--secondary");
  });

  it("hides paired icons from assistive technology by default", () => {
    const element = Button({
      children: "Save",
      icon: "save"
    }) as ReactElement<Record<string, unknown>>;
    const children = element.props.children as ReactElement<Record<string, unknown>>[];
    const icon = children[0];

    expect(icon.props.name).toBe("save");
    expect(icon.props.decorative).toBe(true);
    expect(icon.props.title).toBeUndefined();
  });

  it("keeps explicit icon labels when provided", () => {
    const element = Button({
      children: "Save",
      icon: "save",
      iconLabel: "Save action"
    }) as ReactElement<Record<string, unknown>>;
    const children = element.props.children as ReactElement<Record<string, unknown>>[];
    const icon = children[0];

    expect(icon.props.decorative).toBe(false);
    expect(icon.props.title).toBe("Save action");
  });
});

describe("Icon", () => {
  it("provides a default accessible label for named icons", () => {
    const element = Icon({ name: "upload" }) as ReactElement<Record<string, unknown>>;

    expect(element.type).toBe("span");
    expect(element.props.role).toBe("img");
    expect(element.props["aria-label"]).toBe("Upload");
    expect(element.props["data-icon"]).toBe("upload");
  });

  it("uses title to override the accessible label", () => {
    const element = Icon({ name: "upload", title: "Attach file" }) as ReactElement<Record<string, unknown>>;

    expect(element.props["aria-label"]).toBe("Attach file");
    expect(element.props.title).toBe("Attach file");
  });

  it("can render decorative icons", () => {
    const element = Icon({ decorative: true, name: "upload" }) as ReactElement<Record<string, unknown>>;

    expect(element.props["aria-hidden"]).toBe(true);
    expect(element.props["aria-label"]).toBeUndefined();
    expect(element.props.role).toBeUndefined();
  });

  it("renders distinct SVG paths for each icon name", () => {
    const names = [
      "upload",
      "attachment",
      "microphone",
      "camera",
      "video",
      "image",
      "play",
      "pause",
      "record",
      "stop",
      "send",
      "save",
      "search",
      "filter",
      "settings",
      "edit",
      "delete",
      "close",
      "back",
      "forward",
      "check",
      "warning",
      "info",
      "success"
    ] as const;
    const paths = names.map((name) => {
      const icon = Icon({ name }) as ReactElement<Record<string, unknown>>;
      const svg = icon.props.children as ReactElement<Record<string, unknown>>;
      const path = svg.props.children as ReactElement<Record<string, unknown>>;
      return path.props.d;
    });

    expect(new Set(paths)).toHaveLength(names.length);
  });
});

describe("FileUpload", () => {
  it("marks its paired upload icon as decorative", () => {
    const source = readFileSync(join(import.meta.dirname, "FileUpload.tsx"), "utf8");

    expect(source).toContain('<Icon className="ag-upload__icon" decorative name="upload" />');
  });
});
