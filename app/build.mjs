import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'dist');
const files = ['index.html', 'demo.css', 'demo.js', 'animate-mermaid.js'];

for (const file of files.filter((f) => f.endsWith('.js'))) {
  execFileSync(process.execPath, ['--check', join(here, file)], { stdio: 'inherit' });
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const file of files) copyFileSync(join(here, file), join(out, file));
console.log(`Built ${files.length} files into ${out}`);
