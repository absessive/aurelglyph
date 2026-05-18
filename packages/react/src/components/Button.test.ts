import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Button } from "./Button";
import { Icon, type AurelglyphIconName } from "./Icon";

const iconNames = [
  "home",
  "dashboard",
  "user",
  "users",
  "bell",
  "mail",
  "calendar",
  "clock",
  "plus",
  "minus",
  "upload",
  "download",
  "attachment",
  "share",
  "send",
  "copy",
  "save",
  "lock",
  "unlock",
  "shield",
  "eye",
  "eye-off",
  "search",
  "filter",
  "sort",
  "menu",
  "more-horizontal",
  "more-vertical",
  "settings",
  "edit",
  "delete",
  "close",
  "back",
  "forward",
  "chevron-down",
  "chevron-up",
  "external-link",
  "refresh",
  "sync",
  "check",
  "warning",
  "info",
  "success",
  "cloud",
  "database",
  "server",
  "terminal",
  "code",
  "archive",
  "star",
  "heart",
  "bookmark",
  "tag",
  "map-pin",
  "location",
  "phone",
  "message",
  "chat",
  "grid",
  "list",
  "columns",
  "table",
  "layout",
  "panel",
  "sidebar",
  "command",
  "package",
  "cube",
  "layers",
  "workflow",
  "branch",
  "git-branch",
  "link",
  "unlink",
  "log-in",
  "log-out",
  "power",
  "play",
  "pause",
  "stop",
  "record",
  "microphone",
  "camera",
  "video",
  "image",
  "music",
  "volume",
  "mute",
  "wallet",
  "credit-card",
  "cart",
  "receipt",
  "chart-line",
  "chart-bar",
  "activity",
  "spark",
  "bolt",
  "target",
  "compass",
  "thumbs-up",
  "thumbs-down",
  "help",
  "notification",
  "expand",
  "contract"
] as const satisfies readonly AurelglyphIconName[];

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

  it("uses semantic accent control tokens for primary button contrast", () => {
    const css = readFileSync(join(import.meta.dirname, "../styles.css"), "utf8");

    expect(css).toContain("color: var(--ag-color-semantic-accent-foreground);");
    expect(css).toContain("var(--ag-color-semantic-accent-control)");
    expect(css).toContain("var(--ag-color-semantic-accent-control-strong)");
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

  it("renders the curated 105-icon web and iOS app contract", () => {
    expect(iconNames).toHaveLength(105);

    const paths = iconNames.map((name) => {
      const icon = Icon({ name }) as ReactElement<Record<string, unknown>>;
      const svg = icon.props.children as ReactElement<Record<string, unknown>>;
      const path = svg.props.children as ReactElement<Record<string, unknown>>;
      expect(icon.props["data-icon"]).toBe(name);
      return path.props.d;
    });

    expect(new Set(paths)).toHaveLength(iconNames.length);
  });

  it("keeps corrected glyphs for reviewed icon shapes", () => {
    const expectedPaths = {
      "git-branch": "M7 4v10a4 4 0 0 0 4 4h3M17 4v3a5 5 0 0 1-5 5H7M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
    } as const;

    for (const [name, expectedPath] of Object.entries(expectedPaths)) {
      const icon = Icon({ name: name as AurelglyphIconName }) as ReactElement<Record<string, unknown>>;
      const svg = icon.props.children as ReactElement<Record<string, unknown>>;
      const path = svg.props.children as ReactElement<Record<string, unknown>>;

      expect(path.props.d).toBe(expectedPath);
    }
  });
});

describe("FileUpload", () => {
  it("marks its paired upload icon as decorative", () => {
    const source = readFileSync(join(import.meta.dirname, "FileUpload.tsx"), "utf8");

    expect(source).toContain('<Icon className="ag-upload__icon" decorative name="upload" />');
  });
});

describe("ExpandableSection", () => {
  it("ships a disclosure component with controlled and animated semantics", () => {
    const source = readFileSync(join(import.meta.dirname, "ExpandableSection.tsx"), "utf8");
    const css = readFileSync(join(import.meta.dirname, "../styles.css"), "utf8");

    expect(source).toContain("export function ExpandableSection");
    expect(source).toContain("aria-expanded={isOpen}");
    expect(source).toContain('aria-controls={panelId}');
    expect(source).toContain('name={isOpen ? "contract" : "expand"}');
    expect(source).toContain("onOpenChange?.(nextOpen)");
    expect(css).toContain(".ag-disclosure__panel");
    expect(css).toContain("grid-template-rows var(--ag-motion-duration-base)");
    expect(css).toContain("opacity var(--ag-motion-duration-base)");
  });
});
