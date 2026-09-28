// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, h, Host, Prop, State, Element } from '@stencil/core';
import Papa from 'papaparse';
import { ButtonVariants, IconColor, IconName, Size, TextStyles } from '../../utils/enums';
import Fuse from 'fuse.js';
import DOMPurify from 'dompurify';
import { ButtonVariant } from '../lbj-button/lbj-button-types';
import { LbjMiniCatalogRenderingModes } from './lbj-mini-catalog-rendering-modes';

// Declare interfaces outside the exported class.
export interface ResultItem {
  title: string;
  tags: string;
  url: string;
  type: string;
  date: string;
  description: string;
}
export interface ExplainerItem {
  explains: string;
  description: string;
}

export interface FacetFilter {
  name: string;
  label: string;
  type: string;
  exclude: string;
  sort: string;
}

/**
 * The mini catalog block.
 *
 * @element lbj-mini-catalog
 */
@Component({
  tag: 'lbj-mini-catalog',
  styleUrl: 'lbj-mini-catalog.css',
  shadow: true,
})
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LbjMiniCatalog {
  /**
   * Data Property.
   */
  @Prop({ reflect: true }) csv: string;
  @Prop({ reflect: true }) toggle_csv_local: false;
  @Prop({ reflect: true }) csv_global_var = 'drupalSettings';
  @Prop({ reflect: true }) csv_explainer: string;

  /**
   * Text Properties.
   */
  @Prop({ reflect: true }) headline: string;
  @Prop({ reflect: true }) headline_variation = TextStyles.HEADING2;
  @Prop({ reflect: true }) facet_prepend = 'Filter by';
  @Prop({ reflect: true }) search_button = 'Search';
  @Prop({ reflect: true }) reset_button = 'Clear filters';
  @Prop({ reflect: true }) next_button = 'Next';
  @Prop({ reflect: true }) next_icon = IconName.CHEVRON_RIGHT;
  @Prop({ reflect: true }) prev_button = 'Previous';
  @Prop({ reflect: true }) prev_icon = IconName.CHEVRON_LEFT;
  @Prop({ reflect: true }) pagination_separator = 'of';
  @Prop({ reflect: true }) pagination_btn_variant: ButtonVariant = ButtonVariants.BTN_SECONDARY_NO_BORDER;
  @Prop({ reflect: true }) filter_label = 'Filter';
  @Prop({ reflect: true }) results_count = 'results found';
  @Prop({ reflect: true }) no_results = 'No results found. Try expanding your search.';
  @Prop({ reflect: true }) explainer_cta = 'Learn More About';

  /**
   * Control Properties
   */
  @Prop({ reflect: true }) columns = 3;
  @Prop({ reflect: true }) pagination = 6;
  @Prop({ reflect: true }) mini_tags_show = true;
  @Prop({ reflect: true }) mini_tags_explainers = true;
  @Prop({ reflect: true }) mini_tags_exclude = 'eyebrow;type;image';
  @Prop({ reflect: true }) show_description = false;
  @Prop({ reflect: true }) fulltext_hide = false;
  @Prop({ reflect: true }) fulltext_highlight = true;
  @Prop({ reflect: true }) fulltext_include = 'title;description;authors';
  @Prop({ reflect: true }) fulltext_threshold = 0.4;
  @Prop({ reflect: true }) blank_target = true;
  @Prop({ reflect: true }) not_facet = 'title;url;description;eyebrow;date;image';
  @Prop({ reflect: true }) eyebrow_key = 'type;eyebrow';
  @Prop({ reflect: true }) toggle_filter = true;
  @Prop({ reflect: true }) toggle_rendering = true;
  @Prop({ reflect: true }) toggle_multi_facets = false;
  @Prop({ reflect: true }) toggle_top_pagination = false;
  @Prop({ reflect: true }) rendering_mode_current = 'lede';
  @Prop({ reflect: true }) rendering_mode_set = 'lede';
  @Prop({ reflect: true }) table_columns_includes = 'title;description;tags;authors';
  @Prop({ reflect: true }) table_columns_widths = '30;30;20;20';
  @Prop({ reflect: true }) table_columns_alignments = 'left;left;left';
  @Prop({ reflect: true }) table_columns_vertical_alignments = 'top;top;top;top';
  @Prop({ reflect: true }) explainer_columns = 'tags;type;authors';
  @Prop({ reflect: true }) multi_facet_tags_or = 'authors;tags';
  @Prop({ reflect: true }) title_columns = 'title';
  @Prop({ reflect: true }) title_columns_separator = '&nbsp;';
  @Prop({ reflect: true }) title_columns_label = 'Title';
  @Prop({ reflect: true }) description_columns = 'description';
  @Prop({ reflect: true }) description_columns_label = 'Summary';
  @Prop({ reflect: true }) description_columns_separator = '<br />';
  @Prop({ reflect: true }) description_columns_prefix_title = true;
  @Prop({ reflect: true }) description_columns_prefix_title_skip_first = true;
  @Prop({ reflect: true }) description_columns_suffix_separator = ': ';
  @Prop({ reflect: true }) description_below_title = false;
  @Prop({ reflect: true }) description_toggle_automatic_mini_tags_table = false;
  @Prop({ reflect: true }) image_columns = 'image';
  @Prop({ reflect: true }) image_url_columns = 'url';
  @Prop({ reflect: true }) image_columns_label = '';
  @Prop({ reflect: true }) image_alt_support = true;
  @Prop({ reflect: true }) image_alt_separator = ';';
  @Prop({ reflect: true }) image_above_title = false;
  @Prop({ reflect: true }) image_with_title = false;
  @Prop({ reflect: true }) filter_types = ''; //'tags=type:checkbox;authors=type:multi;type=type:dropdown';
  @Prop({ reflect: true }) person_initials = 'initials';

  /**
   * State variables. Generated from given properties and mouse interactions.
   */
  @State() private facets: { [facetName: string]: { [key: string]: number } } = {};
  @State() private facets_no_filters: { [facetName: string]: { [key: string]: number } } = {};
  @State() private selectedFacetFilters: { [facetName: string]: string[] } = {};
  @State() private items: ResultItem[] = [];
  @State() private items_explained: ExplainerItem[] = [];
  @State() private searchText: string;
  @State() private currentPage = 1;
  @State() private filterExpand = false;
  @State() private toggleOverride = true;
  @State() private renderingMode = new LbjMiniCatalogRenderingModes();
  @State() private renderOverride = 'lede';

  /**
   * Non-state variables.
   */
  private debounceTimer?: number;
  @Element() el: HTMLElement;
  private customFilters: FacetFilter[];

  /**
   * Initiates the process of loading result items from a specified URI.
   */
  private async loadResults(filename: string): Promise<ResultItem[]> {
    if (this.toggle_csv_local && this.csv_global_var.length > 0) {
      try {
        // Dynamically access the variable from the global scope
        return this.getGlobalNestedValue<ResultItem[]>(this.csv_global_var, filename);
      } catch (error) {
        console.error('MiniCatalog::loadResults() Error:', error);
      }
    }
    return (await this.loadResultsUnknown(filename)) as unknown as Promise<ResultItem[]>;
  }

  /**
   * Initiates the process of loading explainers from a specified URI.
   */
  private async loadExplainerResults(filename: string): Promise<ExplainerItem[]> {
    return (await this.loadResultsUnknown(filename)) as unknown as Promise<ExplainerItem[]>;
  }

  /**
   * Loads and processes the CSV file from the provided URI, returning the parsed data as an array.
   */
  private async loadResultsUnknown(filename: string): Promise<[]> {
    return this.getFile(filename)
      .then((response: Response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        return response.text();
      })
      .then(csvText => {
        return new Promise(resolve => {
          Papa.parse(csvText, {
            complete: results => {
              resolve(results.data);
            },
            header: true,
            skipEmptyLines: false,
          });
        });
      });
  }

  /**
   * Fetches the CSV file from the provided URI stored in the `csv` property.
   * This method encapsulates the fetch operation, setting appropriate headers
   * and referrer policy for the request.
   *
   * @returns A promise that resolves with the Response object from the fetch operation,
   * allowing for further processing of the CSV content. If the `csv` property is undefined,
   * indicating no URI is set, the method returns undefined, signalling that no fetch operation
   * should be attempted.
   */
  private async getFile(filename): Promise<Response | undefined> {
    // Fetch the CSV file with no referrer to maintain privacy and set Accept header for CSV content.
    return await fetch(filename, {
      referrerPolicy: 'no-referrer',
      headers: {
        Accept: 'text/csv',
      },
    });
  }

  connectedCallback() {
    document.addEventListener('popoverOpened', this.handlePopoverOpened);
    document.addEventListener('popoverClosed', this.handlePopoverClosed);
    document.addEventListener('filterExpanded', this.handleFilterExpanded);
    document.addEventListener('filterClosed', this.handleFilterClosed);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener('popoverOpened', this.handlePopoverOpened);
    document.removeEventListener('popoverClosed', this.handlePopoverClosed);
    document.removeEventListener('filterExpanded', this.handleFilterExpanded);
    document.removeEventListener('filterClosed', this.handleFilterClosed);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.filterExpand === true) {
      this.toggleFilterExpand();
    }
  };

  /*
   * Handle the open event on rendered popovers.
   *
   * Reference bug:
   *
   * @see LbjPopover.togglePopover
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private handlePopoverOpened = (_event: CustomEvent) => {
    if (this.renderingMode.getActiveMode() === 'table') {
      const tableElement = this.el.shadowRoot.querySelector('.results-wrapper table');
      if (tableElement !== null) {
        tableElement.classList.remove('table-horizontal-scroll');
      }
    }
  };

  private handleFilterExpanded = (event: CustomEvent) => {
    this.handlePopoverOpened(event);
  };

  /*
   * Handle the open event on rendered popovers.
   *
   * @see LbjPopover.togglePopover
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private handlePopoverClosed = (_event: CustomEvent) => {
    if (this.renderingMode.getActiveMode() === 'table') {
      const tableElement = this.el.shadowRoot.querySelector('.results-wrapper table');
      if (tableElement !== null) {
        tableElement.classList.add('table-horizontal-scroll');
      }
    }
  };

  private handleFilterClosed = (event: CustomEvent) => {
    this.handlePopoverClosed(event);
  };

  /**
   * Updates the count of each unique filterable element based on the item facets.
   * This method enhances filter options by aggregating facet counts from the given data.
   *
   * @param data - Array of items to process for facet counts.
   */
  private processFacets(data: ResultItem[]): void {
    const tempFacets: { [facetName: string]: { [key: string]: number } } = {};

    data.forEach(item => {
      // Note the filter below removes anything that we believe isn't a facet.
      Object.keys(item).forEach(key => {
        // Ensure the facet value exists before processing.
        if (this.isFacetKey(key) && item[key] != null) {
          // Initialize the facet count object for new facets.
          tempFacets[key] = tempFacets[key] || {};

          // Convert facet values to string, remove HTML tags, then split by semicolon.
          const tagValues = item[key]
            .toString()
            .replace(/<[^>]*>/g, '')
            .split(';');

          // Increment count for each tag value.
          // This creates an array of tags as keys with their count as value.
          tagValues.forEach(tagValue => {
            const value = String(tagValue);
            const trimmedValue = value.trim();
            if (trimmedValue.length > 0) {
              tempFacets[key][trimmedValue] = (tempFacets[key][trimmedValue] || 0) + 1;
            }
          });
        }
      });
    });

    // Update the facets with numbers and sort the facets alphabetically.
    Object.entries(tempFacets).forEach(([facetName, tags]) => {
      this.facets[facetName] = this.sortTagsAlphabetically(tags);
    });

    // If our selected filters are empty, then we need to update the facets_no_filters.
    // This should only trigger once on load and helps us bring back facets that are in the full list but not in the filtered list.
    if (Object.keys(this.selectedFacetFilters).length === 0 && Object.keys(this.facets_no_filters).length === 0) {
      // Create a deep clone copy of the facets object.
      this.facets_no_filters = JSON.parse(JSON.stringify(this.facets));
    }

    // Go through all multi_facet_tags_or columns that are separated by semicolons and copy the values from facets_no_filters to this.facets.
    this.multi_facet_tags_or.split(';').forEach(facetName => {
      this.facets[facetName] = this.facets_no_filters[facetName];
    });
  }

  /**
   * Returns true if the facet should be counted.
   *
   * The facet should be counted if it is in the OR logic list, or if we have multi-facets enabled.
   *
   * @param facetName - The name of the facet to check.
   * @returns True if the facet should be counted.
   */
  private shouldWeNotCountThisFacet(facetName: string): boolean {
    // Case-insensitive search for key.
    const matchingKey = Object.keys(this.selectedFacetFilters).find(key => key.toLowerCase() === facetName.toLowerCase());
    let facetFiltersKey = '';
    if (matchingKey !== null) {
      // console.log('shouldWeNotCountThisFacet() :: found case-insensitive facetName; given =', facetName, '; found =', matchingKey);
      facetFiltersKey = matchingKey;
    } else {
      facetFiltersKey = facetName;
    }

    return (
      (this.multi_facet_tags_or.split(';').includes(facetName) && this.selectedFacetFilters[facetFiltersKey]?.length > 0) ||
      (!this.toggle_multi_facets && this.selectedFacetFilters[facetFiltersKey]?.length > 0)
    );
  }

  /**
   * Returns a new object with its keys sorted alphabetically.
   * This method ensures that facets are presented in a consistent,
   * scannable order.
   *
   * @param tags - The object whose keys represent tags.
   * @returns A new object with keys sorted alphabetically.
   */
  private sortTagsAlphabetically(tags: { [key: string]: number }): { [key: string]: number } {
    return Object.entries(tags)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .reduce((sortedTags, [key, value]) => {
        sortedTags[key] = value;
        return sortedTags;
      }, {});
  }

  /**
   * Component lifecycle method that loads and processes CSV data on component initialization.
   * It filters the data to remove entries without a title, updates the state with filtered data,
   * and processes facets based on this data. Additionally, initializes dropdowns for each facet
   * with custom configuration.
   */
  componentDidLoad(): void {
    this.initializeRenderingModes();
    // if the current rendering mode isn't in the list of available modes, then set it to the first available mode.
    if (!Object.keys(this.renderingMode.getAvailableModes()).includes(this.rendering_mode_current)) {
      const available_modes = this.rendering_mode_set.split(';');
      // if the count of available modes is greater than 0, then set the rendering mode to the first available mode.
      if (available_modes.length > 0) {
        this.rendering_mode_current = available_modes[0];
      } else {
        // if the count of available modes is 0, then set it to one of the first available modes.
        this.rendering_mode_current = Object.keys(this.renderingMode.getAvailableModes())[0];
      }
    }

    // If there is an explainer CSV, load it.
    if (this.csv_explainer != undefined) {
      this.loadExplainerResults(this.csv_explainer)
        .then(data => {
          // Remove empty lines and set property.
          this.items_explained = data.filter(item => item.explains !== '');
        })
        .catch(error => {
          console.error('MiniCatalog::componentDidLoad() Error:', error);
        });
    }
    this.loadResults(this.csv)
      .then(data => {
        // Remove empty lines.
        const filteredData = data.filter(item => this.renderTitleText(item).trim() != '');
        // Trigger the rendering process.
        this.items = filteredData as ResultItem[];
        this.processFacets(filteredData as ResultItem[]);
      })
      .catch(error => {
        console.error('MiniCatalog::componentDidLoad() Error:', error);
      });
    window.addEventListener('resize', this.setToggleFilterBasedOnScreenSize.bind(this));
  }

  private initializeRenderingModes() {
    // Set available rendering modes.
    // if the rendering mode set is not empty.
    if (this.rendering_mode_set !== '') {
      // Array of rendering modes.
      let rendering_modes = this.rendering_mode_set.split(';');
      // If the rendering mode is a string and not an array of strings, reset it to an array of only one string.
      if (typeof rendering_modes === 'string') {
        rendering_modes = [rendering_modes];
      }
      this.renderingMode.setAvailableModes(rendering_modes);
      this.renderingMode.setModeOrder(rendering_modes);
    }
  }

  componentDidRender() {
    this.setColumnWidths();
  }

  /**
   * Renders the component with a dynamic layout based on the provided data and configuration.
   * It determines the number of columns to display based on the 'columns' property and maps
   * this to corresponding CSS classes for layout. Includes rendering of title, facets, search
   * input and buttons, filter summary, results, and pagination.
   */
  render() {
    // Reset rendering modes just in case.
    this.initializeRenderingModes();
    // Filter the data based on the current search text and selected facet filters.
    const filteredDataArray = this.filteredData();
    // Turn on Filter Toggle if small screen.
    this.setToggleFilterBasedOnScreenSize();
    // Set the rendering mode to the current rendering mode.
    this.renderingMode.setActiveMode(this.rendering_mode_current);

    return (
      <Host>
        <lbj-title variant={this.headline_variation} class="headline">
          {this.headline}
        </lbj-title>
        <div class={`${this.toggleOverride ? 'filter-toggle' : 'filter-static'} ${this.filterExpand ? 'filter-expanded' : 'filter-contracted'}`}>
          <div class="search-input-wrapper">
            <div class="filter-button">
              <lbj-button onClick={() => this.toggleFilterExpand()} variant="primary-dark" icon={IconName.FILTER} iconsize={Size.LG}>
                {this.filter_label}
              </lbj-button>
            </div>
            {this.renderSearchInput(filteredDataArray)}
          </div>
          <div class="filters">
            <div class="filter-wrapper-header">
              <lbj-title variant={TextStyles.HEADING3}>{this.filter_label}</lbj-title>
              <lbj-icon
                class="close-filter"
                onClick={() => this.toggleFilterExpand()}
                name={IconName.CLOSE}
                size={Size.MD}
                onKeyPress={event => {
                  if (event.key === 'Enter') this.toggleFilterExpand();
                }}
                aria-label={`Click to close filters.`}
                tabindex="0"
              />
            </div>
            <div class="filter-dropdowns">
              {this.renderFacets(filteredDataArray)}
              <div class="show-selections">
                <lbj-button onClick={() => this.toggleFilterExpand()} variant="primary">
                  {this.search_button}
                </lbj-button>
              </div>
              {this.renderResetLink()}
            </div>
          </div>
        </div>
        <div class="sub-nav">
          <div class="filter-summary">{this.renderFilterSummary(filteredDataArray)}</div>
          {this.toggle_top_pagination ? this.renderPagination(filteredDataArray) : null}
          {this.toggle_rendering && this.getRenderToggle()}
        </div>

        {this.renderResults(filteredDataArray)}
        {this.renderPagination(filteredDataArray)}
      </Host>
    );
  }

  /**
   * Filters the data based on the current search text and selected facet filters.
   * @private
   */
  private getRenderToggle() {
    // Get the available rendering modes
    const availableModes = this.renderingMode.getAvailableModes();

    // Generate the JSX for each available mode
    const modeIcons = Object.keys(availableModes).map(mode => {
      // Use the icon name from the available mode
      const iconName = availableModes[mode].icon;

      // Set the color based on the active property of the mode
      const iconColor = availableModes[mode].active ? IconColor['PRIMARY-A'] : IconColor['PRIMARY-B-500'];

      return (
        <lbj-icon
          class={mode}
          onClick={() => this.toggleRenderingMode(mode)}
          onKeyPress={event => {
            if (event.key === 'Enter') this.toggleRenderingMode(mode);
          }}
          name={iconName}
          size={Size.MD}
          color={iconColor}
          aria-label={`Change rendering mode to ${mode}`}
          tabindex="0"
        ></lbj-icon>
      );
    });

    return <div class="render-toggle">{modeIcons}</div>;
  }

  /**
   * Filters the data based on the current search text and selected facet filters.
   * @param mode
   */
  public toggleRenderingMode(mode: string) {
    // check if mode string is one of the this.renderingMode.getAvailableModes().keys()
    if (Object.keys(this.renderingMode.getAvailableModes()).includes(mode)) {
      this.renderingMode.setActiveMode(mode);
      this.rendering_mode_current = mode;
    }
  }

  /**
   * Renders dropdown menus for each facet based on filtered data. This method dynamically
   * generates select elements for each facet, populating them with options that represent
   * the available tags and their respective counts. It also pre-selects options based on
   * current filter criteria and attaches event handlers for selection changes.
   *
   * @param filteredDataArray - The array of result items that have been filtered.
   * @returns An array of JSX elements, each representing a dropdown menu for a facet.
   */
  private renderFacets(filteredDataArray: ResultItem[]) {
    // Ensure facets are processed to reflect the current filtered data.
    this.processFacets(filteredDataArray);
    const facetDisplays = []; // Will store JSX elements for each facet's select list.
    let filters = []; // Will store a list of facetFilters.
    // Pull facet types from the filter_types property.
    // If the customFilters property is null and the filter_types property is not empty, then we need to parse the filter_types property.
    if (this.customFilters == undefined && this.filter_types !== '') {
      this.filter_types.split(';').forEach(facetConfig => {
        // split the facetConfig into a list of config strings using semi-colon.
        const config = facetConfig.split(';');
        // Each config string is a key value pair separated by an equals sign.
        // Example: tags=type:checkbox;authors=type:multi;tags=type:dropdown
        // Go through each config string and split it into key value pairs.
        config.forEach(configString => {
          // Split the key and value by the equals sign.
          const [key, value] = configString.split('=');
          const filter: FacetFilter = {
            name: key,
            label: key,
            type: 'dropdown',
            exclude: '',
            sort: '',
          };
          // Expand the value by splitting using the ampersand to have one or more key value pairs. The key value pair is split up using colons.
          const valuePairs = value.split('&');
          // Initialize the facet object.
          // Go through each key value pair and set the facet object.
          valuePairs.forEach(pair => {
            const [pairKey, pairValue] = pair.split(':');
            if (pairKey === 'label') {
              filter.type = pairValue;
            }
            if (pairKey === 'type') {
              filter.type = pairValue;
            }
            if (pairKey === 'exclude') {
              filter.exclude = pairValue;
            }
            if (pairKey === 'sort') {
              filter.sort = pairValue;
            }
          });
          // Add the FacetFilter to the filters array.
          filters.push(filter);
        });
      });
      this.customFilters = filters;
      // console.log('renderFacets() :: custom filters detected', filters);
    }
    filters = this.customFilters;

    if (Object.keys(this.facets).length > 0) {
      // If we have an unempty filters array, then we render the facets based on the filters array.
      if (filters !== undefined && filters.length > 0) {
        // console.log('renderFacets() :: Filters are not empty:', filters);
        // Go through each filter and render the facets based on the filter type.
        filters.forEach(filter => {
          // console.log('renderFacets() :: reviewing this filter:', filter);
          // Check if the facet is in the list of facets.
          const findFacetKey = this.caseInsensitiveKeyExists(this.facets, filter.name);
          if (findFacetKey !== false) {
            const tags = this.facets[findFacetKey];
            // Check if the facet type is a checkbox.
            if (filter.type === 'checkbox') {
              // Render the checkbox facet.
              // console.log('renderFacets() :: Rendering checkbox facet:', filter.name, tags);
              facetDisplays.push(this.renderCheckboxFacet(filter.name, tags));
            }
            // Check if the facet type is a multi facet.
            if (filter.type === 'multi') {
              // Render the multi facet.
              facetDisplays.push(this.renderMultiFacet(filter.name, tags));
            }
            // Check if the facet type is a dropdown.
            if (filter.type === 'dropdown') {
              // Render the dropdown facet.
              facetDisplays.push(this.renderDropdownVertical(filter.name, tags));
            }
          }
        });
        // console.log('renderFacets() :: Facet Displays that have been rendered:', facetDisplays);
        return facetDisplays;
      }
      // Iterate over facets to construct dropdown menus.
      Object.entries(this.facets).forEach(([facetName, tags]) => {
        const facetDropdown = this.renderDropdownFacet(facetName, tags);
        if (facetDropdown != undefined) {
          facetDisplays.push(facetDropdown);
        }
      });
    }
    return facetDisplays;
  }

  /**
   * Renders a search input field if the full-text search is not hidden and if there is either
   * searchable text present or the filtered data array is not empty. This input allows users
   * to enter search terms for filtering the results.
   *
   * @param filteredDataArray - The array of result items after applying any existing filters.
   * @returns A JSX element representing a search input field, or undefined if conditions
   *          prevent the field from being displayed.
   */
  private renderSearchInput(filteredDataArray: ResultItem[]) {
    // Check if the search input should be hidden or if there are no results and no search text.
    if (this.fulltext_hide || (filteredDataArray.length === 0 && (this.searchText === '' || this.searchText == null))) {
      return; // Do not render the input in these cases.
    }

    // Render the search input field with a bound event handler for changes.
    return (
      <div class="search-with-icon">
        <input
          id="fulltext"
          class="fulltext"
          type="text"
          name="fulltext"
          value={this.searchText}
          placeholder={this.search_button}
          onInput={event => this.debounceFulltext(event)}
        />

        <lbj-icon class="button__icon search-icon" name={IconName.SEARCH} color={IconColor.BLACK} size={Size.LG}></lbj-icon>
      </div>
    );
  }

  /**
   * Renders a reset button if there are any selected facet filters or if there is non-empty
   * search text. The button allows users to clear all filters and search text, returning
   * the view to its initial state.
   *
   * @returns A JSX element representing a reset button, or null if there are no filters or
   *          search text to reset.
   */
  private renderResetLink() {
    // Determine if conditions warrant the rendering of the reset button based on the presence
    // of selected facet filters or non-empty, non-whitespace search text.
    const hasSelectedFacets = Object.keys(this.selectedFacetFilters).some(facetName => this.selectedFacetFilters[facetName].length > 0);
    const hasSearchText = Boolean(this.searchText && this.searchText.trim() !== '');

    // Render the reset button if either condition is met.
    if (hasSelectedFacets || hasSearchText) {
      return (
        <div
          class="reset"
          onClick={event => this.reset(event)}
          onKeyPress={event => {
            if (event.key === 'Enter') this.reset(event);
          }}
          aria-label={`Click to remove filters.`}
          tabindex="0"
        >
          {this.reset_button}
        </div>
      );
    }

    // Return null if there's nothing to reset.
    return null;
  }

  /**
   * Constructs and returns an array of JSX elements representing the summary of current filters,
   * including the total number of filtered results, selected facet filters, and any entered
   * search text. Each filter element is interactive, allowing users to remove the filter by
   * clicking on it.
   *
   * @param filteredDataArray - The array of items that have been filtered according to the
   *                            current search and facet selections.
   * @returns An array of JSX elements, each representing a part of the current filter summary.
   */
  private renderFilterSummary(filteredDataArray: ResultItem[]) {
    const filterSummary = [];
    const explainerSummary = [];

    // Add selected facet filters to the summary.
    Object.keys(this.selectedFacetFilters).forEach(facetName => {
      // Updated to handle multiple facet values per facet selection.
      // Go through each selected facet value and add it to the filter summary.
      this.selectedFacetFilters[facetName].forEach(FacetValue => {
        filterSummary.push(
          <div
            class="search-item"
            onClick={event => this.handleRemoveFilter(event, facetName, FacetValue)}
            onKeyPress={event => {
              if (event.key === 'Enter') this.handleRemoveFilter(event, facetName, FacetValue);
            }}
            aria-label={`Click to remove filter.`}
            tabindex="0"
          >
            <span class="label">{FacetValue}</span>
            <span class="remove">
              <lbj-icon name={IconName.CLOSE} color={IconColor.BLACK} size={Size.XS}></lbj-icon>
            </span>
          </div>,
        );
      });
    });
    for (const facetName in this.selectedFacetFilters) {
      this.selectedFacetFilters[facetName].forEach(tag => {
        if (this.items_explained != undefined && this.items_explained.length > 0) {
          const explainerItem = this.items_explained.find(item => item.explains === tag);
          if (explainerItem != undefined) {
            if (explainerSummary.length > 0) {
              explainerSummary.push(<span class="separator">, </span>);
            }
            explainerSummary.push(
              <lbj-popover variant="link" popover_action_text={tag}>
                <div slot="content" innerHTML={explainerItem.description}></div>
              </lbj-popover>,
            );
          }
        }
      });
    }

    // Include the search text in the summary, if present.
    if (this.searchText && this.searchText.trim() !== '') {
      filterSummary.push(
        <div
          class="search-item"
          onClick={event => this.handleRemoveFilter(event, 'searchText')}
          onKeyPress={event => {
            if (event.key === 'Enter') this.handleRemoveFilter(event, 'searchText');
          }}
          aria-label={`Click to remove search text filter.`}
          tabindex="0"
        >
          <span class="label">{this.searchText}</span>
          <span class="remove">
            <lbj-icon name={IconName.CLOSE} color={IconColor.BLACK} size={Size.XS}></lbj-icon>
          </span>
        </div>,
      );
    }
    // Add Explainer.
    if (explainerSummary.length > 0) {
      filterSummary.push();
    }

    // Display the count of items in the filtered data array.
    filterSummary.push(
      <div class="results-count">
        <em>
          {filteredDataArray.length} {this.results_count}
        </em>
        {explainerSummary.length > 0 && (
          <div class="explainers">
            {this.explainer_cta} {explainerSummary}
          </div>
        )}
      </div>,
    );
    return filterSummary;
  }

  /**
   * Sanitizes the provided HTML string to remove potentially malicious content, allowing only
   * a safe subset of tags and attributes. This method helps prevent XSS (Cross-Site Scripting)
   * attacks by ensuring that only specified tags and attributes can be present in the output.
   *
   * @param html - The HTML string to be sanitized.
   * @returns A sanitized version of the HTML string, containing only allowed tags and attributes.
   */
  private sanitizeHTML(html): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'div', 'span', 'hr'],
      ALLOWED_ATTR: ['href', 'class'],
    });
  }

  // Check if the key is a key in the this.explainer_columns property.
  private isExplainerKey(key: string): boolean {
    return this.explainer_columns.split(';').includes(key);
  }

  // Check if the key is the first key in the this.title_columns property.
  private isFirstTitleKey(key: string): boolean {
    // Only check if the title_columns property is not empty.
    if (this.title_columns === '') {
      return false;
    }
    return this.title_columns.split(';')[0] === key;
  }

  // Check if the key is a key in the this.title_columns property.
  private isTitleKey(key: string): boolean {
    // Only check if the title_columns property is not empty.
    if (this.title_columns === '') {
      return false;
    }
    return this.title_columns.split(';').includes(key);
  }

  // Check if the first key is a key in the this.description_columns property.
  private isFirstDescriptionKey(key: string): boolean {
    // Only check if the title_columns property is not empty.
    if (this.description_columns === '') {
      return false;
    }
    return this.description_columns.split(';')[0] === key;
  }

  // Check if the key is a key in the this.description_columns property.
  private isDescriptionKey(key: string): boolean {
    // Only check if the title_columns property is not empty.
    if (this.description_columns === '') {
      return false;
    }
    return this.description_columns.split(';').includes(key);
  }

  // Check if the key is a key in the this.image_columns property.
  private isImageKey(key: string): boolean {
    // Only check if the title_columns property is not empty.
    if (this.image_columns === '') {
      return false;
    }
    return this.image_columns.split(';').includes(key);
  }

  // Check if the key is a key in the this.image_columns property.
  private isImageUrlKey(key: string): boolean {
    // Only check if the title_columns property is not empty.
    if (this.image_url_columns === '') {
      return false;
    }
    return this.image_url_columns.split(';').includes(key);
  }

  // Render an lbj-popover with the explainer content.
  private renderExplainer(item: ResultItem) {
    if (this.items_explained != undefined) {
      const explainerContainers = [];

      // Process and add other facets
      Object.keys(item)
        .filter(key => this.isExplainerKey(key))
        .forEach(key => {
          const explainerValues = item[key].split(';').map((value: string) => this.formatExplainer(value));

          // Wrap the collected facet values in a div with "mini-tags" class
          if (explainerValues.length > 0) {
            explainerContainers.push(explainerValues);
          }
        });

      // If explainerContainers is not empty:
      if (explainerContainers.length > 0) {
        // Add this.explainer_cta to the front of the array.
        explainerContainers.unshift(<span class="explainer_cta">{this.explainer_cta} </span>);
        // And wrap the explainerContainers in a div with the class "explainers".
        return <div class="explainers-summary">{explainerContainers}</div>;
      }
    }
  }

  /**
   * Renders facets of a given item as mini tags, if mini tags display is enabled. This method
   * filters out non-facet keys and keys marked for exclusion from mini tags, then generates
   * clickable tags for each facet value. Facet values containing HTML are sanitized before rendering.
   *
   * Why would facets have html if we don't support HTML in the CSV? Good question! We support
   * it so that we can highlight inside of mini tags if we're fulltext searching them. This function
   * implicitly determines if html exists in the rendered mini tag text and pushes it into the
   * innerHTML if it exists.
   *
   * @param item - The item whose facets are to be rendered as mini tags.
   * @returns An array of JSX elements representing the mini tags for the item's facets, or undefined
   *          if mini tags display is disabled.
   */
  private renderFacetsAsMiniTags(item: ResultItem) {
    if (!this.mini_tags_show) {
      return;
    }
    // Initialize a container for the facet values
    const facetContainers = [];

    // Process and add other facets
    Object.keys(item)
      .filter(key => this.isNotMiniTag(key) && this.isFacetKey(key) && item[key] && this.isNotEyebrow(key))
      .forEach(key => {
        const facetValues = item[key].split(';').map((value: string) => this.formatMiniTags(item, key, value));

        // Wrap the collected facet values in a div with "mini-tags" class
        if (facetValues.length > 0) {
          facetContainers.push(facetValues);
        }
      });

    return facetContainers;
  }

  private formatMiniTags(item: ResultItem, key: string, value: string) {
    // If the key is an explainer key, then we need to render it as a popover.
    if (this.mini_tags_explainers && this.isExplainerKey(key)) {
      const explainer = this.formatExplainer(value);
      // If the explainer is empty, then we don't want to render it as one.
      if (explainer != undefined) {
        return explainer;
      }
    }
    // Detect if value contains HTML
    const containsHtml = /<\/?[a-z][\s\S]*>/i.test(value);
    return containsHtml ? (
      <div
        class="mini-tag"
        onClick={event => this.handleFacetSelection(event, key, value)}
        onKeyPress={event => {
          if (event.key === 'Enter') this.handleFacetSelection(event, key, value);
        }}
        aria-label={`Filter by ${this.sanitizeHTML(value)}.`}
        tabindex="0"
        innerHTML={this.sanitizeHTML(value)}
      ></div>
    ) : (
      <div
        class="mini-tag"
        onClick={event => this.handleFacetSelection(event, key, value)}
        onKeyPress={event => {
          if (event.key === 'Enter') this.handleFacetSelection(event, key, value);
        }}
        aria-label={`Filter by ${this.sanitizeHTML(value)}.`}
        tabindex="0"
      >
        {value}
      </div>
    );
  }

  private formatExplainer(value: string) {
    // load the explainer item.
    const explainerItem = this.items_explained.find(explainer => explainer.explains === value);
    if (explainerItem != undefined) {
      return (
        <lbj-popover variant="mini_tag" popover_action_text={explainerItem.explains}>
          <div slot="content" innerHTML={explainerItem.description}></div>
        </lbj-popover>
      );
    }
  }

  /**
   * Renders the summary content for a given item, including a sanitized description and
   * mini tags for its facets. This method ensures that the description is only added if
   * displaying descriptions is enabled and the description exists. It then includes the
   * item's facets as mini tags, encapsulated within a div.
   *
   * This also includes a really hairy fix for a bug noticed early on. Each <li> needs
   * a unique key="" in order for the StencilJS environment to know which elements require
   * updating. If you remove the key declaration, the titles won't update. Other parts
   * pay not update either.
   *
   * @param item - The item whose summary content is to be rendered.
   * @returns An array of JSX elements representing the item's description (if applicable)
   *          and its facets as mini tags.
   */
  private renderSummaryContent(item: ResultItem) {
    const summaryContent = [];

    // Add the item's description if displaying descriptions is enabled and the description is non-empty.
    const description = this.renderDescriptionText(item);
    if (this.renderingMode.getActiveMode() === 'table' || this.show_description) {
      summaryContent.push(description);
    }

    // Include the item's explainers as clickable buttons.
    // summaryContent.push(this.renderExplainer(item));

    // Include the item's facets as mini tags.
    if (this.renderingMode.getActiveMode() != 'table' || (this.description_toggle_automatic_mini_tags_table && this.renderingMode.getActiveMode() === 'table')) {
      summaryContent.push(<div class="mini-tags">{this.renderFacetsAsMiniTags(item)}</div>);
    }

    return summaryContent;
  }

  // Render the title using columns from this.title_columns.
  private renderTitleText(item: ResultItem) {
    const titleColumns = this.title_columns.split(';');
    const titleText = [];
    titleColumns.forEach(column => {
      if (item[column] != undefined) {
        titleText.push(item[column]);
      }
    });
    return titleText.join(this.title_columns_separator).toString();
  }

  // Render the description from this.description_columns.
  private renderDescriptionText(item: ResultItem) {
    const descriptionColumns = this.description_columns.split(';');
    const descriptionText = [];
    descriptionColumns.forEach(column => {
      if (item[column] != undefined) {
        let description_text = '';
        // Format the description text if it's mini-tags.
        if (this.isFacetKey(column)) {
          description_text = item[column].split(';').map((value: string) => this.formatMiniTags(item, column, value));
        } else {
          description_text = item[column];
        }

        // Prefixing it with the column name if the this.description_columns_prefix_title is true.
        if (
          this.description_columns_prefix_title &&
          ((this.isFirstDescriptionKey(column) && !this.description_columns_prefix_title_skip_first) || !this.isFirstDescriptionKey(column))
        ) {
          // change the following to use JSX instead of string concatenation.
          let desc_text = description_text;
          if (typeof description_text === 'string') {
            desc_text = <span innerHTML={description_text}></span>;
          }
          descriptionText.push(
            <span>
              {this.toSentenceCase(column)}
              <span innerHTML={this.description_columns_suffix_separator}></span>
              {desc_text}
            </span>,
          );
        } else {
          // if string, then add it to innerHTML. If not, then add it as a child.
          if (typeof description_text === 'string') {
            descriptionText.push(<span innerHTML={description_text}></span>);
          } else {
            descriptionText.push(description_text);
          }
        }
        // if not the last item, then add a separator.
        if (descriptionColumns.indexOf(column) < descriptionColumns.length - 1) {
          descriptionText.push(<span innerHTML={this.description_columns_separator}></span>);
        }
      }
    });
    // return the jsx rendered as text
    return descriptionText;
  }

  private renderTableHeader() {
    const columns = [];
    // Create the columns array by removing any columns that are in this.description_columns but not this.isFirstDescriptionKey and the same for titles.
    // This is an edge-case where someone has included title or description in the columns list but asked for them to be rendered in-line elsewhere..
    this.table_columns_includes.split(';').forEach(column => {
      if (this.isFirstTitleKey(column) || this.isFirstDescriptionKey(column) || (!this.isDescriptionKey(column) && !this.isTitleKey(column))) {
        if (this.isTitleKey(column)) {
          column = this.title_columns_label;
        }
        if (this.isDescriptionKey(column)) {
          column = this.description_columns_label;
        }
        columns.push(column);
      }
    });
    // Generate the header row for the table based on this.table_columns_includes values.
    return (
      <thead>
        <tr>
          {columns.map(column => {
            return <th>{this.toSentenceCase(column)}</th>;
          })}
        </tr>
      </thead>
    );
  }

  /**
   * Renders a list of results based on the current page and pagination settings from the
   * filtered data array. Each item is presented with its title and a summary content, which
   * includes a sanitized description and mini tags for its facets. The method supports a
   * target setting for links and dynamically generates a unique key for each item to ensure
   * React can efficiently update the list on changes.
   *
   * @param filteredDataArray - The array of items filtered according to current search and
   *                            facet selections.
   * @returns An array of JSX elements representing the list items for the current page of results.
   */
  private renderResults(filteredDataArray: ResultItem[]) {
    // Mapping of column numbers to CSS class names.
    const columnsClassMap = {
      2: 'two-col',
      3: 'three-col',
      4: 'four-col',
      5: 'five-col',
      6: 'six-col',
    };

    // Default class for results container, adjusted based on columns property.
    let columnsClass = 'results';
    if (filteredDataArray.length > 0 && this.columns !== undefined && columnsClassMap[this.columns]) {
      columnsClass += ` ${columnsClassMap[this.columns]}`;
    }

    const startIndex = (this.currentPage - 1) * this.pagination;
    const endIndex = startIndex + this.pagination;
    const pageItems = filteredDataArray.slice(startIndex, endIndex);

    // Handle case with no results.

    const results = [];

    if (pageItems.length > 0) {
      pageItems.forEach(item => {
        const summaryContent = this.renderSummaryContent(item);
        const title = this.renderTitleText(item);
        let image = this.renderImage(item, 'image');

        switch (this.renderingMode.getActiveMode()) {
          case 'card':
            results.push(
              <li class="lede" key={this.generateKeyForItem(title + item.url)}>
                <lbj-card
                  variant="grid"
                  headline={title}
                  headline_html={true}
                  href={item.url}
                  eyebrow={this.returnEyebrow(item)}
                  dateposition="below"
                  date={this.returnDate(item)}
                  blank_target={this.blank_target}
                >
                  {image}
                  {summaryContent.length > 0 && <div slot="body">{summaryContent}</div>}
                </lbj-card>
              </li>,
            );
            break;
          case 'person':
            // if image is empty, then render a div with the initials of the
            // capitalized name (which is the title).
            if (image == undefined) {
              image = (
                <div slot="image" class="user-initials mb-6">
                  <a href={item.url}>{this.personInitials(item)}</a>
                </div>
              );
            }
            results.push(
              <li class="lede" key={this.generateKeyForItem(title + item.url)}>
                <lbj-person-card name={title} url={item.url}>
                  {image}
                  {summaryContent.length > 0 && (
                    <div slot="position" class="pt-2 lg:pt-3">
                      <a href={item.url} class="text-gray-800">
                        {summaryContent}
                      </a>
                    </div>
                  )}
                </lbj-person-card>
              </li>,
            );
            break;
          case 'table':
            // Review each row and create a header for the table.
            const rows = [];
            this.table_columns_includes.split(';').forEach(column => {
              // if item has the column, then we need to render it.
              let value = [];
              if (item[column]) {
                // Check if the column is the title column.
                if (this.isFirstTitleKey(column)) {
                  // Potentially render the image.
                  if (image != undefined && this.image_with_title && this.image_above_title) {
                    value.push(image);
                  }
                  // Render the title text.
                  if (this.description_below_title && this.renderDescriptionText(item).length > 0) {
                    if (item.url != undefined && item.url.trim() != '') {
                      value.push(
                        <lbj-lede
                          headline={title}
                          headline_html={true}
                          href={item.url}
                          eyebrow={this.returnEyebrow(item)}
                          date={this.returnDate(item)}
                          componentvariant="expanded"
                          blank_target={this.blank_target}
                        >
                          <div slot="summary">{summaryContent}</div>
                        </lbj-lede>,
                      );
                    } else {
                      value.push(
                        <lbj-lede
                          headline={title}
                          headline_html={true}
                          eyebrow={this.returnEyebrow(item)}
                          date={this.returnDate(item)}
                          componentvariant="expanded"
                          blank_target={this.blank_target}
                        >
                          <div slot="summary">{summaryContent}</div>
                        </lbj-lede>,
                      );
                    }
                  } else {
                    // If the title has a URL, then we need to render it as a link.
                    // Otherwise, we just render the title.
                    if (item['url'] && item['url'].trim()) {
                      value.push(
                        <a class="lede__headline-link" href={item.url} aria-label={'Read more about ' + title} target={this.blank_target ? '_blank' : undefined}>
                          <lbj-title variant="heading-6" hasHtml={true} innerHTML={title}></lbj-title>
                        </a>,
                      );
                    } else {
                      value.push(<lbj-title variant="heading-6" hasHtml={true} innerHTML={title}></lbj-title>);
                    }
                  }
                  // Potentially render the image.
                  if (image != undefined && this.image_with_title && !this.image_above_title) {
                    value.push(image);
                  }
                } else if (this.isFirstDescriptionKey(column) && this.description_below_title === false) {
                  value = summaryContent;
                } else if (!this.isTitleKey(column) && !this.isDescriptionKey(column)) {
                  value = <div innerHTML={item[column]}></div>;
                  if (this.isExplainerKey(column)) {
                    value = item[column].split(';').map((value: string) => this.formatExplainer(value));
                  }
                  if (this.isFacetKey(column)) {
                    value = item[column].split(';').map((value: string) => this.formatMiniTags(item, column, value));
                  }
                } else if (this.isImageKey(column)) {
                  value.push(image);
                }
              }
              rows.push(<td>{value}</td>);
            });
            results.push(<tr key={this.generateKeyForItem(title + item.url)}>{rows}</tr>);
            break;
          case 'lede':
          default:
            results.push(
              <li class="lede" key={this.generateKeyForItem(title + item.url)}>
                <lbj-lede
                  headline={title}
                  headline_html={true}
                  href={item.url}
                  eyebrow={this.returnEyebrow(item)}
                  date={this.returnDate(item)}
                  componentvariant="expanded"
                  blank_target={this.blank_target}
                >
                  {summaryContent.length > 0 && <div slot="summary">{summaryContent}</div>}
                </lbj-lede>
              </li>,
            );
            break;
        }
      });
    } else {
      return (
        <div class="results">
          <ul>
            <li class="lede">{this.no_results}</li>
          </ul>
        </div>
      );
    }

    switch (this.renderingMode.getActiveMode()) {
      case 'lede':
      case 'card':
      case 'person':
        return (
          <div class="results-wrapper lede">
            <div class={columnsClass}>
              <ul>{results}</ul>
            </div>
          </div>
        );
      case 'table':
        return (
          <div class="results-wrapper table">
            <table class="table-horizontal-scroll">
              {this.renderTableHeader()}
              <tbody>{results}</tbody>
            </table>
          </div>
        );
    }
  }

  /**
   * Renders pagination controls based on the current state of the component, including buttons
   * for navigating to the previous and next pages, and a display of the current page relative
   * to the total number of pages. The visibility of the navigation buttons is conditional upon
   * the component's current page and the total number of pages determined by the filtered data
   * array length and pagination setting.
   *
   * @param filteredDataArray - The array of items filtered according to current search and
   *                            facet selections.
   * @returns A JSX element representing the pagination controls.
   */
  private renderPagination(filteredDataArray: ResultItem[]) {
    const totalPages = Math.ceil(filteredDataArray.length / this.pagination);
    if (totalPages === 1) {
      return;
    }

    const page_count =
      filteredDataArray.length > 1 ? (
        <span>
          {this.currentPage} {this.pagination_separator} {totalPages}
        </span>
      ) : null;

    const prev_button =
      this.currentPage > 1 ? (
        <lbj-button
          class="prev"
          variant={this.pagination_btn_variant}
          size={Size.SM}
          iconleft={this.prev_icon}
          onClick={event => this.handlePrev(event)}
          aria-label={`Go back one page of results.`}
          tabindex="0"
        >
          {this.prev_button}
        </lbj-button>
      ) : null;

    const next_button =
      this.currentPage < totalPages ? (
        <lbj-button
          class="next"
          variant={this.pagination_btn_variant}
          size={Size.SM}
          icon={this.next_icon}
          onClick={event => this.handleNext(event)}
          aria-label={`Go forward one page of results.`}
          tabindex="0"
        >
          {this.next_button}
        </lbj-button>
      ) : null;

    const pagination_classes = `pagination ${this.pagination_btn_variant} ${!prev_button || !next_button ? 'icon-only' : ''}`;

    return (
      <div class={pagination_classes}>
        {prev_button} {page_count} {next_button}
      </div>
    );
  }

  /**
   * Filters the component's items based on selected facet filters and full-text search criteria,
   * applying "AND" logic between facets and within each facet's selected filters. For full-text
   * search, it uses Fuse.js to perform an advanced search on specified keys, highlighting matched
   * fragments if enabled. This method ensures that the array of ResultItem it returns is directly
   * relevant to the user's selected filters and search input.
   *
   * @returns An array of ResultItem, each potentially modified to include highlighted text matches,
   *          filtered by both facet selections and full-text search criteria.
   */
  private filteredData(): ResultItem[] {
    // Filter items based on selected facet filters with "AND" logic based on excluding facet names listed in this.multi_facet_tags_or
    const multiFacetTagsOr = this.multi_facet_tags_or.split(';');
    // console.log('filteredData() :: selectedFacetFilters', this.selectedFacetFilters);

    // Items before filtering OR columns. Create a list of all and selected facet filters.
    const andSelectedFilters = Object.keys(this.selectedFacetFilters).filter(facetName => !multiFacetTagsOr.includes(facetName));
    const orSelectedFilters = Object.keys(this.selectedFacetFilters).filter(facetName => multiFacetTagsOr.includes(facetName));
    // console.log('filteredData() :: andSelectedFilters', andSelectedFilters);
    // console.log('filteredData() :: orSelectedFilters', orSelectedFilters);

    // OR Facets we are filtering.
    const filtered = [];
    // Go through each item create a list of all filtered items using OR logic for the orSelectedFilters columns.
    this.items.forEach(item => {
      let isMatch = true;
      orSelectedFilters.forEach(facetName => {
        const items_facet_values = item[facetName]?.split(';').map(value => value || '') || [];
        // Exclude any items that do not have any of the selected or filters.
        if (!this.selectedFacetFilters[facetName].some(selectedFilter => items_facet_values.includes(selectedFilter))) {
          // Item did not have a match with one of the selected OR filters.
          isMatch = false;
        }
      });
      if (isMatch) {
        const clonedItem = JSON.parse(JSON.stringify(item)); // Deep clone to avoid modifying original items.
        filtered.push(clonedItem);
      }
    });
    // console.log("filteredData() :: filtered", filtered);
    if (filtered.length === 0) {
      // console.log('filteredData() :: OR logic gave us no results. No point in searching remaining results for filters.', this.selectedFacetFilters);
      return filtered;
    }

    // Go through each filtered item create a new list of all filtered items using AND logic for the andSelectedFilters columns.
    let filtered_round_two = [];
    filtered.forEach(item => {
      let isMatch = true;
      Object.entries(this.selectedFacetFilters).forEach(([facetName, selectedFilters]) => {
        // if the facetName is not in the andSelectedFilters, then we do not want to filter on it.
        // console.log('filteredData() :: checking', facetName);
        if (!andSelectedFilters.includes(facetName)) {
          // Check if an all lowercase facet exists.
          // We unfortunately have to do this because there appears to be
          // an edge case when given a sentence case facet in the source
          // data, the all lowercase facet is not being selected.
          const lowerFacetName = facetName.toLowerCase();
          if (!andSelectedFilters.includes(lowerFacetName)) {
            // We abandon this filter if it is not in the andSelectedFilters either with given case or case-insensitiveness..
            return;
          }
        }
        // console.log('filteredData() :: reviewing', facetName, selectedFilters);
        // This code accesses a property from the `item` object in a case-insensitive
        // way by finding a key that matches `facetName`, ignoring case.
        // If a match is found, it splits the property's value by semicolons
        // and processes each value. If no match is found, it returns an empty
        // array as a fallback.
        const items_facet_values = Object.keys(item).find(key => key.toLowerCase() === facetName.toLowerCase())
          ? item[Object.keys(item).find(key => key.toLowerCase() === facetName.toLowerCase())!].split(';').map(value => value || '')
          : [];
        // If all the selected filters are not in the items_facet_values, then we do not have a match.
        if (!selectedFilters.every(selectedFilter => items_facet_values.includes(selectedFilter))) {
          isMatch = false;
        }
      });
      if (isMatch) {
        const clonedItem = JSON.parse(JSON.stringify(item)); // Deep clone to avoid modifying original items.
        filtered_round_two.push(clonedItem);
      }
    });
    if (filtered_round_two.length === 0) {
      // console.log('filteredData() :: no results have been found. No point in searching remaining results for text.', this.selectedFacetFilters);
      return filtered_round_two;
    }
    // Configuration for Fuse.js search.
    const options = {
      includeScore: true,
      keys: this.fulltext_include.split(';'),
      includeMatches: true,
      minMatchCharLength: 3,
      threshold: this.fulltext_threshold,
      ignoreLocation: true,
    };

    // Apply full-text search using Fuse.js if applicable.
    if (this.searchText !== undefined && this.searchText.trim() !== '') {
      const fuse = new Fuse(filtered_round_two, options);
      const results = fuse.search(this.searchText);

      // Map search results to items, applying text highlighting if enabled.
      filtered_round_two = results.map(({ item, matches }) => {
        const clonedItem = JSON.parse(JSON.stringify(item)); // Deep clone to avoid modifying original items.

        if (this.fulltext_highlight) {
          matches.forEach(({ key, indices }) => {
            let text = clonedItem[key];
            // Work backwards through the matches so indices remain correct after insertions
            for (let i = indices.length - 1; i >= 0; i--) {
              // if the this.fulltext_threshold is set to 0, then we only want to highlight exact matches.
              const [start, end] = indices[i];
              if ((this.fulltext_threshold === 0 && text.slice(start, end + 1) == this.searchText) || this.fulltext_threshold > 0) {
                text = `${text.slice(0, start)}<span class="highlight">${text.slice(start, end + 1)}</span>${text.slice(end + 1)}`;
              }
            }
            clonedItem[key] = text; // Update item with highlighted text.
          });
        }

        return clonedItem;
      });
    }

    return filtered_round_two;
  }

  // Helper function to formalize what is a facet column.
  private isFacetKey(key: string): boolean {
    const excludedKeys = this.not_facet.split(';');

    // exclude this.title_columns from being considered facets.
    if (this.title_columns.split(';').includes(key)) {
      return false;
    }

    return !excludedKeys.includes(key);
  }

  // Helper function to formalize what is an eyebrow field.
  private isNotEyebrow(key: string): boolean {
    const includedKeys = this.eyebrow_key.split(';');
    return !includedKeys.includes(key);
  }

  // Helper function to formalize what is a date field. Hard coded.
  private isNotDate(key: string): boolean {
    const includedKeys = 'date';
    return !includedKeys.includes(key);
  }

  // Helper function to explicitly enforce the exclusion of mini tags.
  private isNotMiniTag(key: string): boolean {
    return !this.mini_tags_exclude.split(';').includes(key);
  }

  // Helper function to formally find the eyebrow value.
  private returnEyebrow(item: ResultItem): string | null {
    // Loop through the keys of the object
    for (const key of Object.keys(item)) {
      // If this.isNotEyebrow() returns false, it means the key is an eyebrow.
      if (!this.isNotEyebrow(key)) {
        return item[key]; // Return the eyebrow text.
      }
    }
    return null; // Return null if no eyebrow key is found
  }

  // Helper function to formally find the date value.
  private returnDate(item: ResultItem): string | null {
    // Loop through the keys of the object
    for (const key of Object.keys(item)) {
      // If this.isNotDate() returns false, it means the key is a date field.
      if (!this.isNotDate(key)) {
        // strip html from the date.
        const date_string = item[key]
          .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with a single space
          .trim(); // Remove leading and trailing whitespace
        return date_string;
      }
    }
    return null; // Return null if no date key is found
  }

  // Helper function to convert string to Sentence Case.
  private toSentenceCase(str: string): string {
    const result = str.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  // Helper function to convert string to Sentence Case and singularize.
  private toSentenceCaseSingular(str: string): string {
    const result = this.toSentenceCase(str);

    // Handle specific plural-to-singular conversions
    if (result.endsWith('ies')) {
      // Convert 'ies' to 'y'
      return result.substring(0, result.length - 3) + 'y';
    } else if (result.endsWith('es')) {
      // For words ending in 'es' like 'Boxes' to 'Box', but avoid words like 'Courses'
      const base = result.substring(0, result.length - 2);
      if (!['o', 'ch', 'sh', 'x', 's', 'z'].includes(base.charAt(base.length - 1))) {
        return base;
      }
    } else if (result.endsWith('s') && !result.endsWith('ss')) {
      // General rule for words ending in 's' but not 'ss' like 'classes'
      return result.substring(0, result.length - 1);
    }

    // Return the original result if none of the above conditions are met
    return result;
  }

  // Event Handler for Resetting.
  private reset(event: MouseEvent | KeyboardEvent) {
    if (event != undefined) {
      this.searchText = '';
      this.selectedFacetFilters = {};
      this.currentPage = 1;
    }
  }

  // Event Handler for Selecting Facets.
  private handleSelect(event: Event, facetName: string) {
    // console.log('handleSelect() :: Facet Selection', facetName);
    const target = event.target as HTMLSelectElement; // Cast the event target to HTMLSelectElement for TypeScript
    const facetVal = target.value;

    // Create a new object for selectedFacetFilters to trigger update
    const updatedFacetFilters = { ...this.selectedFacetFilters };

    if (facetVal === 'all') {
      // If "all" is selected, delete the facetName key from updatedFacetFilters
      if (updatedFacetFilters.hasOwnProperty(facetName)) {
        delete updatedFacetFilters[facetName];
      }
    } else {
      // Ensure the array is replaced, not mutated.
      if (this.toggle_multi_facets === false || this.toggle_multi_facets === undefined) {
        // If we don't support multiple tags per facet, then we need to clear the array and use one value.
        updatedFacetFilters[facetName] = [facetVal];
        this.selectedFacetFilters = updatedFacetFilters;
        this.currentPage = 1;
        return;
      }
      // Added support for multiple tags from the same facet.
      // Go through all facet values by using the dom to find all the options that match the facetName and add them to the updatedFacetFilters array.
      if (updatedFacetFilters[facetName] == undefined) {
        updatedFacetFilters[facetName] = [facetVal];
      } else if (!updatedFacetFilters[facetName].includes(facetVal)) {
        updatedFacetFilters[facetName].push(facetVal);
        // Note to future self or others: We don't support removing tags using the drop down filters at the moment.
        // This could be done with checkboxes instead of a dropdown. At the moment, we only support adding tags.
      }
    }

    // Assign the updated object back to selectedFacetFilters to trigger re-render
    this.selectedFacetFilters = updatedFacetFilters;
    this.currentPage = 1;
  }

  // Event Handler for Checkbox Change.
  private handleCheckboxChange(event: Event, facetName: string, tag: string, isChecked = false) {
    // console.log('handleCheckboxChange() :: Checkbox Change', '; facetName = ', facetName, '; tag = ', tag, '; isChecked = ', isChecked);
    // console.log(event);
    // if event has a target and the target is an input element, then we can get the checked value.
    if (isChecked == false && event.target !== undefined && event.target instanceof HTMLInputElement) {
      const target = event.target as HTMLInputElement;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      isChecked = target.checked;
    }

    // Create a new object to trigger state change
    const updatedFacetFilters = { ...this.selectedFacetFilters };

    if (isChecked) {
      // console.log('handleCheckboxChange() :: Adding tag to a specific facet', facetName, tag);
      // Add the tag to the selected filters
      if (updatedFacetFilters[facetName] == undefined) {
        updatedFacetFilters[facetName] = [];
      }
      if (!updatedFacetFilters[facetName].includes(tag)) {
        updatedFacetFilters[facetName].push(tag);
        // console.log('handleCheckboxChange() :: Tag has been added to this facet.', updatedFacetFilters[facetName]);
      }
    } else {
      // console.log('handleCheckboxChange() :: Removing tag from a specific facet', facetName, tag);
      // Remove the tag from selected filters
      if (updatedFacetFilters[facetName] !== undefined) {
        updatedFacetFilters[facetName] = updatedFacetFilters[facetName].filter(value => value !== tag);
        // console.log('handleCheckboxChange() :: Tag has been removed from this facet.', updatedFacetFilters[facetName]);
        if (updatedFacetFilters[facetName].length === 0) {
          delete updatedFacetFilters[facetName];
        }
      }
    }

    // Update the state to trigger re-render
    this.selectedFacetFilters = updatedFacetFilters;
    this.currentPage = 1;
  }

  // Event Handler for debouncing the input on full text search.
  private debounceFulltext(event: Event) {
    // Clear the previous timer if there is one, to ensure only the last typed word triggers the search
    if (this.debounceTimer != undefined) {
      clearTimeout(this.debounceTimer);
    }
    const inputElement = event.target as HTMLInputElement; // Cast the event target to an HTMLInputElement
    const inputValue = inputElement.value; // Access the input value
    this.debounceTimer = window.setTimeout(() => {
      this.handleFulltext(inputValue);
    }, 250); // Adjust the delay as needed.
  }

  // Event handler for full text searching.
  private handleFulltext(fulltext: string) {
    this.searchText = fulltext;
    this.currentPage = 1;
  }

  // Event handler for next button.
  private handleNext(event: MouseEvent | KeyboardEvent) {
    if (event != undefined) {
      this.currentPage = this.currentPage + 1;
    }
  }

  // Event handler for previous button.
  private handlePrev(event: MouseEvent | KeyboardEvent) {
    if (event != undefined) {
      this.currentPage = this.currentPage - 1;
    }
  }

  // Event handler for the Result Summary remove button click.
  private handleRemoveFilter(event: MouseEvent | KeyboardEvent, facetName: string, facetValue?: string) {
    if (event != undefined) {
      if (facetName === 'searchText') {
        this.searchText = '';
        return;
      }
      // Make a new object for selectedFacetFilters that doesn't include the new facet.
      // If the facetValue is not defined, the new object will not include the facetName.
      // If the facetValue is defined, the new object will not include the facetValue, but it will include the facetName with other values.
      const updatedFacetFilters = { ...this.selectedFacetFilters };
      if (facetValue == undefined) {
        delete updatedFacetFilters[facetName];
      } else {
        updatedFacetFilters[facetName] = updatedFacetFilters[facetName].filter(value => value !== facetValue);
        if (updatedFacetFilters[facetName].length === 0) {
          delete updatedFacetFilters[facetName];
        }
      }

      // Trigger the render.
      this.selectedFacetFilters = updatedFacetFilters;
    }
  }

  // Helper function to generate a simple hash to create keys.
  private generateKeyForItem(str: string, length = 12) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    hash = Math.abs(hash); // Ensure it's a positive number
    const hashStr = hash.toString(16); // Convert to hexadecimal
    // Ensure the hash string length is at least `length` long by repeating it, then slice to get desired length
    return hashStr.repeat(Math.ceil(length / hashStr.length)).slice(0, length);
  }

  // Generic event handler for selecting a facet. Used in clickable mini tags.
  private handleFacetSelection(event: MouseEvent | KeyboardEvent, facetName: string, facetVal: string) {
    // console.log('handleFacetSelection() :: Facet Selection', facetName, facetVal);

    if (event != undefined) {
      const facetType = this.determineFacetType(facetName);
      // console.log('handleFacetSelection() :: facetType = ', facetType)
      if (facetType == 'checkbox') {
        // console.log('handleFacetSelection() :: found a checkbox filter was triggered');
        // Trigger a checkbox change event that adds the value.
        this.handleCheckboxChange(event, facetName, facetVal, true);
        return;
      }
      // Create a new object for selectedFacetFilters to trigger update
      const updatedFacetFilters = { ...this.selectedFacetFilters };
      // If toggle_multi_facets is false or undefined, then we only support one tag per facet.
      if (this.toggle_multi_facets === false || this.toggle_multi_facets === undefined) {
        updatedFacetFilters[facetName] = [facetVal];
        // Else, we support multiple tags per facet.
      } else {
        // If the facetName is not in the updatedFacetFilters, then we need to add it.
        if (updatedFacetFilters[facetName] == undefined) {
          updatedFacetFilters[facetName] = [facetVal];
        } else {
          // If the value is not in the array, then we need to add it.
          if (!updatedFacetFilters[facetName].includes(facetVal)) {
            updatedFacetFilters[facetName].push(facetVal);
          }
        }
      }

      // Assign the updated object back to selectedFacetFilters to trigger re-render
      this.selectedFacetFilters = updatedFacetFilters;
      this.currentPage = 1;
    }
  }

  // This function determines the type of a facet by iterating through a list of custom filters.
  // It checks if any filter's `name` property matches the given `facetName`, ignoring case differences.
  // If a match is found, it returns the `type` property of the matched filter; otherwise, it defaults to 'dropdown'.
  private determineFacetType(facetName: string): string {
    // We'll store the matched type here; if not found, we return 'dropdown' later.
    let matchedType: string | null = null;

    // Ensure that `this.customFilters` is defined before iterating.
    if (this.customFilters !== undefined) {
      // console.log('determineFacetType() :: customFilters are being looked at; faceName = ', facetName, '; this.customFilters = ',this.customFilters);
      // Iterate over each filter in the `this.customFilters` array.
      this.customFilters.forEach(filter => {
        // Compare the `filter.name` and `facetName` in a case-insensitive manner.
        // Convert both to lowercase before checking equality.
        if (filter.name.toLowerCase() === facetName.toLowerCase()) {
          // If a match is found, store the `type`.
          // We use the scope of matchedType to be able to return that
          // value up the stack for returning properly. In this author's opinion,
          // forEach is dumb and inefficient because of issues like this.
          matchedType = filter.type;
        }
      });
    }

    // Return the matched type if found; otherwise, return 'dropdown' as a default.
    return matchedType !== null ? matchedType : 'dropdown';
  }

  // Toggle filter expansion.
  private toggleFilterExpand() {
    this.filterExpand = !this.filterExpand;
    let EventName = 'filterClosed';
    if (this.filterExpand == true) {
      EventName = 'filterExpanded';
    }
    // Create custom events for this.
    const event = new CustomEvent(EventName, {
      bubbles: true,
      composed: true,
      detail: {
        filterExpand: this.filterExpand,
      },
    });
    this.el.dispatchEvent(event);
  }

  // The toggleOverride property is the value of toggle_filter
  // unless the screen is less than 480px wide. In that case, the filter
  // toggle is forced on. Once the screen is bigger, we default
  // back to whatever the value is in toggle_filter.
  private setToggleFilterBasedOnScreenSize(): void {
    // Default to the default value of toggle_filter.
    this.toggleOverride = this.toggle_filter;
    if (window.matchMedia('(max-width: 480px)').matches) {
      this.toggleOverride = true;
    }
  }

  // Set the column widths for the table.
  // See the this.componentDidRender() function for where this is called.
  // It's designed to run AFTER the table has been rendered.
  private setColumnWidths() {
    const table = this.el.shadowRoot.querySelector('.results-wrapper table');
    const widths = this.table_columns_widths.split(';');
    const alignments = this.table_columns_alignments.split(';');
    const vertical_alignments = this.table_columns_vertical_alignments.split(';');
    if (table && (vertical_alignments.length > 0 || widths.length > 0 || alignments.length > 0) && this.renderingMode.getActiveMode() === 'table') {
      const rows = table.querySelectorAll('tr');
      // create a local constant list of the widths broken up from the string in this.table_columns_widths separated by a semicolon.
      rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        cells.forEach((cell, index) => {
          if (index < this.table_columns_widths.length) {
            (cell as HTMLElement).style.width = `${widths[index]}%`;
          }
          if (index < this.table_columns_alignments.length) {
            (cell as HTMLElement).style.textAlign = alignments[index];
          }
          if (index < this.table_columns_vertical_alignments.length) {
            (cell as HTMLElement).style.verticalAlign = vertical_alignments[index];
          }
        });
      });
    }
  }

  private renderImage(item: ResultItem, slot?: string) {
    if (this.image_columns === '') {
      return;
    }
    const imageColumns = this.image_columns.split(';');
    const imageTag = [];
    imageColumns.forEach(column => {
      if (item[column] != null && String(item[column]).trim() !== '') {
        // Create an image tag with the src and alt attributes.
        let imageSrc = item[column];
        // if we have Alt tag support in the href column, then we need to split the column into two parts.
        if (this.image_alt_support) {
          // Src is the first part of the split, Alt is the second.
          imageSrc = item[column].split(this.image_alt_separator)[0];
          const imageAlt = item[column].split(this.image_alt_separator)[1];
          // If we have a column(s) designating a url, then we need to use the same index from that column to create the href for the link.
          if (this.image_url_columns != '') {
            // pull the first index from the image_url_columns and use it as the href.
            const imageUrls = this.image_url_columns.split(';');
            const imageHref = item[imageUrls[0]];
            // If we have a slot, then we need to wrap the image in an anchor tag.
            imageTag.push(
              <a href={imageHref} slot={slot} class="block mb-4">
                {<img src={imageSrc} alt={imageAlt} class="w-full" />}
              </a>,
            );
          }
          // Since we have an alt tag, but no href for a link, then we just need to create the image tag with the alt tag.
          else {
            imageTag.push(<img src={imageSrc} alt={imageAlt} slot={slot} />);
          }
          // If we don't have an alt tag, then we just need to create the image tag with the src.
        } else {
          // If we have a column(s) designating a url, then we need to use the same index from that column to create the href for the link.
          if (this.image_url_columns != '') {
            // Pull the image href
            const imageUrlColumn = this.image_url_columns.split(';');
            const imageHref = item[imageUrlColumn[0]];
            imageTag.push(
              <a href={imageHref} slot={slot} class="block mb-4">
                <img src={imageSrc} class="w-full" alt={this.renderTitleText(item)} />
              </a>,
            );
            // If we don't have a column for the href, then we just need to create the image tag with the src.
          } else {
            imageTag.push(<img src={imageSrc} slot={slot} alt={this.renderTitleText(item)} />);
          }
        }
      }
    });
    if (imageTag.length == 0) {
      return;
    }
    // Return the JSX object for rendering.
    return imageTag;
  }

  private renderDropdownFacet(facetName: string, tags: { [p: string]: number }) {
    if (tags != undefined) {
      const options = []; // Stores options for the current facet's select list.
      // Add a default "all" option to the select list.
      options.push(<option value="all">{`${this.facet_prepend} ${this.toSentenceCaseSingular(facetName)}`}</option>);

      // Generate options for each tag in the facet, indicating selection status.
      Object.entries(tags).forEach(([tag, count]) => {
        // If this column is an OR logic column, or if the toggle_multi_facets is
        // false, and we have at least one selected facet from this column, do not display the count.
        let optionLabel = `${tag} (${count})`; // Format label with tag name and count.
        if (this.shouldWeNotCountThisFacet(facetName)) {
          optionLabel = `${tag}`;
        }

        const isSelected = this.selectedFacetFilters[facetName]?.includes(tag); // Determine if the tag is selected.
        options.push(
          <option value={tag} selected={isSelected}>
            {optionLabel}
          </option>,
        );
      });

      // Return the select element for the facet with an event handler for selection changes.
      return (
        <select id={`facet-${facetName}`} class="dropdown" onInput={event => this.handleSelect(event, facetName)}>
          {options}
        </select>
      );
    }
  }

  private renderDropdownVertical(facetName: string, tags: { [p: string]: number }) {
    const dropdownVariation = this.renderDropdownFacet(facetName, tags);

    // Return a container with the checkboxes.
    return (
      <div class="facet-dropdown-group">
        <div class="alt-inline">{dropdownVariation}</div>
        <lbj-collapse variant="plus-line" class="alt-vertical">
          <div slot="summary">{`${this.facet_prepend} ${this.toSentenceCaseSingular(facetName)}`}</div>
          <div slot="content">{dropdownVariation}</div>
        </lbj-collapse>
      </div>
    );
  }

  private renderCheckboxFacet(facetName: string, tags: { [tag: string]: number }) {
    if (tags != undefined) {
      const checkboxes = [];

      // Generate checkboxes for each tag in the facet.
      Object.entries(tags).forEach(([tag, count]) => {
        if (tag.length > 0) {
          let label = `${tag} (${count})`; // Format label with tag name and count.
          if (this.shouldWeNotCountThisFacet(facetName)) {
            label = `${tag}`;
          }

          // Find a case-insensitive match for `facetName` in the keys of `this.selectedFacetFilters`.
          const matchingKey = Object.keys(this.selectedFacetFilters).find(key => key.toLowerCase() === facetName.toLowerCase());
          // Use the matched key to check if `tag` is included in the selected facet filters.
          let isChecked = false;
          if (this.selectedFacetFilters[matchingKey] !== undefined) {
            isChecked = matchingKey !== null ? this.selectedFacetFilters[matchingKey].includes(tag) : false;
          }

          // make tag and facetName lowercase and no whitespace and no special characters.
          const tag_id = tag.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const facetName_id = facetName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const tag_id_complete = `facet-${facetName_id}-${tag_id}`;

          checkboxes.push(
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                id={`${tag_id_complete}`}
                name={`facet-${facetName}`}
                value={tag}
                checked={isChecked}
                onChange={event => this.handleCheckboxChange(event, facetName.toLowerCase(), tag)}
              />
              <label htmlFor={`${tag_id_complete}`}>{label}</label>
            </div>,
          );
        }
      });

      const dropdownVariation = this.renderDropdownFacet(facetName, tags);

      // Return a container with the checkboxes.
      return (
        <div class="facet-checkbox-group">
          <div class="alt-inline">{dropdownVariation}</div>
          <lbj-collapse variant="plus-line" class="alt-vertical">
            <div slot="summary">{`${this.facet_prepend} ${this.toSentenceCaseSingular(facetName)}`}</div>
            <div slot="content">{checkboxes}</div>
          </lbj-collapse>
        </div>
      );
    }
  }

  private renderMultiFacet(facetName: string, tags: { [tag: string]: number }) {
    return this.renderDropdownVertical(facetName, tags);
  }

  private caseInsensitiveKeyExists(obj, key) {
    if (Object.keys(obj).some(k => k.toLowerCase() === key.toLowerCase())) {
      // return the key that matches the case-insensitive key.
      return Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    }
    return false;
  }

  private personInitials(item: ResultItem) {
    // Pull the image href
    if (this.person_initials != undefined) {
      const initials_col = this.person_initials.split(';')[0];
      // Create a new var string of item[initials_col] and check it's length is over 0.
      const initials = item[initials_col];
      if (initials != undefined && initials.length > 0) {
        // console.log('personInitials() :: custom initials were found = ', initials);
        return initials;
      }
    }
    return this.renderTitleText(item)
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * Retrieve a deeply nested value from a global variable.
   *
   * Example usage:
   *   - const results = getGlobalNestedValue<ResultItem[]>('drupalSettings', 'module.results');
   *   - results.forEach(item => console.log('item title = ', item.title));
   *
   * @param globalVarName - The name of the global variable (e.g., "drupalSettings").
   * @param path - The dot-delimited path to the nested value (e.g., "module.results"). If empty, the global variable itself is returned.
   * @returns The value if it exists and is valid, or undefined if not found.
   */
  private getGlobalNestedValue<T>(globalVarName: string, path: string | null): T | undefined {
    // Special Case for Drupal Settings.
    if (globalVarName === 'drupalSettings') {
      // Load drupalSettings
      const drupalSettings = this.loadDrupalSettings();

      // Retrieve a deeply nested value
      const results = this.getNestedValue<T>(drupalSettings, path);
      if (results != undefined) {
        return results;
      } else {
        console.warn(`No results found in drupalSettings."${path}".`);
      }
    }
    try {
      // Access the global variable dynamically
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globalVar = (globalThis as any)[globalVarName];
      if (!globalVar) {
        console.warn(`Global variable "${globalVarName}" does not exist.`);
        return undefined;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any = globalVar;

      // Split the path into segments and traverse the object
      if (path != null) {
        const keys = path.split('.');

        for (const key of keys) {
          if (result[key] === undefined) {
            console.warn(`Path "${path}" not found in global variable "${globalVarName}".`);
            return undefined;
          }
          result = result[key];
        }
      }

      return result as T;
    } catch (error) {
      console.error(`Error accessing global variable "${globalVarName}" with path "${path}":`, error);
      return undefined;
    }
  }

  // Helper function to get a nested value from an object. Used for accessing drupalSettings.
  private getNestedValue<T>(obj: Record<string, unknown>, path: string): T | undefined {
    try {
      const keys = path.split('.');
      let result: Record<string, unknown> | unknown = obj;

      for (const key of keys) {
        if (result[key] === undefined) {
          console.warn(`Path "${path}" not found.`);
          return undefined;
        }
        result = result[key];
      }
      return result as T;
    } catch (error) {
      console.error(`Error accessing path "${path}":`, error);
      return undefined;
    }
  }

  // Helper function to load drupalSettings from the page.
  // DrupalSettings are stored in a script tag with the attribute
  // data-drupal-selector="drupal-settings-json".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private loadDrupalSettings(): Record<string, any> {
    const scriptTag = document.querySelector('script[data-drupal-selector="drupal-settings-json"]');
    if (scriptTag == null) {
      throw new Error('drupalSettings script tag not found.');
    }
    try {
      return JSON.parse(scriptTag.textContent || '{}');
    } catch (error) {
      console.error('Failed to parse drupalSettings JSON:', error);
      return {};
    }
  }
}
