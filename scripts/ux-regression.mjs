import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createServer as createTcpServer } from "node:net";
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve, sep } from "node:path";

const workspace = resolve(import.meta.dirname, "..");
const exampleDist = join(workspace, "examples/react-vite/dist");
const outputDirectory = process.env.AURELGLYPH_UX_OUTPUT || join(tmpdir(), "aurelglyph-ux-regression");
const axeSource = await readFile(join(workspace, "node_modules/axe-core/axe.min.js"), "utf8");
const childProcesses = new Set();
let staticServer;
let chromeProfile;
let navigationSequence = 0;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createTcpServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolvePort(address.port));
    });
  });
}

async function waitForHttp(url, label, timeout = 20_000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`${label} responded ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`${label} did not become ready: ${lastError?.message ?? "timeout"}`);
}

async function findChrome() {
  const candidates = [
    process.env.AURELGLYPH_CHROME_BIN,
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next supported browser path.
    }
  }
  throw new Error("Chrome or Chromium was not found. Set AURELGLYPH_CHROME_BIN to run the UX gate.");
}

function startProcess(command, args, label) {
  const processHandle = spawn(command, args, {
    cwd: workspace,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  childProcesses.add(processHandle);
  let log = "";
  processHandle.stdout.on("data", (chunk) => { log += chunk.toString(); });
  processHandle.stderr.on("data", (chunk) => { log += chunk.toString(); });
  processHandle.once("exit", (code, signal) => {
    childProcesses.delete(processHandle);
    if (code && !processHandle.killed) {
      process.stderr.write(`${label} exited ${code}${signal ? ` (${signal})` : ""}\n${log}\n`);
    }
  });
  return { processHandle, readLog: () => log };
}

async function startPreview(port) {
  await access(join(exampleDist, "index.html"));
  const preview = startProcess(
    "npm",
    ["run", "preview", "-w", "@aurelglyph/example-react-vite", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    "Vite preview"
  );
  try {
    await waitForHttp(`http://127.0.0.1:${port}/`, "Vite preview");
  } catch (error) {
    throw new Error(`${error.message}\n${preview.readLog()}`);
  }
  return preview.processHandle;
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2"
};

