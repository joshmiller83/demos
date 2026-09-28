// Builds the page-level stylesheet (fonts, CSS variables, Tailwind base and
// utilities) with unused utilities purged. Adapted from Lyndon's
// scripts/build-global-css.js.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = join(import.meta.dirname, '..');
const input = join(root, 'src/global/global-urban.css');
// `--out src` writes next to index.html for the dev server; the default is the www build.
const outDir = process.argv.includes('--out') ? join(root, process.argv[process.argv.indexOf('--out') + 1]) : join(root, 'www/lyndon-search');
const output = join(outDir, 'global.css');

const config = {
  ...require(join(root, 'tailwind.config.js')),
  purge: {
    enabled: true,
    content: [join(root, 'src/**/*.html'), join(root, 'src/**/*.tsx'), join(root, 'src/demo/*.js')],
  },
};

const result = await postcss([postcssImport({ path: [dirname(input)] }), tailwindcss(config), autoprefixer()]).process(readFileSync(input, 'utf8'), {
  from: input,
  to: output,
});
mkdirSync(outDir, { recursive: true });
writeFileSync(output, result.css);
console.log(`global.css: ${(result.css.length / 1024).toFixed(1)} KB -> ${output}`);
