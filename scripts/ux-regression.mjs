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
const chromeProfiles = new Set();
let staticServer;
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

async function stopProcess(processHandle) {
  if (processHandle.exitCode !== null || processHandle.signalCode !== null) return;
  processHandle.kill("SIGTERM");
  await new Promise((resolveExit) => {
    const timer = setTimeout(() => {
      processHandle.kill("SIGKILL");
      resolveExit();
    }, 2_000);
    processHandle.once("exit", () => {
      clearTimeout(timer);
      resolveExit();
    });
  });
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

async function connectPageTarget(target) {
  invariant(target?.webSocketDebuggerUrl, "Chrome page target is missing a DevTools WebSocket URL");
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await Promise.all([
    client.send("Accessibility.enable"),
    client.send("Page.enable"),
    client.send("Runtime.enable")
  ]);
  await client.send("Page.bringToFront");
  return client;
}

async function startChrome(chromeBinary, label) {
  const port = await availablePort();
  const profile = await mkdtemp(join(tmpdir(), "aurelglyph-chrome-"));
  chromeProfiles.add(profile);
  const chrome = startProcess(chromeBinary, [
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-renderer-backgrounding",
    "--headless=new",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-sandbox",
    "--process-per-tab",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ], label);
  try {
    const versionResponse = await waitForHttp(`http://127.0.0.1:${port}/json/version`, `${label} DevTools`);
    const version = await versionResponse.json();
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const pageTarget = targets.find((target) => target.type === "page");
    invariant(pageTarget?.webSocketDebuggerUrl, `${label} page target missing\n${chrome.readLog()}`);
    const client = await connectPageTarget(pageTarget);
    return { client, chrome, profile, version };
  } catch (error) {
    await stopProcess(chrome.processHandle);
    await rm(profile, { force: true, maxRetries: 5, recursive: true, retryDelay: 100 });
    chromeProfiles.delete(profile);
    throw error;
  }
}

async function stopChrome(instance) {
  if (!instance) return;
  instance.client.close();
  await stopProcess(instance.chrome.processHandle);
  await rm(instance.profile, { force: true, maxRetries: 5, recursive: true, retryDelay: 100 });
  chromeProfiles.delete(instance.profile);
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

async function navigateExampleRoute(client, exampleUrl, route) {
  const base = new URL(exampleUrl);
  const hash = `#${route}`;
  const canReuseDocument = await evaluate(
    client,
    `location.origin === ${JSON.stringify(base.origin)} && location.pathname === ${JSON.stringify(base.pathname)}`
  );
  if (!canReuseDocument) {
    await navigate(client, `${exampleUrl}/${hash}`);
    return;
  }

  client.setPhase(`Navigate ${base.origin}${base.pathname}${hash}`);
  await evaluate(client, `location.hash = ${JSON.stringify(hash)}; true`);
  await waitForCondition(client, `location.hash === ${JSON.stringify(hash)}`, `Hash navigation did not finish at ${hash}`);
  await settleUi(client);
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

async function assertWithinViewport(client, selector, label) {
  const expression = `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      let clipLeft = viewportLeft;
      let clipTop = viewportTop;
      let clipRight = viewportLeft + (viewport?.width ?? window.innerWidth);
      let clipBottom = viewportTop + (viewport?.height ?? window.innerHeight);
      for (let ancestor = element.parentElement; ancestor && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
        const ancestorStyle = getComputedStyle(ancestor);
        const ancestorRect = ancestor.getBoundingClientRect();
        const clientLeft = ancestorRect.left + ancestor.clientLeft;
        const clientTop = ancestorRect.top + ancestor.clientTop;
        const clientRight = clientLeft + ancestor.clientWidth;
        const clientBottom = clientTop + ancestor.clientHeight;
        if (["auto", "clip", "hidden", "overlay", "scroll"].includes(ancestorStyle.overflowX)) {
          clipLeft = Math.max(clipLeft, clientLeft);
          clipRight = Math.min(clipRight, clientRight);
        }
        if (["auto", "clip", "hidden", "overlay", "scroll"].includes(ancestorStyle.overflowY)) {
          clipTop = Math.max(clipTop, clientTop);
          clipBottom = Math.min(clipBottom, clientBottom);
        }
      }
      return {
        bottom: rect.bottom,
        clipBottom,
        clipLeft,
        clipRight,
        clipTop,
        computedTransform: style.transform,
        left: rect.left,
        right: rect.right,
        shiftX: element.style.getPropertyValue("--ag-floating-shift-x"),
        shiftY: element.style.getPropertyValue("--ag-floating-shift-y"),
        top: rect.top,
        viewportBottom: viewportTop + (viewport?.height ?? window.innerHeight),
        viewportLeft,
        viewportRight: viewportLeft + (viewport?.width ?? window.innerWidth),
        viewportScale: viewport?.scale ?? 1,
        viewportTop
      };
    })()`;
  const startedAt = Date.now();
  let bounds;
  while (Date.now() - startedAt < 2_000) {
    bounds = await evaluate(client, expression);
    if (bounds
      && bounds.left >= bounds.clipLeft - 1
      && bounds.top >= bounds.clipTop - 1
      && bounds.right <= bounds.clipRight + 1
      && bounds.bottom <= bounds.clipBottom + 1) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 40));
  }
  invariant(bounds, `${label} was not found for viewport bounds check`);
  throw new Error(`${label} escaped the viewport: ${JSON.stringify(bounds)}`);
}

async function auditDom(client, context) {
  client.setPhase(`${context}: DOM audit`);
  const audit = await evaluate(client, `(() => {
    const controlSelector = "button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=menuitem], [role=tab]";
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
    const hasHorizontalScroller = (element) => {
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== document.documentElement) {
        const style = getComputedStyle(ancestor);
        if (["auto", "scroll"].includes(style.overflowX) && ancestor.scrollWidth > ancestor.clientWidth + 1) return true;
        ancestor = ancestor.parentElement;
      }
      return false;
    };
    const isDiscreteTarget = (element) => element.tagName !== "A" || getComputedStyle(element).display !== "inline";
    const visualViewport = window.visualViewport;
    const viewportLeft = visualViewport?.offsetLeft ?? 0;
    const viewportRight = viewportLeft + (visualViewport?.width ?? window.innerWidth);
    const unnamedControls = [...document.querySelectorAll(controlSelector)]
      .filter(visible)
      .filter((element) => {
        if (element.labels?.length) return false;
        return !accessibleName(element);
      })
      .map((element) => element.outerHTML.slice(0, 180));
    const undersizedControls = [...document.querySelectorAll(controlSelector)]
      .filter(visible)
      .filter(isDiscreteTarget)
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
    const clippedHeadings = [...document.querySelectorAll("h1, h2, h3")]
      .filter(visible)
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => element.tagName.toLowerCase() + "[" + element.textContent.trim().slice(0, 80) + "]");
    const clippedControls = [...document.querySelectorAll(controlSelector)]
      .filter(visible)
      .filter(isDiscreteTarget)
      .filter((element) => !["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName))
      .filter((element) => {
        const style = getComputedStyle(element);
        return element.scrollWidth > element.clientWidth + 1 && !["auto", "scroll"].includes(style.overflowX);
      })
      .map((element) => element.tagName.toLowerCase() + "[" + accessibleName(element).slice(0, 80) + "]");
    const offscreenControls = [...document.querySelectorAll(controlSelector)]
      .filter(visible)
      .filter((element) => {
        const elementRect = element.getBoundingClientRect();
        const target = elementRect.width <= 2 && elementRect.height <= 2 ? (element.labels?.[0] || element) : element;
        const rect = target.getBoundingClientRect();
        return (rect.left < viewportLeft - 1 || rect.right > viewportRight + 1) && !hasHorizontalScroller(target);
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const name = accessibleName(element) || element.labels?.[0]?.textContent?.trim() || "";
        return element.tagName.toLowerCase() + "[" + name + "] left=" + Math.round(rect.left) + " right=" + Math.round(rect.right);
      });
    const shellLayoutFailures = [...document.querySelectorAll(".ag-app-shell")]
      .filter(visible)
      .flatMap((shell) => {
        const body = shell.querySelector(":scope > .ag-app-shell__body");
        const content = body?.querySelector(":scope > .ag-app-shell__content");
        const footer = shell.querySelector(":scope > .ag-app-shell__footer");
        const navigation = body?.querySelector(":scope > .ag-app-shell__nav");
        const shellRect = shell.getBoundingClientRect();
        const bodyRect = body?.getBoundingClientRect();
        const contentRect = content?.getBoundingClientRect();
        const footerRect = footer?.getBoundingClientRect();
        const failures = [];
        if (shellRect.height > (visualViewport?.height ?? window.innerHeight) + 1) failures.push("shell exceeds viewport height");
        if (bodyRect && bodyRect.bottom > shellRect.bottom + 1) failures.push("body exceeds shell");
        if (footerRect && footerRect.bottom > shellRect.bottom + 1) failures.push("footer begins below shell");
        if (bodyRect && footerRect && bodyRect.bottom > footerRect.top + 1) failures.push("body overlaps footer");
        if (bodyRect && contentRect && !navigation
          && (Math.abs(contentRect.left - bodyRect.left) > 1 || Math.abs(contentRect.right - bodyRect.right) > 1)) {
          failures.push("content reserves an absent navigation rail");
        }
        if (bodyRect && contentRect && navigation) {
          const navigationVisible = getComputedStyle(navigation).display !== "none";
          const shouldShowNavigation = shell.clientWidth >= 760;
          if (navigationVisible !== shouldShowNavigation) failures.push("navigation does not follow shell container width");
          if (!navigationVisible
            && (Math.abs(contentRect.left - bodyRect.left) > 1 || Math.abs(contentRect.right - bodyRect.right) > 1)) {
            failures.push("compact content does not fill the hidden-rail shell");
          }
        }
        return failures;
      });
    return {
      brokenReferences,
      clippedControls,
      clippedHeadings,
      duplicateIds: [...new Set(duplicateIds)],
      fontDisplay: document.fonts.check('16px "Libre Baskerville"'),
      fontMono: document.fonts.check('16px "Space Mono"'),
      fontUi: document.fonts.check('16px "Atkinson Hyperlegible"'),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offscreenControls,
      shellLayoutFailures,
      undersizedControls,
      unnamedControls,
      viewport: {
        height: window.innerHeight,
        scale: visualViewport?.scale ?? 1,
        visualHeight: visualViewport?.height ?? window.innerHeight,
        visualWidth: visualViewport?.width ?? window.innerWidth,
        width: window.innerWidth
      },
      viewportMeta: Boolean(document.querySelector('meta[name="viewport"][content*="width=device-width"]'))
    };
  })()`);

  invariant(audit.duplicateIds.length === 0, `${context}: duplicate IDs: ${audit.duplicateIds.join(", ")}`);
  invariant(audit.brokenReferences.length === 0, `${context}: broken ARIA references: ${audit.brokenReferences.join(", ")}`);
  invariant(audit.clippedControls.length === 0, `${context}: clipped control labels: ${audit.clippedControls.join(" | ")}`);
  invariant(audit.clippedHeadings.length === 0, `${context}: clipped headings: ${audit.clippedHeadings.join(" | ")}`);
  invariant(audit.unnamedControls.length === 0, `${context}: unnamed controls: ${audit.unnamedControls.join(" | ")}`);
  invariant(audit.undersizedControls.length === 0, `${context}: controls smaller than 24px: ${audit.undersizedControls.join(" | ")}`);
  invariant(audit.offscreenControls.length === 0, `${context}: controls escaped the viewport: ${audit.offscreenControls.join(" | ")}`);
  invariant(audit.shellLayoutFailures.length === 0, `${context}: AppShell layout failures: ${audit.shellLayoutFailures.join(" | ")}`);
  invariant(audit.horizontalOverflow <= 1, `${context}: ${audit.horizontalOverflow}px horizontal overflow`);
  invariant(Math.abs(audit.viewport.scale - 1) <= 0.01, `${context}: browser auto-scaled the page to ${audit.viewport.scale}`);
  invariant(audit.viewportMeta, `${context}: responsive viewport metadata is missing`);
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
  const { data } = await client.send("Page.captureScreenshot", { captureBeyondViewport: false, format: "png" }, 60_000);
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

async function auditOptionalAppShellRows(client) {
  const result = await evaluate(client, `(async () => {
    const host = document.createElement("div");
    host.style.cssText = "position:absolute;left:-10000px;top:0;width:920px";
    const makeShell = (withFooter) => {
      const shell = document.createElement("div");
      shell.className = "ag-app-shell";
      shell.style.setProperty("--ag-app-shell-height", "240px");
      shell.style.width = "320px";
      const body = document.createElement("div");
      body.className = "ag-app-shell__body";
      const content = document.createElement("div");
      content.className = "ag-app-shell__content";
      content.textContent = "Responsive body";
      body.append(content);
      shell.append(body);
      if (withFooter) {
        const footer = document.createElement("footer");
        footer.className = "ag-app-shell__footer";
        footer.textContent = "Footer";
        shell.append(footer);
      }
      host.append(shell);
      return shell;
    };
    const makeNavigationShell = (width) => {
      const shell = document.createElement("div");
      shell.className = "ag-app-shell";
      shell.style.setProperty("--ag-app-shell-height", "240px");
      shell.style.width = width + "px";
      const body = document.createElement("div");
      body.className = "ag-app-shell__body";
      const navigation = document.createElement("nav");
      navigation.className = "ag-app-shell__nav";
      navigation.textContent = "Navigation";
      const content = document.createElement("div");
      content.className = "ag-app-shell__content";
      content.textContent = "Responsive content";
      body.append(navigation, content);
      shell.append(body);
      host.append(shell);
      return shell;
    };
    const bodyOnly = makeShell(false);
    const footerOnly = makeShell(true);
    const narrowNavigation = makeNavigationShell(320);
    const wideNavigation = makeNavigationShell(900);
    document.body.append(host);
    await new Promise((resolveLayout) => setTimeout(resolveLayout, 50));
    const bodyOnlyBody = bodyOnly.querySelector(".ag-app-shell__body").getBoundingClientRect();
    const bodyOnlyShell = bodyOnly.getBoundingClientRect();
    const footerBody = footerOnly.querySelector(".ag-app-shell__body").getBoundingClientRect();
    const footer = footerOnly.querySelector(".ag-app-shell__footer").getBoundingClientRect();
    const footerShell = footerOnly.getBoundingClientRect();
    const narrowBody = narrowNavigation.querySelector(".ag-app-shell__body").getBoundingClientRect();
    const narrowNavElement = narrowNavigation.querySelector(".ag-app-shell__nav");
    const narrowNav = narrowNavElement.getBoundingClientRect();
    const narrowContent = narrowNavigation.querySelector(".ag-app-shell__content").getBoundingClientRect();
    const wideBody = wideNavigation.querySelector(".ag-app-shell__body").getBoundingClientRect();
    const wideNavElement = wideNavigation.querySelector(".ag-app-shell__nav");
    const wideNav = wideNavElement.getBoundingClientRect();
    const wideContent = wideNavigation.querySelector(".ag-app-shell__content").getBoundingClientRect();
    const close = (left, right) => Math.abs(left - right) <= 1;
    const measurements = {
      bodyOnlyFills: close(bodyOnlyBody.top, bodyOnlyShell.top) && close(bodyOnlyBody.bottom, bodyOnlyShell.bottom),
      footerBodyFillsFlexibleRow: close(footerBody.top, footerShell.top) && close(footerBody.bottom, footer.top),
      footerEndsShell: close(footer.bottom, footerShell.bottom),
      footerHeight: footer.height,
      narrowDirectChildNavHidden: getComputedStyle(narrowNavElement).display === "none" && narrowNav.width === 0,
      narrowDirectChildContentFills: close(narrowContent.left, narrowBody.left) && close(narrowContent.right, narrowBody.right),
      wideDirectChildNavVisible: getComputedStyle(wideNavElement).display !== "none" && wideNav.width >= 220,
      wideDirectChildColumnsAlign: close(wideNav.left, wideBody.left)
        && close(wideNav.right, wideContent.left)
        && close(wideContent.right, wideBody.right)
    };
    host.remove();
    return measurements;
  })()`);
  invariant(result.bodyOnlyFills, `Body-only AppShell did not fill its flexible row: ${JSON.stringify(result)}`);
  invariant(result.footerBodyFillsFlexibleRow, `Footer-only AppShell body used the wrong row: ${JSON.stringify(result)}`);
  invariant(result.footerEndsShell && result.footerHeight < 80, `Footer-only AppShell stretched its footer: ${JSON.stringify(result)}`);
  invariant(result.narrowDirectChildNavHidden && result.narrowDirectChildContentFills, `Raw AppShell did not collapse direct-child navigation at 320px: ${JSON.stringify(result)}`);
  invariant(result.wideDirectChildNavVisible && result.wideDirectChildColumnsAlign, `Raw AppShell did not reserve direct-child navigation at 900px: ${JSON.stringify(result)}`);
  return result;
}

async function ensureMode(client, mode, buttonLabel, context) {
  if (await evaluate(client, "document.documentElement.dataset.mode") !== mode) {
    await clickButton(client, buttonLabel);
  }
  await waitForCondition(
    client,
    `document.documentElement.dataset.mode === ${JSON.stringify(mode)}`,
    `${context}: mode did not change to ${mode}`
  );
  await settleUi(client);
}

async function runInteractionRegression(client, exampleUrl, viewport, viewportName) {
  const suiteName = `React interaction suite ${viewportName}`;
  reportProgress(suiteName);
  client.setPhase(`${suiteName}: setup`);
  await setViewport(client, viewport);
  await navigate(client, `${exampleUrl}/#components`);
  client.setPhase(`${suiteName}: dialog`);

  await clickButton(client, "Open dialog");
  await waitForCondition(client, "Boolean(document.querySelector('dialog.ag-dialog[open]'))", "Dialog did not open");
  await assertWithinViewport(client, "dialog.ag-dialog[open]", "Dialog");
  invariant(await evaluate(client, "Boolean(document.querySelector('dialog.ag-dialog[open]')?.matches(':modal') || document.querySelector('dialog.ag-dialog[open]')?.getAttribute('aria-modal') === 'true')"), "Dialog did not open modally");
  invariant(await evaluate(client, "Boolean(document.activeElement?.closest('dialog.ag-dialog'))"), "Dialog did not move focus inside");
  await pressKey(client, "Escape");
  await waitForCondition(client, "!document.querySelector('dialog.ag-dialog[open]')", "Dialog did not close with Escape");
  await waitForCondition(client, "document.activeElement?.textContent.trim() === 'Open dialog'", "Dialog did not restore trigger focus");

  client.setPhase(`${suiteName}: drawer`);
  await clickButton(client, "Open drawer");
  await waitForCondition(client, "Boolean(document.querySelector('dialog.ag-drawer[open]'))", "Drawer did not open");
  await assertWithinViewport(client, "dialog.ag-drawer[open]", "Drawer");
  invariant(await evaluate(client, "Boolean(document.querySelector('dialog.ag-drawer[open]')?.matches(':modal') || document.querySelector('dialog.ag-drawer[open]')?.getAttribute('aria-modal') === 'true')"), "Drawer did not open modally");
  await pressKey(client, "Escape");
  await waitForCondition(client, "!document.querySelector('dialog.ag-drawer[open]')", "Drawer did not close with Escape");

  client.setPhase(`${suiteName}: menu`);
  await clickButton(client, "System actions");
  await waitForCondition(client, "Boolean(document.querySelector('[role=menu]:not([hidden])'))", "Menu did not open");
  await assertWithinViewport(client, "[role=menu]:not([hidden])", "Menu");
  invariant(await evaluate(client, "document.activeElement?.getAttribute('role') === 'menuitem'"), "Menu did not focus its first item");
  await pressKey(client, "ArrowDown");
  invariant(await evaluate(client, "document.activeElement?.textContent.includes('Archive')"), "Menu arrow navigation did not move to Archive");
  await pressKey(client, "Escape");
  await waitForCondition(client, "!document.querySelector('[role=menu]:not([hidden])')", "Menu did not close with Escape");

  client.setPhase(`${suiteName}: clipped AppShell menu`);
  const shellMenuOpened = await evaluate(client, `(() => {
    const trigger = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Shell actions');
    const menu = trigger?.closest('.ag-menu');
    const spacer = document.createElement('div');
    spacer.dataset.agUxAnchorSpacer = 'true';
    spacer.style.height = '640px';
    menu?.before(spacer);
    trigger?.scrollIntoView({ block: 'end', inline: 'nearest' });
    trigger?.focus();
    trigger?.click();
    return Boolean(trigger);
  })()`);
  invariant(shellMenuOpened, "Embedded AppShell menu trigger was not found");
  await waitForCondition(client, "Boolean(document.querySelector('[role=menu][aria-label=\"Shell actions\"]:not([hidden])'))", "Embedded AppShell menu did not open");
  await assertWithinViewport(client, '[role=menu][aria-label="Shell actions"]:not([hidden])', "Embedded AppShell menu");
  await evaluate(client, `(() => {
    const trigger = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Shell actions');
    const scrollport = trigger?.closest('.ag-app-shell__content');
    if (scrollport) {
      scrollport.scrollTop = 0;
      scrollport.dispatchEvent(new Event('scroll'));
    }
    return Boolean(scrollport);
  })()`);
  await waitForCondition(client, "!document.querySelector('[role=menu][aria-label=\"Shell actions\"]:not([hidden])')", "Embedded AppShell menu did not dismiss after its anchor left the viewport");
  await evaluate(client, "document.querySelector('[data-ag-ux-anchor-spacer]')?.remove(); true");

  client.setPhase(`${suiteName}: popover`);
  await clickButton(client, "Inspect release");
  await waitForCondition(client, "Boolean(document.querySelector('.ag-popover__surface[role=dialog]:not([hidden])'))", "Popover did not open");
  await assertWithinViewport(client, ".ag-popover__surface[role=dialog]:not([hidden])", "Popover");
  await pressKey(client, "Escape");
  await waitForCondition(client, "!document.querySelector('.ag-popover__surface[role=dialog]:not([hidden])')", "Popover did not close with Escape");

  client.setPhase(`${suiteName}: tooltip hover`);
  const tooltipPoint = await evaluate(client, `(() => {
    const trigger = document.querySelector('button[aria-label="Refresh package state"]');
    trigger?.scrollIntoView({ block: 'start', inline: 'nearest' });
    const rect = trigger?.getBoundingClientRect();
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
  })()`);
  invariant(tooltipPoint, "Tooltip trigger was not found for hover coverage");
  await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: tooltipPoint.x, y: tooltipPoint.y });
  await waitForCondition(client, "Boolean(document.querySelector('[role=tooltip]:not([hidden])'))", "Tooltip did not open on edge hover");
  await assertWithinViewport(client, "[role=tooltip]:not([hidden])", "Hovered tooltip");
  invariant(
    await evaluate(client, "getComputedStyle(document.querySelector('[role=tooltip]:not([hidden])')).pointerEvents === 'none'"),
    "Tooltip surface can intercept its trigger's hover pointer"
  );
  await settleUi(client);
  invariant(await evaluate(client, "Boolean(document.querySelector('[role=tooltip]:not([hidden])'))"), "Edge-hover tooltip flickered closed");
  await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
  await waitForCondition(client, "!document.querySelector('[role=tooltip]:not([hidden])')", "Tooltip did not close after hover left");

  client.setPhase(`${suiteName}: tooltip focus`);
  const tooltipFocused = await evaluate(client, `(() => {
    const trigger = document.querySelector('button[aria-label="Refresh package state"]');
    trigger?.focus();
    return Boolean(trigger);
  })()`);
  invariant(tooltipFocused, "Tooltip trigger was not found");
  await waitForCondition(client, "Boolean(document.querySelector('[role=tooltip]:not([hidden])'))", "Tooltip did not open on focus");
  await assertWithinViewport(client, "[role=tooltip]:not([hidden])", "Tooltip");
  await pressKey(client, "Escape");
  await waitForCondition(client, "!document.querySelector('[role=tooltip]:not([hidden])')", "Tooltip did not dismiss");

  client.setPhase(`${suiteName}: form controls`);
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

  client.setPhase(`${suiteName}: combobox`);
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
  await assertWithinViewport(client, ".ag-combobox__list:not([hidden])", "Combobox listbox");
  await evaluate(client, "[...document.querySelectorAll('[role=option]')].find((option) => option.textContent.includes('Forest')).click()");
  invariant(await evaluate(client, "document.querySelector('input[name=components-accent]').value === 'forest'"), "Combobox selection did not update");

  client.setPhase(`${suiteName}: reduced motion`);
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
      await navigateExampleRoute(client, exampleUrl, route);
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
  await navigateExampleRoute(client, exampleUrl, "components");
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
  report.appShellVariants = await auditOptionalAppShellRows(client);
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

async function runPagesRegression(client, staticUrl, report) {
  const routes = [
    { name: "overview", path: "index.html" },
    { name: "components", path: "components.html" },
    { name: "usage", path: "usage.html" },
    { name: "changelog", path: "changelog.html" }
  ];
  const viewports = [
    { height: 1100, mobile: false, name: "desktop", width: 1440 },
    { height: 568, mobile: true, name: "compact", width: 320 }
  ];

  for (const viewport of viewports) {
    await setViewport(client, viewport);
    for (const route of routes) {
      await navigate(client, `${staticUrl}/docs/${route.path}`);
      for (const mode of ["dark", "light"]) {
        const context = `Pages ${route.name} ${viewport.name}/${mode}`;
        client.setPhase(`${context}: prepare`);
        reportProgress(context);
        await ensureMode(client, mode, mode === "light" ? "Use light mode" : "Use dark mode", context);
        report.audits.push({ context, dom: await auditDom(client, context) });
        await auditAxe(client, context);
        report.accessibility.push({ context, ...(await auditAccessibilityTree(client, context)) });
        if ((viewport.name === "desktop" && mode === "dark") || (viewport.name === "compact" && mode === "light")) {
          report.screenshots.push(await capture(client, `pages-${route.name}-${viewport.name}-${mode}.png`));
        }
      }
    }
  }
}

async function runResponsiveRegression(client, exampleUrl, staticUrl, report) {
  const extraViewports = [
    { height: 568, mobile: true, name: "compact", width: 320 },
    { height: 320, mobile: true, name: "landscape", width: 568 },
    { height: 1024, mobile: true, name: "tablet", width: 768 },
    { height: 768, mobile: false, name: "laptop", width: 1024 },
    { height: 1080, mobile: false, name: "wide", width: 1920 }
  ];
  const reactRoutes = ["overview", "components", "usage", "changelog"];
  const pageRoutes = [
    { name: "overview", path: "index.html" },
    { name: "components", path: "components.html" },
    { name: "usage", path: "usage.html" },
    { name: "changelog", path: "changelog.html" }
  ];

  for (const viewport of extraViewports) {
    await setViewport(client, viewport);
    for (const route of reactRoutes) {
      await navigateExampleRoute(client, exampleUrl, route);
      const context = `Responsive React ${route} ${viewport.name}`;
      client.setPhase(`${context}: prepare`);
      reportProgress(context);
      await ensureMode(client, "dark", "dark", context);
      report.responsive.push({ context, dom: await auditDom(client, context) });
      if (viewport.name === "compact" || route === "components") {
        report.screenshots.push(await capture(client, `responsive-react-${route}-${viewport.name}.png`));
      }
    }
  }

  for (const viewport of extraViewports.filter(({ name }) => name !== "compact")) {
    await setViewport(client, viewport);
    for (const route of pageRoutes) {
      await navigate(client, `${staticUrl}/docs/${route.path}`);
      const context = `Responsive Pages ${route.name} ${viewport.name}`;
      client.setPhase(`${context}: prepare`);
      reportProgress(context);
      await ensureMode(client, "dark", "Use dark mode", context);
      report.responsive.push({ context, dom: await auditDom(client, context) });
      if (route.name === "components") {
        report.screenshots.push(await capture(client, `responsive-pages-${route.name}-${viewport.name}.png`));
      }
    }
  }

  for (const viewport of extraViewports) {
    await setViewport(client, viewport);
    await navigate(client, `${staticUrl}/preview/index.html`);
    const context = `Responsive static preview ${viewport.name}`;
    client.setPhase(`${context}: prepare`);
    reportProgress(context);
    await ensureMode(client, "dark", "Use dark mode", context);
    report.responsive.push({ context, dom: await auditDom(client, context) });
    report.screenshots.push(await capture(client, `responsive-static-${viewport.name}.png`));
  }
}

async function cleanup() {
  const processes = [...childProcesses];
  await Promise.all(processes.map(stopProcess));
  if (staticServer) await new Promise((resolveClose) => staticServer.close(resolveClose));
  await Promise.all([...chromeProfiles].map((profile) =>
    rm(profile, { force: true, maxRetries: 5, recursive: true, retryDelay: 100 })
  ));
  chromeProfiles.clear();
}

process.once("SIGINT", () => { cleanup().finally(() => process.exit(130)); });
process.once("SIGTERM", () => { cleanup().finally(() => process.exit(143)); });

try {
  await rm(outputDirectory, { force: true, recursive: true });
  await mkdir(outputDirectory, { recursive: true });
  const [previewPort, staticPort] = await Promise.all([availablePort(), availablePort()]);
  const previewProcess = await startPreview(previewPort);
  childProcesses.add(previewProcess);
  await startStaticPreview(staticPort);

  const chromeBinary = await findChrome();
  const report = {
    accessibility: [],
    audits: [],
    browser: "not started",
    interactionCdp: [],
    interactionRetries: [],
    interactions: "not run",
    responsive: [],
    screenshots: [],
    themes: {}
  };
  for (const { name, viewport } of [
    { name: "desktop", viewport: { height: 1100, mobile: false, width: 1440 } },
    { name: "compact", viewport: { height: 568, mobile: true, width: 320 } },
    { name: "landscape", viewport: { height: 320, mobile: true, width: 568 } }
  ]) {
    let completed = false;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      let isolated;
      try {
        isolated = await startChrome(chromeBinary, `${name} interaction Chrome, attempt ${attempt}`);
        await runInteractionRegression(
          isolated.client,
          `http://127.0.0.1:${previewPort}`,
          viewport,
          name
        );
        const diagnostics = isolated.client.diagnostics();
        invariant(diagnostics.pendingCommandCount === 0, `${name} interaction commands remained pending: ${JSON.stringify(diagnostics)}`);
        invariant(diagnostics.socketState === WebSocket.OPEN, `${name} interaction socket closed early: ${JSON.stringify(diagnostics)}`);
        report.interactionCdp.push({ attempt, name, ...diagnostics });
        completed = true;
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const transportFailure = /(?:CDP socket|socket=|timed out after)/u.test(message);
        if (!transportFailure || attempt >= 2) throw error;
        report.interactionRetries.push({ attempt, message, name });
        process.stdout.write(`[ux] Retrying ${name} interaction suite in a fresh browser process after a CDP transport timeout.\n`);
      } finally {
        await stopChrome(isolated);
      }
    }
    invariant(completed, `${name} interaction suite did not complete`);
  }
  report.interactions = "passed";
  const auditChrome = await startChrome(chromeBinary, "audit Chrome");
  const { client } = auditChrome;
  report.browser = auditChrome.version.Browser;
  await runExampleRegression(client, `http://127.0.0.1:${previewPort}`, report);
  await runStaticRegression(client, `http://127.0.0.1:${staticPort}`, report);
  await runPagesRegression(client, `http://127.0.0.1:${staticPort}`, report);
  await runResponsiveRegression(
    client,
    `http://127.0.0.1:${previewPort}`,
    `http://127.0.0.1:${staticPort}`,
    report
  );
  report.cdp = client.diagnostics();
  invariant(report.cdp.pendingCommandCount === 0, `CDP commands remained pending: ${JSON.stringify(report.cdp)}`);
  invariant(report.cdp.socketState === WebSocket.OPEN, `CDP socket closed before completion: ${JSON.stringify(report.cdp)}`);
  await stopChrome(auditChrome);

  const reportPath = join(outputDirectory, "report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `UX regression passed: ${report.audits.length} viewport/mode audits, `
    + `${report.accessibility.length} accessibility-tree audits, `
    + `${report.responsive.length} responsive probes, desktop, compact, and landscape interaction suites passed.\n`
    + `Artifacts: ${outputDirectory}\n`
  );
  process.stdout.write(`CDP session: ${report.cdp.responseCount} responses, ${report.cdp.eventCount} events, no pending commands.\n`);
  process.stdout.write(
    `Interaction CDP sessions: ${report.interactionCdp.length} isolated browser processes, `
    + `${report.interactionRetries.length} transport retries, no pending commands.\n`
  );
} finally {
  await cleanup();
}
