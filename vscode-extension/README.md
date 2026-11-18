# Animated Mermaid Preview

Opens an animated preview of a Mermaid flowchart beside the editor, using `../app/animate-mermaid.js`.

## Try it

- Run `npm install` in this folder once, then open it in VS Code and press F5. In the new window, open `test/sample.mmd` or `test/sample.md`.
- Run **Animated Mermaid: Open Animated Preview to the Side** (`Ctrl+K Alt+M`), or use the play button in the editor title bar of a `.mmd` file.

## Install it

```
npm install
npm run package
code --install-extension animated-mermaid-preview-0.1.3.vsix
```

## How it behaves

- `.mmd` / `.mermaid` files preview the whole file. Markdown files preview the ```` ```mermaid ```` block under the cursor and follow the cursor between blocks.
- Edits show straight away in their finished state. Set `animatedMermaid.replayOnEdit` to replay the build-up on every edit.
- Defaults come from the `animatedMermaid.*` settings. The **Style** button changes them for that panel only; **Use settings** goes back.
- `animatedMermaid.theme: auto` follows VS Code: light, high contrast, or `animatedMermaid.darkTheme`.
- **Maximize** toggles the maximized editor group, since webviews can't go browser-fullscreen.

## Offline

- Everything runs from inside the extension. Mermaid (`mermaid.min.js`, pinned in `package.json`) is copied into `media/` by `npm run sync`, and the webview's Content Security Policy allows no network access at all.
- `media/animate-mermaid.js` is copied from `../app` by the same step (runs on F5 and when packaging). Edit the one in `app/`.
- Labels use the system font, since web fonts would need the network.
