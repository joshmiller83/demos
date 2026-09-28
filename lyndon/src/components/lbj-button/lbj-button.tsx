import { Component, Element, h, Host, Prop, State } from '@stencil/core';

import { ButtonVariant } from './lbj-button-types';
import { ButtonVariants, IconName, Size } from '../../utils/enums';
import { getAttributes } from '../../utils/get-attributes';

/**
 * The primary button component.
 *
 * @element lbj-button
 * @slot defaultSlot - The button text to display.
 */
@Component({
  tag: 'lbj-button',
  styleUrls: {
    urban: 'lbj-button.css',
  },
  shadow: true,
})
export class LbjButton {
  private isExternalLink(link) {
    const currentHost = window.location.hostname;
    const linkHost = new URL(link, window.location.origin).hostname;
    return linkHost !== currentHost;
  }

  // ---------------------------------------------------------------------------
  // Element
  // ---------------------------------------------------------------------------

  @Element() el: HTMLLbjButtonElement;

  // ---------------------------------------------------------------------------
  // Properties
  // ---------------------------------------------------------------------------

  /**
   * The button styling to display.
   */
  @Prop({ reflect: true }) variant: ButtonVariant = ButtonVariants.BTN_PRIMARY;

  /**
   * The internal padding size. sm|md|lg|xl|xxl
   */
  @Prop({ reflect: true }) size: Size = Size.MD;

  /**
   * The button case ( optional ) by default is Uppercase
   */
  @Prop() case: 'none' | 'capitalize' | 'uppercase' | 'lowercase' = 'uppercase';
  /**
   * An icon to display to the right of text (optional).
   */
  @Prop() icon: IconName | undefined;

  /**
   * An icon to display to the left of text (optional).
   */
  @Prop() iconleft: IconName | undefined;

  /**
   * An icon to display to the right of text (optional).
   */
  @Prop() iconsize: Size = Size.FULL;

  /**
   * If no url, then falls back to <button> element (optional).
   */
  @Prop({ reflect: true }) href: string;
  /**
   * Determines if the button is a breakout button.
   */
  @Prop() isBreakout = false;
  /**
   * Defines target for links (optional).
   */
  @Prop() target: string;

  /**
   * Display mode when nested inside another component.
   */
  @Prop({ reflect: true }) mode: string;

  /**
   * Dropdown nav items.
   */
  @Prop() navItems: { title: string; url: string }[] = [];

  /**
   * Defines active state of button
   */
  @Prop() activeState: boolean;

  /**
   * Defines title case of button
   */
  @Prop() titleCase: boolean;

  /**
   * Width of button
   */
  @Prop() fullwidth: boolean;

  /**
   * Modifier class
   */
  @Prop() modifier: string;

  //----------------------------------------------------------------------------
  //  State
  //----------------------------------------------------------------------------

  @State() isActive = false;
  @State() dropdownVisible = false;

  //----------------------------------------------------------------------------
  //  Lifecycle
  //----------------------------------------------------------------------------

  connectedCallback() {
    this.childElType = this.href !== undefined ? 'a' : 'button';
  }

