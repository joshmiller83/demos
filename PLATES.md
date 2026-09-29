# Plates

Each demo on the landing page has a plate: a drawing of the demo as a small machine. The plates live in `site/plates/`, one SVG per demo, named after the demo's slug.

## The rule

Write the demo's line first, in the form "X in, Y out." Draw X on the left, Y on the right, and a machine in between whose working parts show what the code does. Draw objects, not screenshots.

| Plate | Line | In | Machine | Out |
| --- | --- | --- | --- | --- |
| `mini-catalog.svg` | CSV in, catalog out. | A CSV sheet with one column highlighted | A press with rollers | Index cards flying into a card catalog drawer. The highlighted column becomes the divider tabs. |
| `search.svg` | Keywords in, faceted results out. | A magnifying glass over a highlighted word | A ramp with a drop hole over each tube | One glass tube per content type, filled to its count |
| `umf-dashboard.svg` | Editor settings in, public dashboard out. | A clipboard form | A cabinet printed with braces (JSON), wearing a cache tag | A monitor with a tile map, bars and a trend line |
| `wbu-mcp.svg` | A customer's question in, a hold at the local store out. | A chat bubble | A cable and plug into a birdhouse store, with a cardinal on the wire | A bag of seed with a hold tag |
| `urban-pipeline.svg` | Workday XML in, reviewed author bios out. | An XML sheet over a funnel | A queue tank and a review valve | A bio card stamped as a draft, and a bucket for ignored items |
| `flexible-commerce.svg` | A merchant's rules in, a store that follows them out. | A checklist with four rules checked and one open | A machine with a category tree in its window, a gear, and two coins that overprint where one currency becomes another | A price-tagged box flying into one of two carts outside a shop, with a members-only tag on the door |

## How a plate is printed

The plates imitate a risograph print: two spot inks and a navy key line on colored paper, with the inks slightly out of register.

- **Canvas.** `viewBox="0 0 600 400"`. Keep the drawing inside x 36 to 564 and y 36 to 350.
- **Floor.** y 330. Anything that stands sits on it, with a halftone shadow under it: an ellipse at `cy="335"`, `ry="8"`, filled `tk`.
- **Paper.** One stock color per plate, set as `--stock`. Bare paper is the only white. There is no white ink.
- **Inks.** Two spot inks, `--a` and `--b`, plus the key, `--k` (`#1d2340`). No black.
- **Passes.** Three groups, in this order, each with `class="pass"`, which multiplies it onto the paper:
  1. ink A, `transform="translate(3 2)"`
  2. ink B, `transform="translate(-2 3)"`
  3. key, not moved

  The offsets are the same on every plate, as if one press printed all of them.
- **Overprint.** Where A and B overlap you get a third color. Use it on purpose. The dashboard's green is its yellow printed over its blue.
- **Knockouts.** Inside a pass, later shapes cover earlier ones. Fill a shape with `.x` (white) to leave bare paper, like a window cut into a colored machine body. In the key pass, `.kx` and `.kx2` draw an outline with a white fill. That hides key lines behind the shape but lets the spot inks show through.
- **Lines.** `.k` is 3px, for outlines. `.k2` is 2px, for detail. Caps and joins are round.
- **Tints.** `ta`, `tb` and `tk` are halftone dot patterns. Use `tk` for shadows and for grey or metal parts, and `ta` or `tb` for a lighter version of an ink.
- **Movement.** A dotted path (`.dot`) with one to three objects along it shows something traveling between parts.
- **Shapes.** Define each shape once in `<defs>`, then print it from each pass with `<use href="#id" class="…">`. Draw back to front.
- **Words.** None. The page loads plates as images, and images can't use web fonts. Use glyphs instead: commas for CSV, angle brackets for XML, braces for JSON, question marks, checks and crosses.

## Inks and paper

| Ink | Hex | Used on |
| --- | --- | --- |
| Blue | `#2f6bc4` | mini catalog (A), dashboard (B), flexible commerce (B) |
| Teal | `#1b7fb5` | search (A) |
| Pink | `#ec6a9c` | mini catalog (B), search (B) |
| Red | `#e0413b` | WBU (A) |
| Orange | `#f08a2b` | pipeline (A) |
| Yellow | `#ffc530` | dashboard (A), WBU (B) |
| Violet | `#7556c4` | pipeline (B) |
| Green | `#3fa35b` | flexible commerce (A) |

