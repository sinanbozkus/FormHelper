// End-to-end tests of the client script: runs the sample app and drives it with headless Chrome.
//
//   npm test                                    builds and starts the sample, runs the tests, stops the sample
//   BASE=http://localhost:5000 npm test         uses a sample that is already running
//
// Needs the .NET SDK (or DOTNET=path/to/dotnet) and Chrome (or CHROME_PATH=path/to/chrome).
import { spawn, spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort, launch } from "./chrome.mjs";
import loading from "./loading.test.mjs";
import sample from "./sample.test.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sampleDir = path.join(root, "sample/FormHelper.Samples");
const dotnet = process.env.DOTNET || "dotnet";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startSample() {
  console.log("Building the sample...");
  const build = spawnSync(dotnet, ["build", sampleDir, "-c", "Release", "-nologo", "-v", "q", "-nodeReuse:false"], { stdio: "inherit" });
  if (build.status !== 0) {
    throw new Error("The sample did not build.");
  }

  const bin = path.join(sampleDir, "bin/Release");
  const framework = readdirSync(bin).sort().pop();
  const base = `http://127.0.0.1:${await freePort()}`;

  // Run from the project folder so views and wwwroot are found.
  const app = spawn(dotnet, [path.join(bin, framework, "FormHelper.Samples.dll"), "--urls", base], {
    cwd: sampleDir,
    stdio: ["ignore", "ignore", "inherit"]
  });

  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch(base)).ok) {
        return { base, stop: () => app.kill() };
      }
    } catch {
      await sleep(200);
    }
  }

  app.kill();
  throw new Error("The sample did not start.");
}

const results = [];

function check(name, condition, detail) {
  results.push(!!condition);
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${condition ? "" : "  -> " + JSON.stringify(detail)}`);
}

const sampleApp = process.env.BASE ? { base: process.env.BASE.replace(/\/$/, ""), stop() {} } : await startSample();
const browser = await launch();
let crashed = false;

try {
  for (const suite of [sample, loading]) {
    await suite(browser, sampleApp.base, check);
  }
} catch (error) {
  crashed = true;
  console.error(error);
} finally {
  // The antiforgery test posts an invalid token on purpose; Chrome logs the 400 response.
  const expected = [/Failed to load resource: .* 400 .*\/Product$/];
  const errors = browser.errors().filter((e) => !expected.some((pattern) => pattern.test(e.trim())));
  check("no errors in the browser console", errors.length === 0, errors);

  await browser.close();
  sampleApp.stop();
}

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed > 0 || crashed ? 1 : 0);
