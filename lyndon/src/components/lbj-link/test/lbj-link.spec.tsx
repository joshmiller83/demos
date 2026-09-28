import { newSpecPage } from '@stencil/core/testing';
import { LbjLink } from '../lbj-link';

describe('lbj-link', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [LbjLink],
      html: `<lbj-link></lbj-link>`,
    });
    expect(page.root).toEqualHtml(`
      <lbj-link dropdown="floating" variant="link">
        <mock:shadow-root>
          <a class="link">
            <slot></slot>
          </a>
        </mock:shadow-root>
      </lbj-link>
    `);
  });
});
