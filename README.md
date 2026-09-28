# Demos

Working front-end pieces from past projects, isolated so they run in a browser with no backend. Served at **https://demos.joshnliz.com**.

| Demo | What it is |
| --- | --- |
| [`lyndon-search/`](lyndon-search/) · [live](https://demos.joshnliz.com/lyndon-search/) | `<lbj-simple-search>`, a Stencil web component from Urban Institute's Lyndon design system for faceted, paginated search results, running against a mock Drupal Search API. |

## Running locally

```sh
npm install
npm run build   # builds every demo into _site/
npm run serve   # http://localhost:8080
```

To work on a single demo with live reload: `npm start -w lyndon-search`.

## Layout

- `site/` is the landing page and `CNAME`, copied into `_site/` as-is.
- Each demo is an npm workspace whose `build` script writes static files to `<demo>/www/<demo>/`.
- `scripts/assemble.mjs` builds each demo and copies its output to `_site/<demo>/`.
- `.github/workflows/deploy.yml` tests, builds and publishes `_site/` to GitHub Pages on every push to `main`.

**Adding a demo:** create a workspace folder with a `build` script and add it to `workspaces` in `package.json`, to the `demos` list in `scripts/assemble.mjs`, and to `site/index.html`.

## lyndon-search

The component source in `lyndon-search/src/components/` is copied from Lyndon (MIT). It includes `lbj-simple-search` plus the components it renders: `lbj-lede`, `lbj-link`, `lbj-title`, `lbj-button` and `lbj-icon`.

In production the component called `/jsonapi/index/latest_work`, a Search API Solr index exposed by `jsonapi_search_api` with facets from `jsonapi_search_api_facets`. A Drupal event subscriber reshaped each response. Here, `src/demo/mock-jsonapi.js` wraps `window.fetch` and answers the same JSON:API requests from `src/demo/latest-work.json`, so the component runs unchanged. It handles `filter[...]`, `filter[fulltext]`, `page[limit]`/`page[offset]` and `meta.facets`. The records are sample data written for the demo.

### Changes from the original Lyndon repo

- Only the urban theme is kept: `styleUrls` lists `urban` only, and other themes' CSS and Storybook stories are dropped.
- The build config (`stencil.config.ts`, `tailwind.config.js`, `tsconfig.json`) was reconstructed, because the originals weren't part of the portfolio snapshot. Tailwind 1.9 lacks `font-extralight`, so the config adds it.
- Global CSS is built by `scripts/build-global-css.mjs` with unused utilities purged, as Lyndon's own build script did. It isn't passed to Stencil's `globalStyle`, which would inline it into every shadow root.
- Urban's Adobe Typekit kit (Futura) is removed. Jost, a free Google Font, stands in for it.
- The Puppeteer e2e tests are removed. The spec tests are kept, and there's a new spec for `lbj-simple-search`.

The component logic in `lbj-simple-search.tsx` is unchanged, including two quirks. The search box hides when a query returns nothing (use Reset). The Search button is decorative, because the input's `change` event runs the search.
