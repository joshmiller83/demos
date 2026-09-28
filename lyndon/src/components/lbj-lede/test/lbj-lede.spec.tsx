import { newSpecPage } from '@stencil/core/testing';
import { LbjLede } from '../lbj-lede';

describe('lbj-lede', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [LbjLede],
      html: `<lbj-lede></lbj-lede>`,
    });
    expect(page.root).toEqualHtml(`
      <lbj-lede>
        <mock:shadow-root>
          <slot name="headline">
            <div class="headline-container">
            <lbj-title variant="heading-6"></lbj-title>
            </div>
          </slot>
          <slot name="tags"></slot>
        </mock:shadow-root>
      </lbj-lede>
    `);
  });
});
