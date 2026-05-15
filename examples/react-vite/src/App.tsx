import { Button, FileUpload, Icon, TextArea, TextField } from "@aurelglyph/react";

const mediaTools = [
  { name: "microphone", label: "Microphone", detail: "Capture clean narration." },
  { name: "camera", label: "Camera", detail: "Take a reference still." },
  { name: "video", label: "Video", detail: "Record a short clip." },
  { name: "image", label: "Image", detail: "Attach visual context." }
] as const;

export function App() {
  return (
    <main className="example-shell">
      <section className="example-hero" aria-labelledby="hero-title">
        <div className="example-hero__copy">
          <p className="example-eyebrow">Aurelglyph React</p>
          <h1 id="hero-title">Compose multimodal prompts with token-first controls.</h1>
          <p className="example-hero__summary">
            This Vite example pairs Aurelglyph form fields, upload affordances, buttons,
            and media icons in a compact creator workflow.
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
      </section>

      <section className="example-grid" aria-label="Prompt builder">
        <div className="example-panel example-panel--form">
          <div className="example-panel__header">
            <p className="example-eyebrow">Core fields</p>
            <h2>Prompt details</h2>
          </div>

          <div className="example-fields">
            <TextField
              helpText="Give collaborators a scannable working title."
              label="Project title"
              name="project-title"
              placeholder="Launch storyboard"
            />
            <TextField
              helpText="Optional, but useful when prompts are routed across a team."
              label="Owner"
              name="owner"
              placeholder="Design systems"
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
            <p className="example-eyebrow">Rich input</p>
            <h2>Reference assets</h2>
          </div>

          <FileUpload
            accept="image/*,video/*,audio/*,.pdf"
            helpText="Supports images, short videos, audio notes, and PDF briefs."
            label="Drop files for the prompt"
            name="reference-assets"
          />

          <div className="example-media-list" aria-label="Supported media">
            {mediaTools.map((tool) => (
              <div className="example-media-item" key={tool.name}>
                <span className="example-media-item__icon">
                  <Icon name={tool.name} />
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
    </main>
  );
}
