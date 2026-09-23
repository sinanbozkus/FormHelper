// A minimal headless Chrome driver over the DevTools protocol (no dependencies, Node 22+).
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const candidates = {
  darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"],
  linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"],
  win32: [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google\\Chrome\\Application\\chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google\\Chrome\\Application\\chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe")
  ]
};

function findChrome() {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }

  const found = (candidates[process.platform] || []).find((p) => existsSync(p));

  if (!found) {
    throw new Error("Chrome was not found. Set CHROME_PATH to the Chrome (or Chromium) executable.");
  }

  return found;
}

export async function launch() {
  const userDataDir = mkdtempSync(path.join(tmpdir(), "formhelper-chrome-"));
  const port = 9300 + Math.floor(Math.random() * 500);
  const args = ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`,
    "--no-first-run", "--no-default-browser-check", "--window-size=1280,900", "about:blank"];

  if (process.platform === "linux") {
    args.unshift("--no-sandbox");
  }

  const chrome = spawn(findChrome(), args, { stdio: "ignore" });

  let targets = [];
  for (let i = 0; i < 100 && !targets.some((t) => t.type === "page"); i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    } catch {
      await sleep(200);
    }
  }

  const page = targets.find((t) => t.type === "page");
  if (!page) {
    chrome.kill();
    throw new Error("Chrome did not start.");
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));

  let lastId = 0;
  const pending = new Map();
  const listeners = [];
  const logs = [];

  ws.addEventListener("message", (e) => {
    const message = JSON.parse(e.data);

    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
      return;
    }

    const params = message.params;
    if (message.method === "Runtime.consoleAPICalled") {
      logs.push(`[console.${params.type}] ` + params.args.map((a) => (a.value !== undefined ? JSON.stringify(a.value) : a.description || a.type)).join(" "));
    } else if (message.method === "Runtime.exceptionThrown") {
      logs.push("[exception] " + (params.exceptionDetails.exception?.description || params.exceptionDetails.text));
    } else if (message.method === "Log.entryAdded") {
      logs.push(`[log.${params.entry.level}] ${params.entry.text} ${params.entry.url || ""}`);
    }

    listeners.forEach((listener) => listener(message));
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++lastId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");

  return {
    logs,

    errors() {
      return logs.filter((l) => l.startsWith("[exception]") || l.startsWith("[console.error]") || l.startsWith("[log.error]"));
    },

    async goto(url) {
      const loaded = new Promise((resolve) => {
        const listener = (m) => {
          if (m.method === "Page.loadEventFired") {
            listeners.splice(listeners.indexOf(listener), 1);
            resolve();
          }
        };
        listeners.push(listener);
      });
      await send("Page.navigate", { url });
      await loaded;
      await sleep(300);
    },

    // Runs the code as the body of an async function in the page and returns its (JSON) result.
    async eval(code) {
      const result = await send("Runtime.evaluate", { expression: `(async () => { ${code} })()`, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      return result.result.value;
    },

    async close() {
      ws.close();
      chrome.kill();
      await sleep(300);
      try {
        rmSync(userDataDir, { recursive: true, force: true });
      } catch {
        // Chrome may still hold a file on Windows
      }
    }
  };
}
