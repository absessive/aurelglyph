import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const root = resolve(import.meta.dirname, "../examples/react-vite/dist");
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

      if (consoleErrors.length || pageErrors.length) {
        throw new Error(`${name}: browser errors: ${[...consoleErrors, ...pageErrors].join(" | ")}`);
      }
      process.stdout.write(`[browser-smoke] ${name} select theming and menu interaction passed.\n`);
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
