import { Config } from '@stencil/core';
import { postcss } from '@stencil-community/postcss';
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Global CSS is built separately (scripts/build-global-css.mjs), as Lyndon did,
// so it is not bundled into JS or adopted into every component's shadow root.
export const config: Config = {
  namespace: 'lyndon',
  globalScript: 'src/global/global-urban.ts',
  // PapaParse only uses Node's `stream` for server-side duplex parsing, a path
  // the browser never takes, so stub it instead of shipping a polyfill.
  rollupPlugins: {
    before: [
      {
        name: 'stub-node-stream',
        resolveId: id => (id === 'stream' ? '\0stub-stream' : null),
        load: id => (id === '\0stub-stream' ? 'export default {};' : null),
      },
    ],
  },
  plugins: [
    postcss({
      plugins: [postcssImport(), tailwindcss('./tailwind.config.js'), postcssNested(), autoprefixer()],
    }),
  ],
  outputTargets: [
    {
      type: 'www',
      baseUrl: '/lyndon/',
      serviceWorker: null,
      copy: [
        { src: 'pages', dest: '.' },
        { src: 'demo' },
        { src: '../../node_modules/papaparse/papaparse.min.js', dest: 'vendor/papaparse.min.js' },
        { src: '../../node_modules/dompurify/dist/purify.min.js', dest: 'vendor/purify.min.js' },
      ],
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
