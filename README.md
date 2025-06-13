# Proyecto-barack

This project displays a hierarchical product table built with plain HTML, CSS and JavaScript.

## Launching the site

Because some browsers block local file reads, serve the folder from any static web server. For quick testing you can run:

```bash
python3 -m http.server
```

Open http://localhost:8000/index.html in a modern browser. All data, including the AMFE tables, is kept in your browser's localStorage.

## Login and user accounts

Use the **Log in** link or open `login.html` directly to access the sign‑in page. The project includes four default accounts: **PAULO**, **LEO**, **FACUNDO** and **PABLO**, all with password `1234`. After logging in an admin panel becomes visible where you can create new users or update existing passwords.

Account information is stored in the browser's `localStorage`. Clear the `users` entry to reset all accounts.

Editing the master list and the sinóptico now requires being logged in.

## Using `listado_maestro.html`

The **master document list** lets you organise engineering documents by category. Open `listado_maestro.html` in your browser and click **Editar** to toggle edit mode. You must be logged in to modify the table. While in edit mode you can add new rows or change existing numbers and details.

The list is stored in your browser's `localStorage`; the no-borrar folder is no longer used.

## Using `amfe_proceso_mejorado.html`

Open `amfe_proceso_mejorado.html` in a browser to work with an enhanced process AMFE. Log in to add processes or failure modes and edit the tables inline. All data is kept in `localStorage`.

## Using `amfe_proceso_ultra.html`

`amfe_proceso_ultra.html` provides a trimmed-down AMFE editor focused on speed and simplicity. You can add new processes and failure modes directly in the browser and the information will persist in `localStorage`.


## Features

- **Column toggles** – checkboxes let you hide or show specific table columns.
- **Filtering** – search for text and control which hierarchy levels are visible.
- **Expand/Collapse** – the tree of products can be expanded node by node or all at once.
- **Manual refresh** – click the **Refrescar** button in `sinoptico.html` to reload data on demand.
- **Editing modes** – once logged in you can edit the master list and the sinóptico using their respective **Editar** buttons. The product view is maintained through the interface at `admin_menu.html`.
- **Excel export** – visible rows can be saved as `sinoptico.xlsx`. The file
  downloads to your browser's default folder.
- **Dynamic categories** – the master list starts empty and new document sections appear automatically when items are added.
- **Client grouping** – rows with a value in the `Cliente` column are grouped under that client in the product tree.
- **Smooth animations** – buttons and rows fade and scale for a more polished experience.
- **Insumo lookup** – the insumos table includes a search box with fuzzy matching.
- **Cross-linking** – clicking an insumo in the sinóptico opens the list filtered to that entry.
- **Insumo editing** – administrators can agregar, modificar o eliminar insumos desde `insumos.html`.
- **AMFE persistence** – the AMFE pages store their data in `localStorage`.
- **Improved process AMFE** – `amfe_proceso_mejorado.html` adds per-process sections with DataTable filtering and inline editing. Data is saved to `localStorage`.
- **Ultralight AMFE editor** – `amfe_proceso_ultra.html` offers a fast, simplified workflow that also persists entries in `localStorage`.
- **Data change event** – pages dispatch a `sinoptico-data-changed` event after
  updating the product tree so other modules can refresh their views.

The product hierarchy is stored in `localStorage`.

## Listening for data changes

Whenever `SinopticoEditor.addNode`, `updateNode` or `deleteSubtree` modifies the
hierarchy it stores the updated array and dispatches the
`sinoptico-data-changed` event. Scripts can listen for this event on
`document` and call `SinopticoEditor.getNodes()` to refresh their UI.

## Dependencies and browser requirements

The page loads [SheetJS](https://sheetjs.com/) and [Fuse.js](https://fusejs.io/) from CDNs. A browser with ES6 support (such as recent Chrome, Firefox or Edge) is required.

## Node testing

Running the project in a browser is enough to use the page. Optionally you can run automated tests that execute the scripts under Node using JSDOM. The tests rely on `jsdom-global`, `jsdom` and `fuse.js`. **Run `scripts/setup.sh` once before executing the tests to download these dependencies**:

```bash
scripts/setup.sh
```

Then run:

```bash
npm test
```

This creates a small DOM environment so the scripts can be executed without a real browser. The tests also verify that the insumos editor persists new items.

## Fuzzy search flow

 `listado_maestro.html`, `sinoptico.html` and now `insumos.html` load [Fuse.js](https://fusejs.io/) from a CDN. In the master list a drop-down of matching documents appears while you type; picking one stores the selection in `sessionStorage`, highlights the chosen row and shows the filter banner without navigating away. The product view also leverages Fuse.js for its filter box: multiple keywords separated by spaces or commas are accepted and the fuzzy results of each term are combined. The insumos page contains a simpler search box that filters the table in place. Suggestions no longer reload the table; clicking one simply highlights the corresponding row and scrolls it into view. If no row matches the stored selection a warning is shown. Removing the Fuse.js script tags disables these fuzzy searches.

## License

This project is licensed under the [MIT License](LICENSE).