async function startStaticPreview(port) {
  staticServer = createServer(async (request, response) => {
    try {
      const requestPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
      const relativePath = requestPath === "/" ? "preview/index.html" : requestPath.replace(/^\/+/, "");
      const candidate = normalize(join(workspace, relativePath));
      invariant(candidate === workspace || candidate.startsWith(`${workspace}${sep}`), "Invalid static preview path");
      const fileStat = await stat(candidate);
      invariant(fileStat.isFile(), "Static preview path is not a file");
      response.writeHead(200, { "Content-Type": mimeTypes[extname(candidate)] || "application/octet-stream" });
      response.end(await readFile(candidate));
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });
  await new Promise((resolveListen, reject) => {
    staticServer.once("error", reject);
    staticServer.listen(port, "127.0.0.1", resolveListen);
  });
  await waitForHttp(`http://127.0.0.1:${port}/preview/index.html`, "static preview");
}

class CdpClient {
  constructor(webSocketUrl) {
    this.eventCount = 0;
    this.lastMessageAt = Date.now();
    this.messageCount = 0;
    this.nextId = 1;
    this.pending = new Map();
    this.phase = "CDP startup";
    this.responseCount = 0;
    this.socket = new WebSocket(webSocketUrl);
  }

  async connect() {
    await new Promise((resolveOpen, reject) => {
      this.socket.addEventListener("open", resolveOpen, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      this.lastMessageAt = Date.now();
      this.messageCount += 1;
      if (message.id) {
        this.responseCount += 1;
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${pending.description}: ${message.error.message}`));
        else pending.resolve(message.result);
        return;
      }
      this.eventCount += 1;
    });
    this.socket.addEventListener("close", (event) => {
      this.rejectPending(new Error(`CDP socket closed (${event.code}${event.reason ? `: ${event.reason}` : ""}) during ${this.phase}`));
    });
    this.socket.addEventListener("error", () => {
      this.rejectPending(new Error(`CDP socket failed during ${this.phase}`));
    });
  }

  rejectPending(error) {
    const pendingCommands = [...this.pending.values()];
    this.pending.clear();
    for (const pending of pendingCommands) pending.reject(error);
  }

  setPhase(phase) {
    this.phase = phase;
  }

  diagnostics() {
    return {
      eventCount: this.eventCount,
      messageCount: this.messageCount,
      pendingCommandCount: this.pending.size,
      phase: this.phase,
      responseCount: this.responseCount,
      socketState: this.socket.readyState
    };
  }

  send(method, params = {}, timeout = 20_000, detail = "") {
    const description = detail ? `${method} (${detail})` : method;
    if (this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error(`${description} could not start during ${this.phase}: CDP socket state ${this.socket.readyState}`));
    }
    const id = this.nextId++;
    return new Promise((resolveResult, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        const lastMessageAge = Date.now() - this.lastMessageAt;
        reject(new Error(
          `${description} timed out after ${timeout}ms during ${this.phase}; `
          + `socket=${this.socket.readyState}, pending=${this.pending.size}, lastMessage=${lastMessageAge}ms ago`
        ));
      }, timeout);
      this.pending.set(id, {
        description,
        reject: (error) => { clearTimeout(timer); reject(error); },
        resolve: (result) => { clearTimeout(timer); resolveResult(result); }
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, expression, timeout = 20_000) {
  const expressionSummary = expression.slice(0, 160).replace(/\s+/gu, " ").trim();
  const response = await client.send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true,
    userGesture: true
  }, timeout, expressionSummary);
  if (response.exceptionDetails) {
    const exception = response.exceptionDetails.exception?.description || response.exceptionDetails.text;
    throw new Error(`${client.phase}: Runtime.evaluate failed for ${JSON.stringify(expressionSummary)}: ${exception}`);
  }
  return response.result.value;
}

async function navigate(client, url) {
  const destination = new URL(url);
  destination.searchParams.set("__ag_ux", String(++navigationSequence));
  client.setPhase(`Navigate ${destination.href}`);
  const navigation = await client.send("Page.navigate", { url: destination.href }, 20_000);
  invariant(!navigation.errorText, `Navigation to ${destination.href} failed: ${navigation.errorText}`);

  const startedAt = Date.now();
  let lastError;
  let ready = false;
  while (Date.now() - startedAt < 20_000) {
    try {
      ready = await evaluate(client, `location.href === ${JSON.stringify(destination.href)} && document.readyState === "complete"`, 2_000);
      if (ready) break;
    } catch (error) {
      // The previous execution context can disappear while navigation commits.
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 40));
  }
  invariant(ready, `Navigation did not finish at ${destination.href}${lastError ? `: ${lastError.message}` : ""}`);
  await evaluate(client, "document.fonts.ready.then(() => true)", 20_000);
}

async function waitForCondition(client, expression, message, timeout = 4_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(client, expression)) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 40));
  }
  throw new Error(message);
}

async function settleUi(client) {
  await evaluate(client, "new Promise((resolve) => setTimeout(resolve, 300))");
}

function reportProgress(context) {
  process.stdout.write(`[ux] ${context}\n`);
}

async function clickButton(client, label) {
  const result = await evaluate(client, `(() => {
    const label = ${JSON.stringify(label)};
    const button = [...document.querySelectorAll("button")].find((candidate) =>
      candidate.getAttribute("aria-label") === label || candidate.textContent.trim() === label
    );
    if (!button) return false;
    button.focus();
    button.click();
    return true;
  })()`);
  invariant(result, `Button not found: ${label}`);
}

async function pressKey(client, key, code = key) {
  const virtualKeyCodes = { ArrowDown: 40, ArrowUp: 38, Enter: 13, Escape: 27, Tab: 9 };
  const windowsVirtualKeyCode = virtualKeyCodes[key] || 0;
  await client.send("Input.dispatchKeyEvent", { code, key, nativeVirtualKeyCode: windowsVirtualKeyCode, type: "rawKeyDown", windowsVirtualKeyCode });
  await client.send("Input.dispatchKeyEvent", { code, key, nativeVirtualKeyCode: windowsVirtualKeyCode, type: "keyUp", windowsVirtualKeyCode });
}

async function auditDom(client, context) {
  client.setPhase(`${context}: DOM audit`);
  const audit = await evaluate(client, `(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && !element.hidden && rect.width > 0 && rect.height > 0;
    };
    const accessibleName = (element) => {
      const labelledBy = element.getAttribute("aria-labelledby");
      const labelledText = labelledBy
        ? labelledBy.split(/\\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ")
        : "";
      return (element.getAttribute("aria-label") || labelledText || element.textContent || element.getAttribute("title") || "").trim();
    };
    const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const referenceAttributes = ["aria-activedescendant", "aria-controls", "aria-describedby", "aria-labelledby", "aria-owns"];
    const brokenReferences = [];
    for (const element of document.querySelectorAll(referenceAttributes.map((attribute) => "[" + attribute + "]").join(","))) {
      for (const attribute of referenceAttributes) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        for (const id of value.trim().split(/\\s+/)) {
          if (!document.getElementById(id)) brokenReferences.push(attribute + "=" + id);
        }
      }
    }
    const unnamedControls = [...document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea")]
      .filter(visible)
      .filter((element) => {
        if (element.labels?.length) return false;
        return !accessibleName(element);
      })
      .map((element) => element.outerHTML.slice(0, 180));
    const undersizedControls = [...document.querySelectorAll("button, input:not([type=hidden]), select, textarea")]
      .filter(visible)
      .filter((element) => Number(getComputedStyle(element).opacity) > 0 && !element.closest("[hidden]"))
      .filter((element) => {
        const elementRect = element.getBoundingClientRect();
        const target = elementRect.width <= 2 && elementRect.height <= 2 ? (element.labels?.[0] || element) : element;
        const rect = target.getBoundingClientRect();
        return rect.width < 24 || rect.height < 24;
      })
      .map((element) => {
        const elementRect = element.getBoundingClientRect();
        const target = elementRect.width <= 2 && elementRect.height <= 2 ? (element.labels?.[0] || element) : element;
        const rect = target.getBoundingClientRect();
        const name = accessibleName(element) || element.labels?.[0]?.textContent?.trim() || "";
        return element.tagName.toLowerCase() + "[" + name + "] " + Math.round(rect.width) + "x" + Math.round(rect.height);
      });
    return {
      brokenReferences,
      duplicateIds: [...new Set(duplicateIds)],
      fontDisplay: document.fonts.check('16px "Libre Baskerville"'),
      fontMono: document.fonts.check('16px "Space Mono"'),
      fontUi: document.fonts.check('16px "Atkinson Hyperlegible"'),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      undersizedControls,
      unnamedControls
    };
  })()`);

  invariant(audit.duplicateIds.length === 0, `${context}: duplicate IDs: ${audit.duplicateIds.join(", ")}`);
  invariant(audit.brokenReferences.length === 0, `${context}: broken ARIA references: ${audit.brokenReferences.join(", ")}`);
  invariant(audit.unnamedControls.length === 0, `${context}: unnamed controls: ${audit.unnamedControls.join(" | ")}`);
  invariant(audit.undersizedControls.length === 0, `${context}: controls smaller than 24px: ${audit.undersizedControls.join(" | ")}`);
  invariant(audit.horizontalOverflow <= 1, `${context}: ${audit.horizontalOverflow}px horizontal overflow`);
  invariant(audit.fontDisplay && audit.fontMono && audit.fontUi, `${context}: packaged fonts did not load`);
  return audit;
}

async function auditAxe(client, context) {
  client.setPhase(`${context}: axe availability`);
  let axeAvailable = await evaluate(client, "typeof globalThis.axe?.run === 'function'");
  if (!axeAvailable) {
    client.setPhase(`${context}: axe load`);
    await evaluate(client, axeSource, 60_000);
    axeAvailable = await evaluate(client, "typeof globalThis.axe?.run === 'function'");
  }
  invariant(axeAvailable, `${context}: axe did not load`);
  client.setPhase(`${context}: axe audit`);
  const violations = await evaluate(client, `axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }
  }).then((result) => result.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => {
      return {
        failureSummary: node.failureSummary,
        html: node.html,
        target: node.target
      };
    })
  })))`, 60_000).catch((error) => {
    throw new Error(`${context}: axe evaluation failed: ${error.message}`);
  });
  invariant(violations.length === 0, `${context}: axe violations:\n${JSON.stringify(violations, null, 2)}`);
  return violations;
}

async function auditAccessibilityTree(client, context) {
  client.setPhase(`${context}: accessibility tree audit`);
  const { nodes } = await client.send("Accessibility.getFullAXTree");
  const interactiveRoles = new Set(["button", "checkbox", "combobox", "link", "menuitem", "option", "radio", "slider", "tab", "textbox"]);
  const unnamed = nodes
    .filter((node) => !node.ignored && interactiveRoles.has(node.role?.value) && !node.name?.value?.trim())
    .map((node) => `${node.role.value}:${node.backendDOMNodeId ?? node.nodeId}`);
  invariant(unnamed.length === 0, `${context}: unnamed accessibility-tree controls: ${unnamed.join(", ")}`);
  return { interactiveNodeCount: nodes.filter((node) => !node.ignored && interactiveRoles.has(node.role?.value)).length };
}

async function capture(client, filename) {
  client.setPhase(`Capture ${filename}`);
  const { data } = await client.send("Page.captureScreenshot", { captureBeyondViewport: false, format: "png" }, 20_000);
  const path = join(outputDirectory, filename);
  await writeFile(path, Buffer.from(data, "base64"));
  return path;
}

async function setViewport(client, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    deviceScaleFactor: 1,
    height: viewport.height,
    mobile: viewport.mobile,
    screenHeight: viewport.height,
    screenWidth: viewport.width,
    width: viewport.width
  });
}

async function runInteractionRegression(client, exampleUrl) {
  reportProgress("React interaction suite");
  client.setPhase("React interaction suite: setup");
  await setViewport(client, { height: 1100, mobile: false, width: 1440 });
  await navigate(client, `${exampleUrl}/#components`);
  client.setPhase("React interaction suite");

  await clickButton(client, "Open dialog");
  await waitForCondition(client, "Boolean(document.querySelector('dialog.ag-dialog[open]'))", "Dialog did not open");
  invariant(await evaluate(client, "Boolean(document.querySelector('dialog.ag-dialog[open]')?.matches(':modal') || document.querySelector('dialog.ag-dialog[open]')?.getAttribute('aria-modal') === 'true')"), "Dialog did not open modally");
  invariant(await evaluate(client, "Boolean(document.activeElement?.closest('dialog.ag-dialog'))"), "Dialog did not move focus inside");
  await pressKey(client, "Escape");
  await waitForCondition(client, "!document.querySelector('dialog.ag-dialog[open]')", "Dialog did not close with Escape");
  await waitForCondition(client, "document.activeElement?.textContent.trim() === 'Open dialog'", "Dialog did not restore trigger focus");

  await clickButton(client, "Open drawer");
  await waitForCondition(client, "Boolean(document.querySelector('dialog.ag-drawer[open]'))", "Drawer did not open");
  invariant(await evaluate(client, "Boolean(document.querySelector('dialog.ag-drawer[open]')?.matches(':modal') || document.querySelector('dialog.ag-drawer[open]')?.getAttribute('aria-modal') === 'true')"), "Drawer did not open modally");
  await pressKey(client, "Escape");
  await waitForCondition(client, "!document.querySelector('dialog.ag-drawer[open]')", "Drawer did not close with Escape");

  await clickButton(client, "System actions");
  await waitForCondition(client, "Boolean(document.querySelector('[role=menu]:not([hidden])'))", "Menu did not open");
  invariant(await evaluate(client, "document.activeElement?.getAttribute('role') === 'menuitem'"), "Menu did not focus its first item");
  await pressKey(client, "ArrowDown");
  invariant(await evaluate(client, "document.activeElement?.textContent.includes('Archive')"), "Menu arrow navigation did not move to Archive");
  await pressKey(client, "Escape");
  await waitForCondition(client, "!document.querySelector('[role=menu]:not([hidden])')", "Menu did not close with Escape");

  await clickButton(client, "Inspect release");
  await waitForCondition(client, "Boolean(document.querySelector('.ag-popover__surface[role=dialog]:not([hidden])'))", "Popover did not open");
  await pressKey(client, "Escape");
  await waitForCondition(client, "!document.querySelector('.ag-popover__surface[role=dialog]:not([hidden])')", "Popover did not close with Escape");

  const tooltipFocused = await evaluate(client, `(() => {
    const trigger = document.querySelector('button[aria-label="Refresh package state"]');
    trigger?.focus();
    return Boolean(trigger);
  })()`);
  invariant(tooltipFocused, "Tooltip trigger was not found");
  await waitForCondition(client, "Boolean(document.querySelector('[role=tooltip]:not([hidden])'))", "Tooltip did not open on focus");
  await pressKey(client, "Escape");
  await waitForCondition(client, "!document.querySelector('[role=tooltip]:not([hidden])')", "Tooltip did not dismiss");

  const checkboxBefore = await evaluate(client, "document.querySelector('input[name=components-automation]').checked");
  await evaluate(client, "document.querySelector('input[name=components-automation]').click()");
  const checkboxAfter = await evaluate(client, "document.querySelector('input[name=components-automation]').checked");
  invariant(checkboxBefore !== checkboxAfter, "Checkbox did not update");

  await evaluate(client, "document.querySelector('input[name=components-density][value=compact]').click()");
  invariant(await evaluate(client, "document.querySelector('input[name=components-density][value=compact]').checked"), "Radio group did not update");

  await evaluate(client, `(() => {
    const input = document.querySelector('.ag-slider__input');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, '73');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitForCondition(client, "document.querySelector('.ag-slider__input').value === '73'", "Slider did not update");

  const numberBefore = Number(await evaluate(client, "document.querySelector('input[name=components-retention]').value"));
  await clickButton(client, "Increase value");
  const numberAfter = Number(await evaluate(client, "document.querySelector('input[name=components-retention]').value"));
  invariant(numberAfter === numberBefore + 1, "NumberField increment did not update");

  const combobox = await evaluate(client, `(() => {
    const input = document.querySelector('input[role=combobox]');
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Forest');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return Boolean(input);
  })()`);
  invariant(combobox, "Combobox was not found");
  await waitForCondition(client, "Boolean([...document.querySelectorAll('[role=option]')].find((option) => option.textContent.includes('Forest')))" , "Combobox did not filter options");
  await evaluate(client, "[...document.querySelectorAll('[role=option]')].find((option) => option.textContent.includes('Forest')).click()");
  invariant(await evaluate(client, "document.querySelector('input[name=components-accent]').value === 'forest'"), "Combobox selection did not update");

  await client.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    media: "screen"
  });
  const motion = await evaluate(client, `(() => {
    const spinner = getComputedStyle(document.querySelector('.ag-spinner__ring'));
    const chevron = getComputedStyle(document.querySelector('.ag-menu__chevron'));
    return { animationName: spinner.animationName, transitionDuration: chevron.transitionDuration };
  })()`);
  invariant(motion.animationName === "none", `Reduced motion left spinner animation enabled: ${motion.animationName}`);
  invariant(motion.transitionDuration === "0s", `Reduced motion left chevron transition enabled: ${motion.transitionDuration}`);
  await client.send("Emulation.setEmulatedMedia", { features: [], media: "screen" });
}

async function runExampleRegression(client, exampleUrl, report) {
  const viewports = [
    { height: 1100, mobile: false, name: "desktop", width: 1440 },
    { height: 1180, mobile: true, name: "tablet", width: 820 },
    { height: 844, mobile: true, name: "mobile", width: 390 }
  ];

  const routes = ["overview", "components", "usage", "changelog"];
  for (const viewport of viewports) {
    await setViewport(client, viewport);
    for (const route of routes) {
      await navigate(client, `${exampleUrl}/#${route}`);
      for (const mode of ["dark", "light"]) {
        const context = `React ${route} ${viewport.name}/${mode}`;
        client.setPhase(`${context}: prepare`);
        reportProgress(context);
        if (await evaluate(client, "document.documentElement.dataset.mode") !== mode) await clickButton(client, mode);
        await waitForCondition(client, `document.documentElement.dataset.mode === ${JSON.stringify(mode)}`, `Mode did not change to ${mode}`);
        await settleUi(client);
        report.audits.push({ context, dom: await auditDom(client, context) });
        await auditAxe(client, context);
        report.accessibility.push({ context, ...(await auditAccessibilityTree(client, context)) });
        if ((viewport.name === "desktop" && mode === "dark") || (viewport.name === "mobile" && mode === "light")) {
          report.screenshots.push(await capture(client, `react-${route}-${viewport.name}-${mode}.png`));
        }
      }
    }
  }

  await setViewport(client, viewports[0]);
  await navigate(client, `${exampleUrl}/#components`);
  const accents = {};
  for (const theme of ["royal-purple", "amber", "forest", "deep-blue", "cyan", "steel"]) {
    client.setPhase(`React theme ${theme}`);
    await clickButton(client, `Use ${theme} theme`);
    await waitForCondition(client, `document.documentElement.dataset.theme === ${JSON.stringify(theme)}`, `Theme did not change to ${theme}`);
    accents[theme] = await evaluate(client, "getComputedStyle(document.documentElement).getPropertyValue('--ag-accent-rgb').trim()");
    invariant(accents[theme], `Theme ${theme} has no accent token`);
  }
  invariant(new Set(Object.values(accents)).size === 6, `Theme accents are not distinct: ${JSON.stringify(accents)}`);
  report.themes = accents;

  await runInteractionRegression(client, exampleUrl);
  report.interactions = "passed";
}

