// scripts/build.js
const esbuild = require("esbuild");

esbuild.build({
    entryPoints: {
        background: "src/background.ts",
       // contentScript: "src/contentScript.ts",

         popup: "pages/popup.js",
         options: "pages/options.ts",
    },
    bundle: true,
    format: "esm",        // MV3 background service worker is an ES module
    outdir: "dist",
    sourcemap: true,
    target: "chrome110",  // or whatever you target
}).catch(() => process.exit(1));