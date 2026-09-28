import { Component, Host, h, Prop, Element, State, Listen, Event, EventEmitter } from '@stencil/core';
import { CollapseVariant } from './lbj-collapse-types';

/**
 * The primary collapse component.
 *
 * @element lbj-collapse
 * @slot headline - Optional title area of the collapse.
 * @slot summary - Optional HTML summary to trigger the show/hide of content.
 * @slot content - The content area to show or hide.
 */
@Component({
  tag: 'lbj-collapse',
  styleUrls: {
    urban: 'lbj-collapse.css',
  },
  shadow: true,
})
export class LbjCollapse {
  // ---------------------------------------------------------------------------
  // Element
  // ---------------------------------------------------------------------------

  @Element() el: HTMLLbjCollapseElement;

  // ---------------------------------------------------------------------------
  // State and Listeners
  // ---------------------------------------------------------------------------
  @State() open: boolean;

  @Event() stateChanged: EventEmitter<{ state: boolean; id: string }>;

  @Listen('click', { capture: true })
  handleClick() {
    this.open = !this.open;

    if (this.triggerId) {
      this.stateChanged.emit({ state: this.open, id: this.triggerId });
    }
  }

  // ---------------------------------------------------------------------------
  // Properties
  // ---------------------------------------------------------------------------

  /**
   * The collapse styling to display.
   */
  @Prop({ reflect: true }) variant: CollapseVariant = 'default';

  /**
   * Evaluate if headline slot has content.
   */
  @Prop({ mutable: true }) hasHeadline: boolean;

  /**
   * Evaluate if summary slot has content.
   */
  @Prop({ mutable: true }) hasSummary: boolean;

  /**
   * Additional classes to apply to the collapse.
   */
  @Prop({ reflect: true }) modifier: string;

  /**
   * Optionally provide the details element's id for aria-controls.
   */
  @Prop({
    attribute: 'details-id',
    reflect: true,
  })
  detailsId = `collapse-item-${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`;

  /**
   * Optionally provide a custom id for the event trigger.
   */
  @Prop() triggerId?: string;

  /**
   * Evaluate if it's the first content.
   */
  @Prop({ mutable: true }) isOpen: boolean;

  /**
   * Sets the depth of the element for handling nested elements.
   *
   * Works with variants ['collapsible-link'].
   */
  @Prop({ reflect: true }) level?: number;

  //----------------------------------------------------------------------------
  //  Lifecycle
  //----------------------------------------------------------------------------

  componentWillLoad() {
    this.hasHeadline = this.el.querySelector('[slot="headline"]') !== null;
    this.hasSummary = this.el.querySelector('[slot="summary"]') !== null;
  }

  render() {
    const classes = {
      collapse: true,
      [`collapse--${this.variant}`]: this.variant !== undefined,
    };

    const detailsClasses = {
      details: true,
      [`details--${this.variant}`]: this.variant !== undefined,
    };

    const summaryClasses = {
      summary: true,
      [`summary--${this.variant}`]: this.variant !== undefined,
    };

    return (
      <Host class={classes}>
        {this.hasHeadline && <slot name="headline" />}
        <details id={this.detailsId} class={detailsClasses} open={this.isOpen} {...(this.level && { 'data-level': this.level })}>
          {this.hasSummary && (
            <summary class={summaryClasses} aria-controls={this.detailsId} aria-pressed={this.isOpen ? 'true' : 'false'} aria-expanded={this.isOpen ? 'true' : 'false'}>
              <slot name="summary" />
            </summary>
          )}
          <slot name="content" />
        </details>
      </Host>
    );
  }
}
