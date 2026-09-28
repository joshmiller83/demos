import { Component, Host, h, Prop, State, Element } from '@stencil/core';
import { ButtonVariants, IconName, Size } from '../../utils/enums';
import { ButtonVariant } from '../lbj-button/lbj-button-types';

@Component({
  tag: 'lbj-popover',
  styleUrl: 'lbj-popover.css',
  shadow: true,
})

/**
 * LbjPopover Component.
 *
 * This component creates a popover that can be triggered by a button or a link.
 * The popover can contain any content, and is hidden by default.
 * The events 'popoverOpened' and 'popoverClosed' are dispatched
 * when the popover is opened or closed and they are bubbled up for
 * other components to listen to. The LBJ Mini Catalog uses these events
 * to disable the table scrolling and re-enable the scrolling when closed.
 *
 * Attributes that are exposed include:
 * - btn_variant: ButtonVariant - the variant of the button that triggers the popover.
 * - btn_size: Size - the size of the button that triggers the popover.
 * - btn_icon: IconName - the icon to display on the button that triggers the popover.
 * - btn_iconleft: IconName - the icon to display on the left of the button text.
 * - btn_iconsize: Size - the size of the icon on the button.
 * - variant: string - the type of the popover trigger (button, link, mini_tag).
 * - popover_action_text: string - the text to display on the popover trigger.
 * - popover_close_iconsize: Size - the size of the close icon in the popover.
 * - renderMode: 'local' | 'global' - controls where the popover is rendered.
 *
 * Variants supported include:
 * - button: A button that triggers the popover.
 * - link: A link that triggers the popover.
 * - mini_tag: A mini tag that triggers the popover.
 *
 * Render modes:
 * - local (default): popover renders inside Shadow DOM (existing behaviour).
 * - global: popover is portalled into document.body so the backdrop covers the full viewport.
 *
 * Accessibility features include:
 * - Aria attributes are added to the popover trigger and the popover content.
 * - The popover content is displayed in a dialog with a backdrop.
 * - The popover can be closed by pressing the 'Escape' key.
 * - Custom events are dispatched when the popover is opened or closed.
 */
export class LbjPopover {
  // Add the lbj-button properties
  @Prop({ reflect: true }) btn_variant: ButtonVariant = ButtonVariants.BTN_PRIMARY;
  @Prop() btn_size: Size;
  @Prop() btn_icon: IconName;
  @Prop() btn_iconleft: IconName;
  @Prop() btn_iconsize: Size;

  // The popover properties.
  @Prop() variant = 'button';
  @Prop() popover_action_text = 'Trigger';
  @Prop() popover_close_iconsize = Size.MD;
  /** Controls where the popover dialog is rendered.
   *  'local'  – inside Shadow DOM (default, existing behaviour).
   *  'global' – portalled into document.body so the backdrop covers the full viewport.
   */
  @Prop() renderMode: 'local' | 'global' = 'local';

  // The popover state
  @State() popover_open = false;

  @Element() el: HTMLElement;

  private portalEl?: HTMLElement;
  private _slottedContent?: Element;
  private _slottedContentOriginalParent?: Node;

