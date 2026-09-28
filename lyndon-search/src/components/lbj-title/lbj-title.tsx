import { Component, Element, Host, h, Prop, State } from '@stencil/core';

import { IconName, Size } from '../../utils/enums';
import { StripeColor, TitleVariant } from './lbj-title-types';
import { VerticalStripeColor } from '../../utils/enums';
import { getAttributes } from '../../utils/get-attributes';

/**
 * The page title.
 *
 * @element lbj-title
 * @slot defaultSlot - The text contents of the title.
 */
@Component({
  tag: 'lbj-title',
  styleUrls: {
    urban: 'lbj-title.css',
  },
  shadow: true,
})
export class LbjTitle {
  // ---------------------------------------------------------------------------
  // Element
  // ---------------------------------------------------------------------------

  @Element() el: HTMLLbjTitleElement;

  // ---------------------------------------------------------------------------
  // Properties
  // ---------------------------------------------------------------------------

  /**
   * The HTML element to use.
   */
  @Prop() element = 'div';

  /**
   * The text style to use.
   */
  @Prop({ reflect: true }) variant: TitleVariant = 'paragraph';

  /**
   * Optionally, preface the title with an SVG icon.
   */
  @Prop() icon: IconName;

  /**
   * Optionally, add an accent line to highlight content.
   */
  @Prop({ reflect: true }) accent = false;

  /**
   * Optionally, add a stripe on the bottom.
   */
  @Prop({ reflect: true }) stripe_color: StripeColor = undefined;

  /**
   * Display mode when nested inside another component.
   */
  @Prop({ reflect: true }) mode: string;

  // New property to accept HTML content
  @Prop() hasHtml = false;

  /**
   * Optionally, add a vertical stripe to the left of the title.
   */
  @Prop({ reflect: true }) vertical_stripe: VerticalStripeColor = undefined;

  // State to hold slot content when hasHtml is true
  @State() slotHtmlContent = '';

  componentWillLoad() {
    if (this.hasHtml) {
      // Assuming slot content is directly inside the component, not in a nested structure.
      // You might need to adjust based on your actual use case.
      this.slotHtmlContent = this.el.innerHTML;
    }
  }

  render() {
    const props = ['element', 'variant', 'icon', 'icon_classes', 'accent', 'class', 'stripe_color'];
    const elementAttributes = this.el.attributes.length !== 0 ? Array.from(this.el.attributes) : [];
    const attributes = getAttributes(props, elementAttributes);
    const Tag = this.element;

    const stripeColorClass = this.stripe_color?.replace('stripe-', '') || '';
    const verticalStripeColorClass = this.vertical_stripe?.replace('stripe-', '') || '';
    const classes_span = {
      stripe: !!this.stripe_color,
      [`stripe--${stripeColorClass}`]: !!stripeColorClass,
    };

    const vertical_classes_span = {
      [`v-stripe--${verticalStripeColorClass}`]: !!verticalStripeColorClass,
    };

    const classes = {
      'title': true,
      'title--block': this.icon,
      'title--flex': this.accent,
      [`${this.variant}`]: this.variant,
      'v-stripe': this.vertical_stripe,
    };

    return (
      <Host>
        <Tag class={classes} {...attributes}>
          {this.vertical_stripe && <span class={vertical_classes_span} />}
          {this.icon && <lbj-icon name={this.icon} size={Size.MD}></lbj-icon>}
          {this.stripe_color ? (
            <span class={classes_span}>{this.hasHtml ? <div innerHTML={this.slotHtmlContent}></div> : <slot />}</span>
          ) : this.hasHtml ? (
            <div innerHTML={this.slotHtmlContent}></div>
          ) : (
            <slot></slot>
          )}

          {this.accent && <hr part="accent" />}
        </Tag>
      </Host>
    );
  }
}
