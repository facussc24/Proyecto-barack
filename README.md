# Proyecto-barack

This project displays a hierarchical product table built with plain HTML, CSS and JavaScript.

## Launching the site

Because some browsers block local file reads, it is recommended to serve the files from a small local web server. If Python is installed you can run:

```bash
python3 -m http.server
```

Open [http://localhost:8000/index.html](http://localhost:8000/index.html) in a modern browser to access the main menu.

## Login and user accounts

Use the **Log in** link or open `login.html` directly to access the sign‑in page. The project includes four default accounts: **PAULO**, **LEO**, **FACUNDO** and **PABLO**, all with password `1234`. After logging in an admin panel becomes visible where you can create new users or update existing passwords.

Account information is stored in the browser's `localStorage` or in `no-borrar/users.json` when running under Node/Electron. Delete that file or clear the `users` entry from `localStorage` to reset all accounts.

Editing the master list and the sinóptico now requires being logged in.

## Using `listado_maestro.html`

The **master document list** lets you organise engineering documents by category. Open `listado_maestro.html` in your browser and click **Editar** to toggle edit mode. You must be logged in to modify the table. While in edit mode you can add new rows or change existing numbers and details.

The list is normally stored in your browser's `localStorage`. When running in an environment that exposes `window.require` (for example Electron), the table is also loaded from and saved to `no-borrar/no borrar - listado maestro.json`. This JSON file lives in the `no-borrar` folder alongside the generated Excel and CSV files, ensuring the master list persists between sessions.

## Features

- **Column toggles** – checkboxes let you hide or show specific table columns.
- **Filtering** – search for text and control which hierarchy levels are visible.
- **Expand/Collapse** – the tree of products can be expanded node by node or all at once.
- **Manual refresh** – click the **Refrescar** button in `sinoptico.html` to reload data on demand.
- **Editing modes** – once logged in you can edit the master list and the sinóptico using their respective **Editar** buttons. The product view is maintained through the interface at `sinoptico_edit.html`.
- **Excel export** – visible rows can be saved as `sinoptico.xlsx`. The file
  downloads to your browser's default folder.
- **Dynamic categories** – the master list starts empty and new document sections appear automatically when items are added.
- **Client grouping** – rows with a value in the `Cliente` column are grouped under that client in the product tree.
- **Smooth animations** – buttons and rows fade and scale for a more polished experience.

When running the app through Node/Electron the hierarchy is stored in `no-borrar/sinoptico.json`. Browsers fall back to `localStorage`.

## Dependencies and browser requirements

The page loads [SheetJS](https://sheetjs.com/) and [Fuse.js](https://fusejs.io/) from CDNs. A browser with ES6 support (such as recent Chrome, Firefox or Edge) is required.

## Node testing

Running the project in a browser is enough to use the page. Optionally you can run an automated test that executes `maestro.js` under Node using JSDOM. The tests rely on `jsdom-global`, `jsdom` and `fuse.js`, which `npm install` will download for you. Install the dev dependencies once with:

```bash
npm install
```

Then run:

```bash
npm test
```

This creates a small DOM environment so the script can be executed without a real browser.

## Fuzzy search flow

 Both `listado_maestro.html` and `sinoptico.html` load [Fuse.js](https://fusejs.io/) from a CDN. In the master list a drop-down of matching documents appears while you type; picking one stores the selection in `sessionStorage`, highlights the chosen row and shows the filter banner without navigating away. The product view also leverages Fuse.js for its filter box: multiple keywords separated by spaces or commas are accepted and the fuzzy results of each term are combined. Suggestions no longer reload the table; clicking one simply highlights the corresponding row and scrolls it into view. If no row matches the stored selection a warning is shown. Removing the Fuse.js script tags disables these fuzzy searches.

## License

This project is licensed under the [MIT License](LICENSE).
