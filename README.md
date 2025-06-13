# Proyecto-barack

This project displays a hierarchical product table built with plain HTML, CSS and JavaScript.

## Quick start

Run a simple web server from the project folder and visit the site from
`http://localhost`:

```bash
python3 -m http.server
```

Open http://localhost:8000/index.html in a modern browser. Opening the HTML
files directly (for example using the `file://` protocol) disables several
features because the pages rely on `localStorage` and other browser APIs that
only work over HTTP.

## Launching the site

Because some browsers block local file reads, serve the folder from any static web server. For quick testing you can run:

```bash
python3 -m http.server
```

Open http://localhost:8000/index.html in a modern browser. All data, including the AMFE tables, is kept in your browser's localStorage.

All data—including the sinóptico—is stored only in your browser and will not sync across devices, but open tabs share updates through a BroadcastChannel.

Previous versions allowed saving JSON files directly when running the page under Node or Electron. That capability has been removed; the site now reads and writes exclusively through `localStorage`.

## GitHub Pages

To host the page publicly you can enable **GitHub Pages**:

1. Open the repository on GitHub and select **Settings**.
2. In the **Pages** section choose the `main` branch and `/` folder, then save.
3. After a minute or so the site will be available at
   `https://<user>.github.io/<repo>/`.

`localStorage` is tied to each domain. Data saved while using
`http://localhost` will not appear when visiting the GitHub Pages URL and
vice versa.

To inspect or clear stored data open your browser's developer tools and
locate the **Application** or **Storage** tab. Select the site's entry under
**Local Storage** to view the key/value pairs or delete them (you can also run
`localStorage.clear()` from the console).

## Login and user accounts

Use the **Log in** link or open `login.html` directly to access the sign‑in page. The project includes four default accounts: **PAULO**, **LEO**, **FACUNDO** and **PABLO**, all with password `1234`. After logging in an admin panel becomes visible where you can create new users or update existing passwords. A dedicated management page is also available at `usuarios.html` for administrators.
If the page detects `sessionStorage.isAdmin` is already set to `true`, it skips the form and redirects straight to `index.html`.

Account information is now stored as SHA‑256 hashes combined with a per‑user salt in the browser's `localStorage`. Tick **Recordarme** on the login form to keep the session between visits. Clear the `users` entry to reset all accounts.

Editing the master list and the sinóptico now requires being logged in.

## Using `listado_maestro.html`

The **master document list** lets you organise engineering documents by category. Open `listado_maestro.html` in your browser and click **Editar** to toggle edit mode. You must be logged in to modify the table. While in edit mode you can add new rows or change existing numbers and details.

The list is stored solely in your browser's `localStorage`.

## Using `amfe_proceso_ultra.html`

The **AMFE de Proceso Ultraligero** editor works entirely offline. Open
`amfe_proceso_ultra.html` in your browser to capture process failures and
actions. It relies only on the scripts bundled in this repository, so there are
no external dependencies. All header fields and the list of processes persist in
`localStorage`. Pressing **Guardar** attempts to POST the JSON to `/api/amfe`.
If that endpoint is missing the page still saves to `localStorage` and shows a
warning that the server could not be reached.

## Using the sinóptico editor

Open `sinoptico.html` and click **Editar** to modify the hierarchy. Rows remain
visible while editing even with an empty search box, so you can toggle the level
checkboxes to quickly hide or show sections.

## Using `viewer_lite.html`

`viewer_lite.html` displays the product hierarchy without loading optional
libraries such as Fuse.js or SheetJS. The page only includes the core scripts
(`styles.css`, `renderer.js`, `sha256.min.js`, `auth.js` and
`file-warning.js`) and a minimal navigation bar that links back to the home
page. It is intended as a lightweight viewer for quick look-ups.

## Features

- **Column toggles** – checkboxes let you hide or show specific table columns.
- **Filtering** – search for text and control which hierarchy levels are visible.
- **Expand/Collapse** – the tree of products can be expanded node by node or all at once.
- **Manual refresh** – click the **Refrescar** button in `sinoptico.html` to reload data on demand.
- **Editing modes** – once logged in you can edit the master list and the sinóptico using their respective **Editar** buttons. The product view is maintained through the interface at `admin_menu.html`.
- **Excel export** – visible rows can be saved as `sinoptico.xlsx`. The file
  downloads to your browser's default folder.