async function runStaticRegression(client, staticUrl, report) {
  for (const viewport of [
    { height: 1100, mobile: false, name: "desktop", width: 1440 },
    { height: 844, mobile: true, name: "mobile", width: 390 }
  ]) {
    await setViewport(client, viewport);
    await navigate(client, `${staticUrl}/preview/index.html`);
    for (const mode of ["dark", "light"]) {
      const context = `Static preview ${viewport.name}/${mode}`;
      client.setPhase(`${context}: prepare`);
      reportProgress(context);
      const currentMode = await evaluate(client, "document.documentElement.dataset.mode");
      if (currentMode !== mode) await clickButton(client, mode === "light" ? "Use light mode" : "Use dark mode");
      await waitForCondition(client, `document.documentElement.dataset.mode === ${JSON.stringify(mode)}`, `Static mode did not change to ${mode}`);
      await settleUi(client);
      const count = await evaluate(client, "document.querySelector('.contract-count')?.textContent.trim()");
      invariant(count === "18 component families · 5 platform targets · 90 checked claims", `${context}: contract count drifted`);
      report.audits.push({ context, dom: await auditDom(client, context) });
      await auditAxe(client, context);
      report.accessibility.push({ context, ...(await auditAccessibilityTree(client, context)) });
      report.screenshots.push(await capture(client, `static-${viewport.name}-${mode}.png`));
    }
  }
}

