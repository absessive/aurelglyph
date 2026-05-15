import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";

import { Button } from "./Button";

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
});
