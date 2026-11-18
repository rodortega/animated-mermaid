/**
 * animate-mermaid: render a Mermaid flowchart with the real mermaid library, then
 * post-process the SVG so it builds itself up and keeps moving.
 *
 *   const ctl = await animateMermaid(container, source, {
 *     theme: 'aurora',          // aurora, ember, mono, ocean, forest, sunset, neon, light, contrast, or an object
 *     nodeStyle: 'gradient',    // gradient, glass, neon, solid, outline, soft
 *     corners: 'rounded',       // sharp, rounded, pill
 *     curve: 'basis',           // basis (smooth), linear (straight), step
 *     thickness: 'normal',      // thin, normal, thick
 *     glow: true,
 *     preset: 'build',          // build, cascade, fade, slide, typewriter, pulse, none
 *     particleStyle: 'dot',     // dot, comet, spark, arrow
 *     particles: 3,             // particles per edge, 0 turns them off
 *     speed: 'normal',          // slow, normal, fast, or a number (1 = normal)
 *     flow: 'off',              // off, slow, fast: dashed flowing edges after drawing
 *     loop: false,              // replay the build-up after it finishes
 *     panZoom: true,            // zoom and pan inside the container
 *     fullscreenTarget: null,   // element to make fullscreen (the container by default)
 *     onViewChange: ({ zoom, fullscreen, canPan }) => {},
 *   });
 *   ctl.pause(); ctl.play(); ctl.replay();
 *   ctl.setSpeed('fast'); ctl.setParticles(5); ctl.setFlow('slow'); ctl.setLoop(true);
 *   ctl.zoomIn(); ctl.zoomOut(); ctl.setZoom(1.5); ctl.fit(); ctl.toggleFullscreen();
 *   await ctl.set({ preset: 'pulse', theme: 'light' });
 *   await ctl.update(newSource, { theme: 'ember' });
 *   ctl.destroy();
 */

// 11.6.0 is the first release that honours flowchart.curve; earlier 11.x always draws basis.
export const MERMAID_VERSION = '11.17.2';
export const MERMAID_URL = `https://cdn.jsdelivr.net/npm/mermaid@${MERMAID_VERSION}/dist/mermaid.esm.min.mjs`;

const SVG_NS = 'http://www.w3.org/2000/svg';

let mermaidPromise = null;
export function loadMermaid(url = MERMAID_URL) {
  if (!mermaidPromise) mermaidPromise = import(url).then((m) => m.default);
  return mermaidPromise;
}

const FONT = '"Lexend", system-ui, sans-serif';

function darkTheme(t) {
  return { dark: true, font: FONT, nodeFillOpacity: 0.16, ...t };
}

export const THEMES = {
  aurora: darkTheme({
    background: '#020618',
    grid: '#ffffff08',
    text: '#e2e8f0',
    clusterFill: 'rgba(11, 18, 36, 0.45)',
    clusterStroke: '#a78bfa',
    labelBackground: '#0b1224',
    gradients: [
      ['#7c3aed', '#4f46e5'],
      ['#22d3ee', '#0ea5e9'],
      ['#f472b6', '#c084fc'],
      ['#a3e635', '#22c55e'],
      ['#fb7185', '#f97316'],
      ['#38bdf8', '#3b82f6'],
    ],
    edges: ['#22d3ee', '#a78bfa', '#f472b6', '#a3e635', '#fb7185', '#38bdf8', '#f97316'],
  }),
  ember: darkTheme({
    background: '#140804',
    grid: '#ffffff07',
    text: '#fef3c7',
    clusterFill: 'rgba(36, 14, 8, 0.45)',
    clusterStroke: '#fb923c',
    labelBackground: '#1c0d07',
    gradients: [
      ['#f97316', '#ef4444'],
      ['#facc15', '#f59e0b'],
      ['#fb7185', '#e11d48'],
      ['#f472b6', '#db2777'],
      ['#fdba74', '#fb923c'],
    ],
    edges: ['#fb923c', '#facc15', '#fb7185', '#f472b6', '#fdba74'],
  }),
  mono: darkTheme({
    background: '#0b0f17',
    grid: '#ffffff08',
    text: '#f1f5f9',
    nodeFillOpacity: 0.1,
    clusterFill: 'rgba(15, 23, 42, 0.5)',
    clusterStroke: '#64748b',
    labelBackground: '#0f172a',
    gradients: [
      ['#f8fafc', '#94a3b8'],
      ['#cbd5e1', '#64748b'],
    ],
    edges: ['#e2e8f0', '#94a3b8', '#cbd5e1'],
  }),
  ocean: darkTheme({
    background: '#021526',
    grid: '#7dd3fc0a',
    text: '#e0f2fe',
    clusterFill: 'rgba(3, 30, 52, 0.5)',
    clusterStroke: '#38bdf8',
    labelBackground: '#04213a',
    gradients: [
      ['#06b6d4', '#0284c7'],
      ['#38bdf8', '#2563eb'],
      ['#2dd4bf', '#0d9488'],
      ['#818cf8', '#4f46e5'],
    ],
    edges: ['#22d3ee', '#38bdf8', '#2dd4bf', '#818cf8'],
  }),
  forest: darkTheme({
    background: '#04140c',
    grid: '#bbf7d00a',
    text: '#ecfccb',
    clusterFill: 'rgba(6, 30, 18, 0.5)',
    clusterStroke: '#4ade80',
    labelBackground: '#072015',
    gradients: [
      ['#4ade80', '#16a34a'],
      ['#a3e635', '#65a30d'],
      ['#facc15', '#ca8a04'],
      ['#2dd4bf', '#0f766e'],
    ],
    edges: ['#4ade80', '#a3e635', '#facc15', '#2dd4bf'],
  }),
  sunset: darkTheme({
    background: '#1a0b1e',
    grid: '#fecdd30a',
    text: '#ffe4e6',
    clusterFill: 'rgba(42, 14, 44, 0.5)',
    clusterStroke: '#f472b6',
    labelBackground: '#2a0f2e',
    gradients: [
      ['#f97316', '#db2777'],
      ['#fb7185', '#9333ea'],
      ['#fbbf24', '#f97316'],
      ['#c084fc', '#6366f1'],
    ],
    edges: ['#fb923c', '#f472b6', '#fbbf24', '#c084fc'],
  }),
  neon: darkTheme({
    background: '#050008',
    grid: '#ff00e50a',
    text: '#f5f3ff',
    clusterFill: 'rgba(12, 0, 20, 0.6)',
    clusterStroke: '#ff00e5',
    labelBackground: '#0c0014',
    gradients: [
      ['#39ff14', '#00e5ff'],
      ['#ff00e5', '#7c3aed'],
      ['#00e5ff', '#2979ff'],
      ['#ffea00', '#ff6d00'],
    ],
    edges: ['#39ff14', '#ff00e5', '#00e5ff', '#ffea00'],
  }),
  light: {
    dark: false,
    font: FONT,
    background: '#f8fafc',
    grid: '#0f172a0d',
    text: '#0f172a',
    nodeFillOpacity: 0.12,
    clusterFill: 'rgba(255, 255, 255, 0.75)',
    clusterStroke: '#94a3b8',
    labelBackground: '#ffffff',
    gradients: [
      ['#0ea5e9', '#6366f1'],
      ['#8b5cf6', '#d946ef'],
      ['#10b981', '#0d9488'],
      ['#f59e0b', '#ef4444'],
      ['#ec4899', '#f43f5e'],
    ],
    edges: ['#0284c7', '#7c3aed', '#059669', '#ea580c', '#db2777'],
  },
  contrast: {
    dark: true,
    font: FONT,
    background: '#000000',
    grid: '#ffffff12',
    text: '#ffffff',
    nodeFillOpacity: 0,
    clusterFill: 'rgba(0, 0, 0, 1)',
    clusterStroke: '#ffffff',
    labelBackground: '#000000',
    gradients: [
      ['#ffff00', '#ffff00'],
      ['#00ffff', '#00ffff'],
      ['#ff00ff', '#ff00ff'],
      ['#ffffff', '#ffffff'],
    ],
    edges: ['#ffff00', '#00ffff', '#ff00ff', '#ffffff'],
  },
};