- **JSON export/import** – los botones están en la página de inicio y solo los administradores pueden usarlos. Permiten guardar la jerarquía como `.json` o cargar un archivo previamente exportado.
- **Dynamic categories** – the master list starts empty and new document sections appear automatically when items are added.
- **Client grouping** – rows with a value in the `Cliente` column are grouped under that client in the product tree.
- **Smooth animations** – buttons and rows fade and scale for a more polished experience.
- **Insumo lookup** – the insumos table includes a search box with fuzzy matching.
- **Cross-linking** – clicking an insumo in the sinóptico opens the list filtered to that entry.
- **Insumo editing** – administrators can agregar, modificar o eliminar insumos desde `insumos.html`.
- **AMFE persistence** – the AMFE pages store their data in `localStorage`.
- **Data change event** – pages dispatch a `sinoptico-data-changed` event after
  updating the product tree so other modules can refresh their views.
- **Cross-tab sync** – modifying the hierarchy in one tab refreshes any other open sinóptico pages via the BroadcastChannel API.
Pages communicate via a BroadcastChannel so each tab reloads the latest data whenever another one saves changes.

## Listening for data changes

Whenever `SinopticoEditor.addNode`, `updateNode` or `deleteSubtree` modifies the
hierarchy it stores the updated array and dispatches the
`sinoptico-data-changed` event. Scripts can listen for this event on
`document` and call `SinopticoEditor.getNodes()` to refresh their UI.

## Dependencies and browser requirements

The page loads [SheetJS](https://sheetjs.com/) and [Fuse.js](https://fusejs.io/) from CDNs. A browser with ES6 support (such as recent Chrome, Firefox or Edge) is required.

## Instalación y pruebas

Instala las dependencias necesarias y ejecuta la suite de pruebas con:

```bash
scripts/setup.sh
npm test
```

## Node testing

Running the project in a browser is enough to use the page. Optionally you can run automated tests that execute the scripts under Node using JSDOM. The tests rely on `jsdom-global`, `jsdom` and `fuse.js`. **Execute `scripts/setup.sh` before running the tests to install these dependencies**. The setup script will also run automatically thanks to the `pretest` step defined in `package.json`.

```bash
scripts/setup.sh
```

After the dependencies are installed, run:

```bash
npm test
```

This creates a small DOM environment so the scripts can be executed without a real browser. The tests also verify that the insumos editor persists new items.

## Fuzzy search flow

 `listado_maestro.html`, `sinoptico.html` and now `insumos.html` load [Fuse.js](https://fusejs.io/) from a CDN. In the master list a drop-down of matching documents appears while you type; picking one stores the selection in `sessionStorage`, highlights the chosen row and shows the filter banner without navigating away. The product view also leverages Fuse.js for its filter box: multiple keywords separated by spaces or commas are accepted and the fuzzy results of each term are combined. The insumos page contains a simpler search box that filters the table in place. Suggestions no longer reload the table; clicking one simply highlights the corresponding row and scrolls it into view. If no row matches the stored selection a warning is shown. Removing the Fuse.js script tags disables these fuzzy searches.

## Troubleshooting

If editing pages doesn't work as expected:

1. Verify the site is being served over **HTTP**, not opened directly as local files.
2. Make sure you are logged in as an administrator before attempting to edit.
3. Open the browser console and ensure there are no script errors.
4. Check your browser's `localStorage` for entries such as `sinopticoData`.

If a CDN script fails to load you will see one of the following warnings:

- `Fuse.js no cargó – búsqueda deshabilitada`
- `SheetJS no cargó – exportar a Excel deshabilitado`

Ensure your browser can reach the CDN domains if these messages appear.

Local copies of these libraries are now bundled under `vendor/`.
If a CDN script fails to load the pages automatically fall back to the
corresponding local file, so the features remain available offline.

## License

This project is licensed under the [MIT License](LICENSE).
