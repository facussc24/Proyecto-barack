# Proyecto-barack

This project displays a hierarchical product table built with plain HTML, CSS and JavaScript.

## Launching the site

Because some browsers block local file reads, it is recommended to serve the files from a local web server. If Python is installed you can run:

```bash
python3 -m http.server
```

Then open [http://localhost:8000/index.html](http://localhost:8000/index.html) in a modern browser. From there you can navigate to the product synopsis page.

## Features

- **Column toggles** – checkboxes let you hide or show specific table columns.
- **Filtering** – search for text and control which hierarchy levels are visible.
- **Expand/Collapse** – the tree of products can be expanded node by node or all at once.
- **Automatic refresh** – `sinoptico.csv` is reloaded every 30 seconds so changes appear automatically.
- **Excel export** – visible rows can be exported to `sinoptico.xlsx`.

## Dependencies and browser requirements

The page loads [PapaParse](https://www.papaparse.com/) and [SheetJS](https://sheetjs.com/) from CDNs. A browser with ES6 support (such as recent Chrome, Firefox or Edge) is required.

## Node testing

Install dev dependencies once with `npm install` and then run:

```bash
node test-maestro.js
```

This sets up a JSDOM environment so `maestro.js` can execute under Node.


## License

This project is licensed under the [MIT License](LICENSE).

