const vscode = require('vscode');
const crypto = require('crypto');
const path = require('path');

const CONFIG_KEYS = [
  'theme',
  'darkTheme',
  'nodeStyle',
  'corners',
  'curve',
  'preset',
  'particleStyle',
  'particles',
  'replayOnEdit',
  'respectReducedMotion',
];
const FENCE_OPEN = /^\s*(`{3,}|~{3,})\s*mermaid\b/;

function findMermaidBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const open = FENCE_OPEN.exec(lines[i]);
    if (!open) continue;
    const fence = open[1];
    let end = i + 1;
    while (end < lines.length && !lines[end].trimStart().startsWith(fence)) end++;
    blocks.push({ start: i, end, text: lines.slice(i + 1, end).join('\n') });
    i = end;
  }
  return blocks;
}

function readConfig() {
  const cfg = vscode.workspace.getConfiguration('animatedMermaid');
  return Object.fromEntries(CONFIG_KEYS.map((k) => [k, cfg.get(k)]));
}

class Preview {
  constructor(context, document, blockIndex, onDispose) {
    this.context = context;
    this.document = document;
    this.blockIndex = blockIndex;
    this.isMarkdown = document.languageId === 'markdown';
    this.timer = undefined;
    this.disposables = [];

    const mediaRoot = vscode.Uri.joinPath(context.extensionUri, 'media');
    this.panel = vscode.window.createWebviewPanel(
      'animatedMermaid.preview',
      this.title(),
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [mediaRoot] },
    );
    this.panel.webview.html = this.html(mediaRoot);

    this.disposables.push(
      this.panel.onDidDispose(() => {
        this.dispose();
        onDispose();
      }),
      this.panel.webview.onDidReceiveMessage((msg) => this.onMessage(msg)),
      // Compared by URI: closing and reopening a file gives a new document object for the same file.
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (this.isSameFile(e.document)) {
          this.document = e.document;
          this.scheduleUpdate();
        }
      }),
      vscode.window.onDidChangeTextEditorSelection((e) => {
        if (!this.isMarkdown || !this.isSameFile(e.textEditor.document)) return;
        this.document = e.textEditor.document;
        const index = this.blockAt(e.selections[0].active.line);
        if (index !== -1 && index !== this.blockIndex) {
          this.blockIndex = index;
          this.panel.title = this.title();
          this.send({ type: 'source', ...this.source(), replay: true });
        }
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('animatedMermaid')) this.send({ type: 'config', config: readConfig() });
      }),
    );
  }

  isSameFile(document) {
    return document.uri.toString() === this.document.uri.toString();
  }

  title() {
    const name = path.basename(this.document.fileName || 'Untitled');
    return this.isMarkdown ? `Animated: ${name} #${this.blockIndex + 1}` : `Animated: ${name}`;
  }

  blockAt(line) {
    return findMermaidBlocks(this.document.getText()).findIndex((b) => line >= b.start && line <= b.end);
  }

  source() {
    if (!this.isMarkdown) return { text: this.document.getText(), label: path.basename(this.document.fileName) };
    const blocks = findMermaidBlocks(this.document.getText());
    if (!blocks.length) return { text: '', label: 'No ```mermaid block in this file' };
    this.blockIndex = Math.min(this.blockIndex, blocks.length - 1);
    return {
      text: blocks[this.blockIndex].text,
      label: `${path.basename(this.document.fileName)} · block ${this.blockIndex + 1} of ${blocks.length}`,
    };
  }

  scheduleUpdate() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.send({ type: 'source', ...this.source(), replay: false }), 300);
  }

  showBlock(blockIndex) {
    this.blockIndex = blockIndex;
    this.panel.title = this.title();
    this.panel.reveal(undefined, true);
    this.send({ type: 'source', ...this.source(), replay: true });
  }

  onMessage(msg) {
    if (msg.type === 'ready') {
      this.send({ type: 'init', config: readConfig(), ...this.source() });
    } else if (msg.type === 'maximize') {
      vscode.commands.executeCommand('workbench.action.toggleMaximizeEditorGroup');
    } else if (msg.type === 'animateAnyway') {
      vscode.workspace
        .getConfiguration('animatedMermaid')
        .update('respectReducedMotion', false, vscode.ConfigurationTarget.Global);
    } else if (msg.type === 'error') {
      vscode.window.showErrorMessage(`Animated Mermaid: ${msg.message}`);
    }
  }

  send(msg) {
    this.panel.webview.postMessage(msg);
  }

  html(mediaRoot) {
    const webview = this.panel.webview;
    const uri = (file) => webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, file));
    const nonce = crypto.randomBytes(16).toString('base64');
    // Everything ships inside the extension, so nothing may reach the network.
    // Mermaid writes an inline <style> into each SVG, hence 'unsafe-inline' for styles only.
    const csp = [
      "default-src 'none'",
      `script-src 'nonce-${nonce}' ${webview.cspSource}`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `img-src ${webview.cspSource} data:`,
      `font-src ${webview.cspSource}`,
    ].join('; ');
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="${uri('preview.css')}" />
</head>
<body>
  <div id="app">
    <div class="bar" role="toolbar" aria-label="Preview">
      <button id="zoom-out" class="icon" title="Zoom out (−)" aria-label="Zoom out">−</button>
      <output id="zoom" class="zoom" aria-label="Zoom level">100%</output>
      <button id="zoom-in" class="icon" title="Zoom in (+)" aria-label="Zoom in">+</button>
      <button id="fit" title="Fit to view (0)">Fit</button>
      <button id="maximize" title="Maximize the preview's editor group">Maximize</button>
      <span class="spacer"></span>
      <button id="replay" title="Replay the animation">Replay</button>
      <button id="toggle">Pause</button>
      <button id="settings-btn" aria-expanded="false" aria-controls="settings">Style</button>
    </div>
    <div id="settings" class="settings" hidden>
      <label>Animation <select id="preset"></select></label>
      <label>Particles <select id="particleStyle"></select></label>
      <label>Per edge <input id="particles" type="range" min="0" max="8" /></label>
      <label>Colours <select id="theme"></select></label>
      <label>Nodes <select id="nodeStyle"></select></label>
      <label>Corners <select id="corners"></select></label>
      <label>Lines <select id="curve"></select></label>
      <button id="reset" title="Go back to your animatedMermaid.* settings">Use settings</button>
    </div>
    <div id="stage" class="stage"><div id="diagram" class="diagram"></div></div>
    <div id="motion" class="motion" hidden>
      Animations are off because your system asks for reduced motion.
      <button id="animate-anyway">Animate anyway</button>
    </div>
    <div class="foot"><span id="label"></span><span id="status" role="status"></span></div>
  </div>
  <script nonce="${nonce}" src="${uri('mermaid.min.js')}"></script>
  <script nonce="${nonce}" type="module" src="${uri('preview.js')}"></script>
