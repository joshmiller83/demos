import { Component, Host, h, Prop, State, Method } from '@stencil/core';
import { Size, IconName } from '../../utils/enums';

/**
 * The simple search block.
 *
 * @element lbj-simple-search
 */
@Component({
  tag: 'lbj-simple-search',
  styleUrl: 'lbj-simple-search.css',
  shadow: true,
})
export class LbjSimpleSearch {
  /**
   * The headline for the search results.
   */
  @Prop({ reflect: true }) headline: string;
  /**
   * The URI to the solr index powered by JSON:API.
   */
  @Prop({ reflect: true }) solrindex: string;
  /**
   * The column name to filter.
   */
  @Prop({ reflect: true }) filtercol: string;
  /**
   * The value to filter.
   */
  @Prop({ reflect: true }) filtercolval: string;
  /**
   * The number of results to return.
   */
  @Prop({ reflect: true }) max: string;
  /**
   * The number of results to skip.
   */
  @Prop({ reflect: true }) offset: number;
  /**
   * Text to search.
   */
  @Prop({ reflect: true }) fulltext: string;
  /**
   * Facet column to filter.
   */
  @Prop({ reflect: true }) facetcol: string;
  /**
   * Facet value to filter.
   */
  @Prop({ reflect: true }) facetval: string;
  /**
   * A string to tack on the end for sorting.
   */
  @Prop({ reflect: true }) sort: string;
  /**
   * A string to force a two or three column.
   */
  @Prop({ reflect: true }) columns: string;

  @State() private results: string[];
  @State() private facet: string[] = [];
  @State() private facet_context: string[] = [];
  @State() private facet_context_fulltext: string;
  @State() private total: number;
  @State() private errors: string;
  @State() private loading = false;

  /**
   * Load the results from the solr endpoint.
   */
  @Method()
  async loadResults() {
    return this.getSolrResults()
      .then((response: Response) => response.json())
      .then(async response => {
        // await this.sleep(6000);
        // Load items into `this.results`.
        let item = [];
        const results = [];
        response.data.forEach(datum => {
          item = [];
          item['eyebrow'] = datum.attributes.eyebrow;
          item['title'] = datum.attributes.title;
          item['url'] = datum.attributes.path.alias;
          if (datum.attributes.field_display_date != null) {
            item['date'] = datum.attributes.field_display_date;
          }
          results.push(item);
        });
        this.results = results;
        const metafacet = [];
        response.meta.facets.forEach(facet => {
          facet.terms.forEach(value => {
            item = [];
            item['label'] = value.values.label + ' (' + value.values.count + ')';
            item['active'] = value.values.active;
            item['value'] = value.values.value;
            if (facet.id != undefined) {
              item['value'] = value.values.value;
            }
            metafacet.push(item);
          });
        });
        this.facet = metafacet;
        // If we have fulltext or other types of filters on this, keep our
        // context. If we reset and our context expands, this should catch that
        // scenario as well.
        if (metafacet.length > 1) {
          this.facet_context = metafacet;
          this.facet_context_fulltext = this.fulltext;
        }
        this.total = parseInt(response.meta.count);
        this.loading = false;
      })
      .catch(errors => {
        this.errors = errors;
        console.warn('Errors in loading the JSON.', errors);
      });
  }
  //----------------------------------------------------------------------------
  //  Lifecycle
  //----------------------------------------------------------------------------
  componentDidLoad() {
    // Only on start up.
    return this.loadResults();
  }

