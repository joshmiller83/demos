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
  plugins: [
    postcss({
      plugins: [postcssImport(), tailwindcss('./tailwind.config.js'), postcssNested(), autoprefixer()],
    }),
  ],
  outputTargets: [
    {
      type: 'www',
      baseUrl: '/lyndon-search/',
      serviceWorker: null,
      copy: [{ src: 'demo' }],
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
