import { Component, Element, Host, h, Prop, getMode, State } from '@stencil/core';

import { LinkVariant, LinkState } from './lbj-link-types';
import { IconName } from '../../utils/enums';
import { getAttributes } from '../../utils/get-attributes';

/**
 * The primary link component.
 *
 * @element lbj-link
 * @slot defaultSlot - A default slot for link text.
 */
@Component({
  tag: 'lbj-link',
  styleUrls: {
    urban: 'lbj-link.css',
  },
  shadow: true,
})
export class LbjLink {
  private handleDropdown = (event: MouseEvent) => {
    event.preventDefault();
    this.dropdownVisible = !this.dropdownVisible;
    this.state = this.dropdownVisible ? 'active' : 'inactive';
  };

  private isExternalLink(link) {
    const currentHost = window.location.hostname;
    const linkHost = new URL(link, window.location.origin).hostname;
    return linkHost !== currentHost;
  }

  handleEmptyClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdownContainer = this.el;

    if (!dropdownContainer.contains(target)) {
      this.dropdownVisible = false;
      this.state = 'inactive';

      return;
    }
  }

  attachClickListener() {
    document.addEventListener('click', event => this.handleEmptyClick(event));
  }

  componentDidLoad() {
    this.attachClickListener();
  }

  @State() dropdownVisible = false;
  // ---------------------------------------------------------------------------
  // Element
  // ---------------------------------------------------------------------------

  @Element() el: HTMLLbjLinkElement;

  // ---------------------------------------------------------------------------
  // Properties
  // ---------------------------------------------------------------------------

  /**
   * The link style to display.
   */
  @Prop({ reflect: true }) variant: LinkVariant = 'link';

  /**
   * The URL that the hyperlink points to.
   */
  @Prop({ reflect: true }) href: string;

  /**
   * Toggle trailing icon visibility.
   * - false (default): no icon
   * - true or empty attribute (e.g., `<lbj-link icon>`): show default icon based on theme
   */
  @Prop() icon: boolean = false;

  /**
   * Optional override for the trailing icon when `icon` is true.
   * Provide a value from `IconName` (e.g., `arrow-right`).
   * Note: Does not by itself make the icon visible; `icon` must be true.
   */
  @Prop() iconName?: IconName;

  /**
   * Link state active|inactive|undefined.
   */
  @Prop({ mutable: true, reflect: true }) state: LinkState = undefined;

  /**
   * Display mode when nested inside another component.
   */
  @Prop({ reflect: true }) mode: string;

  /**
   * Whether the link has children.
   */
  @Prop({ reflect: true }) hasChildren: boolean;

  /**
   * Dropdown position.
   */
  @Prop({ reflect: true }) dropdown?: 'static' | 'floating' = 'floating';
  render() {
    const props = ['variant', 'class', 'href', 'icon', 'iconName', 'state'];
    const elementAttributes = this.el.attributes.length !== 0 ? Array.from(this.el.attributes) : [];
    const attributes = getAttributes(props, elementAttributes);
    const stateClass = this.state !== undefined ? `${this.variant}--${this.state} ${this.state}` : '';
    // Icon visibility controlled purely by boolean prop
    const showIcon = this.icon === true;
    const iconClass = showIcon ? 'link-with-icon' : '';
    const theme = getMode(this.el);
    // Determine if a specific icon was passed via iconName (must be a valid IconName value)
    const isCustomIcon = typeof this.iconName === 'string' && (Object.values(IconName) as string[]).includes(this.iconName as string);
    const defaultIcon = theme === 'tpc' || theme === 'workrise' ? IconName.ARROW_RIGHT : IconName.CHEVRON_RIGHT;
    const icon = isCustomIcon ? (this.iconName as IconName) : defaultIcon;
    const externalLink = this.isExternalLink(this.href);

    return (
      <Host>
        <a
          class={`${this.variant} ${stateClass} ${iconClass}`}
          href={this.hasChildren ? '#' : this.href}
          {...attributes}
          onClick={this.hasChildren ? this.handleDropdown : null}
          aria-expanded={this.dropdownVisible}
          external-link={externalLink}
          target={externalLink ? '_blank' : null}
        >
          {externalLink && this.variant === 'small-primary' && <lbj-icon class="link__icon" name={IconName.EXTERNAL}></lbj-icon>}
          {this.variant === 'arrow' && <lbj-icon class="link__icon" name={IconName.ARROW_RIGHT}></lbj-icon>}
          <slot></slot>
          {showIcon && this.variant !== 'arrow' && <lbj-icon class="link__icon" name={icon}></lbj-icon>}
          {this.hasChildren && (
            <div class="menu-link-arrow">
              <lbj-icon class="dropdown__arrow" name={IconName.CHEVRON_RIGHT}></lbj-icon>
            </div>
          )}
        </a>
        {this.hasChildren && (
          <div class={`link-dropdown ${this.dropdown}`} aria-hidden={!this.dropdownVisible}>
            <slot name="dropdown" />
          </div>
        )}
      </Host>
    );
  }
}
