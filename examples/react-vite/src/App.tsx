import React, { useEffect, useMemo, useState } from "react";
import {
  AppShell,
  Alert,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CommandPalette,
  DataTable,
  EmptyState,
  ExpandableSection,
  FileUpload,
  Icon,
  ListRow,
  ListSection,
  Metric,
  NavigationPage,
  NavigationStack,
  Pagination,
  Progress,
  SearchField,
  SegmentedControl,
  Select,
  Sheet,
  Skeleton,
  Switch,
  Tabs,
  TabBar,
  TextArea,
  TextField,
  Toast,
  Toolbar,
  TopBar
} from "@aurelglyph/react";
import type { AurelglyphIconName } from "@aurelglyph/react";

const mediaTools = [
  { name: "settings", label: "Token source", detail: "Color, type, spacing, radius, and motion values." },
  { name: "edit", label: "React package", detail: "Import controls from @aurelglyph/react." },
  { name: "filter", label: "Generated outputs", detail: "CSS, TypeScript, Swift, Ruby, and native values." },
  { name: "check", label: "Verification", detail: "Run version sync, builds, tests, and typecheck." }
] as const;

const navItems = [
  { id: "overview", label: "Overview" },
  { id: "components", label: "Components" },
  { id: "usage", label: "Usage" },
  { id: "changelog", label: "Changelog" }
] as const;

