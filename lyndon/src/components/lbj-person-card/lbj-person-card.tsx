import { Component, Host, h, Prop, Element } from '@stencil/core';
import { IconColor, IconName, Size } from '../../utils/enums';

@Component({
  tag: 'lbj-person-card',
  styleUrls: {
    urban: 'lbj-person-card.css',
  },
  shadow: true,
})
export class LbjPersonCard {
  // ---------------------------------------------------------------------------
  // Element
  // ---------------------------------------------------------------------------

  @Element() el: HTMLLbjPersonCardElement;

  // ---------------------------------------------------------------------------
  // Properties
  // ---------------------------------------------------------------------------

  /**
   * The text contents of the Name of the Author.
   */
  @Prop() name: string;

  /**
   * The Link to Author's profile page.
   */
  @Prop({ reflect: true }) url: string | null = undefined;

  /**
   * The text contents of the Job title.
   */
  @Prop() position: string;

  /**
   * The text contents of the Company name.
   */
  @Prop() company: string;

  /**
   * The link to person's linkedin link.
   */
  @Prop({ reflect: true }) linkedin: string;

  /**
   * The Link to person's Twitter link.
   */
  @Prop({ reflect: true }) twitter: string | null = undefined;

  /**
   * The Link to person's Threads link.
   */
  @Prop({ reflect: true }) threads: string | null = undefined;

  /**
   * The Link to person's Bluesky link.
   */
  @Prop({ reflect: true }) bluesky: string | null = undefined;

  /**
   * Evaluate if Position slot has content.
   */
  @Prop({ mutable: true }) hasPosition: boolean;

  // New property to open link in new tab
  @Prop() blank_target = false;

  // New property to accept HTML content
  @Prop() headline_html = false;

  componentWillLoad() {
    this.hasPosition = this.el.querySelector('[slot="position"]') !== null;
  }

  render() {
    const social_classes = this.linkedin != null ? 'pl-3' : undefined;

    return (
      <Host>
        <slot name="image" />
        {this.url && (
          <p>
            <a
              href={this.url}
              class="paragraph font-bold person__name-link"
              target={this.blank_target ? '_blank' : undefined}
              innerHTML={this.name}
              aria-label={`View profile for ${this.name}`}
            ></a>
          </p>
        )}
        {this.url == null && <p class="paragraph font-bold" innerHTML={this.name}></p>}
        {this.hasPosition && <slot name="position" />}
        {this.company && <div class="small text-gray-800 pt-2 lg:pt-3">{this.company}</div>}
        {(this.linkedin || this.twitter) && (
          <div class="pt-4 lg:pt-6">
            {this.linkedin && (
              <a href={this.linkedin}>
                <lbj-icon class="link__icon" name={IconName.LINKEDIN} color={IconColor.BLACK} size={Size.MD} />
              </a>
            )}
            {this.bluesky && (
              <a href={this.bluesky} class={social_classes}>
                <lbj-icon class="link__icon" name={IconName.BLUESKY} color={IconColor.BLACK} size={Size.MD} />
              </a>
            )}
            {this.threads && (
              <a href={this.threads} class={social_classes}>
                <lbj-icon class="link__icon" name={IconName.THREADS} color={IconColor.BLACK} size={Size.MD} />
              </a>
            )}
            {this.twitter && (
              <a href={this.twitter} class={social_classes}>
                <lbj-icon class="link__icon" name={IconName.TWITTER} color={IconColor.BLACK} size={Size.MD} />
              </a>
            )}
          </div>
        )}
      </Host>
    );
  }
}
