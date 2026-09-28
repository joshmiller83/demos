import { IconName } from '../../utils/enums';

/**
 * LbjMiniCatRenderingMode Interface.
 *
 * This interface defines the properties of a rendering mode for the
 * LbjMiniCatalog component.
 */
export interface LbjMiniCatRenderingMode {
  name: string;
  icon: IconName;
  active: boolean;
  allowed: boolean;
}

export class LbjMiniCatalogRenderingModes {
  modes: LbjMiniCatRenderingMode[];

  /**
   * Initialize the rendering modes.
   *
   * The rendering modes are defined as a list of
   * LbjMiniCatRenderingMode with the following properties:
   * - name: string - the name of the mode, used to identify it.
   * - icon: IconName - the icon to display for the mode.
   * - active: boolean - whether the mode is currently active.
   * - allowed: boolean - whether the mode is allowed to be displayed.
   */
  constructor() {
    const ledeMode: LbjMiniCatRenderingMode = {
      name: 'lede',
      icon: IconName.GRID,
      active: true,
      allowed: true,
    };
    const tableMode: LbjMiniCatRenderingMode = {
      name: 'table',
      icon: IconName.HAMBURGER_FOUR,
      active: false,
      allowed: true,
    };
    const cardMode: LbjMiniCatRenderingMode = {
      name: 'card',
      icon: IconName.GRID,
      active: false,
      allowed: false,
    };
    const personMode: LbjMiniCatRenderingMode = {
      name: 'person',
      icon: IconName.PEOPLE,
      active: false,
      allowed: false,
    };
    this.modes = [ledeMode, tableMode, cardMode, personMode];
    // console.log('this.modes', this.modes);
  }

  /**
   * Get the available rendering modes.
   */
  public getAvailableModes() {
    // Initialize an empty object to store the allowed modes
    const allowedModes = {};

    // Iterate over each LbjMiniCatRenderingMode in this.modes and put
    // their name if the allowed property is true.
    for (const key in this.modes) {
      if (this.modes[key].allowed) {
        allowedModes[this.modes[key].name] = this.modes[key];
      }
    }

    // console.log('getAvailableModes()', allowedModes);

    // Return the object containing only the allowed modes
    return allowedModes;
  }

  /**
   * Set the available rendering modes based on an array of names.
   * @param modes
   */
  public setAvailableModes(modes: string[]) {
    // console.log('setAvailableModes() - this.modes', this.modes);
    // console.log('setAvailableModes() - modes', modes);
    // Go through the arbitrary array of mode names and set the allowed
    // based on the presence of the name in the given list.
    for (const key in this.modes) {
      // Set this.modes[key].allowed to true if the name property matches
      // the modes array.
      // console.log('setAvailableModes() - Checking set of provided modes for...', this.modes[key].name);
      this.modes[key].allowed = modes.includes(this.modes[key].name);
    }
    // console.log('setAvailableModes() - this.modes', this.modes);
  }

  /**
   * Set the active rendering mode.
   *
   * This is based on the name property of LbjMiniCatRenderingMode.
   * @param mode
   */
  public setActiveMode(mode: string) {
    // console.log('setActiveMode() - mode', mode);
    // Check if the mode is in the list of available modes. The available
    // modes have name-based keys because it is an object.
    // Note  that we iterate over all modes, as an edge case could have
    // a default state of an active mode that is not allowed.
    for (const key in this.modes) {
      // console.log('setActiveMode() - Checking...', this.modes[key].name);
      this.modes[key].active = this.modes[key].name === mode;
      //if (this.modes[key].active) {
      //console.log('setActiveMode() - Activated: this.modes[key]', this.modes[key]);
      //}
    }
  }

  /**
   * Get the active rendering mode.
   */
  public getActiveMode() {
    // Iterate over each LbjMiniCatRenderingMode in this.modes.
    for (const key in this.modes) {
      // If the active property is true, return the name property.
      // We assume one active mode at a time.
      if (this.modes[key].active) {
        // console.log('getActiveMode() - Found active mode:', this.modes[key].name);
        return this.modes[key].name;
      }
    }
    // console.log('getActiveMode() - No active mode found');
  }

  /**
   * Set the order of the rendering modes.
   *
   * The order array should contain a simple string array of the mode
   * names in the order you want.
   *
   * @param order
   */
  public setModeOrder(order: string[]) {
    // console.log('setModeOrder() - order', order);
    // console.log('setModeOrder() - this.modes - BEFORE', this.modes);
    // Initialize an empty array to store the ordered modes.
    const orderedModes: LbjMiniCatRenderingMode[] = [];
    // Iterate over the argument array and recreate the this.modes
    // array in the same order.
    order.forEach(mode => {
      // Find the mode in this.modes and push it to the orderedModes
      // array.
      this.modes.forEach(m => {
        if (m.name === mode) {
          orderedModes.push(m);
        }
      });
    });
    // Tack on any modes that were not in the order array.
    this.modes.forEach(m => {
      if (!order.includes(m.name)) {
        orderedModes.push(m);
      }
    });
    // Set this.modes to the orderedModes array.
    this.modes = orderedModes;
    // console.log('setModeOrder() - this.modes - AFTER', this.modes);
  }
}
