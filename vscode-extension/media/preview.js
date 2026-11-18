import { animateMermaid, resolveTheme, THEMES, PRESETS, PARTICLE_STYLES, NODE_STYLES, CORNERS } from './animate-mermaid.js';

const vscode = acquireVsCodeApi();
const $ = (id) => document.getElementById(id);

const CHOICES = {
  preset: PRESETS,
  particleStyle: PARTICLE_STYLES,
  theme: ['auto', ...Object.keys(THEMES)],
  nodeStyle: NODE_STYLES,
  corners: CORNERS,
  curve: ['basis', 'linear', 'step'],
};
const LABELS = { basis: 'smooth', linear: 'straight', step: 'step', contrast: 'high contrast', none: 'none (static)' };

// Choices made in the panel win over the animatedMermaid.* settings until "Use settings" is pressed.
const saved = vscode.getState() || {};
let overrides = saved.overrides || {};
let config = {};
let ctl = null;
let source = '';
let renderQueue = Promise.resolve();

for (const [id, values] of Object.entries(CHOICES)) {
  for (const v of values) $(id).append(new Option(LABELS[v] || v, v));
}

function settings() {
  return { ...config, ...overrides };
}

function vscodeThemeKind() {
  const c = document.body.classList;
  if (c.contains('vscode-high-contrast-light')) return 'light';
  if (c.contains('vscode-high-contrast')) return 'contrast';
  if (c.contains('vscode-light')) return 'light';
  return 'dark';
}

function themeName(s = settings()) {
  if (s.theme && s.theme !== 'auto') return s.theme;
  const kind = vscodeThemeKind();
  return kind === 'dark' ? s.darkTheme || 'aurora' : kind;
}

function animatorOptions() {
  const s = settings();
  return {
    theme: themeName(s),
    nodeStyle: s.nodeStyle,
    corners: s.corners,
    curve: s.curve,
    preset: s.preset,
    particleStyle: s.particleStyle,
    particles: Number(s.particles),
    respectReducedMotion: s.respectReducedMotion !== false,
  };
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Without this note the preview just looks broken when the OS has animations turned off.
function syncMotionNote() {
  $('motion').hidden = !(reducedMotion.matches && settings().respectReducedMotion !== false);
}

function syncControls() {
  const s = settings();
  for (const id of Object.keys(CHOICES)) $(id).value = s[id];
  $('particles').value = s.particles;
  const theme = resolveTheme(themeName(s));
  const stage = $('stage');
  stage.style.setProperty('--stage-bg', theme.background);
  stage.style.setProperty('--stage-grid', theme.grid);
  stage.classList.toggle('is-light', theme.dark === false);
  syncMotionNote();
}

function setStatus(text, isError = false) {
  $('status').textContent = text;
  $('status').classList.toggle('error', isError);
}

function errorText(err) {
  return String(err?.message || err).split('\n').slice(0, 3).join(' ');
}

// Renders run one after another so a slow Mermaid render can't land after a newer one.
function enqueue(task) {
  renderQueue = renderQueue.then(task).catch((err) => setStatus(`Kept the last diagram. ${errorText(err)}`, true));
  return renderQueue;
}

function render(replay) {
  return enqueue(async () => {
    if (!source.trim()) {
      setStatus('Nothing to show yet.');
      return;
    }
    if (!ctl) {
      setStatus('Loading Mermaid…');
      ctl = await animateMermaid($('diagram'), source, {
        ...animatorOptions(),
        mermaid: window.mermaid,
        fullscreenTarget: $('stage'),
        onViewChange: ({ zoom }) => ($('zoom').textContent = `${Math.round(zoom * 100)}%`),
      });
    } else {
      await ctl.update(source);
      if (!replay) ctl.skipToEnd();
    }
    setStatus('');
    syncToggle();
  });
}

function applyOptions() {
  syncControls();
  if (!ctl) return;
  const opts = animatorOptions();
  // set() doesn't replay for this option, and the preset only changes on the next replay.
  const motionChanged = opts.respectReducedMotion !== ctl.opts.respectReducedMotion;
  enqueue(async () => {
    await ctl.set(opts);
    if (motionChanged) ctl.replay();
  });
}

function setOverride(key, value) {
  overrides = { ...overrides, [key]: value };
  vscode.setState({ overrides });
  applyOptions();
}

function syncToggle() {
  $('toggle').textContent = ctl && !ctl.playing ? 'Play' : 'Pause';
}

window.addEventListener('message', ({ data: msg }) => {
  if (msg.type === 'init') {
    config = msg.config;
    source = msg.text;
    $('label').textContent = msg.label;
    syncControls();
    render(true);
  } else if (msg.type === 'source') {
    if (msg.text === source && !msg.replay) return;
    source = msg.text;
    $('label').textContent = msg.label;
    render(msg.replay || config.replayOnEdit);
  } else if (msg.type === 'config') {
    config = msg.config;
    applyOptions();
  }
});

for (const id of Object.keys(CHOICES)) $(id).addEventListener('change', (e) => setOverride(id, e.target.value));
$('particles').addEventListener('change', (e) => setOverride('particles', Number(e.target.value)));
$('particles').addEventListener('input', (e) => ctl?.setParticles(Number(e.target.value)));
$('reset').addEventListener('click', () => {
  overrides = {};
  vscode.setState({ overrides });
  applyOptions();
});
$('settings-btn').addEventListener('click', () => {
  const panel = $('settings');
  panel.hidden = !panel.hidden;
  $('settings-btn').setAttribute('aria-expanded', String(!panel.hidden));
});
$('zoom-in').addEventListener('click', () => ctl?.zoomIn());
$('zoom-out').addEventListener('click', () => ctl?.zoomOut());
$('fit').addEventListener('click', () => ctl?.fit());
$('maximize').addEventListener('click', () => vscode.postMessage({ type: 'maximize' }));
$('animate-anyway').addEventListener('click', () => vscode.postMessage({ type: 'animateAnyway' }));
reducedMotion.addEventListener('change', () => {
  syncMotionNote();
  if (ctl) enqueue(() => ctl.replay());
});
$('replay').addEventListener('click', () => {
  ctl?.replay();
  ctl?.play();
  syncToggle();
});
$('toggle').addEventListener('click', () => {
  ctl?.toggle();
  syncToggle();
});

// VS Code swaps these body classes when the user changes colour theme.
new MutationObserver(() => {
  if ((settings().theme || 'auto') === 'auto') applyOptions();
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

vscode.postMessage({ type: 'ready' });
