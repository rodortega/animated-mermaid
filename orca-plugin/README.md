# Animated Mermaid for Orca

A custom editor that opens `.mmd` and `.mermaid` files as animated diagrams, with the source beside them. Built on `../app/animate-mermaid.js` and runs fully offline.

## Use it

- Open a `.mmd` or `.mermaid` file. It opens in **Animated**; the view toggle beside it switches to **Source**.
- **New Mermaid diagram** in the tab bar + menu or the command palette starts a new `.mmd` file.
- Type in the source pane and the diagram updates in its finished state. **Replay** runs the build-up again.
- **Style** changes the animation, particles, colours, nodes, corners and lines. Choices are saved as the plugin's settings (Settings > Plugins > Animated Mermaid).
- Colours `auto` follows Orca: light themes use Light, dark themes use the **Dark colours** setting.
- If your system has animations turned off, the editor says so and offers **Animate anyway**.

## Develop

Orca has no build step and refuses `node_modules` inside a plugin, so Mermaid is installed at the repo root and copied in:

```sh
npm install                      # at the repo root: mermaid (pinned)
npm run orca:sync                # copies app/animate-mermaid.js and mermaid.min.js into editor/vendor/
orca plugin check ./orca-plugin --json
orca plugin install ./orca-plugin --json   # prints the access it asks for; re-run with --approve <fingerprint>
orca plugin shot local.animated-mermaid --editor "$PWD/orca-plugin/test/sample.mmd"
```

Edit `app/animate-mermaid.js`, not the copy in `editor/vendor/`. After changing files here, run `orca plugin install ./orca-plugin` again to update the installed copy.
