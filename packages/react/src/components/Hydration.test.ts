// @vitest-environment jsdom

import { act, createElement, type ReactElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Combobox } from "./Combobox";
import { Select } from "./Select";
import { Tabs } from "./Tabs";
import { Accordion, Chip, InputGroup, Link, PasswordField, Rating, Stepper, ValidationSummary } from "../index";

type ActEnvironment = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

let hydratedRoot: Root | undefined;

function Fixture(): ReactElement {
  return createElement(
    "main",
    { dir: "rtl" },
    createElement(Link, { external: true, href: "https://example.com" }, "Guide"),
    createElement(Chip, { defaultSelected: true, label: "Local" }),
    createElement(InputGroup, { addonDescription: "US dollars", label: "Amount", leading: "$", trailing: "USD" }),
    createElement(PasswordField, { label: "Password" }),
    createElement(ValidationSummary, { errors: [{ id: "one", message: "Check value" }] }),
    createElement(Accordion, { defaultValue: ["one"], items: [{ id: "one", title: "Workspace", content: "Local" }] }),
    createElement(Stepper, { currentId: "review", items: [{ id: "review", label: "Review" }] }),
    createElement(Rating, { defaultValue: 3, label: "Experience", name: "experience" }),
    createElement(Select, {
      label: "Theme",
      name: "theme",
      onChange: () => undefined,
      options: [
        { label: "Royal purple", value: "royal-purple" },
        { label: "Forest", value: "forest" }
      ],
      value: "royal-purple"
    }),
    createElement(Combobox, {
      label: "System",
      name: "system",
      onValueChange: () => undefined,
      options: [
        { label: "Workbench", value: "workbench" },
        { label: "Archive", value: "archive" }
      ],
      value: "workbench"
    }),
    createElement(
      Tabs,
      {
        activeId: "overview",
        items: [
          { id: "overview", label: "Overview" },
          { id: "logs", label: "Logs" }
        ],
        onValueChange: () => undefined
      },
      "Server-rendered panel"
    )
  );
}

afterEach(async () => {
  if (hydratedRoot) {
    await act(async () => hydratedRoot?.unmount());
    hydratedRoot = undefined;
  }
  document.body.replaceChildren();
  vi.restoreAllMocks();
  delete (globalThis as ActEnvironment).IS_REACT_ACT_ENVIRONMENT;
});

describe("React server rendering", () => {
  it("hydrates representative form and selection controls without replacing markup", async () => {
    (globalThis as ActEnvironment).IS_REACT_ACT_ENVIRONMENT = true;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const container = document.createElement("div");
    container.innerHTML = renderToString(createElement(Fixture));
    const serverMain = container.querySelector("main");
    const serverSelect = container.querySelector("select");
    document.body.append(container);

    await act(async () => {
      hydratedRoot = hydrateRoot(container, createElement(Fixture));
      await Promise.resolve();
    });

    expect(container.querySelector("main")).toBe(serverMain);
    expect(container.querySelector("select")).toBe(serverSelect);
    expect(container.querySelector("input[name='system']")?.getAttribute("value")).toBe("workbench");
    expect(container.querySelector("[role='tab'][aria-selected='true']")?.textContent).toBe("Overview");
    expect(consoleError).not.toHaveBeenCalled();
  });
});