  connectedCallback() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.unmountPortal();
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.popover_open) {
      this.togglePopover();
    }
  };

  // Local mode rendering renders the popover content inside the Shadow DOM, controlled by the popover_open state.

  private renderPopoverContent() {
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="popoverTitle" aria-describedby="popoverContent">
        <div class="backdrop" onClick={() => this.togglePopover()}>
          <div class={`popover-content iconsize-${this.popover_close_iconsize}`} onClick={event => event.stopPropagation()}>
            <lbj-icon
              name={IconName.CLOSE}
              size={this.popover_close_iconsize}
              onClick={event => {
                event.stopPropagation();
                this.togglePopover();
              }}
              onKeyPress={event => {
                if (event.key === 'Enter') this.togglePopover();
              }}
              aria-label="Click to close."
              tabindex="0"
            ></lbj-icon>
            <div class="content-wrapper">
              <slot name="content"></slot>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Global mode rendering logic.

  private mountPortal() {
    this.injectGlobalStyles();

    // Wrapper – carries ARIA dialog role
    this.portalEl = document.createElement('div');
    this.portalEl.setAttribute('role', 'dialog');
    this.portalEl.setAttribute('aria-modal', 'true');
    this.portalEl.setAttribute('aria-labelledby', 'lbj-popover-title');
    this.portalEl.setAttribute('aria-describedby', 'lbj-popover-content');

    const backdrop = document.createElement('div');
    backdrop.className = 'lbj-popover-backdrop fixed flex items-center justify-center inset-0';
    backdrop.style.cssText = 'background: rgba(255,255,255,0.5); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); z-index: 999;';
    backdrop.addEventListener('click', () => this.togglePopover());

    // Content panel
    const contentPanel = document.createElement('div');
    contentPanel.className = `lbj-popover-content block relative bg-white border border-primary-b-400 p-8 rounded shadow-lg max-w-xl text-lg font-normal leading-normal normal-case text-gray-900 text-left overflow-y-auto iconsize-${this.popover_close_iconsize}`;
    contentPanel.style.cssText = 'z-index: 9999; max-height: 90vh;';
    contentPanel.addEventListener('click', (e: Event) => e.stopPropagation());

    // Close icon (lbj-icon is a registered custom element)
    const closeIcon = document.createElement('lbj-icon');
    closeIcon.setAttribute('name', IconName.CLOSE);
    closeIcon.setAttribute('size', this.popover_close_iconsize);
    closeIcon.setAttribute('aria-label', 'Click to close.');
    closeIcon.setAttribute('tabindex', '0');
    closeIcon.className = 'lbj-popover-close-icon absolute cursor-pointer right-3 top-3 text-primary-b-700';
    closeIcon.style.cssText = 'z-index: 10000;';
    closeIcon.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.togglePopover();
    });
    closeIcon.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') this.togglePopover();
    });

    // Move (not clone) the light-DOM slot content into the portal so that
    // any already-rendered widgets (e.g. reCAPTCHA) keep their live DOM
    // node and their JS callbacks remain intact.
    const slottedContent = this.el.querySelector('[slot="content"]');
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'lbj-popover-content-wrapper';
    if (slottedContent) {
      // Store refs so we can move the node back to its original parent on close.
      this._slottedContent = slottedContent;
      this._slottedContentOriginalParent = slottedContent.parentNode;
      contentWrapper.appendChild(slottedContent); // live move, not a clone
    }

    contentPanel.appendChild(closeIcon);
    contentPanel.appendChild(contentWrapper);
    backdrop.appendChild(contentPanel);
    this.portalEl.appendChild(backdrop);
    document.body.appendChild(this.portalEl);
  }

  private unmountPortal() {
    // Move the slotted content back to its original parent before removing
    // the portal, so it is ready for the next open and reCAPTCHA state is preserved.
    if (this._slottedContent && this._slottedContentOriginalParent) {
      this._slottedContentOriginalParent.appendChild(this._slottedContent);
      this._slottedContent = undefined;
      this._slottedContentOriginalParent = undefined;
    }
    if (this.portalEl?.parentNode) {
      this.portalEl.parentNode.removeChild(this.portalEl);
    }
    this.portalEl = undefined;
  }

  /** Injects a minimal <style> tag for things Tailwind classes cannot express:
   *  pseudo-state (:focus) and the responsive padding breakpoint.
   *  All other styles are applied via Tailwind classes on the DOM elements.
   */
  private injectGlobalStyles() {
    const STYLE_ID = 'lbj-popover-global-styles';
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .lbj-popover-close-icon:focus {
        color: var(--primary-b-900);
        outline: none;
      }
      @media (min-width: 765px) {
        .lbj-popover-content {
          padding: 3rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  render() {
    return (
      <Host class={this.popover_open ? 'popover-open' : 'popover-closed'}>
        {/* In global mode the dialog is rendered outside the Shadow DOM via the portal */}
        {this.popover_open && this.renderMode === 'local' && this.renderPopoverContent()}

        {/* Add the lbj-button that triggers the popover */}
        {this.variant == 'button' && (
          <lbj-button
            variant={this.btn_variant}
            size={this.btn_size}
            icon={this.btn_icon}
            iconleft={this.btn_iconleft}
            iconsize={this.btn_iconsize}
            case="none"
            onClick={() => this.togglePopover()}
            aria-controls="popoverContent"
            aria-expanded={this.popover_open ? 'true' : 'false'}
          >
            <span id="popoverTitle">{this.popover_action_text}</span>
          </lbj-button>
        )}
        {this.variant == 'link' && (
          <a onClick={() => this.togglePopover()} aria-controls="popoverContent" aria-expanded={this.popover_open ? 'true' : 'false'}>
            <span id="popoverTitle">{this.popover_action_text}</span>
          </a>
        )}
        {this.variant == 'mini_tag' && (
          <a class="mini_tag" onClick={() => this.togglePopover()} aria-controls="popoverContent" aria-expanded={this.popover_open ? 'true' : 'false'}>
            <span id="popoverTitle">{this.popover_action_text}</span>
          </a>
        )}
      </Host>
    );
  }

  /**
   * Toggles the popover open and closed.
   * In global mode, mounts/unmounts the portal on document.body.
   * @private
   */
  private togglePopover() {
    this.popover_open = !this.popover_open;

    if (this.renderMode === 'global') {
      if (this.popover_open) {
        this.mountPortal();
      } else {
        this.unmountPortal();
      }
    }

    const eventName = this.popover_open ? 'popoverOpened' : 'popoverClosed';

    const event = new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail: {
        popover: this.el,
      },
    });

    this.el.dispatchEvent(event);
  }
}
