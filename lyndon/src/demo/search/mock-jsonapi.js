/**
 * Stand-in for Drupal's jsonapi_search_api endpoint.
 *
 * In production, <lbj-simple-search> fetched /jsonapi/index/latest_work from a
 * Search API Solr index, with facets from jsonapi_search_api_facets and the
 * eyebrow/date shaping done by lyndon_sidekick's JsonApiOnResponse subscriber.
 * This file wraps window.fetch so the unmodified component can run on a static
 * host against sample data in latest-work.json.
 */
(function () {
  const INDEX_PATH = '/jsonapi/index/latest_work';
  const FACET_ID = 'content_type';
  const LATENCY_MS = 250;
  const DATA_URL = new URL('latest-work.json', document.currentScript.src).href;

  const realFetch = window.fetch.bind(window);
  let fixture;

  const loadFixture = () => {
    fixture = fixture || realFetch(DATA_URL).then(response => response.json());
    return fixture;
  };

  const matches = (value, wanted) => (Array.isArray(value) ? value.map(String).includes(wanted) : String(value) === wanted);

  const search = (params, { types, data }) => {
    const filters = {};
    let fulltext = '';
    params.forEach((value, key) => {
      const filter = key.match(/^filter\[(.+)\]$/);
      if (!filter) {
        return;
      }
      if (filter[1] === 'fulltext') {
        fulltext = value.trim().toLowerCase();
      } else {
        filters[filter[1]] = value;
      }
    });

    let rows = data.filter(row =>
      Object.entries(filters).every(([column, wanted]) => column === FACET_ID || matches(row.attributes[column], wanted)),
    );
    if (fulltext) {
      const words = fulltext.split(/\s+/);
      rows = rows.filter(row => {
        const haystack = `${row.attributes.title} ${row.attributes.eyebrow}`.toLowerCase();
        return words.every(word => haystack.includes(word));
      });
    }

    // OR-style facet: counts ignore the facet's own filter, so every content
    // type in the current result set stays selectable.
    const counts = {};
    rows.forEach(row => {
      const type = row.attributes[FACET_ID];
      counts[type] = (counts[type] || 0) + 1;
    });
    const activeFacet = filters[FACET_ID];
    if (activeFacet) {
      rows = rows.filter(row => row.attributes[FACET_ID] === activeFacet);
    }

    const offset = parseInt(params.get('page[offset]') || '0', 10);
    const limit = parseInt(params.get('page[limit]') || '50', 10);

    return {
      jsonapi: { version: '1.0' },
      data: rows.slice(offset, offset + limit),
      meta: {
        count: rows.length,
        facets: [
          {
            id: FACET_ID,
            label: 'Content type',
            terms: Object.keys(counts)
              .sort((a, b) => counts[b] - counts[a] || types[a].localeCompare(types[b]))
              .map(value => ({
                url: '',
                values: { value, label: types[value], count: counts[value], active: value === activeFacet },
              })),
          },
        ],
      },
    };
  };

  window.fetch = function (input, init) {
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
    if (!url.pathname.endsWith(INDEX_PATH)) {
      return realFetch(input, init);
    }
    return loadFixture()
      .then(fixtureData => new Promise(resolve => setTimeout(() => resolve(search(url.searchParams, fixtureData)), LATENCY_MS)))
      .then(
        body =>
          new Response(JSON.stringify(body), {
            status: 200,
            headers: { 'Content-Type': 'application/vnd.api+json' },
          }),
      );
  };
})();
