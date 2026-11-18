import { animateMermaid, resolveTheme } from './animate-mermaid.js';

const EXAMPLES = {
  'Hub and spokes': `flowchart LR
    subgraph Sources
        A[Sensors]
        B[Logs]
        C[Events]
        D[Uploads]
    end
    H((Hub))
    subgraph Results
        E[Dashboards]
        F[Alerts]
        G[Reports]
    end
    A --> H
    B --> H
    C --> H
    D --> H
    H --> E
    H --> F
    H --> G`,
  'Request lifecycle': `flowchart TD
    A([Request]) --> B{Cached?}
    B -- yes --> C[Serve from cache]
    B -- no --> D[Fetch from origin]
    D --> E[(Store)]
    E --> C
    C --> F([Response])`,
  'Release train': `flowchart LR
    dev[Develop] --> rc[Release candidate]
    rc ==> qa{QA passes?}
    qa -- no --> fix[Fix]
    fix -.-> rc
    qa == yes ==> ship[Ship]
    ship --> mon[Monitor]`,
  'Feedback loop': `flowchart LR
    Plan --> Build --> Measure --> Learn --> Plan
    Learn --> Share`,
  'Microservices (shapes)': `flowchart TD
    user([User]) --> gw{{API Gateway}}
    subgraph Services
        auth[Auth]
        orders[Orders]
        pay[Payments]
    end
    gw --> auth
    gw --> orders
    orders --> pay
    orders --> db[(Orders DB)]
    pay --> q>Events]
    q --> mail[[Email worker]]`,
  'CI pipeline (labels, thick)': `flowchart LR
    push([Push]) --> lint[Lint] & test[Unit tests] & build[Build]
    lint --> gate{All green?}
    test --> gate
    build --> gate
    gate == yes ==> stage[Deploy to staging]
    gate -. no .-> fix[Notify author]
    stage --> e2e[E2E tests] --> prod([Release])`,
  'Onboarding journey (long)': `flowchart LR
    visit[Visit site] --> signup[Sign up] --> verify[Verify email] --> profile[Set up profile]
    profile --> invite[Invite team] --> first[First project] --> aha((Aha!))`,
};

const $ = (id) => document.getElementById(id);
const source = $('source');
const exampleSelect = $('example');
const stage = $('stage');
const status = $('status');
const toggle = $('toggle');
const particles = $('particles');
const particlesOut = $('particles-out');
const readout = $('zoom-readout');
const fullscreenBtn = $('fullscreen');

const SELECTS = ['preset', 'particleStyle', 'speed', 'flow', 'theme', 'nodeStyle', 'corners', 'curve', 'thickness'];
const CHECKS = ['loop', 'glow'];

for (const name of Object.keys(EXAMPLES)) exampleSelect.append(new Option(name, name));
source.value = EXAMPLES['Hub and spokes'];

let ctl = null;
let timer = 0;

function options() {
  const opts = { particles: Number(particles.value) };
  for (const id of SELECTS) opts[id] = $(id).value;
  for (const id of CHECKS) opts[id] = $(id).checked;
  return opts;
}

function setStatus(text, isError = false) {
  status.textContent = text;
  status.classList.toggle('error', isError);
}

function syncToggle() {
  toggle.textContent = ctl && !ctl.playing ? 'Play' : 'Pause';
}

function applyStageTheme() {
  const theme = resolveTheme($('theme').value);
  stage.style.setProperty('--stage-bg', theme.background);
  stage.style.setProperty('--stage-grid', theme.grid);
  stage.classList.toggle('is-light', theme.dark === false);
}

const FS_ENTER = 'M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5';
const FS_EXIT = 'M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5';

function onViewChange({ zoom, fullscreen }) {
  readout.textContent = `${Math.round(zoom * 100)}%`;
  const label = fullscreen ? 'Exit fullscreen' : 'Fullscreen';
  $('fs-label').textContent = label;
  fullscreenBtn.setAttribute('aria-label', label);
  fullscreenBtn.setAttribute('aria-pressed', String(fullscreen));
  $('fs-icon').setAttribute('d', fullscreen ? FS_EXIT : FS_ENTER);
}

async function run(task) {
  try {
    await task();
    setStatus('Rendered.');
  } catch (err) {
    const message = String(err?.message || err).split('\n').slice(0, 4).join('\n');
    setStatus(ctl ? `Kept the last diagram. ${message}` : message, true);
  }
  syncToggle();
}

let queue = Promise.resolve();

// One render at a time, so typing while Mermaid is still loading can't create a second animator.
function render() {
  queue = queue.then(() => run(async () => {
    const text = source.value;
    if (!ctl) {
      ctl = await animateMermaid($('diagram'), text, { ...options(), fullscreenTarget: stage, onViewChange });
    } else {
      await ctl.update(text);
    }
  }));
  return queue;
}

source.addEventListener('input', () => {
  clearTimeout(timer);
  setStatus('Typing…');
  timer = setTimeout(render, 450);
});

exampleSelect.addEventListener('change', () => {
  source.value = EXAMPLES[exampleSelect.value];
  render();
});

for (const id of [...SELECTS, ...CHECKS]) {
  $(id).addEventListener('change', () => {
    if (id === 'theme') applyStageTheme();
    if (ctl) queue = queue.then(() => run(() => ctl.set(options())));
  });
}

particles.addEventListener('input', () => {
  particlesOut.textContent = particles.value;
  ctl?.setParticles(Number(particles.value));
});

toggle.addEventListener('click', () => {
  ctl?.toggle();
  syncToggle();
});
$('replay').addEventListener('click', () => {
  ctl?.replay();
  ctl?.play();
  syncToggle();
});
$('zoom-in').addEventListener('click', () => ctl?.zoomIn());
$('zoom-out').addEventListener('click', () => ctl?.zoomOut());
$('fit').addEventListener('click', () => ctl?.fit());
fullscreenBtn.addEventListener('click', () => ctl?.toggleFullscreen());

applyStageTheme();
// Mermaid measures label text while rendering, so the web font has to be ready first.
await document.fonts.ready;
setStatus('Loading Mermaid…');
render();
