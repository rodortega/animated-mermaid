import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Orca has no build step or network, and refuses a plugin folder with node_modules in it, so
// Mermaid is installed at the repo root and copied in here.
const plugin = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(plugin, '..');
const mermaid = dirname(createRequire(join(repo, 'package.json')).resolve('mermaid/package.json'));
const vendor = join(plugin, 'editor', 'vendor');
mkdirSync(vendor, { recursive: true });
copyFileSync(join(repo, 'app', 'animate-mermaid.js'), join(vendor, 'animate-mermaid.js'));
copyFileSync(join(mermaid, 'dist', 'mermaid.min.js'), join(vendor, 'mermaid.min.js'));
copyFileSync(join(mermaid, 'LICENSE'), join(vendor, 'mermaid.LICENSE'));
console.log('Copied animate-mermaid.js and mermaid.min.js into orca-plugin/editor/vendor/');
