import { newSpecPage } from '@stencil/core/testing';
import { LbjTitle } from '../lbj-title';

describe('lbj-title', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [LbjTitle],
      html: `<lbj-title></lbj-title>`,
    });
    expect(page.root).toEqualHtml(`
      <lbj-title variant="paragraph">
        <mock:shadow-root>
          <div class="paragraph title">
              <slot></slot>
          </div>
        </mock:shadow-root>
      </lbj-title>
    `);
  });
});
