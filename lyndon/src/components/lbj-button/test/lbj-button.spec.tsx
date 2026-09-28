import '../../../global/mocks';
import { newSpecPage } from '@stencil/core/testing';
import { LbjButton } from '../lbj-button';

class TestLbjButton extends LbjButton {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getAssignedNodes(_slot: HTMLSlotElement): Node[] {
    // Return an array of mock nodes or an empty array to simulate slot content
    // Example: return [document.createTextNode('Mock content')];
    return [];
  }
}

describe('lbj-button', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [TestLbjButton],
      html: `<lbj-button></lbj-button>`,
    });

    expect(page.root).toEqualHtml(`
      <lbj-button size="md" variant="primary">
        <mock:shadow-root>
          <button class="button button--md button--primary icon-only">
            <span class="button__text">
              <slot></slot>
            </span>
          </button>
        </mock:shadow-root>
      </lbj-button>`);
  });

  it('renders as anchor with href', async () => {
    const page = await newSpecPage({
      components: [TestLbjButton],
      html: `<lbj-button href="/internal-link">Click me</lbj-button>`,
    });

    const anchor = page.root.shadowRoot.querySelector('a');
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('href')).toBe('/internal-link');
  });

  it('detects external links and sets target="_blank"', async () => {
    const page = await newSpecPage({
      components: [TestLbjButton],
      html: `<lbj-button href="https://external.com">External</lbj-button>`,
    });

    const anchor = page.root.shadowRoot.querySelector('a');
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.hasAttribute('external-link')).toBe(true);
  });

  it('does not set target for internal links', async () => {
    const page = await newSpecPage({
      components: [TestLbjButton],
      html: `<lbj-button href="/internal">Internal</lbj-button>`,
    });

    const anchor = page.root.shadowRoot.querySelector('a');
    expect(anchor.getAttribute('target')).toBeNull();
    expect(anchor.hasAttribute('external-link')).toBe(false);
  });

  it('respects explicit target prop over external link detection', async () => {
    const page = await newSpecPage({
      components: [TestLbjButton],
      html: `<lbj-button href="https://external.com" target="_self">External</lbj-button>`,
    });

    const anchor = page.root.shadowRoot.querySelector('a');
    expect(anchor.getAttribute('target')).toBe('_self');
    expect(anchor.hasAttribute('external-link')).toBe(false);
  });

  it('does not apply external link logic when target is provided', async () => {
    const page = await newSpecPage({
      components: [TestLbjButton],
      html: `<lbj-button href="https://external.com" target="_parent">External</lbj-button>`,
    });

    const anchor = page.root.shadowRoot.querySelector('a');
    expect(anchor.getAttribute('target')).toBe('_parent');
    expect(anchor.hasAttribute('external-link')).toBe(false);
  });

  it('handles relative URLs as internal links', async () => {
    const page = await newSpecPage({
      components: [TestLbjButton],
      html: `<lbj-button href="../relative/path">Relative</lbj-button>`,
    });

    const anchor = page.root.shadowRoot.querySelector('a');
    expect(anchor.getAttribute('target')).toBeNull();
    expect(anchor.hasAttribute('external-link')).toBe(false);
  });
});