</body>
</html>`;
  }

  dispose() {
    clearTimeout(this.timer);
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
  }
}

function activate(context) {
  const previews = new Map();

  context.subscriptions.push(
    vscode.commands.registerCommand('animatedMermaid.openPreview', (uri) => {
      const editor = vscode.window.activeTextEditor;
      const document = editor && (!uri || editor.document.uri.toString() === uri.toString()) ? editor.document : undefined;
      if (!document) {
        vscode.window.showWarningMessage('Animated Mermaid: open a .mmd file or a Markdown file with a ```mermaid block first.');
        return;
      }
      let blockIndex = 0;
      if (document.languageId === 'markdown') {
        const blocks = findMermaidBlocks(document.getText());
        if (!blocks.length) {
          vscode.window.showWarningMessage('Animated Mermaid: this Markdown file has no ```mermaid block.');
          return;
        }
        const line = editor.selection.active.line;
        blockIndex = Math.max(0, blocks.findIndex((b) => line >= b.start && line <= b.end));
      }
      const key = document.uri.toString();
      const existing = previews.get(key);
      if (existing) {
        existing.document = document;
        existing.showBlock(blockIndex);
        return;
      }
      previews.set(key, new Preview(context, document, blockIndex, () => previews.delete(key)));
    }),
  );
}

function deactivate() {}

module.exports = { activate, deactivate, findMermaidBlocks };
