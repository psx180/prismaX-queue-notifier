// scripts/build.js
const esbuild = require("esbuild");

esbuild.build({
    entryPoints: {
        background: "src/background.ts",
       // contentScript: "src/contentScript.ts",
        // add popup, options, etc. if you have them:
        // popup: "src/popup.ts",
        // options: "src/options.ts",
    },
    bundle: true,
    format: "esm",        // MV3 background service worker is an ES module
    outdir: "dist",
    sourcemap: true,
    target: "chrome110",  // or whatever you target
}).catch(() => process.exit(1));