  componentWillLoad() {
    window.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const menu = document.querySelector('.menu-links');
      if (target !== menu) {
        this.isActive = false;
      }
    });
  }

  render() {
    // Check if slot is empty.
    const hasText = this.el.textContent.trim() !== '';

    const props = ['variant', 'size', 'icon', 'class', 'iconleft', 'target', 'case'];
    const elementAttributes = this.el.attributes.length !== 0 ? Array.from(this.el.attributes) : [];
    const attributes = getAttributes(props, elementAttributes);
    const Tag = this.childElType;

    const classes = {
      'button': true,
      'button--primary-utility-link': this.variant === ButtonVariants.BTN_PRIMARY_UTILITY_LINK,
      'button--secondary-utility-link': this.variant === ButtonVariants.BTN_SECONDARY_UTILITY_LINK,
      'button--nav-link': this.variant === ButtonVariants.BTN_NAV_LINK,
      'button--mobile-nav-link': this.variant === ButtonVariants.BTN_MOBILE_NAV_LINK,
      'button--primary': this.variant === ButtonVariants.BTN_PRIMARY,
      'button--primary-blue': this.variant === ButtonVariants.BTN_PRIMARY_BLUE,
      'button--primary-dark': this.variant === ButtonVariants.BTN_PRIMARY_DARK,
      'button--primary-blue-mid': this.variant === ButtonVariants.BTN_PRIMARY_BLUE_MID,
      'button--primary-blue-dark': this.variant === ButtonVariants.BTN_PRIMARY_BLUE_DARK,
      'button--secondary': this.variant === ButtonVariants.BTN_SECONDARY,
      'button--secondary-blue': this.variant === ButtonVariants.BTN_SECONDARY_BLUE,
      'button--secondary-dark': this.variant === ButtonVariants.BTN_SECONDARY_DARK,
      'button--secondary-transparent': this.variant === ButtonVariants.BTN_SECONDARY_TRANSPARENT,
      'button--secondary-no-border': this.variant === ButtonVariants.BTN_SECONDARY_NO_BORDER,
      'button--tertiary': this.variant === ButtonVariants.BTN_TERTIARY,
      'button--disabled': this.variant === ButtonVariants.BTN_DISABLED,
      'button--white': this.variant === ButtonVariants.BTN_WHITE,
      'button--white-dark': this.variant === ButtonVariants.BTN_WHITE_DARK,
      'button--primary button--dropdown': this.variant === ButtonVariants.BTN_DROPDOWN,
      'button--sm': this.size === Size.SM,
      'button--md': this.size === Size.MD,
      'button--lg': this.size === Size.LG,
      'button--xl': this.size === Size.XL,
      'button--xxl': this.size === Size.XXL,
      'button--normal-case': this.case == 'none',
      'button--lower-case': this.case == 'lowercase',
      'button--capital-case': this.case == 'capitalize',
      'icon-only': hasText === false,
      'icon-left': this.iconleft != undefined && this.iconleft,
      'icon-right': this.icon != undefined && this.icon,
      'button-breakout': this.isBreakout,
      'button--full': this.fullwidth,
      'title-case': this.titleCase,
      'elevate': this.modifier === 'elevate',
    };

    if (this.iconsize !== Size.FULL) {
      const iconClass = 'icon--size icon--size--' + this.iconsize;
      classes[iconClass] = true;
    }

    // Determine if link is external (only if href exists and target is not passed)
    const externalLink = this.href && !this.target ? this.isExternalLink(this.href) : false;
    const linkTarget = this.target || (externalLink ? '_blank' : null);

    return (
      <Host>
        {this.href && (
          <Tag class={classes} {...attributes} href={this.href} target={linkTarget} external-link={externalLink} data-active={this.isActive}>
            {this.iconleft && <lbj-icon class="button__icon__left" name={this.iconleft} size={this.iconsize}></lbj-icon>}
            <span class={this.isBreakout ? '' : 'button__text'}>
              <slot></slot>
            </span>
            {this.icon && <lbj-icon class="button__icon" name={this.icon} size={this.iconsize}></lbj-icon>}
          </Tag>
        )}
        {(this.href == null || this.href == '') && (
          <Tag class={classes} {...attributes} onClick={() => this.handleButtonClick()} data-active={this.isActive}>
            {this.iconleft && <lbj-icon class="button__icon__left" name={this.iconleft} size={this.iconsize}></lbj-icon>}
            <span class={this.isBreakout ? '' : 'button__text'}>
              <slot></slot>
            </span>
            {this.icon && <lbj-icon class="button__icon" name={this.icon} size={this.iconsize}></lbj-icon>}
            {this.variant === 'dropdown' && this.dropdownVisible && (
              <ul class="dropdown-menu">
                <slot name="nav-items">
                  {this.navItems.map(item => (
                    <li>
                      <a href={item.url}>{item.title}</a>
                    </li>
                  ))}
                </slot>
              </ul>
            )}
          </Tag>
        )}
      </Host>
    );
  }

  /**
   * The node type of the rendered child element
   */
  private childElType?: 'a' | 'button' = 'button';

  /**
   * Custom Click Handler
   */
  handleButtonClick() {
    if (this.variant === 'dropdown') {
      this.dropdownVisible = !this.dropdownVisible;
    }
  }
}
