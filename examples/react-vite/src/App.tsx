import { useEffect } from "react";
import { Button, FileUpload, Icon, TextArea, TextField } from "@aurelglyph/react";

const mediaTools = [
  { name: "microphone", label: "Microphone", detail: "Clean narration channel." },
  { name: "camera", label: "Camera", detail: "Reference still capture." },
  { name: "video", label: "Video", detail: "Short motion brief." },
  { name: "image", label: "Image", detail: "Visual context layer." }
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
        <a className="example-wordmark" href="/" aria-label="absessive home">
          ab<span>.</span>
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
            <p className="example-kicker">Aurelglyph React · v0.1.0 · Absessive UI</p>
            <h1 id="hero-title">Compose a quiet prompt system.</h1>
            <p className="example-hero__summary">
              A cross-platform control language for forms, media capture, file intake,
              and instrument-grade application surfaces.
            </p>
          </div>

          <div className="example-hero__actions" aria-label="Prompt actions">
            <Button icon="upload">Upload source</Button>
            <Button icon="microphone" variant="secondary">
              Record audio
            </Button>
            <Button icon="camera" variant="ghost">
              Capture image
            </Button>
          </div>
        </header>

        <section className="example-grid" aria-label="Prompt builder">
          <div className="example-panel example-panel--form">
            <div className="example-panel__header">
              <p className="example-kicker">LOCAL DRAFT</p>
              <h2>Prompt details</h2>
            </div>

            <div className="example-fields">
              <TextField
                helpText="A compact name for routing and review."
                label="Project title"
                name="project-title"
                placeholder="Launch storyboard"
              />
              <TextField
                helpText="Useful when work moves across systems."
                label="Owner"
                name="owner"
                placeholder="systems atelier"
              />
              <TextArea
                helpText="Describe the intended result, constraints, and source context."
                label="Prompt"
                name="prompt"
                placeholder="Create a concise shot list for a product walkthrough..."
              />
            </div>
          </div>

          <aside className="example-panel example-panel--media" aria-label="Media inputs">
            <div className="example-panel__header">
              <p className="example-kicker">SYNCED INPUT</p>
              <h2>Reference assets</h2>
            </div>

            <FileUpload
              accept="image/*,video/*,audio/*,.pdf"
              helpText="Images, short videos, audio notes, and PDF briefs."
              label="Drop files for the prompt"
              name="reference-assets"
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
              <Button icon="send">Generate draft</Button>
              <Button icon="save" variant="secondary">
                Save brief
              </Button>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
