import { Component, Host, h, Prop, getMode, Element, State, Watch } from '@stencil/core';
import { getFileTypes, assignColorsToFileTypes } from '../../utils/file-type';

/**
 * A introductory lede component.
 *
 * @element lbj-lede
 * @slot accent - Implement lbj-title as heading-2 style with accent.
 * @slot eyebrow - Implement lbj-title as eyebrow style.
 * @slot headline - Implement lbj-title as heading-6 style.
 * @slot date - Implement lbj-title as date style.
 * @slot tags - Tags to be displayed below the headline.
 * @slot summary - Summary text below tags.
 * @slot filetype - File type indicator.
 */

@Component({
  tag: 'lbj-lede',
  styleUrls: {
    urban: 'lbj-lede.css',
  },
  shadow: true,
})
export class LbjLede {
  // ---------------------------------------------------------------------------
  // Element
  // ---------------------------------------------------------------------------

  @Element() el: HTMLLbjLedeElement;

  // ---------------------------------------------------------------------------
  // Properties
  // ---------------------------------------------------------------------------

  /**
   * The text contents of the accent title.
   */
  @Prop() accent: string;

  /**
   * The text contents of the eyebrow title and url.
   */
  @Prop() eyebrow?: Array<{ name: string; url: string }> | string | null;

  /**
   * The array contents of the primary topic/ second eyebrow.
   */
  @Prop() topic: Array<{ name: string; url: string }> = [];

  /**
   * The text contents of the headline title.
   */
  @Prop() headline: string;

  /**
   * The text contents of the date.
   */
  @Prop() date: string;

  /**
   * The Array contents of the Author.
   */
  @Prop() author: Array<{ name: string; url: string }> = [];
  /**
   * Evaluate if summary slot has content.
   */
  @Prop({ mutable: true }) hasSummary: boolean;

  /**
   * Evaluate if Topic slot has content.
   */
  @Prop({ mutable: true }) hasTopic: boolean;

  /**
   * Evaluate if Author slot has content.
   */
  @Prop({ mutable: true }) hasAuthor: boolean;

  /**
   * A wrapping URL for the headline title.
   */
  @Prop({ reflect: true }) href: string;

  /**
   * The different variants of the Lede.
   */
  @Prop() componentvariant = 'lede';

  /**
   * The tags to display below the headline.
   */
  @Prop() tags: Array<{ name: string; url: string }> = [];

  /**
   * The text contents of the summary.
   */
  @Prop({ mutable: true }) summary: string;

  /**
   * The file type indicator.
   */
  @Prop({ mutable: true }) filetype: string;

  // New property to accept HTML content
  @Prop() headline_html = false;

  // New property to accept HTML content
  @Prop() blank_target = false;

  // New property to accept url of icon.
  @Prop() icon: string;

  // State to hold slot content when hasHtml is true
  @State() slotHtmlContent = '';

  //----------------------------------------------------------------------------
  //  Lifecycle
  //----------------------------------------------------------------------------

  @State() isExpanded = false;
  @State() isDetailed = false;
  @State() parsedFileTypes: { name: string; bgColor: string }[] = [];

  @Watch('filetype')
  parseFileType(newValue: string) {
    if (newValue) {
      const fileTypeArray = newValue.split(',').map(type => type.trim());
      const fileTypes = getFileTypes(fileTypeArray);
      this.parsedFileTypes = assignColorsToFileTypes(fileTypes);
    } else {
      this.parsedFileTypes = [];
    }
  }

  componentWillLoad() {
    this.hasSummary = this.el.querySelector('[slot="summary"]') !== null;
    this.hasTopic = this.el.querySelector('[slot="topic"]') !== null;
    this.hasAuthor = this.el.querySelector('[slot="author"]') !== null;
    if (this.headline_html) {
      // Assuming the headline slot translates to this property.
      this.slotHtmlContent = this.headline;
    }
    this.parseFileType(this.filetype);
  }

  componentWillRender() {
    this.isExpanded = this.componentvariant === 'expanded';
    this.isDetailed = this.componentvariant === 'detailed';
  }

