import { Component, Host, h, Element, Prop, getMode, Fragment, State } from '@stencil/core';

import { IconColor, IconName, Size } from '../../utils/enums';
import { CardVariant, DatePosition } from './lbj-card-types';
import { TitleVariant } from '../lbj-title/lbj-title-types';

/**
 * The page title.
 *
 * @element lbj-card
 * @slot image - Slotted content for an image.
 * @slot body - The WYSIWYG body content.
 */
@Component({
  tag: 'lbj-card',
  styleUrls: {
    urban: 'lbj-card.css',
  },
  shadow: true,
})
export class LbjCard {
  // ---------------------------------------------------------------------------
  // Element
  // ---------------------------------------------------------------------------

  @Element() el: HTMLLbjCardElement;

  // ---------------------------------------------------------------------------
  // Properties
  // ---------------------------------------------------------------------------

  /**
   * Whether the card is a full size or grid display.
   */
  @Prop({ reflect: true }) variant: CardVariant = 'grid';

  /**
   * Date position.
   */
  @Prop({ reflect: true }) dateposition: DatePosition = 'below';

  /**
   * The text of the eyebrow title to display.
   */
  @Prop() eyebrow: string;

  /**
   * The text of the headline title to display.
   */
  @Prop() headline: string;

  /**
   * Optionally wrap the headline title with a URL.
   */
  @Prop() href: string;

  /**
   * Optionally, preface the headline with an SVG icon.
   */
  @Prop() icon: IconName;

  /**
   * The text of the date title to display.
   */
  @Prop() date: string;

  /**
   * The text of the date title to display.
   */
  @Prop() headlineVariant: TitleVariant;

  // New property to open link in new tab
  @Prop() blank_target = false;

  // New property to accept HTML content
  @Prop() headline_html = false;

  // State to hold slot content when headline_html is true
  @State() slotHtmlContent = '';

  handleClick = (event: Event) => {
    event.stopPropagation();
    window.location.href = this.href;
  };

  //----------------------------------------------------------------------------
  //  Lifecycle
  //----------------------------------------------------------------------------
  componentDidLoad() {
    if (this.href !== undefined) {
      this.el.addEventListener('click', this.handleClick);
    }
  }

  disconnectedCallback() {
    // Clean up the event listener
    if (this.href !== undefined) {
      this.el.removeEventListener('click', this.handleClick);
    }
  }

  render() {
    const theme = getMode(this.el);
    const { variant, icon } = this;
    const fullHeadingVariant = 'heading-2';
    const headlineVariant: TitleVariant = variant === 'grid' ? 'heading-5' : variant === 'full' ? fullHeadingVariant : 'paragraph';
    const eyebrowVariant = theme === 'tpc' || theme === 'yellow' ? 'eyebrow-with-background' : 'eyebrow';

    /**
      It renders a title with a blue icon for the hero variant card
      if the icon is present.
    */
    const renderTitle = () => {
      return (
        <Fragment>
          <div class="hero__card-title">
            {icon && <lbj-icon name={icon} color={IconColor.BLUE} size={Size.SM}></lbj-icon>}
            <lbj-title variant="heading-6">{this.headline}</lbj-title>
          </div>
        </Fragment>
      );
    };

    /**
     Based on the variant it will render the appropriate card.
     */
    const renderCard = (variant: string) => {
      const variantList = {
        'grid': () => {
          return (
            <Fragment>
              <div class="card">
                <slot name="image"></slot>
                <div class="card-content">
                  {this.eyebrow && (
                    <slot name="eyebrow">
                      <lbj-title variant={eyebrowVariant}>{this.eyebrow}</lbj-title>
                    </slot>
                  )}
                  <slot name="headline">
                    {this.href !== undefined ? (
                      <a class="card__headline-link" href={this.href}>
                        <lbj-title variant={headlineVariant} icon={this.icon}>
                          {this.headline}
                        </lbj-title>
                      </a>
                    ) : (
                      <lbj-title variant={headlineVariant} icon={this.icon}>
                        {this.headline}
                      </lbj-title>
                    )}
                  </slot>

                  {this.dateposition == 'below' && <slot name="body"></slot>}

                  {this.date && <slot name="date">{this.date && <lbj-title variant="date">{this.date}</lbj-title>}</slot>}

                  {this.dateposition == 'above' && <slot name="body"></slot>}
                </div>
              </div>
            </Fragment>
          );
        },
        'hero-basic': () => {
          return (
            <Fragment>
              <article class={`hero__card-container -${variant}`}>
                <slot name="image"></slot>
                <div class="hero__card-content">
                  {this.eyebrow && (
                    <slot name="eyebrow">
                      <h4 class="hero__card-eyebrow">{this.eyebrow}</h4>
                    </slot>
                  )}
                  <slot name="headline">
                    {this.href !== undefined ? (
                      <a class="card__headline-link" href={this.href}>
                        {' '}
                        {renderTitle()}
                      </a>
                    ) : (
                      renderTitle()
                    )}
                  </slot>
                </div>
              </article>
            </Fragment>
          );
        },
        'research': () => (
          <Fragment>
            <article part="research-card" class={`research__card-container`}>
              <slot name="image"></slot>
              <div class="research__card-content">
                {this.eyebrow && (
                  <slot name="eyebrow">
                    <lbj-title variant={eyebrowVariant}>{this.eyebrow}</lbj-title>
                  </slot>
                )}
                <slot name="headline">
                  {this.href !== undefined ? (
                    <a class="card__headline-link" href={this.href}>
                      {' '}
                      {renderTitle()}
                    </a>
                  ) : (
                    renderTitle()
                  )}
                </slot>
              </div>
            </article>
          </Fragment>
        ),
      };

      variantList['hero-featured'] = variantList['hero-basic'];
      variantList['full'] = variantList['grid'];

      return variantList[variant].call();
    };

    return <Host>{renderCard(variant)}</Host>;
  }
}
