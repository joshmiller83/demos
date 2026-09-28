import { newSpecPage } from '@stencil/core/testing';
import { LbjCollapse } from '../lbj-collapse';

describe('lbj-collapse', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [LbjCollapse],
      html: `<lbj-collapse details-id="test-123"></lbj-collapse>`,
    });
    expect(page.root).toEqualHtml(`
      <lbj-collapse class="collapse collapse--default" variant="default" details-id="test-123">
        <mock:shadow-root>
          <details class="details details--default" id="test-123">
            <slot name="content"></slot>
          </details>
        </mock:shadow-root>
      </lbj-collapse>
    `);
  });
});
