# Demos

Working front-end pieces from past projects, isolated so they run in a browser with no backend. Served at **https://demos.joshnliz.com**.

| Demo | What it is |
| --- | --- |
| [Mini catalog](https://demos.joshnliz.com/lyndon/mini-catalog/) | `<lbj-mini-catalog>` renders a CSV as a catalog you can search, filter and page through. Five presets, plus a bring-your-own-CSV panel. |
| [Search results](https://demos.joshnliz.com/lyndon/search/) | `<lbj-simple-search>` shows faceted, paginated results from a Drupal Search API index, here backed by a mocked JSON:API endpoint. |

## Running locally

```sh
npm install
npm test        # component specs + CSV pre-processor tests
npm run build   # builds every demo into _site/
npm run serve   # http://localhost:8080
```

To work on the Lyndon components with live reload, run `npm start -w lyndon`.

## Layout

- `site/` holds the landing page and `CNAME`, copied into `_site/` as-is.
- Each demo is an npm workspace whose `build` script writes static files to `<workspace>/www/<workspace>/`. `scripts/assemble.mjs` runs each build and copies the output to `_site/<workspace>/`.
- `.github/workflows/deploy.yml` tests, builds and publishes `_site/` to GitHub Pages on every push to `main`.

To add a demo, create a workspace with a `build` script, add it to `workspaces` in `package.json` and to the `demos` list in `scripts/assemble.mjs`, then link it from `site/index.html`.

## lyndon/

A single Stencil build of components copied from Urban Institute's [Lyndon](https://github.com/UI-Research/lyndon) library (MIT), urban theme only.

- `src/components/` holds `lbj-mini-catalog` and `lbj-simple-search` plus everything they render: `lbj-lede`, `lbj-link`, `lbj-title`, `lbj-button`, `lbj-icon`, `lbj-popover`, `lbj-card`, `lbj-person-card` and `lbj-collapse`.
- `src/pages/` holds the demo pages, served at `/lyndon/mini-catalog/` and `/lyndon/search/`.
- `src/demo/mini-catalog/`:
  - `csv/` holds the sample CSVs, all fictional.
  - `catalog.js` holds the presets and the bring-your-own-CSV panel.
  - `prepare-csv.js` normalizes and sanitizes a visitor's CSV before the component sees it.
- `src/demo/search/` holds a `window.fetch` mock of Drupal's `jsonapi_search_api` endpoint, plus its sample data.

### How the mini catalog worked in production

A Drupal Layout Builder block exposed the component's 64 attributes as form fields and wrote them onto the element. The CSV came from one of three places: an upload, a URL, or a Drupal View pushed into `drupalSettings` (`toggle_csv_local`). In the browser the component fetches the CSV and parses it with PapaParse. Every column not listed in `not_facet` becomes a filter, search is fuzzy (Fuse.js), and rows render as ledes, a table, cards or person cards.

### Changes from the original Lyndon repo

- Only the urban theme is kept: `styleUrls` lists `urban` only, and the other themes' CSS and Storybook stories are dropped.
- The build config (`stencil.config.ts`, `tailwind.config.js`, `tsconfig.json`) was reconstructed, because it wasn't part of the portfolio snapshot.
  - Tailwind 1.9 lacks `font-extralight`, so the config adds it.
  - Utilities are purged to the classes the components use.
  - PapaParse's Node-only `stream` import is stubbed instead of polyfilled.
- Global CSS is built by `scripts/build-global-css.mjs`, as Lyndon's own build did. It isn't passed to Stencil's `globalStyle`, which would inline it into every shadow root.
- Urban's Adobe Typekit kit (Futura) is removed. Jost, a free Google Font, stands in for it.
- The Puppeteer e2e tests are removed and the spec tests kept. New specs cover `lbj-simple-search` and `lbj-mini-catalog`.

### Known quirks of the original components (left as-is)

**`lbj-mini-catalog`**
- It reads its CSV once, in `componentDidLoad`, with no `@Watch`. The demo mounts a new element for every preset or CSV change.
- Cells are rendered with `innerHTML`. That was fine for editor-supplied CSVs, but visitor CSVs go through DOMPurify in `prepare-csv.js` first.
- The `window` resize listener isn't removed on disconnect.
- `render()` updates state, which triggers a Stencil dev warning.
- Fuzzy-match highlighting can land inside tag values.
- In card mode, a click anywhere on the card follows its link.
- The `label:` option in `filter_types` sets the wrong key.

**`lbj-simple-search`**
- The search box hides after a query that returns nothing; use Reset.
- The Search button is decorative: the input's `change` event runs the search.
