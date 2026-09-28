import { newSpecPage } from '@stencil/core/testing';
import { LbjPersonCard } from '../lbj-person-card';

describe('lbj-person-card', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [LbjPersonCard],
      html: `<lbj-person-card></lbj-person-card>`,
    });
    expect(page.root).toEqualHtml(`
      <lbj-person-card>
        <mock:shadow-root>
          <slot name="image"></slot>
          <p class="font-bold paragraph"></p>
        </mock:shadow-root>
      </lbj-person-card>
    `);
  });
});
