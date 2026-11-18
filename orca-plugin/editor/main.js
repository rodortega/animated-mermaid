import {
  animateMermaid,
  resolveTheme,
  THEMES,
  PRESETS,
  PARTICLE_STYLES,
  NODE_STYLES,
  CORNERS,
} from './vendor/animate-mermaid.js';

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
// Mirrors the defaults in orca-plugin.json, for when settings can't be read.
const DEFAULTS = {
  theme: 'auto',
  darkTheme: 'aurora',
  nodeStyle: 'gradient',
  corners: 'rounded',
  curve: 'basis',
  preset: 'build',
  particleStyle: 'dot',
  particles: 3,
  showSource: true,
  respectReducedMotion: true,
};

let settings = { ...DEFAULTS };
let ctl = null;
let source = '';
let renderQueue = Promise.resolve();
let renderTimer = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

for (const [id, values] of Object.entries(CHOICES)) {
  for (const v of values) $(id).append(new Option(LABELS[v] || v, v));
}

function setStatus(text, isError = false) {
  $('status').textContent = text;
  $('status').classList.toggle('error', isError);
}

function errorText(err) {
  return String(err?.message || err).split('\n').slice(0, 3).join(' ');
}

async function loadSettings() {
  try {
    settings = { ...DEFAULTS, ...(await orca.settings.get()) };
  } catch (err) {
    setStatus(`Using default settings: ${errorText(err)}`, true);
  }
}

async function saveSetting(key, value) {
  settings = { ...settings, [key]: value };
  applySettings();
  try {
    await orca.settings.set(key, value);
  } catch (err) {
    setStatus(`Couldn't save ${key}: ${errorText(err)}`, true);
  }
}

// Orca puts a `light` or `dark` class on <html> and swaps it in place when the theme changes.
function themeName() {
  if (settings.theme && settings.theme !== 'auto') return settings.theme;
  return document.documentElement.classList.contains('light') ? 'light' : settings.darkTheme || 'aurora';
}

function animatorOptions() {
  return {
    theme: themeName(),
    nodeStyle: settings.nodeStyle,
    corners: settings.corners,
    curve: settings.curve,
    preset: settings.preset,
    particleStyle: settings.particleStyle,
    particles: Number(settings.particles),
    respectReducedMotion: settings.respectReducedMotion !== false,
  };
}

function syncControls() {
  for (const id of Object.keys(CHOICES)) $(id).value = settings[id];
  $('particles').value = settings.particles;
  const showSource = settings.showSource !== false;
  $('source').hidden = !showSource;
  $('source-btn').setAttribute('aria-pressed', String(showSource));
  const theme = resolveTheme(themeName());
  $('stage').style.setProperty('--stage-bg', theme.background);
  $('stage').style.setProperty('--stage-grid', theme.grid);
  // Without this note the editor just looks broken when the OS has animations turned off.
  $('motion').hidden = !(reducedMotion.matches && settings.respectReducedMotion !== false);
}

// Renders run one after another so a slow Mermaid render can't land after a newer one.
function enqueue(task) {
  renderQueue = renderQueue.then(task).catch((err) => setStatus(`Kept the last diagram. ${errorText(err)}`, true));
  return renderQueue;
}

function render(replay) {
  return enqueue(async () => {
    if (!source.trim()) {
      setStatus('Empty file: type a flowchart in the source.');
      return;
    }
    if (!ctl) {
      ctl = await animateMermaid($('diagram'), source, {
        ...animatorOptions(),
        mermaid: window.mermaid,
        // The whole editor, so the toolbar and its exit button stay on screen.
        fullscreenTarget: $('app'),
        onViewChange: ({ zoom, fullscreen }) => {
          $('zoom').textContent = `${Math.round(zoom * 100)}%`;
          $('fullscreen').textContent = fullscreen ? 'Exit fullscreen' : 'Fullscreen';
          $('fullscreen').setAttribute('aria-pressed', String(fullscreen));
        },
      });
    } else {
      await ctl.update(source);
      if (!replay) ctl.skipToEnd();
    }
    setStatus('');
    syncToggle();
  });
}

function applySettings() {
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

function syncToggle() {
  $('toggle').textContent = ctl && !ctl.playing ? 'Play' : 'Pause';
}

for (const id of Object.keys(CHOICES)) $(id).addEventListener('change', (e) => saveSetting(id, e.target.value));
$('particles').addEventListener('input', (e) => ctl?.setParticles(Number(e.target.value)));
$('particles').addEventListener('change', (e) => saveSetting('particles', Number(e.target.value)));
$('source-btn').addEventListener('click', () => saveSetting('showSource', settings.showSource === false));
$('style-btn').addEventListener('click', () => {
  const panel = $('style');
  panel.hidden = !panel.hidden;
  $('style-btn').setAttribute('aria-expanded', String(!panel.hidden));
});
$('zoom-in').addEventListener('click', () => ctl?.zoomIn());
$('zoom-out').addEventListener('click', () => ctl?.zoomOut());
$('fit').addEventListener('click', () => ctl?.fit());
$('fullscreen').addEventListener('click', () => ctl?.toggleFullscreen());
$('replay').addEventListener('click', () => {
  ctl?.replay();
  ctl?.play();
  syncToggle();
});
$('toggle').addEventListener('click', () => {
  ctl?.toggle();
  syncToggle();
});
$('animate-anyway').addEventListener('click', () => saveSetting('respectReducedMotion', false));
reducedMotion.addEventListener('change', () => {
  syncControls();
  if (ctl) enqueue(() => ctl.replay());
});

async function start() {
  if (typeof orca === 'undefined' || !orca.document) {
    setStatus('This page runs as an Orca custom editor.', true);
    return;
  }
  orca.on('theme', () => {
    if ((settings.theme || 'auto') === 'auto') applySettings();
    else syncControls();
  });
  orca.settings.onDidChange(async () => {
    await loadSettings();
    applySettings();
  });
  await loadSettings();
  syncControls();
  // No merge: a Mermaid file can't be merged by joining two versions, so Orca's own
  // Reload/Overwrite banner handles an outside write that collides with typing.
  const doc = await orca.document.session();
  const text = $('source');
  text.value = doc.value;
  text.readOnly = doc.readOnly;
  source = doc.value;

  text.addEventListener('input', () => {
    doc.change(text.value);
    source = text.value;
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => render(false), 300);
  });
  text.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.shiftKey || e.ctrlKey || e.metaKey || text.readOnly) return;
    e.preventDefault();
    text.setRangeText('    ', text.selectionStart, text.selectionEnd, 'end');
    text.dispatchEvent(new Event('input'));
  });
  doc.onReplace((value) => {
    text.value = value;
    source = value;
    render(false);
  });

  render(true);
}

start().catch((err) => setStatus(errorText(err), true));
