import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Alert } from "./Alert";
import { Button } from "./Button";
import { AppShell } from "./AppShell";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Breadcrumbs } from "./Breadcrumbs";
import { Card } from "./Card";
import { CommandPalette } from "./CommandPalette";
import { DataTable } from "./Table";
import { EmptyState } from "./EmptyState";
import { Icon, type AurelglyphIconName } from "./Icon";
import { ListRow, ListSection } from "./List";
import { Metric } from "./Metric";
import { NavigationPage, NavigationStack } from "./NavigationStack";
import { Pagination } from "./Pagination";
import { Progress } from "./Progress";
import { SearchField } from "./SearchField";
import { SegmentedControl } from "./SegmentedControl";
import { Select } from "./Select";
import { Sheet } from "./Sheet";
import { Skeleton } from "./Skeleton";
import { Switch } from "./Switch";
import { Tabs } from "./Tabs";
import { TabBar } from "./TabBar";
import { Toast } from "./Toast";
import { Toolbar } from "./Toolbar";
import { TopBar } from "./TopBar";

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
    const buttonRule = /\.ag-button \{([\s\S]*?)\n\}/u.exec(css)?.[1];

    expect(css).toContain("color: var(--ag-color-semantic-accent-foreground);");
    expect(css).toContain("var(--ag-color-semantic-accent-control)");
    expect(css).toContain("var(--ag-color-semantic-accent-control-strong)");
    expect(buttonRule).not.toMatch(/^\s*color var\(--ag-motion-duration-fast\)/mu);
  });

  it("disables and announces loading controls", () => {
    const element = Button({ children: "Save", loading: true }) as ReactElement<Record<string, unknown>>;
    const children = element.props.children as ReactElement<Record<string, unknown>>[];

    expect(element.props.disabled).toBe(true);
    expect(element.props["aria-busy"]).toBe(true);
    expect(element.props["data-loading"]).toBe(true);
    expect(children[2]?.props.className).toBe("ag-button__spinner");
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
  it("ships a disclosure component with controlled and focus-safe semantics", () => {
    const source = readFileSync(join(import.meta.dirname, "ExpandableSection.tsx"), "utf8");
    const css = readFileSync(join(import.meta.dirname, "../styles.css"), "utf8");

    expect(source).toContain("export function ExpandableSection");
    expect(source).toContain("aria-expanded={isOpen}");
    expect(source).toContain('aria-controls={panelId}');
    expect(source).toContain('name={isOpen ? "contract" : "expand"}');
    expect(source).toContain("onOpenChange?.(nextOpen)");
    expect(source).toContain("hidden={!isOpen}");
    expect(source).toContain("inert={!isOpen ? true : undefined}");
    expect(css).toContain(".ag-disclosure__panel");
    expect(css).toContain("grid-template-rows var(--ag-motion-duration-base)");
    expect(css).toContain("opacity var(--ag-motion-duration-base)");
  });
});

