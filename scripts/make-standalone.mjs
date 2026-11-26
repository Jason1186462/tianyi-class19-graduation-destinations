import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
let html = await readFile(path.join(distDir, "index.html"), "utf8");

const scriptMatch = html.match(
  /<script\b[^>]*\bsrc="(\.\/assets\/[^"]+\.js)"[^>]*><\/script>/i,
);
const styleMatch = html.match(
  /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="(\.\/assets\/[^"]+\.css)"[^>]*>/i,
);

if (!scriptMatch || !styleMatch) {
  throw new Error("Built index.html does not contain the expected JavaScript and CSS assets.");
}

const [script, style, favicon, memoryImage] = await Promise.all([
  readFile(path.join(distDir, scriptMatch[1]), "utf8"),
  readFile(path.join(distDir, styleMatch[1]), "utf8"),
  readFile(path.join(distDir, "favicon.svg"), "utf8"),
  readFile(path.join(distDir, "memory-triptych.png")),
]);
const memoryImageDataUrl = `data:image/png;base64,${memoryImage.toString("base64")}`;
const standaloneScript = script
  .replaceAll("./memory-triptych.png", memoryImageDataUrl)
  .replaceAll("memory-triptych.png", memoryImageDataUrl);

html = html
  .replace(
    /<link rel="icon"[^>]*>/i,
    () =>
      `<link rel="icon" href="data:image/svg+xml;base64,${Buffer.from(favicon).toString("base64")}" />`,
  )
  .replace(
    styleMatch[0],
    () => `<style>${style.replaceAll("</style", "<\\/style")}</style>`,
  )
  .replace(
    scriptMatch[0],
    () =>
      `<script type="module">${standaloneScript.replaceAll("</script", "<\\/script")}</script>`,
  );

await writeFile(path.join(distDir, "standalone.html"), html, "utf8");
console.log("Standalone HTML generated: dist/standalone.html");
