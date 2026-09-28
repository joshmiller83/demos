/**
 * Preset gallery and bring-your-own-CSV panel for the <lbj-mini-catalog> demo.
 *
 * The component reads its CSV once, in componentDidLoad, and keeps facet state
 * internally, so every preset or CSV change mounts a fresh element.
 */
(function () {
  const CSV_DIR = '/lyndon/demo/mini-catalog/csv/';
  const DEFAULT_NOT_FACET = 'title;url;description;eyebrow;date;image';

  const PRESETS = [
    {
      id: 'publications',
      label: 'Publications library',
      csv: 'publications.csv',
      blurb:
        'The default layout. Every column not in <code>not_facet</code> becomes a filter. <code>authors</code> and <code>tags</code> combine with OR (<code>multi_facet_tags_or</code>) and everything else with AND. Search is fuzzy (Fuse.js) and highlights matches, so try <em>housng</em>. Author and tag chips open bios from a second CSV (<code>csv_explainer</code>). The icons at the top right switch to a table (<code>rendering_mode_set="lede;table"</code>).',
      attrs: {
        headline: 'Publications library',
        csv_explainer: CSV_DIR + 'explainers.csv',
        rendering_mode_set: 'lede;table',
        columns: '3',
        pagination: '6',
        show_description: 'true',
        not_facet: 'title;url;description;date',
        eyebrow_key: 'type',
        multi_facet_tags_or: 'authors;tags',
        explainer_columns: 'authors;tags',
        fulltext_include: 'title;description;authors;tags',
        table_columns_includes: 'title;type;date;authors',
        table_columns_widths: '45;15;15;25',
        table_columns_alignments: 'left;left;left;left',
        table_columns_vertical_alignments: 'top;top;top;top',
        blank_target: 'false',
      },
    },
    {
      id: 'data-catalog',
      label: 'Data catalog table',
      csv: 'data-catalog.csv',
      blurb:
        'Starts in table mode (<code>rendering_mode_current="table"</code>). The columns come from <code>table_columns_includes</code> and their widths from <code>table_columns_widths</code>. <code>title_columns="title;geography"</code> joins two CSV columns into each title. <code>description_below_title</code> tucks the summary under it, and <code>toggle_top_pagination</code> repeats paging above the table.',
      attrs: {
        headline: 'Data catalog',
        rendering_mode_set: 'table;lede',
        rendering_mode_current: 'table',
        title_columns: 'title;geography',
        title_columns_separator: ' — ',
        not_facet: 'title;geography;url;description;date',
        eyebrow_key: 'topic',
        mini_tags_exclude: 'topic',
        fulltext_include: 'title;geography;description;source',
        table_columns_includes: 'title;source;format;date',
        table_columns_widths: '40;30;15;15',
        table_columns_alignments: 'left;left;left;left',
        table_columns_vertical_alignments: 'top;top;top;top',
        description_below_title: 'true',
        toggle_top_pagination: 'true',
        pagination: '8',
        blank_target: 'false',
      },
    },
    {
      id: 'team',
      label: 'Team directory',
      csv: 'team.csv',
      blurb:
        'The same component renders people cards (<code>rendering_mode_set="person;table"</code>). Initials come from a column (<code>person_initials</code>) when there is no photo. <code>filter_types</code> turns “team” into checkboxes and “location” into a dropdown.',
      attrs: {
        headline: 'Team directory',
        rendering_mode_set: 'person;table',
        columns: '4',
        pagination: '8',
        person_initials: 'initials',
        not_facet: 'title;url;description;initials',
        filter_types: 'team=type:checkbox;location=type:dropdown',
        show_description: 'true',
        fulltext_include: 'title;description;team',
        table_columns_includes: 'title;description;team;location',
        table_columns_widths: '30;30;20;20',
        table_columns_alignments: 'left;left;left;left',
        table_columns_vertical_alignments: 'top;top;top;top',
        blank_target: 'false',
      },
    },
    {
      id: 'resources',
      label: 'Resource cards',
      csv: 'resources.csv',
      blurb:
        'Card mode with images. The <code>image</code> column holds <code>src;alt text</code>, which <code>image_alt_support</code> splits apart, and <code>image_url_columns</code> links each image. <code>columns</code> sets the grid width.',
      attrs: {
        headline: 'Resource cards',
        rendering_mode_set: 'card;lede',
        rendering_mode_current: 'card',
        columns: '3',
        pagination: '6',
        image_columns: 'image',
        image_url_columns: 'url',
        not_facet: 'title;url;description;image',
        eyebrow_key: 'type',
        show_description: 'true',
        fulltext_include: 'title;description;topic',
        fulltext_highlight: 'false',
        blank_target: 'false',
      },
    },
    {
      id: 'labels',
      label: 'Custom labels',
      csv: 'publications.csv',
      blurb:
        'Every piece of UI text is an attribute, so editors could adapt the catalog without code: <code>facet_prepend</code>, <code>filter_label</code>, <code>reset_button</code>, <code>results_count</code>, <code>no_results</code> and <code>search_button</code>. Paging buttons can be icon-only (<code>next_button=""</code>) with their own icons and variant. <code>fulltext_threshold="0.2"</code> makes search stricter.',
      attrs: {
        headline: 'Browse the archive',
        headline_variation: 'heading-3',
        rendering_mode_set: 'lede',
        toggle_rendering: 'false',
        columns: '2',
        pagination: '4',
        not_facet: 'title;url;description;date',
        eyebrow_key: 'type',
        facet_prepend: 'Narrow by',
        filter_label: 'Refine',
        reset_button: 'Start over',
        results_count: 'matching items',
        no_results: 'Nothing matches that. Try fewer filters.',
        search_button: 'Search the archive',
        fulltext_threshold: '0.2',
        next_button: '',
        prev_button: '',
        next_icon: 'arrow-right',
        prev_icon: 'arrow-back',
        pagination_btn_variant: 'primary',
        blank_target: 'false',
      },
    },
  ];

  const $ = id => document.getElementById(id);
  let current = PRESETS[0];
  let blobUrl;

  const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const markupFor = attrs =>
    '<lbj-mini-catalog\n' +
    Object.entries(attrs)
      .map(([name, value]) => `  ${name}="${escapeHtml(value)}"`)
      .join('\n') +
    '\n></lbj-mini-catalog>';

  const mount = csvUrl => {
    const attrs = { csv: csvUrl, ...current.attrs };
    const element = document.createElement('lbj-mini-catalog');
    Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value));
    $('catalog').replaceChildren(element);
    $('markup').textContent = markupFor(attrs);
  };

  const loadCsvText = () =>
    fetch(CSV_DIR + current.csv)
      .then(response => response.text())
      .then(text => {
        $('csv-text').value = text;
      });

  const selectPreset = (preset, updateHash) => {
    current = preset;
    document.querySelectorAll('#presets button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === preset.id)));
    $('preset-blurb').innerHTML = preset.blurb;
    $('csv-link').href = CSV_DIR + preset.csv;
    $('csv-link').textContent = preset.csv;
    $('byo-status').textContent = '';
    if (updateHash) {
      history.replaceState(null, '', preset.id === PRESETS[0].id ? location.pathname : `#${preset.id}`);
    }
    mount(CSV_DIR + preset.csv);
    loadCsvText();
  };

  const status = (message, isError) => {
    $('byo-status').textContent = message;
    $('byo-status').classList.toggle('is-error', Boolean(isError));
  };

  const renderOwnCsv = () => {
    const result = window.prepareCsv($('csv-text').value, {
      Papa: window.Papa,
      sanitize: html => window.DOMPurify.sanitize(html),
      notFacet: (current.attrs.not_facet || DEFAULT_NOT_FACET).split(';'),
      titleColumns: (current.attrs.title_columns || 'title').split(';'),
    });
    if (!result.ok) {
      status(result.error, true);
      return;
    }
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    blobUrl = URL.createObjectURL(new Blob([result.csv], { type: 'text/csv' }));
    mount(blobUrl);
    const notes = [`Rendered ${result.rowCount} rows with the “${current.label}” settings.`, `Filters: ${result.facets.join(', ') || 'none'}.`];
    if (result.extraFieldRows) {
      notes.push(`${result.extraFieldRows} row(s) had more fields than the header; extras were dropped.`);
    }
    status(notes.join(' '), false);
    $('catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const readFile = event => {
    const [file] = event.target.files;
    if (!file) {
      return;
    }
    file.text().then(text => {
      $('csv-text').value = text;
      renderOwnCsv();
    });
  };

  const downloadCsv = () => {
    const url = URL.createObjectURL(new Blob([$('csv-text').value], { type: 'text/csv' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: current.csv });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  document.addEventListener('DOMContentLoaded', () => {
    PRESETS.forEach(preset => {
      const button = Object.assign(document.createElement('button'), { type: 'button', className: 'preset', textContent: preset.label });
      button.dataset.preset = preset.id;
      button.addEventListener('click', () => selectPreset(preset, true));
      $('presets').append(button);
    });
    $('byo-render').addEventListener('click', renderOwnCsv);
    $('byo-reset').addEventListener('click', () => selectPreset(current, false));
    $('byo-download').addEventListener('click', downloadCsv);
    $('byo-file').addEventListener('change', readFile);

    const fromHash = () => PRESETS.find(preset => `#${preset.id}` === location.hash);
    window.addEventListener('hashchange', () => fromHash() && selectPreset(fromHash(), false));
    selectPreset(fromHash() || PRESETS[0], false);
  });
})();
