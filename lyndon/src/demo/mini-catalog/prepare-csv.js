/**
 * Cleans a visitor-supplied CSV before it is handed to <lbj-mini-catalog>.
 *
 * The component trusts its CSV: it renders cells with innerHTML, expects
 * lowercase headers, and throws on rows with more fields than the header. In
 * production the CSV came from editors; here it can come from anyone, so this
 * normalizes and sanitizes it, then re-serializes it so the component's own
 * fetch → PapaParse pipeline still does the rendering.
 *
 * Dependencies are injected so the same code runs in the page and in node tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.prepareCsv = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  return function prepareCsv(text, { Papa, sanitize, notFacet = [], titleColumns = ['title'] }) {
    const parsed = Papa.parse(text.trim(), {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: header => header.trim().toLowerCase(),
    });

    const fields = (parsed.meta.fields || []).filter(field => field !== '' && field !== '__parsed_extra');
    if (!fields.some(field => titleColumns.includes(field))) {
      return { ok: false, error: `No ${titleColumns.join(' / ')} column found. Columns seen: ${fields.join(', ') || 'none'}.` };
    }

    let extraFieldRows = 0;
    const rows = parsed.data.map(row => {
      if (row.__parsed_extra) {
        extraFieldRows++;
      }
      const clean = {};
      fields.forEach(field => {
        clean[field] = sanitize(String(row[field] ?? '').trim());
      });
      return clean;
    });

    const excluded = new Set([...notFacet, ...titleColumns]);
    return {
      ok: true,
      csv: Papa.unparse(rows, { columns: fields }),
      rowCount: rows.length,
      fields,
      facets: fields.filter(field => !excluded.has(field)),
      extraFieldRows,
      parseErrors: parsed.errors.filter(error => error.code !== 'TooManyFields').length,
    };
  };
});