export const PRESETS = ['build', 'cascade', 'fade', 'slide', 'typewriter', 'pulse', 'none'];
export const PARTICLE_STYLES = ['dot', 'comet', 'spark', 'arrow'];
export const NODE_STYLES = ['gradient', 'glass', 'neon', 'solid', 'outline', 'soft'];
export const CORNERS = ['sharp', 'rounded', 'pill'];
export const CURVES = { basis: 'basis', smooth: 'basis', linear: 'linear', straight: 'linear', step: 'step' };
export const THICKNESS = { thin: 1.4, normal: 2.4, thick: 3.6 };

const SPEEDS = { slow: 0.6, normal: 1, fast: 1.8 };

const DEFAULTS = {
  theme: 'aurora',
  nodeStyle: 'gradient',
  corners: 'rounded',
  curve: 'basis',
  thickness: 'normal',
  glow: true,
  preset: 'build',
  particleStyle: 'dot',
  particles: 3,
  speed: 'normal',
  flow: 'off',
  loop: false,
  panZoom: true,
  minZoom: 0.1,
  maxZoom: 5,
  maxFitZoom: 2,
  fitPadding: 24,
  fullscreenTarget: null,
  onViewChange: null,
  respectReducedMotion: true,
};

// Base timings at speed 1; speed changes playbackRate instead of these, so it can change live.
const T = {
  sourceStagger: 120,
  nodeDur: 450,
  edgeLead: 250,
  edgeStagger: 110,
  drawPerPx: 2.6,
  drawMin: 500,
  drawMax: 1200,
  particlePerPx: 10,
  particleMin: 1600,
  particleMax: 4500,
  hold: 2200,
  cascadeStep: 360,
  typeGap: 70,
};

