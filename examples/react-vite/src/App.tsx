import React, { useEffect, useMemo, useState } from "react";
import { Button, ExpandableSection, FileUpload, Icon, TextArea, TextField } from "@aurelglyph/react";
import type { AurelglyphIconName } from "@aurelglyph/react";

const mediaTools = [
  { name: "settings", label: "Design tokens", detail: "Color, type, spacing, radius, motion." },
  { name: "edit", label: "React controls", detail: "Button, field, textarea, upload, icon." },
  { name: "filter", label: "Platform outputs", detail: "CSS, TypeScript, Swift, Ruby, native." },
  { name: "check", label: "Release checks", detail: "Version sync, build, tests, typecheck." }
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
          <p className="example-kicker">Aurelglyph React · v0.1.0</p>
          <h1 id="hero-title">Aurelglyph React components.</h1>
          <p className="example-hero__summary">
            Buttons, fields, text areas, upload controls, and icons using the
            same generated design values as the CSS, Rails, and Swift packages.
          </p>
        </div>

        <div className="example-hero__actions" aria-label="Package actions">
          <Button icon="upload">Install</Button>
          <Button icon="settings" variant="secondary">
            {mode}
          </Button>
          <Button icon="search" variant="ghost">
            {theme}
          </Button>
        </div>
      </header>

      <section className="example-panel example-panel--preview" aria-label="React component preview">
        <div className="example-panel__header">
          <p className="example-kicker">COMPONENT PREVIEW</p>
          <h2>Starter controls</h2>
        </div>

        <div className="example-component-bar" aria-label="Button variants">
          <Button icon="send">Primary action</Button>
          <Button icon="settings" variant="secondary">
            Secondary
          </Button>
          <Button icon="search" variant="ghost">
            Ghost
          </Button>
        </div>

        <div className="example-preview-grid">
          <TextField
            helpText="A styled input with label, helper text, and focus treatment."
            label="Project name"
            name="preview-project"
            placeholder="Smart home dashboard"
          />
          <TextArea
            helpText="Textarea, upload, and field controls share spacing and border values."
            label="Notes"
            name="preview-notes"
            placeholder="Describe the app surface this component library will support."
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
                helpText="Use the CSS package plus the adapter for your app framework."
                label="Install"
                name="install"
                placeholder="npm install @aurelglyph/css @aurelglyph/react"
              />
              <TextField
                helpText="Set these attributes once on the root element."
                label="Theme attributes"
                name="theme"
                placeholder="data-mode=&quot;dark&quot; data-theme=&quot;royal-purple&quot;"
              />
              <TextArea
                helpText="Use semantic variables and package components instead of one-off styles."
                label="Usage"
                name="integration-notes"
                placeholder="Import @aurelglyph/css once, import @aurelglyph/react/styles.css for controls, then compose Button, TextField, TextArea, FileUpload, and Icon."
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
              <Button icon="send">Open README</Button>
              <Button icon="save" variant="secondary">
                Run verify
              </Button>
            </div>
          </aside>
        </section>
    </>
  );
}

function ComponentsPage() {
  return (
    <section className="example-panel" aria-labelledby="components-title">
      <div className="example-panel__header">
        <p className="example-kicker">COMPONENTS</p>
        <h2 id="components-title">Component previews</h2>
      </div>
      <p className="example-copy">
        These are the first live React controls and companion previews for the
        cross-platform component contract. The same names, variants, and states
        should carry across CSS/Web, React Native, SwiftUI, and Rails.
      </p>
      <div className="example-platform-list" aria-label="Platform targets">
        {platformTargets.map((target) => (
          <span key={target}>{target}</span>
        ))}
      </div>
      <div className="example-component-previews">
        <section className="example-preview-card">
          <h3>Buttons</h3>
          <div className="example-component-bar">
            <Button icon="send">Primary action</Button>
            <Button icon="settings" variant="secondary">
              Secondary
            </Button>
            <Button icon="search" variant="ghost">
              Ghost
            </Button>
            <Button icon="warning" variant="danger">
              Danger
            </Button>
            <Button disabled icon="check" variant="secondary">
              Disabled
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
              placeholder="Smart home dashboard"
            />
            <TextArea
              helpText="Textarea uses the same field contract."
              label="Notes"
              name="components-notes"
              placeholder="Describe the app surface."
            />
            <TextField
              error="Use a supported package version."
              label="Version"
              name="components-version"
              placeholder="0.1.0"
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
        <CodeBlock label="React exact version" code={"npm install @aurelglyph/css@0.1.0 @aurelglyph/react@0.1.0\n\nimport \"@aurelglyph/css\";\nimport \"@aurelglyph/react/styles.css\";"} />
        <CodeBlock label="Rails Git ref" code={'gem "aurelglyph-rails",\n  git: "https://github.com/absessive/aurelglyph",\n  glob: "packages/rails/aurelglyph-rails.gemspec",\n  tag: "v0.1.0"'} />
        <CodeBlock label="SwiftPM version" code={'.package(url: "https://github.com/absessive/aurelglyph", exact: "0.1.0")\n// or\n.package(url: "https://github.com/absessive/aurelglyph", from: "0.1.0")'} />
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
        <h2 id="changelog-title">0.1.0</h2>
      </div>
      <p className="example-copy">
        Establish the first Aurelglyph cross-platform design-system workspace.
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
