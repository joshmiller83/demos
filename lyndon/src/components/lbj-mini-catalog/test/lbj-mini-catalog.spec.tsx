import { newSpecPage } from '@stencil/core/testing';
import { LbjMiniCatalog } from '../lbj-mini-catalog';

// Rows arrive pre-parsed through a global, the same path Drupal Views used via
// drupalSettings (toggle_csv_local + csv_global_var).
const rows = [
  { title: 'Housing costs', url: '#a', description: 'One', type: 'Report', authors: 'Ada Lin;Sam Okafor', date: '2024-01-01' },
  { title: 'Transit access', url: '#b', description: 'Two', type: 'Brief', authors: 'Ada Lin', date: '2024-02-01' },
  { title: 'Child care', url: '#c', description: 'Three', type: 'Report', authors: 'Priya Raman', date: '2024-03-01' },
];

describe('lbj-mini-catalog', () => {
  beforeEach(() => {
    (globalThis as any).demoData = { rows };
  });

  it('derives facets from columns and paginates rows', async () => {
    const page = await newSpecPage({
      components: [LbjMiniCatalog],
      html: `<lbj-mini-catalog toggle_csv_local="true" csv_global_var="demoData" csv="rows" pagination="2" not_facet="title;url;description;date"></lbj-mini-catalog>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    const shadow = page.root.shadowRoot;
    const facetLabels = Array.from(shadow.querySelectorAll('select')).map(select => select.querySelector('option').textContent.trim());
    expect(facetLabels).toEqual(expect.arrayContaining(['Filter by Type', 'Filter by Author']));

    const typeOptions = Array.from(shadow.querySelectorAll('select'))
      .find(select => select.querySelector('option').textContent.includes('Type'))
      .querySelectorAll('option');
    expect(Array.from(typeOptions).map(option => option.textContent.trim())).toEqual(['Filter by Type', 'Brief (1)', 'Report (2)']);

    expect(shadow.textContent).toContain('3 results found');
    expect(shadow.querySelectorAll('lbj-lede')).toHaveLength(2);
    expect(shadow.textContent.replace(/\s+/g, ' ')).toContain('1 of 2');
  });
});
