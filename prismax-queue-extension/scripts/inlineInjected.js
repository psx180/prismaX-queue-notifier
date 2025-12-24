const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const contentScriptPath = path.join(distDir, "contentScript.js");
// We can read from src or dist; src is simpler since it's not minified.
const injectedSourcePath = path.join(__dirname, "..", "src", "injected.js");

const MARKER = "// __INJECTED_WS_PATCH__";

// Read injected.js source
const injectedCode = fs.readFileSync(injectedSourcePath, "utf8");

// Wrap it in an IIFE so it behaves like before
const wrappedCode = `(function () {\n${injectedCode}\n})();`;

// Escape as a JS string literal
const injectedStringLiteral = JSON.stringify(wrappedCode);

// Read compiled contentScript.js
let contentScript = fs.readFileSync(contentScriptPath, "utf8");

if (!contentScript.includes(MARKER)) {
    console.error("inlineInjected.js: marker not found in contentScript.js");
    process.exit(1);
}

// Replacement code that creates an inline <script> with our patch
const replacement = `
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.textContent = ${injectedStringLiteral};
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    csLog("Inline WebSocket patch injected from injected.js");
`;

// Replace marker with real code
contentScript = contentScript.replace(MARKER, replacement.trim());

// Write back modified contentScript.js
fs.writeFileSync(contentScriptPath, contentScript, "utf8");
console.log("inlineInjected.js: injected WebSocket patch into contentScript.js");