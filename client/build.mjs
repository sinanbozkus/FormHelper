// Builds the embedded client assets:
//   Scripts/formhelper(.min).js         core, no dependencies
//   Scripts/formhelper.bundle(.min).js  jQuery Validation + Unobtrusive (skipped when already on the page) + core
//   Styles/formhelper(.min).css
// The outputs are committed, so building the .NET solution never needs Node.
// `node build.mjs --check` fails when the committed outputs are out of date (used by CI).

import { build, transform } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.join(root, "../src/FormHelper/Scripts");
const stylesDir = path.join(root, "../src/FormHelper/Styles");
const check = process.argv.includes("--check");

const props = await readFile(path.join(root, "../src/Directory.Build.props"), "utf8");
const version = props.match(/<Version>(.+)<\/Version>/)[1];
const banner = `/*! FormHelper v${version} | MIT License | https://github.com/sinanbozkus/FormHelper */\n`;

async function bundleCore(minify) {
  const result = await build({
    entryPoints: [path.join(root, "src/index.js")],
    bundle: true,
    format: "iife",
    target: "es2017",
    minify,
    write: false,
    legalComments: "none",
    define: { __VERSION__: JSON.stringify(version) }
  });
  return result.outputFiles[0].text;
}

// The vendor libraries are UMD modules. `define` and `module` are shadowed so they always attach to the global
// jQuery (a page with RequireJS would otherwise get an anonymous define() error).
async function guardedVendor() {
  const validate = await readFile(path.join(root, "vendor/jquery.validate.js"), "utf8");
  const unobtrusive = await readFile(path.join(root, "vendor/jquery.validate.unobtrusive.js"), "utf8");

  return `(function (define, module) {
var jQuery = window.jQuery;
if (!jQuery) {
  console.warn("FormHelper: jQuery was not found, so jQuery Validation in formhelper.bundle.js was skipped. Load jQuery before formhelper.bundle.js, or use formhelper.js.");
  return;
}
// jQuery 4 removed $.parseJSON, which Unobtrusive 4.0.0 still calls. It was JSON.parse.
if (!jQuery.parseJSON) {
  jQuery.parseJSON = JSON.parse;
}
// Skipped when the page already loads them (e.g. _ValidationScriptsPartial), so they are never loaded twice.
if (!jQuery.validator) {
${validate}
}
if (!jQuery.validator.unobtrusive) {
${unobtrusive}
}
})();
`;
}

const core = await bundleCore(false);
const coreMin = await bundleCore(true);
const vendor = await guardedVendor();
const vendorMin = (await transform(vendor, { minify: true, target: "es2017", legalComments: "inline" })).code;

const css = await readFile(path.join(root, "src/formhelper.css"), "utf8");
const cssMin = (await transform(css, { loader: "css", minify: true })).code;

const outputs = {
  [path.join(scriptsDir, "formhelper.js")]: banner + core,
  [path.join(scriptsDir, "formhelper.min.js")]: banner + coreMin,
  [path.join(scriptsDir, "formhelper.bundle.js")]: banner + vendor + core,
  [path.join(scriptsDir, "formhelper.bundle.min.js")]: banner + vendorMin + coreMin,
  [path.join(stylesDir, "formhelper.css")]: banner + css,
  [path.join(stylesDir, "formhelper.min.css")]: banner + cssMin
};

let outdated = 0;

for (const [file, content] of Object.entries(outputs)) {
  const name = path.relative(path.join(root, ".."), file);

  if (check) {
    const existing = await readFile(file, "utf8").catch(() => "");
    if (existing !== content) {
      console.error(`out of date: ${name}`);
      outdated++;
    }
  } else {
    await writeFile(file, content);
    console.log(`${name} (${(Buffer.byteLength(content) / 1024).toFixed(1)} KB)`);
  }
}

if (outdated > 0) {
  console.error("Run `npm run build` in client/ and commit the outputs.");
  process.exit(1);
}
