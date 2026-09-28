// Builds every demo and gathers the static output into _site/ for GitHub Pages.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const site = join(root, '_site');

// Each demo is an npm workspace whose build writes www/<slug>/.
const demos = ['lyndon-search'];

rmSync(site, { recursive: true, force: true });
cpSync(join(root, 'site'), site, { recursive: true });

for (const slug of demos) {
  execSync(`npm run build -w ${slug}`, { cwd: root, stdio: 'inherit' });
  const out = join(root, slug, 'www', slug);
  if (!existsSync(join(out, 'index.html'))) {
    throw new Error(`${slug}: expected build output at ${out}`);
  }
  cpSync(out, join(site, slug), { recursive: true });
}

console.log(`Assembled ${demos.length} demo(s) into _site/`);
