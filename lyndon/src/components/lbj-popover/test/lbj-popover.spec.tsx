import { newSpecPage } from '@stencil/core/testing';
import { LbjPopover } from '../lbj-popover';

describe('lbj-popover', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [LbjPopover],
      html: `<lbj-popover></lbj-popover>`,
    });
    expect(page.root).toEqualHtml(`
      <lbj-popover btn_variant="primary" class="popover-closed">
        <mock:shadow-root>
          <lbj-button aria-controls="popoverContent" aria-expanded="false" case="none" variant="primary">
            <span id="popoverTitle">
              Trigger
            </span>
          </lbj-button>
        </mock:shadow-root>
      </lbj-popover>
    `);
  });
});
