import { newSpecPage } from '@stencil/core/testing';
import { LbjCard } from '../lbj-card';

describe('lbj-card', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [LbjCard],
      html: `<lbj-card></lbj-card>`,
    });
    expect(page.root).toEqualHtml(`
    <lbj-card dateposition="below" variant="grid">
      <mock:shadow-root>
      <div class="card">
          <slot name="image"></slot>
          <div class="card-content">
            <slot name="headline">
              <lbj-title variant="heading-5"></lbj-title>
            </slot>
            <slot name="body"></slot>
          </div>
      </div>
      </mock:shadow-root>
    </lbj-card>    `);
  });
});