  renderFileTypes() {
    return (
      <slot name="filetype">
        <div class="file-types">
          {this.parsedFileTypes.map(fileType => (
            <div class={`file-type ${fileType.bgColor}`}>{fileType.name.toUpperCase()}</div>
          ))}
        </div>
      </slot>
    );
  }

  render() {
    const theme = getMode(this.el);
    const eyebrowVariant = theme === 'tpc' || theme === 'yellow' ? 'eyebrow-with-background' : 'eyebrow';
    let authorsList = '';
    if (this.author && this.author.length > 0) {
      // Build a string with the names of all authors separated by commas.
      const authorLinks = this.author.map(person => (
        <lbj-link variant="small" href={person.url}>
          {person.name}
        </lbj-link>
      ));

      // Build a string with the HTML of all lbj-link components separated by commas.
      authorsList = authorLinks.reduce((prev, curr) => [prev, ', ', curr]);
    }

    let eyebrowMarkup = null;

    if (this.eyebrow) {
      if (Array.isArray(this.eyebrow)) {
        this.eyebrow.map(
          item =>
            (eyebrowMarkup = (
              <lbj-link variant="eyebrow-with-background" href={item.url}>
                {item.name}
              </lbj-link>
            )),
        );
      } else {
        eyebrowMarkup = <lbj-title variant={eyebrowVariant}>{this.eyebrow}</lbj-title>;
      }
    }
    let tagsMarkup = null;
    if (this.tags && this.tags.length > 0) {
      // Build a string with the tags separated by commas.
      tagsMarkup = this.tags.map(tag => (
        <lbj-link variant="tag" href={tag.url}>
          {tag.name}
        </lbj-link>
      ));
    }
    return (
      <Host>
        {this.accent && (
          <slot name="accent">
            <lbj-title variant="heading-2" accent>
              {this.accent}
            </lbj-title>
          </slot>
        )}

        {this.isExpanded && this.topic && (
          <slot name="topic">
            {this.topic.map(item => (
              <lbj-link variant="eyebrow-with-background" href={item.url}>
                {item.name}
              </lbj-link>
            ))}
          </slot>
        )}
        {this.isExpanded && this.hasTopic && this.eyebrow && (
          <slot name="colon">
            <span class="divider"> : </span>
          </slot>
        )}
        {this.eyebrow && <slot name="eyebrow">{eyebrowMarkup}</slot>}
        <slot name="headline">
          <div class="headline-container">
            {this.icon && <img src={this.icon} alt="icon" class="lede-icon" />}
            {this.href !== undefined ? (
              <a
                class="lede__headline-link"
                href={this.href}
                title="headline"
                id="headline"
                aria-label={'Read more about ' + this.headline}
                target={this.blank_target ? '_blank' : undefined}
              >
                {this.headline_html ? (
                  <lbj-title variant="heading-6" hasHtml={this.headline_html} innerHTML={this.headline}></lbj-title>
                ) : (
                  <lbj-title variant="heading-6" hasHtml={this.headline_html}>
                    {this.headline}
                  </lbj-title>
                )}
              </a>
            ) : this.headline_html ? (
              <lbj-title variant="heading-6" hasHtml={this.headline_html} innerHTML={this.headline}></lbj-title>
            ) : (
              <lbj-title variant="heading-6" hasHtml={this.headline_html}>
                {this.headline}
              </lbj-title>
            )}
          </div>
        </slot>
        {this.tags && <slot name="tags">{tagsMarkup}</slot>}
        {(this.isDetailed || this.isExpanded) && this.hasSummary && <slot name="summary" />}
        {this.date && <slot name="date">{this.date && <lbj-title variant="date">{this.date}</lbj-title>}</slot>}
        {this.isExpanded && this.date && this.hasAuthor && (
          <slot name="divider">
            <span class="divider"> | </span>
          </slot>
        )}
        {this.isExpanded && this.author && <slot name="author">{authorsList}</slot>}
        {this.isDetailed && this.filetype && this.renderFileTypes()}
      </Host>
    );
  }
}
