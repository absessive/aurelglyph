import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Accordion, Chip, InputGroup, Link, PasswordField, Rating, Stack, Stepper, ValidationSummary } from "../packages/react/src/index.js";

/** Generated from actual public controls; disabled specimens intentionally have no JS actions. */
export function renderCatalogSpecimens(): string {
  const sample = (title: string, control: ReturnType<typeof h>) => h("section", { className: "catalog-card", key: title }, h("h3", null, title), control);
  return renderToStaticMarkup(h("section", { id: "catalog-essentials", "aria-labelledby": "catalog-essentials-title" },
    h("h2", { id: "catalog-essentials-title" }, "Catalog essentials · Unreleased"),
    h("p", null, "Read-only specimens. Use the React example for interactive behavior."),
    h("div", { className: "catalog" },
      sample("Link", h(Stack, { gap: "sm" }, h(Link, { href: "usage.html" }, "View guide"), h(Link, { disabled: true, href: "#unavailable" }, "Unavailable"))),
      sample("Chip", h(Chip, { defaultSelected: true, disabled: true, label: "Workbench", onRemove: () => {}, removeLabel: "Remove Workbench" })),
      sample("Password field", h(PasswordField, { autoComplete: "new-password", defaultValue: "example-only", disabled: true, error: "Use at least 12 characters.", id: "specimen-password", label: "Password" })),
      sample("Input group", h(InputGroup, { addonDescription: "US dollars", defaultValue: "125.00", id: "specimen-amount", label: "Amount", leading: "$", readOnly: true, trailing: "USD" })),
      sample("Validation summary", h(ValidationSummary, { headingLevel: 4, errors: [{ id: "password", message: "Check the password." }, { id: "amount", fieldId: "specimen-amount", message: "Check the amount." }] })),
      sample("Accordion", h(Accordion, { defaultValue: ["workspace"], disabled: true, headingLevel: 4, items: [{ id: "workspace", title: "Workspace", content: "Changes stay local." }, { id: "access", title: "Access", content: "Review permissions." }] })),
      sample("Stepper", h(Stepper, { "aria-label": "Publishing workflow", currentId: "review", items: [{ id: "details", label: "Details" }, { id: "review", label: "Review" }, { id: "approve", label: "Approve" }, { id: "publish", label: "Publish", status: "error" }] })),
      sample("Rating", h(Rating, { defaultValue: 3, disabled: true, label: "Experience" }))
    )
  ));
}
