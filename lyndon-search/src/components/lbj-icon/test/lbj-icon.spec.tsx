import { newSpecPage } from '@stencil/core/testing';
import { LbjIcon } from '../lbj-icon';

describe('lbj-icon', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [LbjIcon],
      html: `<lbj-icon background="default" variant="default"></lbj-icon>`,
    });
    expect(page.root).toEqualHtml(`
    <lbj-icon background="default" variant="default">
      <mock:shadow-root>
        <span class="icon-current icon-full svg-icon">
          <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M31.756 9.4c.183-.267.503-.4.824-.4.32 0 .64.133.869.4l14.14 13.733c.274.223.411.49.411.845s-.137.622-.412.844L33.45 38.6c-.183.267-.503.4-.87.4-.365 0-.64-.133-.823-.4l-2.15-2c-.275-.267-.413-.578-.413-.933 0-.356.138-.623.412-.845L38.3 26.69H1.281c-.366 0-.64-.133-.915-.356C.092 26.111 0 25.8 0 25.444v-2.888c0-.356.137-.623.366-.89.229-.266.55-.355.915-.355H38.3l-8.694-8.133c-.274-.222-.412-.49-.412-.845s.138-.666.412-.933l2.151-2z"></path>
          </svg>
        </span>
      </mock:shadow-root>
    </lbj-icon>
    `);
  });
});