describe("Phase 1 mobile foundation components", () => {
  it("exports app shell and top navigation primitives", () => {
    const shell = AppShell({
      children: "Content",
      footer: "Tabs",
      navigation: "Rail",
      topBar: TopBar({ title: "Workbench", subtitle: "Systems" })
    }) as ReactElement<Record<string, unknown>>;
    const topBar = TopBar({ actions: "Edit", leading: "Back", title: "Workbench" }) as ReactElement<Record<string, unknown>>;

    expect(shell.props.className).toContain("ag-app-shell");
    expect(topBar.props.className).toContain("ag-top-bar");
    const shellBody = (shell.props.children as Array<ReactElement<Record<string, unknown>> | null>)[1];
    expect(shellBody?.props.className).toContain("ag-app-shell__body--with-navigation");

    const embedded = AppShell({ children: "Embedded", contentAs: "section" }) as ReactElement<Record<string, unknown>>;
    const embeddedBody = (embedded.props.children as Array<ReactElement<Record<string, unknown>> | null>)[1];
    expect(embeddedBody?.props.className).not.toContain("ag-app-shell__body--with-navigation");
    const embeddedContent = (embeddedBody?.props.children as Array<ReactElement<Record<string, unknown>> | null>)[1];
    expect(embeddedContent?.type).toBe("section");

    const embeddedTopBar = TopBar({ title: "Embedded", titleAs: "h3" }) as ReactElement<Record<string, unknown>>;
    const titleGroup = (embeddedTopBar.props.children as Array<ReactElement<Record<string, unknown>> | null>)[1];
    const embeddedTitle = (titleGroup?.props.children as Array<ReactElement<Record<string, unknown>> | null>)[0];
    expect(embeddedTitle?.type).toBe("h3");

    const css = readFileSync(join(import.meta.dirname, "../styles.css"), "utf8");
    expect(css).toContain("container-name: ag-app-shell");
    expect(css).toContain("@container ag-app-shell (min-width: 760px)");
    expect(css).toContain(".ag-app-shell__body--with-navigation");
    expect(css).toContain(".ag-app-shell__body:has(> .ag-app-shell__nav)");
    expect(css).toMatch(/\.ag-app-shell__top \{[\s\S]*?grid-row: 1;/u);
    expect(css).toMatch(/\.ag-app-shell__body \{[\s\S]*?grid-row: 2;/u);
    expect(css).toMatch(/\.ag-app-shell__footer \{[\s\S]*?grid-row: 3;/u);
    expect(css).toMatch(/\.ag-tooltip__surface \{[\s\S]*?pointer-events: none;/u);
  });

  it("renders tab bar items with active page semantics", () => {
    const tabBar = TabBar({
      activeId: "systems",
      items: [
        { href: "#workbench", icon: "dashboard", id: "workbench", label: "Workbench" },
        { href: "#systems", icon: "settings", id: "systems", label: "Systems" }
      ]
    }) as ReactElement<Record<string, unknown>>;
    const items = tabBar.props.children as ReactElement<Record<string, unknown>>[];

    expect(tabBar.type).toBe("nav");
    expect(items[1].props["aria-current"]).toBe("page");
    expect(items[1].props.className).toContain("is-active");
  });

  it("renders list sections and rows with selected state", () => {
    const row = ListRow({
      description: "Quiet mode enabled",
      icon: "bell",
      selected: true,
      title: "Notifications",
      trailing: "On"
    }) as ReactElement<Record<string, unknown>>;
    const section = ListSection({ children: row, title: "Settings" }) as ReactElement<Record<string, unknown>>;

    expect(section.props.className).toContain("ag-list-section");
    expect(row.props.className).toContain("ag-list-row");
    expect(row.props["aria-current"]).toBe("true");
  });

  it("renders cards, search, and switches with mobile form semantics", () => {
    const card = Card({ children: "Body", eyebrow: "Live", title: "Status" }) as ReactElement<Record<string, unknown>>;
    const searchSource = readFileSync(join(import.meta.dirname, "SearchField.tsx"), "utf8");
    const switchSource = readFileSync(join(import.meta.dirname, "Switch.tsx"), "utf8");
    const css = readFileSync(join(import.meta.dirname, "../styles.css"), "utf8");

    expect(card.props.className).toContain("ag-card");
    expect(typeof SearchField).toBe("function");
    expect(typeof Switch).toBe("function");
    expect(searchSource).toContain('type="search"');
    expect(searchSource).toContain('name="search"');
    expect(switchSource).toContain('role="switch"');
    expect(switchSource).toContain('type="checkbox"');
    expect(css).toContain(".ag-tab-bar");
    expect(css).toContain(".ag-list-row");
    expect(css).toContain(".ag-switch__input:checked");
  });
});

describe("Phase 2 mobile app components", () => {
  it("renders navigation stack, toolbar, and sheet semantics", () => {
    const page = NavigationPage({ children: "Body", title: "Systems" }) as ReactElement<Record<string, unknown>>;
    const stack = NavigationStack({ children: page, title: "Workbench" }) as ReactElement<Record<string, unknown>>;
    const toolbar = Toolbar({ children: "Tools" }) as ReactElement<Record<string, unknown>>;

    expect(stack.props.className).toContain("ag-nav-stack");
    expect(page.props.className).toContain("ag-nav-page");
    expect(toolbar.props.role).toBe("toolbar");
    expect(typeof Sheet).toBe("function");
  });

  it("renders segmented controls, selects, alerts, empty states, avatars, and badges", () => {
    const alert = Alert({ title: "Synced", tone: "success" }) as ReactElement<Record<string, unknown>>;
    const empty = EmptyState({ title: "No systems" }) as ReactElement<Record<string, unknown>>;
    const avatar = Avatar({ name: "Ajit Chakrapani" }) as ReactElement<Record<string, unknown>>;
    const badge = Badge({ children: "Live", tone: "accent" }) as ReactElement<Record<string, unknown>>;

    expect(typeof SegmentedControl).toBe("function");
    expect(typeof Select).toBe("function");
    expect(alert.props.role).toBe("status");
    expect(empty.props.className).toContain("ag-empty-state");
    expect(avatar.props["aria-label"]).toBe("Ajit Chakrapani");
    expect(badge.props.className).toContain("ag-badge--accent");
  });
});

describe("Phase 3 product workbench components", () => {
  it("renders tabs, breadcrumbs, toast, progress, skeleton, and metrics", () => {
    const breadcrumbs = Breadcrumbs({
      items: [
        { href: "#workbench", label: "Workbench" },
        { current: true, label: "Systems" }
      ]
    }) as ReactElement<Record<string, unknown>>;
    const toast = Toast({ title: "Saved", tone: "success" }) as ReactElement<Record<string, unknown>>;
    const progress = Progress({ value: 42 }) as ReactElement<Record<string, unknown>>;
    const skeleton = Skeleton({}) as ReactElement<Record<string, unknown>>;
    const metric = Metric({ label: "Latency", value: "42ms" }) as ReactElement<Record<string, unknown>>;

    expect(typeof Tabs).toBe("function");
    expect(breadcrumbs.type).toBe("nav");
    expect(toast.props.role).toBe("status");
    expect(progress.props.role).toBe("progressbar");
    expect(progress.props["aria-valuenow"]).toBe(42);
    expect(skeleton.props.role).toBe("status");
    expect(metric.props.className).toContain("ag-metric");
  });

  it("renders data table, pagination, and command palette contracts", () => {
    const table = DataTable({
      columns: [{ header: "Name", key: "name", render: (row: { name: string }) => row.name }],
      getRowId: (row) => row.name,
      rows: [{ name: "System" }]
    }) as ReactElement<Record<string, unknown>>;
    const pagination = Pagination({ currentPage: 2, totalPages: 3 }) as ReactElement<Record<string, unknown>>;
    const css = readFileSync(join(import.meta.dirname, "../styles.css"), "utf8");

    expect(table.props.className).toContain("ag-table-wrap");
    expect(table.props.role).toBe("region");
    expect(table.props.tabIndex).toBe(0);
    expect(table.props["aria-label"]).toBe("Data table");
    expect(pagination.type).toBe("nav");
    expect(typeof CommandPalette).toBe("function");
    expect(css).toContain(".ag-command-palette");
    expect(css).toContain(".ag-skeleton");
    expect(css).toContain(".ag-table");
  });
});

describe("interaction foundation styles", () => {
  it("keeps disabled, empty, mixed, and fallback-modal states in the canonical stylesheet", () => {
    const css = readFileSync(join(import.meta.dirname, "../styles.css"), "utf8");

    expect(css).toContain('.ag-pagination__button:hover:not(:disabled):not([aria-disabled="true"])');
    expect(css).toContain('.ag-menu__item:hover:not(:disabled):not([aria-disabled="true"])');
    expect(css).toContain('.ag-command-palette__item:hover:not(:disabled):not([aria-disabled="true"])');
    expect(css).toContain('.ag-pagination__button[aria-disabled="true"]');
    expect(css).toContain('.ag-pagination__page[aria-disabled="true"]');
    expect(css).toContain('.ag-menu__item[aria-disabled="true"]');
    expect(css).toContain('.ag-command-palette__item[aria-disabled="true"]');
    expect(css).toMatch(/\.ag-command-palette__empty\s*\{[^}]*margin: 0;[^}]*color: var\(--ag-color-semantic-muted\);/u);
    expect(css).toContain('.ag-sheet[aria-modal="true"] > .ag-sheet__fallback-scrim');
    expect(css).toContain('.ag-checkbox__input[data-indeterminate="true"] + .ag-checkbox__box');
    expect(css).toContain("cursor: not-allowed;");
    expect(css).toContain("text-decoration: none;");
  });
});
