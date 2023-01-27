# WorkFlowy MultiFlow

> Columns view for Workflowy

![screenshot](assets/screenshot.png)


## Intro

WorkFlowy MultiFlow adds a multi-column view to WorkFlowy, which enables you to maintain an overview of or relationship between several trees at once.

It can also make moving data within large trees easier, as you can open a new column and cut and paste between columns, rather than scrolling up and down or collapsing and uncollapsing bullets.
Columns are opened by Cmd/Ctrl+Clicking on:

- bullets
- links to other pages
- the breadcrumbs' page title

You can open and close as many columns as you require, and change the layout by clicking on the toolbar icon and selecting the layout from the popup.

When you first click the icon your previous session will be loaded so you can start where you left off.

See the [home page](https://davestewart.co.uk/products/workflowy-multiflow) for more information.


## Development

To build the project, run:

```bash
npm run dev
```

To run the extension as you develop, load the unpacked extension:

- Open Chrome
- Go Window > Extensions
- Click "Load unpacked"
- Choose the project's `dist` folder

You'll need to reload the extension from its settings page if you make changes.

*TODO: migrate to a build setup that supports HMR*

## Releasing

To release, update the `src/manifest.json` version field, and run:
```
npm run release
```

A zip file will be saved to `../releases`.

Upload this file to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/8051cfa9-44b7-4869-9a94-1843ebf8c388?hl=en-GB) and publish using the tools provided.


## Extension Interoperability

Because MultiFlow uses `iframe`s to simulate columns, it can break other extensions which target WorkFlowy via the main `window` object.

If you're an extension developer, you can use the code in [`src/interop/multiflow.js`](https://github.com/davestewart/workflowy-multiflow/tree/main/src/interop/multiflow.js) to grab the active frame (or main window), or respond to state changes:

```js
// copy and paste the MultiFlow Interop API
const MultiFlow = { ... }

// get a reference to the active frame or main window
MultiFlow.getWindow()

// log when MultiFlow state changes
MultiFlow.onChange(function (attr, value, oldValue) {
  console.log({ attr, value, oldValue })
})
```

Hopefully this covers most use cases!

If not, feel free to create an [issue](https://github.com/davestewart/workflowy-multiflow/issues).


## Assets

The file `assets/multiflow.sketch` is a [Sketch](https://www.sketch.com/) file containing the icons and UI images for the extension.


## Links

- [MultiFlow home page](https://davestewart.co.uk/products/workflowy-multiflow)
- [Chrome Web Store](https://chrome.google.com/webstore/detail/workflowy-multiflow/khjdmjcmpolknpccmaaipmidphjokhdf)
- [Product Hunt](https://www.producthunt.com/posts/workflowy-multiflow)
- [Reddit](https://www.reddit.com/r/Workflowy/comments/l9eoqz/workflowy_multiflow_navigate_organise_maintain/)
