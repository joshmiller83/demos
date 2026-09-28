import { newSpecPage } from '@stencil/core/testing';
import { LbjSimpleSearch } from '../lbj-simple-search';

const jsonapiResponse = (count: number, limit: number) => ({
  data: Array.from({ length: Math.min(count, limit) }, (_, i) => ({
    attributes: { eyebrow: 'Brief', title: `Result ${i + 1}`, path: { alias: `/result-${i + 1}` }, field_display_date: 'June 1, 2024' },
  })),
  meta: {
    count: String(count),
    facets: [
      {
        id: 'content_type',
        terms: [
          { values: { value: 'brief', label: 'Brief', count: 10, active: false } },
          { values: { value: 'blog_post', label: 'Blog Post', count: 4, active: false } },
        ],
      },
    ],
  },
});

describe('lbj-simple-search', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ json: () => Promise.resolve(jsonapiResponse(14, 6)) });
    global.fetch = fetchMock;
  });

  it('builds the JSON:API query from its attributes', async () => {
    await newSpecPage({
      components: [LbjSimpleSearch],
      html: `<lbj-simple-search solrindex="/jsonapi/index/latest_work" filtercol="field_research_areas" filtercolval="5771" max="6"></lbj-simple-search>`,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/jsonapi/index/latest_work?filter[field_research_areas]=5771&page[limit]=6');
  });

  it('renders results, facets and page count', async () => {
    const page = await newSpecPage({
      components: [LbjSimpleSearch],
      html: `<lbj-simple-search headline="Latest" solrindex="/jsonapi/index/latest_work" max="6"></lbj-simple-search>`,
    });
    await page.waitForChanges();
    const shadow = page.root.shadowRoot;
    expect(shadow.querySelectorAll('lbj-lede')).toHaveLength(6);
    const options = Array.from(shadow.querySelectorAll('select#facet option')).map(o => o.textContent);
    expect(options).toEqual(['Filter by Content', 'Brief (10)', 'Blog Post (4)']);
    expect(shadow.querySelector('.pagination').textContent).toContain('1 of 3');
    expect(shadow.querySelector('lbj-button.next')).not.toBeNull();
    expect(shadow.querySelector('lbj-button.prev')).toBeNull();
  });
});