const platformTargets = ["CSS/Web", "React", "React Native", "SwiftUI", "Rails"] as const;
const modeOptions = ["dark", "light"] as const;
const themeOptions = ["royal-purple", "amber", "forest", "deep-blue", "cyan", "steel"] as const;
const packageVersion = "0.4.1";
const iconCatalog = [
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

type PageId = (typeof navItems)[number]["id"];
type ModeOption = (typeof modeOptions)[number];
type ThemeOption = (typeof themeOptions)[number];

export function App() {
  const [activePage, setActivePage] = useState<PageId>(() => {
    const hash = window.location.hash.replace("#", "");
    return navItems.some((item) => item.id === hash) ? (hash as PageId) : "overview";
  });
  const [mode, setMode] = useState<ModeOption>("dark");
  const [theme, setTheme] = useState<ThemeOption>("royal-purple");

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    document.documentElement.dataset.theme = theme;
  }, [mode, theme]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (navItems.some((item) => item.id === hash)) {
        setActivePage(hash as PageId);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const pageTitle = useMemo(
    () => navItems.find((item) => item.id === activePage)?.label ?? "Overview",
    [activePage]
  );

  return (
    <main className="example-shell">
      <aside className="example-rail" aria-label="Primary">
        <a
          className="example-wordmark"
          href="#overview"
          aria-label="Aurelglyph home"
          onClick={() => setActivePage("overview")}
        >
          Aurelglyph<span>.</span>
        </a>
        <nav className="example-nav">
          {navItems.map((item) => (
            <a
              aria-current={activePage === item.id ? "page" : undefined}
              className={activePage === item.id ? "is-active" : undefined}
              href={`#${item.id}`}
              key={item.id}
              onClick={() => setActivePage(item.id)}
            >
              <span className="example-nav__dot" />
              {item.label}
            </a>
          ))}
        </nav>
        <p className="example-rail__status">
          <span />
          {pageTitle.toUpperCase()}
        </p>
      </aside>

      <section className="example-workbench" aria-labelledby="hero-title">
        <ThemeSwitcher mode={mode} setMode={setMode} setTheme={setTheme} theme={theme} />

        {activePage === "overview" && <OverviewPage mode={mode} theme={theme} />}
        {activePage === "components" && <ComponentsPage />}
        {activePage === "usage" && <UsagePage mode={mode} theme={theme} />}
        {activePage === "changelog" && <ChangelogPage />}

        <p className="example-copyright">Copyright 2026 absessive.</p>
      </section>
    </main>
  );
}

function ThemeSwitcher({
  mode,
  setMode,
  setTheme,
  theme
}: {
  mode: ModeOption;
  setMode: (mode: ModeOption) => void;
  setTheme: (theme: ThemeOption) => void;
  theme: ThemeOption;
}) {
  return (
    <section className="example-theme-switcher" aria-label="Theme controls">
      <div>
        <p className="example-kicker">THEME</p>
        <strong>
          {mode} · {theme}
        </strong>
      </div>
      <div className="example-segmented" aria-label="Mode">
        {modeOptions.map((option) => (
          <button
            aria-pressed={mode === option}
            key={option}
            onClick={() => setMode(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      <div className="example-swatches" aria-label="Accent theme">
        {themeOptions.map((option) => (
          <button
            aria-label={`Use ${option} theme`}
            aria-pressed={theme === option}
            className={`example-swatch example-swatch--${option}`}
            key={option}
            onClick={() => setTheme(option)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}

function OverviewPage({ mode, theme }: { mode: ModeOption; theme: ThemeOption }) {
  return (
    <>
      <header className="example-hero">
        <div className="example-hero__copy">
          <p className="example-kicker">Aurelglyph React · v{packageVersion}</p>
          <h1 id="hero-title">Use Aurelglyph React components.</h1>
          <p className="example-hero__summary">
            Import the CSS package once, set theme attributes on the document,
            then compose React controls with shared variants, icons, and focus states.
          </p>
        </div>

        <div className="example-hero__actions" aria-label="Package actions">
          <Button icon="upload">Install packages</Button>
          <Button icon="settings" variant="secondary">
            Mode: {mode}
          </Button>
          <Button icon="search" variant="ghost">
            Theme: {theme}
          </Button>
        </div>
      </header>

      <section className="example-panel example-panel--preview" aria-label="React component preview">
        <div className="example-panel__header">
          <p className="example-kicker">COMPONENT PREVIEW</p>
          <h2>Buttons and fields</h2>
          <p className="example-panel__summary">
            These controls come from <code>@aurelglyph/react</code> and inherit
            tokens from <code>@aurelglyph/css</code>.
          </p>
        </div>

        <div className="example-component-bar" aria-label="Button variants">
          <Button icon="send">Save project</Button>
          <Button icon="settings" variant="secondary">
            Configure
          </Button>
          <Button icon="search" variant="ghost">
            Search docs
          </Button>
        </div>

        <div className="example-preview-grid">
          <TextField
            helpText="A styled input with label, helper text, and focus treatment."
            label="Project name"
            name="preview-project"
            placeholder="Home operations console"
          />
          <TextArea
            helpText="Textarea, upload, and field controls share spacing and border values."
            label="Notes"
            name="preview-notes"
            placeholder="Describe the React screen that will use these controls."
          />
        </div>
      </section>

      <section className="example-grid" aria-label="Design system setup">
          <div className="example-panel example-panel--form">
            <div className="example-panel__header">
              <p className="example-kicker">APP SETUP</p>
              <h2>Consumer configuration</h2>
            </div>

            <div className="example-fields">
              <TextField
                helpText="Install the token CSS plus the React adapter at the same version."
                label="Install"
                name="install"
                placeholder={`npm install @aurelglyph/css@${packageVersion} @aurelglyph/react@${packageVersion}`}
              />
              <TextField
                helpText="Set these attributes once on the root element."
                label="Theme attributes"
                name="theme"
                placeholder="data-mode=&quot;dark&quot; data-theme=&quot;royal-purple&quot;"
              />
              <TextArea
                helpText="Import package styles before composing controls."
                label="React entry"
                name="integration-notes"
                placeholder={`import "@aurelglyph/css";\nimport "@aurelglyph/react/styles.css";\nimport { Button, TextField } from "@aurelglyph/react";`}
              />
            </div>
          </div>

          <aside className="example-panel example-panel--media" aria-label="Package coverage">
            <div className="example-panel__header">
              <p className="example-kicker">PACKAGE SURFACE</p>
              <h2>What ships</h2>
            </div>

            <FileUpload
              accept=".json,.css,.ts,.tsx,.swift,.rb"
              helpText="The token compiler emits CSS variables, TypeScript constants, React Native values, Swift constants, and Ruby helpers."
              label="Generated outputs"
              name="generated-assets"
            />

            <div className="example-media-list" aria-label="Supported media">
              {mediaTools.map((tool) => (
                <div className="example-media-item" key={tool.name}>
                  <span className="example-media-item__icon">
                    <Icon decorative name={tool.name} />
                  </span>
                  <span>
                    <strong>{tool.label}</strong>
                    <small>{tool.detail}</small>
                  </span>
                </div>
              ))}
            </div>

            <div className="example-panel__footer">
              <Button icon="send">Read setup</Button>
              <Button icon="save" variant="secondary">
                Run checks
              </Button>
            </div>
          </aside>
        </section>
    </>
  );
}

function ComponentsPage() {
  const [quietMode, setQuietMode] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [tab, setTab] = useState("overview");
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <section className="example-panel" aria-labelledby="components-title">
      <div className="example-panel__header">
        <p className="example-kicker">COMPONENTS</p>
        <h2 id="components-title">Component previews</h2>
      </div>
      <p className="example-copy">
        Use the same component names, variants, and states across CSS/Web,
        React, React Native, SwiftUI, and Rails. This page shows the React
        package rendering the shared contract.
      </p>
      <div className="example-platform-list" aria-label="Platform targets">
        {platformTargets.map((target) => (
          <span key={target}>{target}</span>
        ))}
      </div>
      <div className="example-component-previews">
        <section className="example-preview-card">
          <h3>Mobile shell</h3>
          <AppShell
            className="example-mobile-shell"
            footer={
              <TabBar
                activeId="systems"
                items={[
                  { href: "#workbench", icon: "dashboard", id: "workbench", label: "Workbench" },
                  { href: "#systems", icon: "settings", id: "systems", label: "Systems" },
                  { href: "#settings", icon: "user", id: "settings", label: "Settings" }
                ]}
              />
            }
            topBar={<TopBar actions={<Button icon="edit" variant="ghost">Edit</Button>} subtitle="Systems online" title="Workbench" />}
          >
            <div className="example-mobile-stack">
              <SearchField label="Search systems" name="systems-query" />
              <Card eyebrow="Live" title="Status">
                The same component language carries from web previews into native apps.
              </Card>
              <ListSection title="Settings">
                <ListRow description="Reduce notification noise" icon="bell" selected title="Quiet mode" trailing="On" />
                <ListRow description="Generated packages aligned" icon="sync" title="Sync" trailing="Now" />
              </ListSection>
              <Switch
                checked={quietMode}
                description="Use restrained notifications."
                label="Quiet mode"
                name="quiet-mode"
                onChange={(event) => setQuietMode(event.currentTarget.checked)}
              />
            </div>
          </AppShell>
        </section>
        <section className="example-preview-card">
          <h3>Navigation and selections</h3>
          <NavigationStack title="Workbench">
            <NavigationPage
              actions={
                <Toolbar label="System actions">
                  <Button icon="save" variant="secondary">Save</Button>
                  <Button icon="more-horizontal" variant="ghost">More</Button>
                </Toolbar>
              }
              title="Systems"
            >
              <div className="example-mobile-stack">
                <SegmentedControl
                  activeId={viewMode}
                  items={[
                    { id: "grid", label: "Grid" },
                    { id: "list", label: "List" }
                  ]}
                  onValueChange={setViewMode}
                />
                <Select
                  label="Theme"
                  name="theme-select"
                  options={[
                    { label: "Royal purple", value: "royal-purple" },
                    { label: "Forest", value: "forest" }
                  ]}
                />
                <Alert title="Package ready" tone="success">Design tokens and native controls are ready to use.</Alert>
                <div className="example-inline-row">
                  <Avatar name="Ajit Chakrapani" />
                  <Badge tone="accent">Live</Badge>
                  <Badge tone="success">Ready</Badge>
                  <Button icon="external-link" onClick={() => setDetailsOpen(true)} variant="secondary">
                    Open sheet
                  </Button>
                </div>
                <EmptyState title="No archived releases" icon="archive">Use this state when a filtered list has no records.</EmptyState>
                <Sheet
                  actions={
                    <Button icon="close" onClick={() => setDetailsOpen(false)} variant="ghost">
                      Close
                    </Button>
                  }
                  onOpenChange={setDetailsOpen}
                  open={detailsOpen}
                  title="Details"
                >
                  Use sheets for focused edits without leaving the current page.
                </Sheet>
              </div>
            </NavigationPage>
          </NavigationStack>
        </section>
        <section className="example-preview-card">
          <h3>Workbench data</h3>
          <div className="example-mobile-stack">
            <Breadcrumbs items={[{ href: "#overview", label: "Workbench" }, { current: true, label: "Systems" }]} />
            <Tabs
              activeId={tab}
              items={[
                { id: "overview", label: "Overview" },
                { id: "logs", label: "Logs" }
              ]}
              onValueChange={setTab}
            >
              The active tab owns the panel content and selected state.
            </Tabs>
            <div className="example-metric-grid">
              <Metric label="Latency" value="42ms" delta="Stable" />
              <Metric label="Sync" value="99.8%" delta="Now" />
            </div>
            <Progress label="Release readiness" value={72} />
            <Skeleton />
            <DataTable
              columns={[
                { header: "System", key: "system", render: (row: { system: string; state: string }) => row.system },
                { header: "State", key: "state", render: (row: { system: string; state: string }) => row.state }
              ]}
              getRowId={(row) => row.system}
              rows={[{ state: "Operational", system: "Pages" }, { state: "Ready", system: "SwiftUI" }]}
            />
            <Pagination currentPage={2} totalPages={3} />
            <Toast title="Settings saved" tone="success">The toast reports a non-blocking outcome.</Toast>
            <CommandPalette items={[{ icon: "search", id: "search", label: "Search systems", shortcut: "Cmd-K" }]} />
          </div>
        </section>
        <section className="example-preview-card">
          <h3>Buttons</h3>
          <div className="example-component-bar">
            <Button icon="send">Publish</Button>
            <Button icon="settings" variant="secondary">
              Configure
            </Button>
            <Button icon="search" variant="ghost">
              Search
            </Button>
            <Button icon="warning" variant="danger">
              Remove
            </Button>
            <Button disabled icon="check" variant="secondary">
              Synced
            </Button>
          </div>
        </section>
        <section className="example-preview-card">
          <h3>Expandable sections</h3>
          <div className="example-disclosure-stack">
            <ExpandableSection defaultOpen eyebrow="SYSTEM" title="Release readiness">
              <p>
                Build artifacts, generated tokens, Rails helpers, Swift symbols, and the
                React package contract are checked before publishing.
              </p>
            </ExpandableSection>
            <ExpandableSection eyebrow="DETAILS" title="Advanced adoption notes">
              <p>
                Import the CSS package once, pin exact versions in applications, and use
                platform adapters for React, Rails, and Swift surfaces.
              </p>
            </ExpandableSection>
          </div>
        </section>
        <section className="example-preview-card">
          <h3>Forms</h3>
          <div className="example-preview-grid">
            <TextField
              helpText="Label, helper text, placeholder, and focus treatment."
              label="Project name"
              name="components-project"
              placeholder="Home operations console"
            />
            <TextArea
              helpText="Textarea uses the same field contract."
              label="Notes"
              name="components-notes"
              placeholder="Add implementation notes for this React view."
            />
            <TextField
              error="Use a supported package version."
              label="Version"
              name="components-version"
              placeholder={packageVersion}
            />
          </div>
        </section>
        <section className="example-preview-card">
          <h3>Upload and icons</h3>
          <FileUpload
            accept=".json,.css,.ts,.tsx,.swift,.rb"
            helpText="Upload affordance with generated output file types."
            label="Generated outputs"
            name="components-upload"
          />
          <div className="example-icon-row" aria-label="Icon preview">
            {iconCatalog.map((name) => (
              <span className="example-media-item__icon" key={name} title={name}>
                <Icon decorative name={name} />
              </span>
            ))}
          </div>
        </section>
        <section className="example-preview-card">
          <h3>Feedback and content</h3>
          <div className="example-feedback-row">
            <span className="example-badge">Active</span>
            <div className="example-alert">Generated package outputs are in sync.</div>
            <div className="example-progress" aria-label="Progress preview">
              <span />
            </div>
            <div className="example-skeleton" aria-label="Skeleton loading preview">
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function UsagePage({ mode, theme }: { mode: ModeOption; theme: ThemeOption }) {
  return (
    <section className="example-panel" aria-labelledby="usage-title">
      <div className="example-panel__header">
        <p className="example-kicker">USAGE</p>
        <h2 id="usage-title">Install and configure</h2>
      </div>
      <div className="example-code-grid">
        <CodeBlock label="React install" code={`npm install @aurelglyph/css@${packageVersion} @aurelglyph/react@${packageVersion}`} />
        <CodeBlock label="React styles" code={`import "@aurelglyph/css";\nimport "@aurelglyph/react/styles.css";`} />
        <CodeBlock label="React component" code={`import { Button, TextField } from "@aurelglyph/react";\n\n<Button icon="send">Publish</Button>\n<TextField label="Project name" name="project" />`} />
        <CodeBlock label="Rails Git ref" code={`gem "aurelglyph-rails",\n  git: "https://github.com/absessive/aurelglyph",\n  glob: "packages/rails/aurelglyph-rails.gemspec",\n  tag: "v${packageVersion}"`} />
        <CodeBlock label="SwiftPM version" code={`.package(url: "https://github.com/absessive/aurelglyph", exact: "${packageVersion}")\n// or\n.package(url: "https://github.com/absessive/aurelglyph", from: "${packageVersion}")`} />
        <CodeBlock label="Current theme" code={`<html data-mode="${mode}" data-theme="${theme}">`} />
      </div>
    </section>
  );
}

function ChangelogPage() {
  return (
    <section className="example-panel" aria-labelledby="changelog-title">
      <div className="example-panel__header">
        <p className="example-kicker">CHANGELOG</p>
        <h2 id="changelog-title">{packageVersion}</h2>
      </div>
      <p className="example-copy">
        Hardens real modal behavior, Rails rendering safety, cross-adapter SVG
        icons, contrast, focus indicators, and reduced-motion behavior.
      </p>
    </section>
  );
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <figure className="example-code-block">
      <figcaption>{label}</figcaption>
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
