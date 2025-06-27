# Electron build notes

The desktop version of Proyecto Barack uses Electron to bundle a browser window with a small backend server. The current setup relies on **CommonJS** modules in Node.js.

- `package.json` declares `"type": "commonjs"` so `require()` works in the entry files.
- The main processes (`main.js`, `backend.js`) are regular `.js` files. Using `.mjs` or `.cjs` would trigger `[ERR_REQUIRE_ESM]` during the Electron build.

If you ever need to migrate to ESM modules:

1. Rename the entry points to use the `.cjs` extension or set `"type": "module"` in `package.json`.
2. Update all `require()` calls to `import` statements.
3. Adjust Electron's preload scripts and bundler configuration accordingly.

For now keep `"type": "commonjs"` and `.js` extensions to ensure the desktop app starts without module errors.

If you need to run Electron as the `root` user (for example inside a container
without a regular user account), pass the `--no-sandbox` flag when starting the
application:

```bash
npm start -- --no-sandbox
```

The `package.json` in this repository already includes this argument so the
development build works even when executed as root.

## Building the Windows executable

1. Install dependencies if they are not already present:

   ```bash
   npm install
   ```

2. Create the installer with Electron Forge:

   ```bash
   npm run make
   ```

   The generated `.exe` resides under `out/make`. Double click it to launch
   Proyecto Barack.

## Sharing the database across installations

The program stores all information inside the `datos` folder located next to the
executable. This directory contains a single `base_de_datos.sqlite` file.

To synchronize several computers, create a shared network folder and replace the
local `datos` directory with a symbolic link pointing to that path. On Windows
use:

```cmd
mklink /D datos \\servidor\ruta\datos
```

Every instance will then read and write to the same `base_de_datos.sqlite` so
changes made on one computer propagate automatically to the rest.

