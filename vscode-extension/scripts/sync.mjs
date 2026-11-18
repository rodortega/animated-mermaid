import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The webview can only load files from inside the extension, and it must work offline.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const media = join(root, 'media');
const mermaidDist = join(root, 'node_modules', 'mermaid');
mkdirSync(media, { recursive: true });
copyFileSync(join(root, '..', 'app', 'animate-mermaid.js'), join(media, 'animate-mermaid.js'));
copyFileSync(join(mermaidDist, 'dist', 'mermaid.min.js'), join(media, 'mermaid.min.js'));
copyFileSync(join(mermaidDist, 'LICENSE'), join(media, 'mermaid.LICENSE'));
console.log('Copied animate-mermaid.js and mermaid.min.js into media/');
