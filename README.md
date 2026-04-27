# Multi Text Slicer

A Power BI custom visual that filters a column from a list of values pasted
into a textbox.

Type or paste something like `toto, tata, titi`, and the visual applies a
Basic `IN` filter on the column bound to its data role. Empty values are
ignored; if no non-empty value remains, the filter is cleared.

## Features

- Textarea input — paste or type a list of values.
- The list is split on a configurable separator, each value is trimmed, and
  empty entries are dropped.
- A Basic `IN` filter is pushed to Power BI through the sandboxed
  `applyJsonFilter` API.
- Clearing the textbox (or leaving only empty entries) disables the filter.
- The textbox content is restored when the report is reopened, by reading
  back the persisted filter values.
- Customisable separator and placeholder (format pane).
- Customisable font size, font colour and background colour.
- The textbox can be resized with the mouse (drag the bottom-right
  handle); the chosen size is saved with the report and survives tab
  switches.

## Install in Power BI Desktop

1. Download the latest `multiTextSlicer*.pbiviz` from the
   [Releases page](../../releases).
2. In Power BI Desktop: **Visualizations** pane → **…** → **Import a visual
   from a file** → select the `.pbiviz`.
3. Drop the visual on the report canvas.
4. Drag the column you want to filter into the **Column** data role.
5. Paste values into the textbox — the filter is applied on every keystroke.

## Formatting options

Available under the **Format visual** pane:

- **Text settings**
  - *Separator* — character (or string) used to split the input. Defaults to
    `,`. Use `;`, `|`, a tab, etc. if your values contain commas.
  - *Placeholder* — placeholder shown when the textbox is empty.
- **Appearance** — *Font size*, *Font colour*, *Background colour*.

## Build from source

Requirements: Node.js 20+, npm.

```bash
npm ci
npm start           # pbiviz dev server (for use with "Developer visual")
npm run package     # produces dist/multiTextSlicer*.pbiviz
```

The GitHub Actions workflow in `.github/workflows/release.yml` performs the
same `pbiviz package` step on every push to `main` and publishes the
resulting `.pbiviz` as a GitHub Release (tag `v<version>` from
`pbiviz.json`).

## Project layout

```
pbiviz.json          visual metadata (name, version, guid, API version)
capabilities.json    data roles, dataview mapping, formatting objects, privileges
src/visual.ts        IVisual implementation (textarea, filter logic)
src/settings.ts      formatting model (separator, placeholder, appearance)
style/visual.less    component styles
assets/icon.png      20x20 visual icon
```

## Security & privacy

This visual is designed to minimise its access to report data. It was
reviewed against the Power BI [custom visual security
requirements](https://learn.microsoft.com/power-bi/developer/visuals/develop-power-bi-visuals).

- **No network access.** The visual declares an empty `privileges` array in
  `capabilities.json`, so Power BI will not grant `WebAccess`, `ExportContent`
  or `LocalStorage`. No `fetch`, `XMLHttpRequest`, `WebSocket`, `<script>`,
  `<iframe>`, `<img src=…remote…>`, `<link>`, `@import` or web-font fetch is
  performed by the visual.
- **No access to row data.** The bound column is used only to resolve the
  filter target (`category.source.queryName`). The category values array is
  **never read** by the visual code. The `dataViewMappings` declares
  `dataReductionAlgorithm.top.count = 1`, so the host ships at most one row
  of the column into the sandbox anyway.
- **No unsafe DOM.** Content is rendered exclusively through
  `document.createElement`, `Element.textContent`, `HTMLTextAreaElement.value`
  / `.placeholder`, `setAttribute("aria-label", …)` and single-property
  `element.style.*` assignments. The visual uses no `innerHTML`,
  `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`
  or string-form `setTimeout`/`setInterval`.
- **No dynamic code or external assets.** No CDN script, no remote stylesheet,
  no remote font, no `import()` at runtime.
- **Only outbound channel is `host.applyJsonFilter`.** Values typed into the
  textbox leave the visual sandbox exclusively as filter values via the
  Power BI filter API, the same channel a native slicer uses.
- **Filter values are persisted with the report.** Just like any Power BI
  slicer, the applied filter is saved inside the `.pbix` report. Treat
  textbox contents as you would any slicer selection.
- **Dependencies.** Only first-party Microsoft packages at runtime:
  [`powerbi-visuals-api`](https://www.npmjs.com/package/powerbi-visuals-api),
  [`powerbi-models`](https://www.npmjs.com/package/powerbi-models),
  [`powerbi-visuals-utils-formattingmodel`](https://www.npmjs.com/package/powerbi-visuals-utils-formattingmodel).
  No third-party runtime code.
- **No telemetry.** The visual does not log, collect, or transmit user
  input.

If you find a security issue, please open a private report on the
[repository issues page](../../issues).

## License

MIT — see [LICENSE](./LICENSE).
