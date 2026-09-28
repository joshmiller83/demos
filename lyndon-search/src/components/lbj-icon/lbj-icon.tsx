import { Component, h, Prop, State, Watch } from '@stencil/core';

import icons from './assets/icons.json';

import { IconColor, IconName, Size } from '../../utils/enums';

import { IconVariant } from './lbj-icon-types';

import { getFileTypes, assignColorsToFileTypes } from '../../utils/file-type';

/**
 * Design icons for lyndon.
 *
 * @element lbj-icon
 */
@Component({
  tag: 'lbj-icon',
  styleUrl: 'lbj-icon.css',
  shadow: true,
})
export class LbjIcon {
  /**
   * The registered icon to display.
   */
  @Prop() name: IconName = IconName.ARROW_RIGHT;

  /**
   * The icon color to display.
   */
  @Prop() color: IconColor = IconColor.CURRENT;

  /**
   * An optional property to add height/width to an icon.
   */
  @Prop() size: Size;

  /**
   * The icon variant to display.
   */
  @Prop({ reflect: true }) variant: IconVariant = 'default';

  @Prop({ mutable: true }) filetype: string;

  @State() parsedFileTypes: { name: string; bgColor: string }[] = [];

  @Watch('filetype')
  parseFileType(newValue: string) {
    if (newValue) {
      const fileTypeArray = [newValue.split(',')[0].trim()];
      const fileTypes = getFileTypes(fileTypeArray);
      this.parsedFileTypes = assignColorsToFileTypes(fileTypes);
    } else {
      this.parsedFileTypes = [];
    }
  }

  componentWillLoad() {
    this.parseFileType(this.filetype);
  }

  render() {
    const sizeClass = this.size !== undefined ? `icon-${this.size}` : 'icon-full';

    return this.variant !== 'default' ? (
      <span class={`${this.variant} ${this.parsedFileTypes[0].bgColor} icon-${this.color}`}>{this.parsedFileTypes[0].name}</span>
    ) : (
      <span class={`svg-icon icon-${this.color} ${sizeClass}`} innerHTML={icons[this.name]} />
    );
  }
}
