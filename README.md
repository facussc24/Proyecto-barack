# Proyecto-barack

This project displays a hierarchical product table built with plain HTML, CSS and JavaScript.

## Launching the site

Because some browsers block local file reads, it is recommended to serve the files from a small local web server. If Python is installed you can run:

```bash
python3 -m http.server
```

Open [http://localhost:8000/index.html](http://localhost:8000/index.html) in a modern browser to access the main menu.

## Using `listado_maestro.html`

The **master document list** lets you organise engineering documents by category. Open `listado_maestro.html` in your browser. Click **Editar** to enable edit mode and enter the administrator password defined in `config.js`. While in edit mode you can add new rows or change existing numbers and details.

## Features

- **Column toggles** – checkboxes let you hide or show specific table columns.
- **Filtering** – search for text and control which hierarchy levels are visible.
- **Expand/Collapse** – the tree of products can be expanded node by node or all at once.
- **Automatic refresh** – `sinoptico.csv` is reloaded every 30 seconds so changes appear automatically.
- **Excel export** – visible rows can be exported to `sinoptico.xlsx`.
- **Dynamic categories** – the master list starts empty and new document sections appear automatically when items are added.

## Dependencies and browser requirements

The page loads [PapaParse](https://www.papaparse.com/) and [SheetJS](https://sheetjs.com/) from CDNs. A browser with ES6 support (such as recent Chrome, Firefox or Edge) is required.

## Node testing

Running the project in a browser is enough to use the page. Optionally you can run an automated test that executes `maestro.js` under Node using JSDOM. Install the dev dependencies once with:

```bash
npm install
```

Then run:

```bash
npm test
```

This creates a small DOM environment so the script can be executed without a real browser.

## License

This project is licensed under the [MIT License](LICENSE).
