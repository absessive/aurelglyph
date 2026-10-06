import { createReadStream } from "node:fs";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const root = resolve(import.meta.dirname, "../examples/react-vite/dist");
const artifacts = await mkdtemp(join(tmpdir(), "aurelglyph-catalog-web-"));
const axeSource = await readFile(resolve(import.meta.dirname, "../node_modules/axe-core/axe.min.js"), "utf8");
const railsSource = await readFile(resolve(import.meta.dirname, "../packages/rails/app/assets/javascripts/aurelglyph.js"), "utf8");
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"]
]);

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const relativePath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = join(root, relativePath === "/" ? "index.html" : relativePath);
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    response.writeHead(200, { "content-type": mimeTypes.get(extname(filePath)) ?? "application/octet-stream" });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolveListen, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolveListen);
});

const address = server.address();
if (!address || typeof address === "string") throw new Error("Could not start browser smoke server.");
const url = `http://127.0.0.1:${address.port}/#components`;
const engines = [
  ["Chromium", chromium],
  ["Firefox", firefox],
  ["WebKit", webkit]
];

try {
  for (const [name, engine] of engines) {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ colorScheme: "light", viewport: { height: 800, width: 1280 } });
      const consoleErrors = [];
      const pageErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.goto(url, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Component previews" }).waitFor();

      const gallery = page.locator("[data-catalog-essentials]");
      const unavailable = gallery.locator(".ag-link.is-unavailable");
      if ((await unavailable.getAttribute("href")) !== null || (await unavailable.getAttribute("tabindex")) !== null || (await unavailable.getAttribute("role")) === "link") throw new Error(`${name}: unavailable link remains activatable.`);
      const linkSizing = await gallery.evaluate((element) => {
        const standalone = element.querySelector(".example-inline-row .ag-link:not(.is-unavailable)");
        if (!(standalone instanceof HTMLElement)) throw new Error("Standalone catalog link is missing.");
        const fixture = document.createElement("div");
        fixture.innerHTML = '<p style="margin:0;white-space:nowrap">Read the <a class="ag-link" href="#inline-link-size">inline guide</a> today.</p><p style="margin:0;white-space:nowrap">Read the <span>inline guide</span> today.</p>';
        element.append(fixture);
        const inline = fixture.querySelector(".ag-link");
        const paragraphs = fixture.querySelectorAll("p");
        if (!(inline instanceof HTMLElement) || paragraphs.length !== 2) throw new Error("Inline link fixture is incomplete.");
        const standaloneRect = standalone.getBoundingClientRect();
        const inlineRect = inline.getBoundingClientRect();
        const linkedLineRect = paragraphs[0].getBoundingClientRect();
        const plainLineRect = paragraphs[1].getBoundingClientRect();
        const result = {
          inlineDisplay: getComputedStyle(inline).display,
          inlineHeight: inlineRect.height,
          linkedLineHeight: linkedLineRect.height,
          plainLineHeight: plainLineRect.height,
          standaloneHeight: standaloneRect.height,
          standaloneWidth: standaloneRect.width
        };
        fixture.remove();
        return result;
      });
      if (linkSizing.standaloneHeight < 24 || linkSizing.standaloneWidth < 24) throw new Error(`${name}: standalone link target is undersized: ${JSON.stringify(linkSizing)}`);
      if (linkSizing.inlineDisplay !== "inline" || Math.abs(linkSizing.linkedLineHeight - linkSizing.plainLineHeight) > 0.5) throw new Error(`${name}: inline prose link changed natural line flow: ${JSON.stringify(linkSizing)}`);
      const chip = gallery.getByRole("button", { name: "Workbench", exact: true });
      await chip.click();
      if ((await chip.getAttribute("aria-pressed")) !== "false") throw new Error(`${name}: chip selection did not update.`);
      await chip.evaluate((element) => element.closest("form").reset());
      await page.waitForFunction(() => document.querySelector("[data-catalog-essentials] .ag-chip__select")?.getAttribute("aria-pressed") === "true");
      if ((await chip.evaluate((element) => new FormData(element.closest("form")).get("catalog-scope"))) !== "workbench") throw new Error(`${name}: chip reset lost its form value.`);
      await gallery.getByRole("button", { name: "Remove Workbench" }).click();
      const restore = gallery.getByRole("button", { name: "Restore chip" });
      if (!(await restore.evaluate((element) => element === document.activeElement))) throw new Error(`${name}: example chip removal lost focus.`);
      await restore.click();
      if (!(await chip.evaluate((element) => element === document.activeElement))) throw new Error(`${name}: example chip restoration lost focus.`);
      const password = gallery.getByLabel("Password", { exact: true });
      await password.fill("example-password");
      await password.evaluate((input) => input.setSelectionRange(2, 5));
      const passwordIdentity = await password.elementHandle();
      await gallery.getByRole("button", { name: "Show password" }).click();
      // Check the settled native range after the type-change paint boundary.
      await password.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      const revealed = await password.evaluate((input, original) => ({ type: input.type, value: input.value, start: input.selectionStart, end: input.selectionEnd, focused: input === document.activeElement, sameInput: input === original }), passwordIdentity);
      if (revealed.type !== "text" || revealed.value !== "example-password" || revealed.start !== 2 || revealed.end !== 5 || !revealed.focused || !revealed.sameInput) throw new Error(`${name}: password reveal lost native state: ${JSON.stringify(revealed)}`);
      await gallery.getByRole("button", { name: "Hide password" }).click();
      await password.fill("short");
      await gallery.getByRole("button", { name: "Validate fields" }).click();
      if (!(await gallery.locator("#catalog-errors").evaluate((element) => element === document.activeElement))) throw new Error(`${name}: summary submission focus failed.`);
      await gallery.locator(".ag-validation-summary").getByRole("link", { name: "Use at least 12 characters." }).click();
      if (!(await password.evaluate((input) => input === document.activeElement))) throw new Error(`${name}: error link did not focus its field.`);
      await gallery.getByLabel("Amount", { exact: true }).fill("125.00");
      await password.fill("example-password");
      await gallery.getByRole("button", { name: "Validate fields" }).click();
      if (await gallery.locator("#catalog-errors").count()) throw new Error(`${name}: empty validation summary remained visible.`);
      const access = gallery.getByRole("button", { name: "Access", exact: true });
      await access.click();
      if ((await access.getAttribute("aria-expanded")) !== "true" || (await gallery.getByRole("button", { name: "Workspace", exact: true }).getAttribute("aria-expanded")) !== "false") throw new Error(`${name}: accordion single-open policy failed.`);
      if (await gallery.getByRole("button", { name: "Archive", exact: true }).isEnabled()) throw new Error(`${name}: disabled accordion remained enabled.`);
      if ((await gallery.locator(".ag-stepper [aria-current=step]").count()) !== 1 || (await gallery.locator(".ag-stepper .is-disabled button, .ag-stepper .is-disabled a").count()) !== 0) throw new Error(`${name}: workflow status semantics failed.`);
      const rating = gallery.getByRole("radiogroup", { name: "Experience" });
      await gallery.evaluate((element) => { element.dir = "rtl"; });
      await rating.getByRole("radio", { name: "3 of 5", exact: true }).focus();
      await page.keyboard.press("ArrowRight");
      if (!(await rating.getByRole("radio", { name: "2 of 5", exact: true }).isChecked())) throw new Error(`${name}: RTL rating keyboard failed.`);
      await rating.getByRole("button", { name: "Clear rating" }).click();
      if (await rating.locator("input:checked").count()) throw new Error(`${name}: rating did not clear.`);
      await rating.evaluate((element) => element.closest("form").reset());
      await page.waitForFunction(() => document.querySelector("[data-catalog-essentials] .ag-rating input[value='3']")?.checked === true);
      if ((await rating.locator(".ag-rating__option[data-filled]").count()) !== 3 || (await rating.evaluate((element) => new FormData(element.closest("form")).get("catalog-rating"))) !== "3") throw new Error(`${name}: rating reset lost form value or selection paint.`);
      await gallery.evaluate((element) => { element.dir = "ltr"; });
      await page.addScriptTag({ content: axeSource });
      for (const mode of ["light", "dark"]) {
        await page.getByRole("button", { name: mode, exact: true }).click();
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 900 });
          // Audit settled token paint, not an intermediate light/dark transition.
          await page.evaluate(async () => {
            await new Promise(requestAnimationFrame);
            await Promise.all(document.getAnimations().filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime)).map((animation) => animation.finished.catch(() => {})));
          });
          const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector("[data-catalog-essentials]"))).violations.map(({ id, nodes }) => ({ id, nodes: nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) })));
          if (violations.length) throw new Error(`${name}/${mode}/${width}: catalog accessibility ${JSON.stringify(violations)}`);
          const overflowing = await gallery.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
          if (overflowing) throw new Error(`${name}/${mode}/${width}: catalog overflowed.`);
          if (name === "Chromium") await gallery.screenshot({ path: join(artifacts, `${mode}-${width}.png`) });
        }
      }
      await page.setViewportSize({ width: 1280, height: 800 });

      const select = page.getByLabel("Theme", { exact: true });
      await select.selectOption("forest");
      if ((await select.inputValue()) !== "forest") throw new Error(`${name}: native select did not update.`);
      const paint = await select.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          color: style.color
        };
      });
      if (Object.values(paint).some((value) => !value || value === "rgba(0, 0, 0, 0)")) {
        throw new Error(`${name}: select fallback is missing themed paint: ${JSON.stringify(paint)}`);
      }

      await page.getByRole("button", { name: "dark", exact: true }).click();
      if ((await page.locator("html").getAttribute("data-mode")) !== "dark") {
        throw new Error(`${name}: dark mode did not apply.`);
      }

      const menuButton = page.getByRole("button", { name: "System actions" });
      await menuButton.click();
      await page.getByRole("menu").waitFor();
      await page.keyboard.press("Escape");
      if (await page.getByRole("menu").isVisible()) throw new Error(`${name}: Escape did not dismiss the menu.`);
      if (!(await menuButton.evaluate((element) => element === document.activeElement))) {
        throw new Error(`${name}: menu dismissal did not restore trigger focus.`);
      }

      const railsPage = await browser.newPage();
      try {
        await railsPage.setContent(`
          <div data-aurelglyph-password-field="" data-hide-label="Hide password" data-show-label="Show password">
            <input aria-label="Rails password" data-aurelglyph-password-input="" type="password" value="example-password" />
            <button aria-label="Show password" aria-pressed="false" data-aurelglyph-password-toggle="" type="button">
              <span data-aurelglyph-password-show-icon="">Show</span>
              <span data-aurelglyph-password-hide-icon="" hidden>Hide</span>
            </button>
          </div>
        `);
        await railsPage.addScriptTag({ content: railsSource });
        const railsPassword = railsPage.getByLabel("Rails password", { exact: true });
        const railsIdentity = await railsPassword.elementHandle();
        await railsPassword.focus();
        await railsPassword.evaluate((input) => input.setSelectionRange(2, 5));
        await railsPage.getByRole("button", { name: "Show password" }).click();
        await railsPassword.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
        const railsRevealed = await railsPassword.evaluate((input, original) => ({ type: input.type, value: input.value, start: input.selectionStart, end: input.selectionEnd, focused: input === document.activeElement, sameInput: input === original }), railsIdentity);
        if (railsRevealed.type !== "text" || railsRevealed.value !== "example-password" || railsRevealed.start !== 2 || railsRevealed.end !== 5 || !railsRevealed.focused || !railsRevealed.sameInput) throw new Error(`${name}: Rails password reveal lost settled native state: ${JSON.stringify(railsRevealed)}`);

        await railsPassword.evaluate((input) => input.setSelectionRange(3, 7, "backward"));
        const hidePassword = railsPage.getByRole("button", { name: "Hide password" });
        const toggleIdentity = await hidePassword.elementHandle();
        await hidePassword.focus();
        await railsPage.keyboard.press("Enter");
        await railsPassword.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
        const railsConcealed = await railsPassword.evaluate((input) => ({ type: input.type, value: input.value, start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection }));
        if (railsConcealed.type !== "password" || railsConcealed.value !== "example-password" || railsConcealed.start !== 3 || railsConcealed.end !== 7 || railsConcealed.direction !== "backward" || !(await toggleIdentity.evaluate((element) => element === document.activeElement))) throw new Error(`${name}: Rails keyboard conceal lost selection or control focus: ${JSON.stringify(railsConcealed)}`);
      } finally {
        await railsPage.close();
      }

      if (consoleErrors.length || pageErrors.length) {
        throw new Error(`${name}: browser errors: ${[...consoleErrors, ...pageErrors].join(" | ")}`);
      }
      process.stdout.write(`[browser-smoke] ${name} catalog essentials, four mode/viewport accessibility checks, select theming and menu interaction passed.\n`);
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise((resolveClose, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolveClose();
    };
    const timer = setTimeout(() => {
      server.closeAllConnections?.();
      finish();
    }, 2_000);
    server.close(finish);
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
  });
}
process.stdout.write(`[browser-smoke] Catalog screenshots: ${artifacts}\n`);