| Stock | Hex | Used on |
| --- | --- | --- |
| Sky | `#dce7f3` | mini catalog |
| Canary | `#f7ecc3` | search |
| Lilac | `#e8e3f2` | dashboard |
| Mint | `#dcede3` | WBU |
| Peach | `#f7e2d6` | pipeline |
| Slate | `#e2e7ed` | flexible commerce |

Multiplying changes an ink on colored paper. Blue and violet turn teal or brown on yellow stocks, and yellow nearly disappears on canary. Give each plate a stock its neighbors on the page don't use, and try the inks on it before drawing much.

## Starting a new plate

Copy this into `site/plates/<slug>.svg`, set the three colors in `:root`, and replace `#thing` with real shapes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <!-- Demo name: X in, Y out.
       One or two sentences on what the drawing shows. -->
  <style>
    :root { --stock: #e2e7ed; --a: #3fa35b; --b: #ec6a9c; --k: #1d2340; }
    .stock { fill: var(--stock); }
    .pass { mix-blend-mode: multiply; }
    .a { fill: var(--a); }
    .b { fill: var(--b); }
    .kf { fill: var(--k); }
    .x { fill: #fff; }
    .ta { fill: url(#ta); }
    .tb { fill: url(#tb); }
    .tk { fill: url(#tk); }
    .k, .k2, .dot { fill: none; stroke: var(--k); stroke-linecap: round; stroke-linejoin: round; }
    .k { stroke-width: 3; }
    .k2 { stroke-width: 2; }
    .dot { stroke-width: 2.4; stroke-dasharray: 0.1 7; }
    .kx, .kx2 { fill: #fff; stroke: var(--k); stroke-linejoin: round; }
    .kx { stroke-width: 3; }
    .kx2 { stroke-width: 2; }
  </style>
  <defs>
    <pattern id="tk" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <circle cx="3" cy="3" r="1.3" style="fill: var(--k)" />
    </pattern>
    <pattern id="ta" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
      <circle cx="3" cy="3" r="1.7" style="fill: var(--a)" />
    </pattern>
    <pattern id="tb" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(75)">
      <circle cx="3" cy="3" r="1.7" style="fill: var(--b)" />
    </pattern>

    <rect id="thing" x="220" y="200" width="160" height="130" rx="10" />
  </defs>

  <rect class="stock" width="600" height="400" />

  <!-- shadows -->
  <g class="pass">
    <ellipse class="tk" cx="300" cy="335" rx="90" ry="8" />
  </g>

  <!-- pass A -->
  <g class="pass" transform="translate(3 2)">
    <use href="#thing" class="a" />
  </g>

  <!-- pass B -->
  <g class="pass" transform="translate(-2 3)">
  </g>

  <!-- key -->
  <g class="pass">
    <use href="#thing" class="k" />
  </g>
</svg>
```

## Adding the entry

Add an `<article>` to the `.demos` section of `site/index.html`. The first article has `class="demo lead"` and shows large, next to its text. It's the demo to see first. The rest fill two columns in order.

```html
<article class="demo">
  <img
    class="plate"
    src="plates/<slug>.svg"
    width="600"
    height="400"
    loading="lazy"
    decoding="async"
    alt="One or two plain sentences that describe the drawing."
  />
  <div>
    <h2>Demo name</h2>
    <p class="io">X in, Y out.</p>
    <p class="desc">Two or three plain sentences, in first person.</p>
    <p class="links">
      <a class="go" href="/<slug>/">Try the thing</a>
      <a href="https://github.com/joshmiller83/demos/tree/main/site/<slug>">Source</a>
    </p>
  </div>
</article>
```

- The `go` link covers the whole entry, plate included. Start it with what the visitor will do there: Try (interactive), Watch (animated) or Read (a write-up).
- If the demo has a length, put it in the description, like "A three-minute re-enactment".
- The social preview shows four plates. To change them, edit `scripts/og.html` and regenerate `site/og.png` with the command at the top of that file.

## Checking a plate

- Open the SVG by itself in a browser, then look at the page at full width and at phone width (about 390px). The plate has to read at 358px wide.
- Look for key lines showing through a shape that should hide them, spot ink showing through a knockout, and anything closer than 36px to the edge.
- Put it next to the other plates. Line weight, ink offsets and shadow depth should match.