async function cleanup() {
  const processes = [...childProcesses];
  for (const processHandle of processes) processHandle.kill("SIGTERM");
  await Promise.all(processes.map((processHandle) => {
    if (processHandle.exitCode !== null || processHandle.signalCode !== null) return Promise.resolve();
    return new Promise((resolveExit) => {
      const timer = setTimeout(() => {
        processHandle.kill("SIGKILL");
        resolveExit();
      }, 2_000);
      processHandle.once("exit", () => {
        clearTimeout(timer);
        resolveExit();
      });
    });
  }));
  if (staticServer) await new Promise((resolveClose) => staticServer.close(resolveClose));
  if (chromeProfile) await rm(chromeProfile, { force: true, maxRetries: 5, recursive: true, retryDelay: 100 });
}

process.once("SIGINT", () => { cleanup().finally(() => process.exit(130)); });
process.once("SIGTERM", () => { cleanup().finally(() => process.exit(143)); });

try {
  await rm(outputDirectory, { force: true, recursive: true });
  await mkdir(outputDirectory, { recursive: true });
  const [previewPort, staticPort, chromePort] = await Promise.all([availablePort(), availablePort(), availablePort()]);
  const previewProcess = await startPreview(previewPort);
  childProcesses.add(previewProcess);
  await startStaticPreview(staticPort);

  const chromeBinary = await findChrome();
  chromeProfile = await mkdtemp(join(tmpdir(), "aurelglyph-chrome-"));
  const chrome = startProcess(chromeBinary, [
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--headless=new",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-sandbox",
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${chromeProfile}`,
    "about:blank"
  ], "Chrome");
  const versionResponse = await waitForHttp(`http://127.0.0.1:${chromePort}/json/version`, "Chrome DevTools");
  const chromeVersion = await versionResponse.json();
  const targets = await (await fetch(`http://127.0.0.1:${chromePort}/json/list`)).json();
  const pageTarget = targets.find((target) => target.type === "page");
  invariant(pageTarget?.webSocketDebuggerUrl, `Chrome page target missing\n${chrome.readLog()}`);

  const client = new CdpClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  await Promise.all([
    client.send("Accessibility.enable"),
    client.send("Page.enable"),
    client.send("Runtime.enable")
  ]);

  const report = {
    accessibility: [],
    audits: [],
    browser: chromeVersion.Browser,
    interactions: "not run",
    screenshots: [],
    themes: {}
  };
  await runExampleRegression(client, `http://127.0.0.1:${previewPort}`, report);
  await runStaticRegression(client, `http://127.0.0.1:${staticPort}`, report);
  report.cdp = client.diagnostics();
  invariant(report.cdp.pendingCommandCount === 0, `CDP commands remained pending: ${JSON.stringify(report.cdp)}`);
  invariant(report.cdp.socketState === WebSocket.OPEN, `CDP socket closed before completion: ${JSON.stringify(report.cdp)}`);
  client.close();

  const reportPath = join(outputDirectory, "report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`UX regression passed: ${report.audits.length} viewport/mode audits, ${report.accessibility.length} accessibility-tree audits, interaction suite passed.\nArtifacts: ${outputDirectory}\n`);
  process.stdout.write(`CDP session: ${report.cdp.responseCount} responses, ${report.cdp.eventCount} events, no pending commands.\n`);
} finally {
  await cleanup();
}
