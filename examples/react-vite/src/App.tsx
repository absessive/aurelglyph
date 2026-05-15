import { useEffect } from "react";
import { Button, FileUpload, Icon, TextArea, TextField } from "@aurelglyph/react";

const mediaTools = [
  { name: "settings", label: "Design tokens", detail: "Color, type, spacing, radius, motion." },
  { name: "edit", label: "React controls", detail: "Button, field, textarea, upload, icon." },
  { name: "filter", label: "Platform outputs", detail: "CSS, TypeScript, Swift, Ruby, native." },
  { name: "check", label: "Release checks", detail: "Version sync, build, tests, typecheck." }
] as const;

const navItems = ["Workbench", "Notes", "Systems", "Lab", "Archive", "Settings"] as const;

export function App() {
  useEffect(() => {
    document.documentElement.dataset.mode = "dark";
    document.documentElement.dataset.theme = "royal-purple";
  }, []);

  return (
    <main className="example-shell">
      <aside className="example-rail" aria-label="Primary">
        <a className="example-wordmark" href="/" aria-label="Aurelglyph home">
          Aurelglyph<span>.</span>
        </a>
        <nav className="example-nav">
          {navItems.map((item, index) => (
            <a className={index === 0 ? "is-active" : undefined} href="/" key={item}>
              <span className="example-nav__dot" />
              {item}
            </a>
          ))}
        </nav>
        <p className="example-rail__status">
          <span />
          SYSTEMS OPERATIONAL
        </p>
      </aside>

      <section className="example-workbench" aria-labelledby="hero-title">
        <header className="example-hero">
          <div className="example-hero__copy">
            <p className="example-kicker">Aurelglyph React · v0.1.0</p>
            <h1 id="hero-title">A shared design language for every app surface.</h1>
            <p className="example-hero__summary">
              Aurelglyph gives web, mobile, desktop, and Rails apps one token
              contract, one component vocabulary, and generated platform outputs
              that stay on the same version.
            </p>
          </div>

          <div className="example-hero__actions" aria-label="Package actions">
            <Button icon="upload">npm install</Button>
            <Button icon="settings" variant="secondary">
              data-theme
            </Button>
            <Button icon="search" variant="ghost">
              Component API
            </Button>
          </div>
        </header>

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

        <p className="example-copyright">Copyright 2026 absessive.</p>
      </section>
    </main>
  );
}