  private sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  render() {
    const results = [];
    if (this.loading || this.results == undefined) {
      results.push(<li class="lede">Loading...</li>);
    }
    if (this.results != undefined && this.results.length > 0) {
      results.length = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.results.forEach((result: any) => {
        if (result && typeof result == 'object' && 'title' in result) {
          const safeResult = result as { date?: string; eyebrow?: string | { name: string; url: string }[]; title?: string; url?: string }; // Type assertion to handle the null check
          results.push(
            <li class="lede">
              <lbj-lede date={safeResult.date} eyebrow={safeResult.eyebrow} headline={safeResult.title} href={safeResult.url} />
            </li>,
          );
        } else {
          results.push(<li>{result}</li>);
        }
      });
    }
    if (!this.loading && this.results != undefined && this.results.length == 0) {
      results.length = 0;
      results.push(<li class="lede">No results.</li>);
    }
    if (this.errors != undefined && this.errors != '') {
      results.length = 0;
      results.push(<li class="lede">{this.errors.toString()}</li>);
    }
    // Only show "all" facet if we don't have fulltext and if the real facet
    // results are significantly lower than expected.
    let facet_display = '';
    let facet_results = this.facet;
    // if full text exists now and didn't exist when facet_context was developed,
    // we want to show the current facet, not the context facet.
    let show_context_facet = this.fulltext != undefined && !(this.facet_context_fulltext == undefined || this.facet_context_fulltext == '');
    // if we have facets, we want to show the context facet.
    if (show_context_facet) {
      show_context_facet = show_context_facet && facet_results != undefined && this.facet_context != undefined;
    }
    // If the current facet is 1 or less and the context facet has more results
    // show the context facet.
    if (show_context_facet) {
      show_context_facet = show_context_facet && facet_results.length <= 1 && this.facet_context.length > facet_results.length;
    }
    if (show_context_facet) {
      facet_results = this.facet_context;
    }
    if (facet_results != undefined && facet_results.length > 0) {
      const facet = [];
      facet.push(<option value="all">Filter by Content</option>);
      facet_results.forEach(item => {
        if (item['value'] == this.facetval) {
          facet.push(
            <option value={item['value']} selected>
              {item['label']}
            </option>,
          );
        } else {
          facet.push(<option value={item['value']}>{item['label']}</option>);
        }
      });
      facet_display = (
        <select id="facet" class="dropdown" onInput={event => this.handleSelect(event)}>
          {facet}
        </select>
      );
    }
    let reset = '';
    if ((this.facetval && this.facetval != 'all' && this.facetval.length > 0) || (this.fulltext && this.fulltext.length > 0)) {
      reset = (
        <lbj-button class="reset" variant="secondary-dark" size={Size.SM} onClick={event => this.reset(event)}>
          Reset
        </lbj-button>
      );
    }
    let search_input = '';
    let search_btn = '';
    if (this.results != undefined && this.results.length > 0) {
      search_input = <input id="fulltext" class="fulltext" type="text" name="fulltext" value={this.fulltext} onChange={event => this.handleFulltext(event)} />;
      search_btn = (
        <lbj-button class="search" variant="primary" size={Size.SM}>
          Search
        </lbj-button>
      );
    }
    const max_number = parseInt(this.max);
    let has_next = this.total - max_number > 0;
    if (this.offset > 0) {
      // The last page will have no more than the maximum allowed per page.
      has_next = this.total - this.offset > max_number;
    }
    const has_prev = this.offset > 0;
    let next_button = '';
    let prev_button = '';
    if (has_next) {
      next_button = (
        <lbj-button class="next" variant="secondary-blue" size={Size.SM} onClick={event => this.handleNext(event)} icon={IconName.CHEVRON_RIGHT}>
          Next
        </lbj-button>
      );
    }
    if (has_prev) {
      prev_button = (
        <lbj-button class="prev" variant="secondary-blue" size={Size.SM} iconleft={IconName.CHEVRON_LEFT} onClick={event => this.handlePrev(event)}>
          Previous
        </lbj-button>
      );
    }
    let page_count = '';
    if (max_number > 0 && this.total > max_number) {
      let current_page = 1;
      if (this.offset > 0) {
        current_page = this.offset / max_number;
        current_page = current_page + 1;
      }
      const total_pages = Math.ceil(this.total / max_number);
      page_count = current_page + ' of ' + total_pages;
    }
    let columns = 'three-col';
    if (this.columns != undefined) {
      columns = this.columns + '-col';
    }
    return (
      <Host>
        <lbj-title variant="heading-3" element="h3" class="headline">
          {this.headline}
        </lbj-title>
        {facet_display}
        {search_input}
        {search_btn}
        {reset}

        <slot name="results">
          <div class={columns}>
            <ul>{results}</ul>
          </div>
        </slot>
        <div class="pagination">
          {prev_button} {page_count} {next_button}
        </div>
      </Host>
    );
  }

  private reset(event) {
    if (event != undefined) {
      this.facetval = 'all';
      this.fulltext = '';
      // Go back to first page.
      this.offset = 0;
      // Reload.
      this.results.length = 0;
      this.loading = true;
      this.facet_context = undefined;
      this.facet_context_fulltext = undefined;
      return this.loadResults();
    }
  }
  private handleSelect(event) {
    this.facetval = event.target.value;
    // Go back to first page.
    this.offset = 0;
    // Reload.
    this.results.length = 0;
    this.loading = true;
    return this.loadResults();
  }

  private handleFulltext(event) {
    // The funny thing is, the button is completely superfluous. onChange works
    // before you can click the button. Button click is ignored.
    this.fulltext = event.target.value;
    // Go back to first page.
    this.offset = 0;
    // Reload.
    this.results.length = 0;
    this.loading = true;
    return this.loadResults();
  }

  private handleNext(event) {
    if (event != undefined) {
      const max_number = parseInt(this.max);
      if (this.offset == undefined) {
        this.offset = 0;
      }
      this.offset += max_number;
      // Reload.
      this.results.length = 0;
      this.loading = true;
      return this.loadResults();
    }
  }

  private handlePrev(event) {
    if (event != undefined) {
      const max_number = parseInt(this.max);
      this.offset -= max_number;
      // Reload.
      this.results.length = 0;
      this.loading = true;
      return this.loadResults();
    }
  }

  private async getSolrResults() {
    if (this.solrindex == undefined) {
      return undefined;
    }

    // Generate query.
    const d = [];

    // Filter column.
    if (this.filtercol != undefined && this.filtercolval != undefined) {
      d['filter[' + this.filtercol + ']'] = this.filtercolval;
    }

    // Max or pagination element.
    if (this.max != undefined) {
      d['page[limit]'] = this.max;
    }

    // The number of results to skip.
    if (this.offset != undefined) {
      d['page[offset]'] = this.offset;
    }

    // Max or pagination element.
    if (this.fulltext != undefined && this.fulltext != '') {
      d['filter[fulltext]'] = this.fulltext;
    }

    // Facet column.
    if (this.facetcol != undefined && this.facetval != undefined && this.facetval != '' && this.facetval != 'all') {
      d['filter[' + this.facetcol + ']'] = this.facetval;
    }

    // Generate data and filters for query.
    // Encode all components to keep things relatively secure.
    let q = this.solrindex;
    if (Object.keys(d).length > 0) {
      const out = [];
      Object.keys(d).forEach(key => {
        out.push(key + '=' + encodeURIComponent(d[key]));
      });
      q += '?' + out.join('&');
    }

    // Sorting.
    if (this.sort != undefined) {
      q += this.sort;
    }

    return await fetch(q, {
      mode: 'no-cors',
      referrerPolicy: 'no-referrer',
      headers: {
        Accept: 'application/vnd.api+json',
      },
    });
  }
}