const ENTRANCES = {
  build: {
    duration: 450,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    frames: [
      { opacity: 0, transform: 'scale(0.6)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
  },
  cascade: {
    duration: 420,
    easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
    frames: [
      { opacity: 0, transform: 'scale(0.85)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
  },
  fade: { duration: 800, easing: 'ease-in-out', frames: [{ opacity: 0 }, { opacity: 1 }] },
  slide: {
    duration: 560,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    frames: [
      { opacity: 0, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
  typewriter: {
    duration: 240,
    easing: 'ease-out',
    frames: [
      { opacity: 0, transform: 'scale(0.92)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
  },
};

const STYLE_ID = 'animate-mermaid-styles';
const STYLES = `
@keyframes am-dash { to { stroke-dashoffset: 0; } }
.am-svg { --am-speed: 1; overflow: visible; }
.am-svg .am-node-inner { transform-box: fill-box; transform-origin: center; }
.am-svg .nodeLabel, .am-svg .edgeLabel, .am-svg .cluster-label span { color: var(--am-text) !important; }
.am-svg .am-particle { offset-rotate: auto; will-change: offset-distance, opacity; }
.am-svg[data-flow="slow"] path.am-drawn,
.am-svg[data-flow="fast"] path.am-drawn {
  stroke-dasharray: 9 5 !important;
  stroke-dashoffset: 900;
  stroke-linecap: round;
  animation: am-dash calc(50s / var(--am-speed)) linear infinite;
}
.am-svg[data-flow="fast"] path.am-drawn { animation-duration: calc(20s / var(--am-speed)); }
.am-svg.am-paused path.am-drawn { animation-play-state: paused; }
.am-viewport {
  position: relative; width: 100%; height: 100%; min-height: var(--am-min-height, 240px);
  overflow: hidden; outline: none; touch-action: pan-x pan-y; user-select: none; -webkit-user-select: none;
}
.am-viewport:focus-visible { box-shadow: inset 0 0 0 2px #38bdf8; }
.am-viewport.am-can-pan { cursor: grab; touch-action: none; }
.am-viewport.am-dragging { cursor: grabbing; }
.am-canvas { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.am-host:fullscreen { width: 100vw; height: 100vh; max-height: none; border-radius: 0; background-color: var(--am-bg, #020618); }
.am-host::backdrop { background: var(--am-bg, #020618); }
.am-host.am-pseudo-fullscreen {
  position: fixed !important; inset: 0; z-index: 2147483000; width: 100vw; height: 100vh; height: 100dvh;
  max-height: none; margin: 0; border-radius: 0; background-color: var(--am-bg, #020618);
}
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function resolveTheme(theme) {
  if (theme && typeof theme === 'object') return { ...THEMES.aurora, ...theme };
  return THEMES[theme] || THEMES.aurora;
}

export function resolveSpeed(speed) {
  if (typeof speed === 'number' && speed > 0) return speed;
  return SPEEDS[speed] || 1;
}

function flowDirection(source) {
  const m = /^\s*(?:flowchart|graph)\s+(TB|TD|BT|LR|RL)\b/im.exec(source || '');
  const d = m ? m[1].toUpperCase() : 'TB';
  return d === 'TD' ? 'TB' : d;
}

function mermaidConfig(theme, curve) {
  return {
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: theme.font,
    themeVariables: {
      darkMode: theme.dark !== false,
      background: 'transparent',
      fontFamily: theme.font,
      fontSize: '15px',
      primaryColor: theme.labelBackground,
      primaryTextColor: theme.text,
      primaryBorderColor: theme.edges[0],
      secondaryColor: theme.labelBackground,
      tertiaryColor: theme.labelBackground,
      lineColor: theme.edges[0],
      textColor: theme.text,
      titleColor: theme.text,
      clusterBkg: theme.clusterFill,
      clusterBorder: theme.clusterStroke,
      edgeLabelBackground: theme.labelBackground,
    },
    flowchart: { curve: CURVES[curve] || 'basis', htmlLabels: true, padding: 16, nodeSpacing: 40, rankSpacing: 60 },
  };
}

let uid = 0;

class MermaidAnimator {
  constructor(container, options) {
    this.container = container;
    this.opts = { ...DEFAULTS, ...options };
    this.anims = [];
    this.particleAnims = [];
    this.token = 0;
    this.renderToken = 0;
    this.playing = true;
    this.markup = null;
    this.source = null;
    this.svg = null;
    this.graph = null;
    this.clock = null;
    this.view = { k: 1, tx: 0, ty: 0, w: 0, h: 0, auto: true };
    this.pointers = new Map();
    this.gesture = null;
    this.pseudoFullscreen = false;
    this.abort = new AbortController();
    ensureStyles();

    this.fsTarget = this.opts.fullscreenTarget || container;
    this.fsTarget.classList.add('am-host');
    const signal = this.abort.signal;
    document.addEventListener('fullscreenchange', () => this.onFullscreenChange(), { signal });
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape' && this.pseudoFullscreen) this.setPseudoFullscreen(false);
      },
      { signal },
    );
    if (this.opts.panZoom) this.setupViewport();
  }

  // ---- rendering

  async update(source, options = {}) {
    Object.assign(this.opts, options);
    this.requestedSource = source;
    const theme = resolveTheme(this.opts.theme);
    const mermaid = this.opts.mermaid || (await loadMermaid(this.opts.mermaidUrl));
    const myRender = ++this.renderToken;
    mermaid.initialize(mermaidConfig(theme, this.opts.curve));
    const id = `am-${++uid}-${Date.now().toString(36)}`;
    let svg;
    try {
      ({ svg } = await mermaid.render(id, source));
    } finally {
      document.getElementById(`d${id}`)?.remove();
      document.getElementById(id)?.remove();
    }
    if (myRender !== this.renderToken) return this;
    if (source !== this.source) this.view.auto = true;
    this.markup = svg;
    this.source = source;
    this.replay();
    return this;
  }

  // Changes options, doing only as much work as each one needs.
  async set(options = {}) {
    const prev = { ...this.opts };
    Object.assign(this.opts, options);
    const changed = (k) => k in options && options[k] !== prev[k];
    if (this.source != null && (changed('theme') || changed('curve'))) {
      // An update may still be rendering; redo the newest source, not the last finished one.
      const latest = this.requestedSource ?? this.source;
      try {
        await this.update(latest);
      } catch (err) {
        if (latest === this.source) throw err;
        await this.update(this.source);
      }
      return this;
    }
    if (['preset', 'nodeStyle', 'corners', 'thickness', 'glow'].some(changed)) {
      this.replay();
      return this;
    }
    if (changed('particles') || changed('particleStyle')) this.setParticles(this.opts.particles);
    if (changed('speed')) this.setSpeed(this.opts.speed);
    if (changed('flow')) this.setFlow(this.opts.flow);
    if (changed('loop')) this.setLoop(this.opts.loop);
    return this;
  }

  replay() {
    if (!this.markup) return;
    this.stopAll();
    const token = ++this.token;
    const holder = document.createElement('div');
    holder.innerHTML = this.markup;
    const svg = holder.querySelector('svg');
    svg.classList.add('am-svg');
    this.svg = svg;
    this.theme = resolveTheme(this.opts.theme);
    this.mount(svg);
    svg.style.setProperty('--am-text', this.theme.text);
    this.fsTarget.style.setProperty('--am-bg', this.theme.background);
    this.applySpeedVar();

    this.graph = this.decorate(svg);
    const preset = this.effectivePreset();
    svg.dataset.preset = preset;
    svg.dataset.flow = preset === 'none' ? 'off' : this.opts.flow;
    if (preset === 'none') {
      this.showFinalState();
      return;
    }
    this.schedule(this.graph, preset);
    this.startTimeline(token, preset);
    if (!this.playing) this.pause();
  }

  effectivePreset() {
    if (this.opts.respectReducedMotion !== false && prefersReducedMotion()) return 'none';
    return PRESETS.includes(this.opts.preset) ? this.opts.preset : 'build';
  }

  mount(svg) {
    if (!this.opts.panZoom) {
      svg.style.maxWidth = svg.style.maxWidth || '100%';
      svg.style.height = 'auto';
      this.container.replaceChildren(svg);
      return;
    }
    const vb = svg.viewBox.baseVal;
    const w = vb && vb.width ? vb.width : 600;
    const h = vb && vb.height ? vb.height : 400;
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.style.maxWidth = 'none';
    svg.style.width = `${w}px`;
    svg.style.height = `${h}px`;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.replaceChildren(svg);
    this.view.w = w;
    this.view.h = h;
    if (this.view.auto) this.fit();
    else this.applyView();
  }

  // ---- playback

  play() {
    this.playing = true;
    for (const a of this.allAnims()) if (a.playState === 'paused') a.play();
    this.svg?.classList.remove('am-paused');
  }

  pause() {
    this.playing = false;
    for (const a of this.allAnims()) if (a.playState === 'running') a.pause();
    this.svg?.classList.add('am-paused');
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
    return this.playing;
  }

  setSpeed(speed) {
    this.opts.speed = speed;
    const rate = resolveSpeed(speed);
    for (const a of this.allAnims()) a.updatePlaybackRate(rate);
    this.applySpeedVar();
  }

  setFlow(flow) {
    this.opts.flow = flow;
    if (this.svg && this.svg.dataset.preset !== 'none') this.svg.dataset.flow = flow;
  }

  setLoop(loop) {
    this.opts.loop = loop;
    if (loop && this.clock && this.clock.playState === 'finished' && this.playing) this.replay();
  }

  setPreset(preset) {
    return this.set({ preset });
  }

  // Jumps the build-up to its finished state while particles keep flowing, e.g. after an edit.
  skipToEnd() {
    const preset = this.svg?.dataset.preset;
    if (!this.graph || preset === 'pulse' || preset === 'none') return;
    for (const a of [...this.anims]) {
      try {
        a.finish();
      } catch {
        // Infinite animations can't finish; they're already in their running state.
      }
    }
    if (this.clock) this.clock.currentTime = this.graph.total;
    this.setParticles(this.opts.particles);
  }

  setParticles(count) {
    this.opts.particles = count;
    if (!this.graph) return;
    for (const a of [...this.particleAnims]) a.cancel();
    this.particleAnims = [];
    for (const child of [...this.graph.layer.children]) if (!child.classList.contains('am-filter-pad')) child.remove();
    if (this.svg?.dataset.preset === 'none') return;
    const elapsed = this.clock ? Number(this.clock.currentTime) || 0 : Infinity;
    this.spawnParticles(this.graph, elapsed);
    if (!this.playing) for (const a of this.particleAnims) a.pause();
  }

  destroy() {
    this.stopAll();
    this.token++;
    this.renderToken++;
    this.abort.abort();
    this.resizeObserver?.disconnect();
    if (this.pseudoFullscreen) this.setPseudoFullscreen(false);
    if (document.fullscreenElement === this.fsTarget) document.exitFullscreen().catch(() => {});
    this.fsTarget.classList.remove('am-host');
    this.container.replaceChildren();
    this.svg = null;
    this.graph = null;
  }

  allAnims() {
    const list = [...this.anims, ...this.particleAnims];
    if (this.clock) list.push(this.clock);
    return list;
  }

  stopAll() {
    for (const a of this.allAnims()) a.cancel();
    this.anims = [];
    this.particleAnims = [];
    this.clock = null;
  }

  applySpeedVar() {
    this.svg?.style.setProperty('--am-speed', String(resolveSpeed(this.opts.speed)));
  }

  track(anim, list = this.anims) {
    anim.updatePlaybackRate(resolveSpeed(this.opts.speed));
    list.push(anim);
    anim.addEventListener('cancel', () => {
      const i = list.indexOf(anim);
      if (i >= 0) list.splice(i, 1);
    });
    return anim;
  }

  // ---- viewport: pan, zoom, fullscreen

  setupViewport() {
    const viewport = document.createElement('div');
    viewport.className = 'am-viewport';
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'group');
    viewport.setAttribute('aria-label', 'Diagram. Plus and minus zoom, 0 fits, arrow keys or drag to pan.');
    const canvas = document.createElement('div');
    canvas.className = 'am-canvas';
    viewport.append(canvas);
    this.container.replaceChildren(viewport);
    this.viewport = viewport;
    this.canvas = canvas;

    const signal = this.abort.signal;
    viewport.addEventListener('pointerdown', (e) => this.onPointerDown(e), { signal });
    viewport.addEventListener('pointermove', (e) => this.onPointerMove(e), { signal });
    viewport.addEventListener('pointerup', (e) => this.onPointerUp(e), { signal });
    viewport.addEventListener('pointercancel', (e) => this.onPointerUp(e), { signal });
    viewport.addEventListener('wheel', (e) => this.onWheel(e), { signal, passive: false });
    viewport.addEventListener('keydown', (e) => this.onKey(e), { signal });

    this.resizeObserver = new ResizeObserver(() => {
      if (this.view.auto) this.fit();
      else this.applyView();
    });
    this.resizeObserver.observe(viewport);
  }

  get zoom() {
    return this.view.k;
  }

  get isFullscreen() {
    return document.fullscreenElement === this.fsTarget || this.pseudoFullscreen;
  }

  viewportSize() {
    return { W: this.viewport?.clientWidth || 0, H: this.viewport?.clientHeight || 0 };
  }

  fit() {
    if (!this.viewport) return;
    const { W, H } = this.viewportSize();
    const { w, h } = this.view;
    this.view.auto = true;
    if (!W || !H || !w || !h) return;
    const pad = this.opts.fitPadding;
    const k = clamp(Math.min((W - pad * 2) / w, (H - pad * 2) / h), this.opts.minZoom, this.opts.maxFitZoom);
    this.view.k = k;
    this.view.tx = (W - w * k) / 2;
    this.view.ty = (H - h * k) / 2;
    this.applyView();
  }

  setZoom(k, at) {
    if (!this.viewport) return;
    const { W, H } = this.viewportSize();
    const point = at || { x: W / 2, y: H / 2 };
    const next = clamp(k, this.opts.minZoom, this.opts.maxZoom);
    const v = this.view;
    const cx = (point.x - v.tx) / v.k;
    const cy = (point.y - v.ty) / v.k;
    v.k = next;
    v.tx = point.x - cx * next;
    v.ty = point.y - cy * next;
    v.auto = false;
    this.applyView();
  }

  zoomIn() {
    this.setZoom(this.view.k * 1.25);
  }

  zoomOut() {
    this.setZoom(this.view.k / 1.25);
  }

  panBy(dx, dy) {
    if (!this.viewport) return;
    this.view.tx += dx;
    this.view.ty += dy;
    this.view.auto = false;
    this.applyView();
  }

  // Bigger than the viewport: keep a margin of it on screen. Smaller: keep it centred.
  clampView() {
    const { W, H } = this.viewportSize();
    const v = this.view;
    const sw = v.w * v.k;
    const sh = v.h * v.k;
    const mx = Math.min(48, W * 0.25);
    const my = Math.min(48, H * 0.25);
    v.tx = sw <= W ? (W - sw) / 2 : clamp(v.tx, W - sw - mx, mx);
    v.ty = sh <= H ? (H - sh) / 2 : clamp(v.ty, H - sh - my, my);
    return sw > W + 1 || sh > H + 1;
  }

  applyView() {
    if (!this.viewport) return;
    const canPan = this.clampView();
    const v = this.view;
    this.canvas.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.k})`;
    this.viewport.classList.toggle('am-can-pan', canPan);
    this.canPan = canPan;
    this.emitView();
  }

  emitView() {
    this.opts.onViewChange?.({ zoom: this.view.k, fullscreen: this.isFullscreen, canPan: !!this.canPan });
  }

  localPoint(e) {
    const r = this.viewport.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.viewport.focus({ preventScroll: true });
    this.pointers.set(e.pointerId, this.localPoint(e));
    if (this.pointers.size === 2) {
      this.viewport.setPointerCapture(e.pointerId);
      this.startPinch();
    } else if (this.pointers.size === 1 && this.canPan) {
      this.viewport.setPointerCapture(e.pointerId);
      this.startPan(this.pointers.get(e.pointerId));
    }
  }

  startPan(p) {
    this.gesture = { type: 'pan', x: p.x, y: p.y, tx: this.view.tx, ty: this.view.ty };
    this.viewport.classList.add('am-dragging');
  }

  startPinch() {
    const [a, b] = [...this.pointers.values()];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const v = this.view;
    this.gesture = {
      type: 'pinch',
      dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      k: v.k,
      cx: (mid.x - v.tx) / v.k,
      cy: (mid.y - v.ty) / v.k,
    };
    this.viewport.classList.remove('am-dragging');
  }

  onPointerMove(e) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, this.localPoint(e));
    const g = this.gesture;
    if (!g) return;
    const v = this.view;
    if (g.type === 'pinch' && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const k = clamp((g.k * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist, this.opts.minZoom, this.opts.maxZoom);
      v.k = k;
      v.tx = mid.x - g.cx * k;
      v.ty = mid.y - g.cy * k;
    } else if (g.type === 'pan') {
      const p = this.pointers.get(e.pointerId);
      v.tx = g.tx + (p.x - g.x);
      v.ty = g.ty + (p.y - g.y);
    } else {
      return;
    }
    v.auto = false;
    e.preventDefault();
    this.applyView();
  }

  onPointerUp(e) {
    this.pointers.delete(e.pointerId);
    if (this.viewport.hasPointerCapture?.(e.pointerId)) this.viewport.releasePointerCapture(e.pointerId);
    if (this.pointers.size === 1 && this.canPan) this.startPan([...this.pointers.values()][0]);
    else if (this.pointers.size === 0) {
      this.gesture = null;
      this.viewport.classList.remove('am-dragging');
    }
  }

  onWheel(e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const scale = e.deltaMode === 1 ? 0.05 : 0.0025;
    this.setZoom(this.view.k * Math.exp(-e.deltaY * scale), this.localPoint(e));
  }

  onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const step = 48;
    const actions = {
      '+': () => this.zoomIn(),
      '=': () => this.zoomIn(),
      '-': () => this.zoomOut(),
      _: () => this.zoomOut(),
      0: () => this.fit(),
      ArrowLeft: () => this.panBy(step, 0),
      ArrowRight: () => this.panBy(-step, 0),
      ArrowUp: () => this.panBy(0, step),
      ArrowDown: () => this.panBy(0, -step),
    };
    const action = actions[e.key];
    if (!action) return;
    if (e.key.startsWith('Arrow') && !this.canPan) return;
    e.preventDefault();
    action();
  }

  async toggleFullscreen() {
    if (this.isFullscreen) {
      if (this.pseudoFullscreen) this.setPseudoFullscreen(false);
      else await document.exitFullscreen().catch(() => {});
      return false;
    }
    if (document.fullscreenEnabled && this.fsTarget.requestFullscreen) {
      try {
        await this.fsTarget.requestFullscreen();
        return true;
      } catch {
        // Falls through to the in-page version, e.g. on phones without element fullscreen.
      }
    }
    this.setPseudoFullscreen(true);
    return true;
  }

  setPseudoFullscreen(on) {
    this.pseudoFullscreen = on;
    this.fsTarget.classList.toggle('am-pseudo-fullscreen', on);
    document.documentElement.style.overflow = on ? 'hidden' : '';
    this.onFullscreenChange();
  }

  onFullscreenChange() {
    requestAnimationFrame(() => {
      if (this.viewport) this.fit();
      else this.emitView();
    });
  }

  // ---- decoration

  decorate(svg) {
    const theme = this.theme;
    const opts = this.opts;
    const prefix = svg.id;
    const tag = `${prefix}-am`;
    this.tag = tag;
    let defs = svg.querySelector(':scope > defs');
    if (!defs) {
      defs = el('defs');
      svg.prepend(defs);
    }

    theme.gradients.forEach(([from, to], i) => {
      const grad = el('linearGradient', { id: `${tag}-node-grad-${i}`, x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
      grad.append(el('stop', { offset: '0%', 'stop-color': from }), el('stop', { offset: '70%', 'stop-color': to }));
      defs.append(grad);
    });

    const glass = el('linearGradient', { id: `${tag}-glass`, x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
    glass.append(
      el('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': theme.dark ? 0.2 : 0.95 }),
      el('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': theme.dark ? 0.05 : 0.65 }),
    );
    defs.append(glass);

    theme.edges.forEach((color, i) => {
      const comet = el('linearGradient', { id: `${tag}-comet-${i}`, x1: '100%', y1: '0%', x2: '0%', y2: '0%' });
      comet.append(
        el('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': 0.85 }),
        el('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 }),
      );
      defs.append(comet);
    });

    // Edge glow is userSpaceOnUse because a straight horizontal edge has a zero-height bounding
    // box, which would collapse a bounding-box filter region and hide it.
    const vb = svg.viewBox.baseVal;
    const w = vb && vb.width ? vb.width : 2000;
    const h = vb && vb.height ? vb.height : 2000;
    defs.append(
      glowFilter(`${tag}-glow`, [
        [1, 0.51],
        [2.4, 0.6],
      ], {
        filterUnits: 'userSpaceOnUse',
        x: (vb?.x || 0) - w,
        y: (vb?.y || 0) - h,
        width: w * 3,
        height: h * 3,
      }),
      glowFilter(`${tag}-neon`, [
        [2, 0.9],
        [6, 0.7],
      ], { x: '-50%', y: '-50%', width: '200%', height: '200%' }),
    );
    const shadow = el('filter', { id: `${tag}-shadow`, x: '-30%', y: '-30%', width: '160%', height: '180%' });
    shadow.append(
      el('feDropShadow', { dx: 0, dy: 3, stdDeviation: 4, 'flood-color': '#000000', 'flood-opacity': theme.dark ? 0.35 : 0.14 }),
    );
    defs.append(shadow);

    const nodes = [];
    const nodeById = new Map();
    svg.querySelectorAll('g.node').forEach((g, index) => {
      const m = /flowchart-(.+)-\d+$/.exec(g.id);
      const id = m ? m[1] : g.id;
      const inner = el('g', { class: 'am-node-inner' });
      inner.append(...g.childNodes);
      g.append(inner);
      const node = { id, g, inner, index, appear: Infinity, done: false };
      this.styleNode(node);
      nodes.push(node);
      nodeById.set(id, node);
    });

    const clusters = [...svg.querySelectorAll('g.cluster')];
    const clusterRadius = opts.corners === 'sharp' ? 0 : 12;
    clusters.forEach((c) => {
      c.querySelectorAll(':scope > rect').forEach((r) => {
        r.style.fill = theme.clusterFill;
        r.style.stroke = theme.clusterStroke;
        r.style.strokeWidth = '1.5';
        r.setAttribute('rx', clusterRadius);
        r.setAttribute('ry', clusterRadius);
      });
    });

    const markerCache = new Map();
    const coloredMarker = (ref, color) => {
      const m = /url\(["']?#([^"')]+)["']?\)/.exec(ref || '');
      if (!m) return null;
      const key = `${m[1]}|${color}`;
      if (markerCache.has(key)) return markerCache.get(key);
      const original = svg.querySelector(`[id="${CSS.escape(m[1])}"]`);
      if (!original) return null;
      const clone = original.cloneNode(true);
      clone.id = `${tag}-marker-${markerCache.size}`;
      clone.querySelectorAll('path, circle, polygon').forEach((p) => {
        p.style.fill = color;
        p.style.stroke = color;
      });
      original.parentNode.append(clone);
      const url = `url(#${clone.id})`;
      markerCache.set(key, url);
      return url;
    };

    const labelById = new Map();
    svg.querySelectorAll('g.edgeLabel').forEach((lbl) => {
      const idHolder = lbl.querySelector('[data-id]') || lbl;
      const key = idHolder.getAttribute('data-id') || lbl.id;
      if (key) labelById.set(key, lbl);
    });

    const baseWidth = THICKNESS[opts.thickness] ?? THICKNESS.normal;
    let edgePaths = [...svg.querySelectorAll('path.flowchart-link')];
    if (!edgePaths.length) edgePaths = [...svg.querySelectorAll('.edgePaths path')];
    const edges = [];
    edgePaths.forEach((path, index) => {
      if (path.classList.contains('edge-thickness-invisible')) return;
      const raw = (path.getAttribute('data-id') || path.id || '').replace(`${prefix}-`, '');
      const ends = parseEdgeEnds(raw, nodeById);
      const colorIndex = edges.length % theme.edges.length;
      const color = theme.edges[colorIndex];
      const width = path.classList.contains('edge-thickness-thick') ? baseWidth + 1.6 : baseWidth;
      let length = 0;
      try {
        length = path.getTotalLength();
      } catch {
        length = 0;
      }
      path.style.fill = 'none';
      path.style.stroke = color;
      path.style.strokeWidth = `${width}px`;
      path.style.strokeLinecap = 'round';
      path.style.opacity = '0.9';
      const marker = coloredMarker(path.getAttribute('marker-end'), color);
      const markerStart = coloredMarker(path.getAttribute('marker-start'), color);
      if (marker) path.setAttribute('marker-end', marker);
      if (markerStart) path.setAttribute('marker-start', markerStart);
      edges.push({
        path,
        index,
        from: ends?.[0] ?? null,
        to: ends?.[1] ?? null,
        color,
        colorIndex,
        width,
        length,
        label: labelById.get(raw) || null,
        markerEnd: path.getAttribute('marker-end'),
        markerStart: path.getAttribute('marker-start'),
        start: 0,
        end: 0,
      });
    });

    // One filter pass per edge group instead of one per edge keeps big diagrams smooth.
    const edgeGroups = [...svg.querySelectorAll('.edgePaths')];
    if (opts.glow) for (const g of edgeGroups) g.style.filter = `url(#${tag}-glow)`;

    // Particles sit just above the edges and below the nodes.
    const layer = el('g', { 'data-layer': 'particles', style: 'pointer-events: none;' });
    if (opts.glow || opts.particleStyle === 'spark') layer.style.filter = `url(#${tag}-glow)`;
    const edgeGroup = edgeGroups[0];
    if (edgeGroup && edgeGroup.parentNode) edgeGroup.parentNode.insertBefore(layer, edgeGroup.nextSibling);
    else svg.append(layer);

    // Chromium paints a black square at the origin for a filtered group whose children are all
    // still invisible, as both groups are before the first edge draws. A box spanning the
    // diagram keeps the group from ever being empty.
    for (const g of [...edgeGroups, layer]) {
      if (!g.style.filter || !vb?.width) continue;
      g.prepend(
        el('rect', {
          class: 'am-filter-pad',
          x: vb.x,
          y: vb.y,
          width: vb.width,
          height: vb.height,
          fill: 'none',
          'pointer-events': 'none',
        }),
      );
    }

    return { nodes, nodeById, edges, clusters, layer };
  }

  styleNode(node) {
    const theme = this.theme;
    const tag = this.tag;
    const gi = node.index % theme.gradients.length;
    const [from, to] = theme.gradients[gi];
    const grad = `url(#${tag}-node-grad-${gi})`;
    let text = theme.text;
    const shapes = [...node.inner.querySelectorAll('rect, polygon, circle, ellipse, path')].filter(
      (s) => !s.closest('.label') && !s.closest('foreignObject'),
    );
    for (const shape of shapes) {
      const userStyled = /(^|;)\s*(fill|stroke)\s*:/.test(shape.getAttribute('style') || '');
      if (shape.tagName === 'rect') applyCorners(shape, this.opts.corners);
      if (userStyled) continue;
      const s = shape.style;
      s.filter = '';
      switch (this.opts.nodeStyle) {
        case 'glass':
          s.fill = `url(#${tag}-glass)`;
          s.fillOpacity = '1';
          s.stroke = from;
          s.strokeWidth = '1.6px';
          s.filter = `url(#${tag}-shadow)`;
          break;
        case 'neon':
          s.fill = theme.dark ? '#05070f' : '#ffffff';
          s.fillOpacity = '0.9';
          s.stroke = from;
          s.strokeWidth = '2px';
          s.filter = `url(#${tag}-neon)`;
          break;
        case 'solid':
          s.fill = from;
          s.fillOpacity = '1';
          s.stroke = to;
          s.strokeWidth = '1.5px';
          text = luminance(from) > 0.4 ? '#0b1020' : '#ffffff';
          break;
        case 'outline':
          s.fill = 'transparent';
          s.fillOpacity = '1';
          s.stroke = from;
          s.strokeWidth = '2px';
          break;
        case 'soft':
          s.fill = mix(from, '#ffffff', 0.72);
          s.fillOpacity = '1';
          s.stroke = 'none';
          s.filter = `url(#${tag}-shadow)`;
          text = '#1e293b';
          break;
        default:
          s.fill = grad;
          s.fillOpacity = String(theme.nodeFillOpacity);
          s.stroke = grad;
          s.strokeWidth = '2.4px';
      }
    }
    if (text !== theme.text) node.inner.style.setProperty('--am-text', text);
  }

  // ---- timing

  schedule(graph, preset) {
    this.scheduleBuild(graph);
    if (preset === 'cascade') this.scheduleCascade(graph);
    else if (preset === 'typewriter') this.scheduleTypewriter(graph);
    else if (preset === 'pulse') {
      for (const n of graph.nodes) n.appear = 0;
      for (const e of graph.edges) e.start = e.end = 0;
    }
    const entrance = ENTRANCES[preset]?.duration ?? 0;
    graph.total = Math.max(0, ...graph.nodes.map((n) => n.appear + entrance), ...graph.edges.map((e) => e.end));
  }

  drawDuration(e) {
    return clamp(e.length * T.drawPerPx, T.drawMin, T.drawMax);
  }

  scheduleBuild(graph) {
    const { nodes, nodeById, edges } = graph;
    const outgoing = new Map(nodes.map((n) => [n.id, []]));
    const incoming = new Map(nodes.map((n) => [n.id, 0]));
    for (const e of edges) {
      if (e.from == null || e.to == null) continue;
      outgoing.get(e.from).push(e);
      if (e.from !== e.to) incoming.set(e.to, incoming.get(e.to) + 1);
    }
    graph.outgoing = outgoing;
    let sources = nodes.filter((n) => incoming.get(n.id) === 0);
    if (!sources.length && nodes.length) sources = [nodes[0]];
    sources.forEach((n, i) => {
      n.appear = i * T.sourceStagger;
    });

    const timed = new Set();
    const order = [];
    let latest = 0;
    for (;;) {
      let next = null;
      for (const n of nodes) if (!n.done && n.appear !== Infinity && (!next || n.appear < next.appear)) next = n;
      if (!next) next = nodes.find((n) => !n.done);
      if (!next) break;
      // Nodes only reachable through a cycle that hasn't started yet join right after the latest one.
      if (next.appear === Infinity) next.appear = latest + T.sourceStagger;
      next.done = true;
      order.push(next);
      latest = Math.max(latest, next.appear);
      outgoing.get(next.id).forEach((e, k) => {
        if (timed.has(e)) return;
        timed.add(e);
        e.start = next.appear + T.edgeLead + k * T.edgeStagger;
        e.end = e.start + this.drawDuration(e);
        const target = nodeById.get(e.to);
        if (target && !target.done) target.appear = Math.min(target.appear, e.end - T.nodeDur * 0.35);
      });
    }
    graph.order = order;

    let tail = Math.max(latest + T.nodeDur, ...edges.filter((e) => timed.has(e)).map((e) => e.end), 0);
    for (const e of edges) {
      if (timed.has(e)) continue;
      e.start = tail;
      e.end = e.start + this.drawDuration(e);
      tail += T.edgeStagger;
    }
  }

  scheduleCascade(graph) {
    const dir = flowDirection(this.source);
    const horizontal = dir === 'LR' || dir === 'RL';
    const sign = dir === 'RL' || dir === 'BT' ? -1 : 1;
    const scale = this.view.k || 1;
    const placed = graph.nodes.map((n) => {
      const r = n.g.getBoundingClientRect();
      const cx = (r.left + r.width / 2) / scale;
      const cy = (r.top + r.height / 2) / scale;
      return { n, primary: sign * (horizontal ? cx : cy), secondary: horizontal ? cy : cx };
    });
    placed.sort((a, b) => a.primary - b.primary || a.secondary - b.secondary);
    let bucket = -1;
    let bucketStart = -Infinity;
    let rank = 0;
    for (const p of placed) {
      if (p.primary - bucketStart > 24) {
        bucket++;
        bucketStart = p.primary;
        rank = 0;
      }
      p.n.appear = bucket * T.cascadeStep + rank * 60;
      rank++;
    }
    let tail = Math.max(0, ...graph.nodes.map((n) => n.appear));
    for (const e of graph.edges) {
      const from = graph.nodeById.get(e.from);
      const to = graph.nodeById.get(e.to);
      e.start = from ? from.appear + 220 : to ? to.appear : (tail += T.edgeStagger);
      e.end = e.start + this.drawDuration(e);
    }
  }

  scheduleTypewriter(graph) {
    const gap = T.typeGap;
    const entrance = ENTRANCES.typewriter.duration;
    const placed = new Set();
    let t = 0;
    const write = (e) => {
      e.start = t;
      e.end = t + clamp(e.length * 1.6, 300, 800);
      t = e.end + gap;
      placed.add(e);
    };
    for (const n of graph.order) {
      n.appear = t;
      t += entrance + gap;
      for (const e of graph.outgoing.get(n.id) || []) if (!placed.has(e)) write(e);
    }
    for (const e of graph.edges) if (!placed.has(e)) write(e);
  }

  startTimeline(token, preset) {
    const graph = this.graph;

    if (preset === 'pulse') {
      graph.nodes.forEach((n, i) => {
        this.track(
          n.inner.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.045)' }, { transform: 'scale(1)' }], {
            duration: 2600,
            delay: -i * 330,
            iterations: Infinity,
            easing: 'ease-in-out',
          }),
        );
      });
      graph.edges.forEach((e, i) => {
        e.path.classList.add('am-drawn');
        this.track(
          e.path.animate(
            [
              { opacity: 0.45, strokeWidth: `${e.width}px` },
              { opacity: 1, strokeWidth: `${e.width * 1.7}px` },
              { opacity: 0.45, strokeWidth: `${e.width}px` },
            ],
            { duration: 2400, delay: -i * 280, iterations: Infinity, easing: 'ease-in-out' },
          ),
        );
      });
      this.spawnParticles(graph, 0);
      return;
    }

    for (const c of graph.clusters) {
      this.track(c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'both', easing: 'ease-out' }));
    }

    const entrance = ENTRANCES[preset] || ENTRANCES.build;
    for (const n of graph.nodes) {
      this.track(
        n.inner.animate(entrance.frames, {
          duration: entrance.duration,
          delay: n.appear,
          fill: 'both',
          easing: entrance.easing,
        }),
      );
    }

    for (const e of graph.edges) {
      const { path, length } = e;
      let reveal;
      if (preset === 'fade') {
        reveal = this.track(
          path.animate([{ opacity: 0 }, { opacity: 0.9 }], {
            duration: Math.max(500, e.end - e.start),
            delay: e.start,
            fill: 'both',
            easing: 'ease-in-out',
          }),
        );
      } else {
        if (e.markerEnd) path.removeAttribute('marker-end');
        if (e.markerStart) path.removeAttribute('marker-start');
        path.style.strokeDasharray = `${length} ${length}`;
        path.style.strokeDashoffset = String(length);
        reveal = this.track(
          path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
            duration: e.end - e.start,
            delay: e.start,
            fill: 'both',
            easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
          }),
        );
      }
      reveal.finished
        .then(() => {
          if (this.token !== token) return;
          path.style.strokeDasharray = '';
          path.style.strokeDashoffset = '';
          if (e.markerEnd) path.setAttribute('marker-end', e.markerEnd);
          if (e.markerStart) path.setAttribute('marker-start', e.markerStart);
          path.classList.add('am-drawn');
          reveal.cancel();
        })
        .catch(() => {});
      if (e.label) {
        this.track(e.label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: Math.max(0, e.end - 150), fill: 'both' }));
      }
    }

    this.spawnParticles(graph, 0);

    this.clock = new Animation(new KeyframeEffect(null, null, { duration: graph.total + T.hold }), document.timeline);
    this.clock.updatePlaybackRate(resolveSpeed(this.opts.speed));
    this.clock.onfinish = () => {
      if (this.token === token && this.opts.loop && this.playing) this.replay();
    };
    this.clock.play();
  }

  // ---- particles

  makeParticle(e) {
    const style = this.opts.particleStyle;
    if (style === 'comet') {
      const g = el('g', { class: 'am-particle', opacity: 0 });
      g.append(
        el('path', { d: 'M0 -3.2 L-28 0 L0 3.2 Z', fill: `url(#${this.tag}-comet-${e.colorIndex})` }),
        el('circle', { r: 3.6, cx: 0, cy: 0, fill: e.color }),
      );
      return g;
    }
    if (style === 'arrow') {
      return el('path', { class: 'am-particle', d: 'M-5 -4.5 L5 0 L-5 4.5 L-2.5 0 Z', fill: e.color, opacity: 0 });
    }
    if (style === 'spark') {
      return el('circle', { class: 'am-particle', r: 2.2, cx: 0, cy: 0, fill: mix(e.color, '#ffffff', 0.45), opacity: 0 });
    }
    return el('circle', { class: 'am-particle', r: 4, cx: 0, cy: 0, fill: e.color, opacity: 0 });
  }

  spawnParticles(graph, elapsed) {
    const spark = this.opts.particleStyle === 'spark';
    const base = Math.max(0, Math.floor(Number(this.opts.particles) || 0));
    const count = spark ? base * 2 : base;
    if (!count) return;
    let layerInverse = null;
    try {
      layerInverse = graph.layer.getCTM()?.inverse() || null;
    } catch {
      layerInverse = null;
    }
    const frames = spark
      ? [
          { offsetDistance: '0%', opacity: 0 },
          { opacity: 1, offset: 0.1 },
          { opacity: 0.35, offset: 0.3 },
          { opacity: 1, offset: 0.5 },
          { opacity: 0.4, offset: 0.7 },
          { opacity: 1, offset: 0.85 },
          { offsetDistance: '100%', opacity: 0 },
        ]
      : [
          { offsetDistance: '0%', opacity: 0 },
          { opacity: 0.9, offset: 0.1 },
          { opacity: 0.9, offset: 0.9 },
          { offsetDistance: '100%', opacity: 0 },
        ];
    for (const e of graph.edges) {
      const d = e.path.getAttribute('d');
      if (!d || e.length < 4) continue;
      const wrap = el('g');
      const pathCtm = e.path.getCTM();
      if (layerInverse && pathCtm) {
        const m = layerInverse.multiply(pathCtm);
        wrap.setAttribute('transform', `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`);
      }
      graph.layer.append(wrap);
      const travel = clamp(e.length * T.particlePerPx, T.particleMin, T.particleMax) * (spark ? 0.8 : 1);
      for (let i = 0; i < count; i++) {
        const dot = this.makeParticle(e);
        dot.style.offsetPath = `path("${d.replace(/"/g, '')}")`;
        dot.style.offsetDistance = '0%';
        wrap.append(dot);
        const anim = dot.animate(frames, {
          duration: travel,
          delay: Math.max(0, e.end - elapsed) + (i * travel) / count,
          iterations: Infinity,
          fill: 'backwards',
          easing: 'linear',
        });
        this.track(anim, this.particleAnims);
      }
    }
  }

  showFinalState() {
    this.svg.dataset.flow = 'off';
    for (const e of this.graph.edges) e.path.classList.add('am-drawn');
  }
}

