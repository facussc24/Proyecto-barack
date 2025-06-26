# Electron build notes

The desktop version of Proyecto Barack uses Electron to bundle a browser window with a small backend server. The current setup relies on **CommonJS** modules in Node.js.

- `package.json` declares `"type": "commonjs"` so `require()` works in the entry files.
- The main processes (`main.js`, `backend.js`) are regular `.js` files. Using `.mjs` or `.cjs` would trigger `[ERR_REQUIRE_ESM]` during the Electron build.

If you ever need to migrate to ESM modules:

1. Rename the entry points to use the `.cjs` extension or set `"type": "module"` in `package.json`.
2. Update all `require()` calls to `import` statements.
3. Adjust Electron's preload scripts and bundler configuration accordingly.

For now keep `"type": "commonjs"` and `.js` extensions to ensure the desktop app starts without module errors.