function glowFilter(id, layers, attrs) {
  const filter = el('filter', { id, 'color-interpolation-filters': 'sRGB', ...attrs });
  const merge = el('feMerge');
  const names = [];
  layers.forEach(([deviation, slope], i) => {
    const blur = el('feGaussianBlur', { stdDeviation: deviation, in: 'SourceGraphic', result: `blur${i}` });
    const fade = el('feComponentTransfer', { in: `blur${i}`, result: `blur${i}_faded` });
    fade.append(el('feFuncA', { type: 'linear', slope }));
    filter.append(blur, fade);
    names.unshift(`blur${i}_faded`);
  });
  for (const name of names) merge.append(el('feMergeNode', { in: name }));
  merge.append(el('feMergeNode', { in: 'SourceGraphic' }));
  filter.append(merge);
  return filter;
}

function applyCorners(rect, corners) {
  const h = Number(rect.getAttribute('height')) || 0;
  const r = corners === 'sharp' ? 0 : corners === 'pill' ? h / 2 : Math.min(12, h / 2);
  rect.setAttribute('rx', r);
  rect.setAttribute('ry', r);
}

function parseEdgeEnds(raw, nodeById) {
  const m = /^L[_-](.+)[_-]\d+$/.exec(raw);
  if (!m) return null;
  const middle = m[1];
  for (let i = 1; i < middle.length - 1; i++) {
    const ch = middle[i];
    if (ch !== '_' && ch !== '-') continue;
    const a = middle.slice(0, i);
    const b = middle.slice(i + 1);
    if (nodeById.has(a) && nodeById.has(b)) return [a, b];
  }
  return null;
}

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export async function animateMermaid(container, source, options = {}) {
  const ctl = new MermaidAnimator(container, options);
  try {
    await ctl.update(source);
  } catch (err) {
    // The caller never gets this controller, so nothing else could remove its listeners.
    ctl.destroy();
    throw err;
  }
  return ctl;
}

export default animateMermaid;
