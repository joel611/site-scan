import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { Graph } from "./types"

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function generateReport(graph: Graph, domain: string): Promise<void> {
  const sigmaSource = readFileSync(join(__dirname, "../node_modules/sigma/dist/sigma.min.js"), "utf-8")
  const graphologySource = readFileSync(join(__dirname, "../node_modules/graphology/dist/graphology.umd.min.js"), "utf-8")
  const forceAtlas2Source = readFileSync(join(__dirname, "vendor/forceatlas2.bundle.js"), "utf-8")
  const noverlapSource = readFileSync(join(__dirname, "vendor/noverlap.bundle.js"), "utf-8")
  const graphJson = JSON.stringify({ nodes: graph.nodes, edges: graph.edges, stats: graph.stats })
  const timestamp = new Date().toISOString()
  const outputFile = `${domain.replace(/\./g, "-")}-scan.html`

  const html = buildHtml(graphJson, sigmaSource, graphologySource, forceAtlas2Source, noverlapSource, domain, timestamp, graph.stats)
  await Bun.write(outputFile, html)
}

function buildHtml(graphJson: string, sigmaSource: string, graphologySource: string, forceAtlas2Source: string, noverlapSource: string, domain: string, timestamp: string, stats: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${domain} — Site Scan</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e2e8f0; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

/* Header */
#header { background: #1a1d27; border-bottom: 1px solid #2d3148; padding: 12px 20px; display: flex; align-items: center; gap: 20px; flex-shrink: 0; }
#header h1 { font-size: 16px; font-weight: 600; color: #a78bfa; }
#header .meta { font-size: 12px; color: #64748b; }
#header .stats-pills { display: flex; gap: 8px; margin-left: auto; }
.pill { background: #1e2235; border: 1px solid #2d3148; border-radius: 20px; padding: 3px 10px; font-size: 12px; color: #94a3b8; }
.pill span { color: #e2e8f0; font-weight: 600; }

/* Tabs */
#tabs { background: #1a1d27; border-bottom: 1px solid #2d3148; display: flex; padding: 0 20px; flex-shrink: 0; }
.tab { padding: 10px 16px; font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent; color: #64748b; transition: color 0.15s; }
.tab:hover { color: #e2e8f0; }
.tab.active { color: #a78bfa; border-bottom-color: #a78bfa; }

/* Main layout */
#main { display: flex; flex: 1; overflow: hidden; }

/* Graph view */
#graph-view { display: flex; flex: 1; overflow: hidden; }
#sidebar { width: 220px; background: #1a1d27; border-right: 1px solid #2d3148; padding: 14px; overflow-y: auto; flex-shrink: 0; }
#sidebar h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 10px; }
#sidebar .filter-group { margin-bottom: 16px; }
#sidebar .filter-group label { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #94a3b8; cursor: pointer; padding: 3px 0; }
#sidebar .filter-group input[type=checkbox] { accent-color: #a78bfa; }
#sidebar .range-row { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 4px; }
input[type=range] { width: 100%; accent-color: #a78bfa; }
.toggle-btn { background: #1e2235; border: 1px solid #2d3148; border-radius: 6px; color: #94a3b8; font-size: 12px; padding: 5px 10px; cursor: pointer; width: 100%; text-align: left; transition: background 0.15s; }
.toggle-btn:hover { background: #252840; }
.toggle-btn.active { background: #2d2455; border-color: #7c3aed; color: #a78bfa; }

#graph-canvas { flex: 1; position: relative; overflow: hidden; }
#sigma-container { width: 100%; height: 100%; position: relative; }
#hull-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
#sigma-container > canvas { z-index: 1; }

/* Tooltip */
#tooltip { position: absolute; background: #1a1d27; border: 1px solid #2d3148; border-radius: 8px; padding: 10px 14px; font-size: 12px; pointer-events: none; max-width: 280px; z-index: 100; opacity: 0; transition: opacity 0.1s; }
#tooltip .t-title { font-weight: 600; color: #e2e8f0; margin-bottom: 4px; word-break: break-word; }
#tooltip .t-url { color: #64748b; font-size: 11px; word-break: break-all; margin-bottom: 6px; }
#tooltip .t-row { display: flex; gap: 12px; color: #94a3b8; }
#tooltip .t-row span { color: #e2e8f0; }

/* Stats view */
#stats-view { flex: 1; overflow-y: auto; padding: 24px; display: none; }

/* Links view */
#links-view { flex: 1; overflow-y: auto; padding: 24px; display: none; }
.cards { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 28px; }
.card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 10px; padding: 16px 20px; min-width: 140px; }
.card .c-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
.card .c-val { font-size: 28px; font-weight: 700; color: #a78bfa; }

.data-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
.data-table th { text-align: left; padding: 8px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid #2d3148; cursor: pointer; user-select: none; white-space: nowrap; }
.data-table th:hover { color: #94a3b8; }
.data-table th.sorted-asc::after { content: ' ↑'; color: #a78bfa; }
.data-table th.sorted-desc::after { content: ' ↓'; color: #a78bfa; }
.data-table td { padding: 8px 12px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e2235; }
.data-table td:first-child { color: #e2e8f0; font-family: monospace; font-size: 12px; }
.data-table tr:hover td { background: #1e2235; }
h3.section-title { font-size: 14px; font-weight: 600; color: #e2e8f0; margin-bottom: 12px; }

/* Detail panel */
#graph-view { position: relative; }
#detail-panel { position: absolute; right: 0; top: 0; bottom: 0; width: 320px; background: #1a1d27; border-left: 1px solid #2d3148; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.2s ease; z-index: 10; overflow: hidden; }
#detail-panel.open { transform: translateX(0); }
#dp-header { display: flex; align-items: flex-start; gap: 8px; padding: 14px 14px 10px; border-bottom: 1px solid #2d3148; flex-shrink: 0; }
#dp-title { flex: 1; font-size: 13px; font-weight: 600; color: #e2e8f0; word-break: break-word; line-height: 1.4; }
#dp-close { background: none; border: none; color: #64748b; font-size: 18px; cursor: pointer; padding: 0 2px; line-height: 1; flex-shrink: 0; }
#dp-close:hover { color: #e2e8f0; }
#dp-url { padding: 8px 14px 4px; font-family: monospace; font-size: 11px; color: #64748b; word-break: break-all; flex-shrink: 0; }
#dp-meta { padding: 4px 14px 10px; font-size: 12px; color: #94a3b8; display: flex; gap: 12px; flex-shrink: 0; }
#dp-visit { margin: 0 14px 12px; background: #1e2235; border: 1px solid #2d3148; border-radius: 6px; color: #a78bfa; font-size: 12px; padding: 5px 10px; cursor: pointer; text-align: left; flex-shrink: 0; }
#dp-visit:hover { background: #252840; }
#dp-body { flex: 1; overflow-y: auto; padding-bottom: 16px; }
.dp-section { padding: 10px 14px; border-top: 1px solid #2d3148; }
.dp-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.dp-count { color: #475569; font-weight: normal; }
.dp-list-item { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 5px; cursor: pointer; font-size: 12px; color: #94a3b8; }
.dp-list-item:hover { background: #1e2235; color: #e2e8f0; }
.dp-item-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dead-badge { background: #7f1d1d; border: 1px solid #dc2626; color: #fca5a5; font-size: 10px; padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
.missing-badge { background: #1e2a1a; border: 1px solid #4a5568; color: #718096; font-size: 10px; padding: 1px 5px; border-radius: 3px; flex-shrink: 0; font-style: italic; }
.dp-lang-row { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 5px; font-size: 12px; color: #94a3b8; }
.dp-lang-row.missing { opacity: 0.5; }
.dp-lang-code { width: 32px; font-weight: 600; color: #a78bfa; flex-shrink: 0; font-size: 11px; }
.dp-lang-row.missing .dp-lang-code { color: #64748b; }
.dp-lang-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dp-lang-url { font-family: monospace; font-size: 10px; color: #475569; cursor: pointer; }
.dp-lang-url:hover { color: #a78bfa; text-decoration: underline; }
.dp-empty { font-size: 12px; color: #475569; font-style: italic; padding: 2px 0; }
.dp-more { font-size: 11px; color: #475569; font-style: italic; padding: 2px 8px; }
</style>
</head>
<body>

<div id="header">
  <h1>${domain}</h1>
  <div class="meta">${new Date(timestamp).toLocaleString()}</div>
  <div class="stats-pills">
    <div class="pill">Pages: <span>${stats.totalPages}</span></div>
    <div class="pill">Templates: <span>${stats.totalTemplates}</span></div>
    <div class="pill">Sections: <span>${stats.totalSections}</span></div>
    <div class="pill">Dead: <span>${stats.deadCount}</span></div>
  </div>
</div>

<div id="tabs">
  <div class="tab active" onclick="switchTab('graph')">Graph</div>
  <div class="tab" onclick="switchTab('stats')">Stats</div>
  <div class="tab" onclick="switchTab('links')">Pages</div>
</div>

<div id="main">
  <div id="graph-view">
    <div id="sidebar">
      <div class="filter-group">
        <h2>Sections</h2>
        <div id="section-filters"></div>
      </div>
      <div class="filter-group">
        <h2>Depth</h2>
        <input type="range" id="depth-min" min="0" step="1" oninput="applyFilters()">
        <input type="range" id="depth-max" min="0" step="1" oninput="applyFilters()">
        <div class="range-row"><span id="depth-min-label">0</span><span id="depth-max-label">10</span></div>
      </div>
      <div class="filter-group">
        <button class="toggle-btn" id="hulls-btn" onclick="toggleFilter('hulls')">Section Clusters</button>
      </div>
      <div class="filter-group">
        <button class="toggle-btn" id="orphan-btn" onclick="toggleFilter('orphan')">Show Orphans</button>
      </div>
      <div class="filter-group">
        <button class="toggle-btn" id="dead-btn" onclick="toggleFilter('dead')">Show Dead</button>
      </div>
    </div>
    <div id="graph-canvas">
      <div id="sigma-container"><canvas id="hull-canvas"></canvas></div>
      <div id="tooltip">
        <div class="t-title" id="tt-title"></div>
        <div class="t-url" id="tt-url"></div>
        <div class="t-row">Status: <span id="tt-status"></span> &nbsp; Depth: <span id="tt-depth"></span></div>
        <div class="t-row">In: <span id="tt-in"></span> &nbsp; Out: <span id="tt-out"></span></div>
      </div>
    </div>
    <div id="detail-panel">
      <div id="dp-header">
        <div id="dp-title"></div>
        <button id="dp-close" onclick="closePanel()">✕</button>
      </div>
      <div id="dp-url"></div>
      <div id="dp-meta"><span>Status: <span id="dp-status"></span></span><span id="dp-depth-meta"></span></div>
      <div id="dp-nav-meta" style="display:none; padding: 2px 14px 8px; font-size: 11px; color: #94a3b8; display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0;"></div>
      <button id="dp-visit" onclick="visitPage()">Visit page →</button>
      <div id="dp-body">
        <div class="dp-section" id="dp-langs-section" style="display:none">
          <div class="dp-section-title">Languages <span id="dp-langs-count" class="dp-count"></span></div>
          <div id="dp-langs"></div>
        </div>
        <div class="dp-section">
          <div class="dp-section-title">Sources <span id="dp-sources-count" class="dp-count"></span></div>
          <div id="dp-sources"></div>
        </div>
        <div class="dp-section">
          <div class="dp-section-title">Backlinks <span id="dp-backlinks-count" class="dp-count"></span></div>
          <div id="dp-backlinks"></div>
        </div>
      </div>
    </div>
  </div>
  <div id="stats-view"></div>
  <div id="links-view"></div>
</div>

<script>
const GRAPH_DATA = ${graphJson};
</script>
<script>
${graphologySource}
</script>
<script>
${forceAtlas2Source}
</script>
<script>
${noverlapSource}
</script>
<script>
${sigmaSource}
</script>
<script>
// --- State ---
const filters = {
  sections: new Set(),
  depthMin: 0,
  depthMax: Infinity,
  showOrphan: true,
  showDead: true,
  showHulls: true,
};

// --- Color palette (Tableau10) ---
const TABLEAU10 = ['#4e79a7','#f28e2c','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ab'];
const hasCommunityData = GRAPH_DATA.nodes.some(n => n.community);
// Group key: navSection (nav-detected) > community > section
const colorGroups = [...new Set(GRAPH_DATA.nodes.map(n => n.navSection || (hasCommunityData ? n.community : null) || n.section))];
const colorScale = (group) => TABLEAU10[colorGroups.indexOf(group) % TABLEAU10.length];
function getGroupKey(n) { return n.navSection || (hasCommunityData ? n.community : null) || n.section; }

function colorWithOpacity(hex, opacity) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return \`rgba(\${r},\${g},\${b},\${opacity})\`;
}

// --- Tab switcher ---
function switchTab(tab) {
  const tabs = ['graph', 'stats', 'links'];
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', tabs[i] === tab));
  document.getElementById('graph-view').style.display = tab === 'graph' ? 'flex' : 'none';
  document.getElementById('stats-view').style.display = tab === 'stats' ? 'block' : 'none';
  document.getElementById('links-view').style.display = tab === 'links' ? 'block' : 'none';
}

// --- Build filter sidebar ---
const sections = [...new Set(GRAPH_DATA.nodes.map(n => n.section))];
function buildSidebar() {
  const container = document.getElementById('section-filters');
  filters.sections = new Set(sections);
  sections.forEach(sec => {
    // Representative group key: use community of the first node in this section
    const rep = GRAPH_DATA.nodes.find(n => n.section === sec);
    const repKey = rep ? getGroupKey(rep) : sec;
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.dataset.section = sec;
    cb.addEventListener('change', () => {
      if (cb.checked) filters.sections.add(sec); else filters.sections.delete(sec);
      applyFilters();
    });
    const dot = document.createElement('span');
    dot.style.cssText = \`width:10px;height:10px;border-radius:50%;background:\${colorScale(repKey)};display:inline-block;flex-shrink:0\`;
    label.appendChild(cb);
    label.appendChild(dot);
    label.appendChild(document.createTextNode(' ' + (sec === '/' ? '(root)' : sec)));
    container.appendChild(label);
  });

  const maxDepth = GRAPH_DATA.stats.maxDepth;
  ['depth-min', 'depth-max'].forEach(id => {
    const el = document.getElementById(id);
    el.max = maxDepth;
    el.value = id === 'depth-min' ? 0 : maxDepth;
  });
  filters.depthMax = maxDepth;
  document.getElementById('depth-max-label').textContent = maxDepth;

}

function applyFilters() {
  const minEl = document.getElementById('depth-min');
  const maxEl = document.getElementById('depth-max');
  filters.depthMin = +minEl.value;
  filters.depthMax = +maxEl.value;
  document.getElementById('depth-min-label').textContent = filters.depthMin;
  document.getElementById('depth-max-label').textContent = filters.depthMax;
  refreshGraph();
}

function toggleFilter(type) {
  if (type === 'orphan') {
    filters.showOrphan = !filters.showOrphan;
    document.getElementById('orphan-btn').classList.toggle('active', filters.showOrphan);
  } else if (type === 'dead') {
    filters.showDead = !filters.showDead;
    document.getElementById('dead-btn').classList.toggle('active', filters.showDead);
  } else if (type === 'hulls') {
    filters.showHulls = !filters.showHulls;
    document.getElementById('hulls-btn').classList.toggle('active', filters.showHulls);
    sigma.refresh();
    return;
  }
  refreshGraph();
}

function isVisible(n) {
  return filters.sections.has(n.section)
    && n.depth >= filters.depthMin
    && n.depth <= filters.depthMax
    && (filters.showOrphan || !n.orphan)
    && (filters.showDead || !n.dead);
}

// --- Convex hull (Graham scan) ---
function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}
function convexHull(points) {
  if (points.length < 3) return null;
  const pts = points.slice().sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// --- Color utilities ---
function mixColors(hex1, hex2, ratio) {
  const r1 = parseInt(hex1.slice(1,3),16), g1 = parseInt(hex1.slice(3,5),16), b1 = parseInt(hex1.slice(5,7),16);
  const r2 = parseInt(hex2.slice(1,3),16), g2 = parseInt(hex2.slice(3,5),16), b2 = parseInt(hex2.slice(5,7),16);
  const r = Math.round(r1 + (r2-r1)*ratio);
  const g = Math.round(g1 + (g2-g1)*ratio);
  const b = Math.round(b1 + (b2-b1)*ratio);
  return '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
}
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d = max-min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return [h*360, s*100, l*100];
}
function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
    const hue2rgb = (p, q, t) => {
      if (t<0) t+=1; if (t>1) t-=1;
      if (t<1/6) return p+(q-p)*6*t;
      if (t<1/2) return q;
      if (t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    };
    r = hue2rgb(p,q,h+1/3); g = hue2rgb(p,q,h); b = hue2rgb(p,q,h-1/3);
  }
  const hex2 = x => Math.round(x*255).toString(16).padStart(2,'0');
  return '#' + hex2(r) + hex2(g) + hex2(b);
}

// --- Node role classification ---
function computeNodeRoles(nodes) {
  const roles = new Map();
  for (const n of nodes) {
    if (n.depth === 0) roles.set(n.id, 'sun');
    else if (n.orphan || n.status !== 200) roles.set(n.id, 'asteroid');
    else if (n.navSource === 'nav' || n.navSource === 'footer') roles.set(n.id, 'planet');
  }
  // Non-anchor nodes in a navSection group → moon; nav anchor is already the planet for that group
  const navPlanetSections = new Set(
    nodes.filter(n => roles.get(n.id) === 'planet').map(n => n.navSection).filter(Boolean)
  );
  for (const n of nodes) {
    if (roles.has(n.id)) continue;
    if (n.navSection && navPlanetSections.has(n.navSection)) roles.set(n.id, 'moon');
  }
  // Fallback: community-based planet for nodes without navSection coverage
  const candidates = nodes.filter(n => !roles.has(n.id) && n.community != null);
  const allCommunities = new Set(candidates.map(n => n.community));
  if (allCommunities.size <= 1) {
    nodes.forEach(n => { if (!roles.has(n.id)) roles.set(n.id, 'moon'); });
    return roles;
  }
  const communityMinDepth = new Map();
  for (const n of candidates) {
    const cur = communityMinDepth.get(n.community);
    if (cur === undefined || n.depth < cur) communityMinDepth.set(n.community, n.depth);
  }
  for (const n of nodes) {
    if (roles.has(n.id)) continue;
    if (n.community != null && n.depth === communityMinDepth.get(n.community)) roles.set(n.id, 'planet');
    else roles.set(n.id, 'moon');
  }
  return roles;
}

// --- Role-based sizing ---
function getRoleSize(n, role, tierMaxInbound) {
  if (role === 'sun') return 45;
  if (role === 'asteroid') return 8;
  const [baseMin, baseMax] = role === 'planet' ? [22, 28] : [11, 16];
  const maxInbound = tierMaxInbound[role] || 1;
  const navMultiplier = n.navSource === 'nav' ? 1.5 : n.navSource === 'footer' ? 1.3 : 1.0;
  return baseMin + (baseMax-baseMin) * Math.min(1, (n.inbound * navMultiplier)/maxInbound);
}

// --- Role-based color ---
function getRoleColor(n, role) {
  if (role === 'sun') return '#FFD700';
  const baseHex = colorScale(getGroupKey(n));
  if (n.status !== 200) return mixColors(baseHex, '#FF4444', 0.6);
  if (role === 'planet') return baseHex;
  const [h, s, l] = hexToHsl(baseHex);
  if (role === 'moon') return hslToHex(h, s*0.7, l*0.7);
  return hslToHex(h, s*0.4, 60); // asteroid
}

// --- Orbital seed ---
function computeOrbitalPositions(nodes, roles) {
  const positions = new Map();
  const nodeCount = nodes.length;
  const planetRadius = 8 * Math.sqrt(nodeCount);
  const moonRadius = planetRadius * 2;
  const asteroidRadius = planetRadius * 3;

  const sunNode = nodes.find(n => n.depth === 0);
  if (sunNode) positions.set(sunNode.id, { x: 0, y: 0 });

  const byCommunity = new Map();
  for (const n of nodes) {
    const role = roles.get(n.id);
    if (role === 'sun') continue;
    const key = n.community != null ? n.community : '__orphan__';
    if (!byCommunity.has(key)) byCommunity.set(key, { planets: [], moons: [], asteroids: [] });
    const g = byCommunity.get(key);
    if (role === 'planet') g.planets.push(n);
    else if (role === 'moon') g.moons.push(n);
    else g.asteroids.push(n);
  }

  const communityKeys = [...byCommunity.keys()].filter(k => k !== '__orphan__');
  const communitySizes = new Map();
  for (const key of communityKeys) {
    const g = byCommunity.get(key);
    communitySizes.set(key, g.planets.length + g.moons.length + g.asteroids.length);
  }
  const totalCommunityNodes = [...communitySizes.values()].reduce((a,b) => a+b, 0) || 1;

  let arcStart = 0;
  const communityArcStart = new Map();
  const communityArcFraction = new Map();
  for (const key of communityKeys) {
    const fraction = (communitySizes.get(key) || 0) / totalCommunityNodes;
    communityArcStart.set(key, arcStart);
    communityArcFraction.set(key, fraction);
    arcStart += fraction * 2 * Math.PI;
  }

  for (const key of communityKeys) {
    const g = byCommunity.get(key);
    const arcFraction = communityArcFraction.get(key);
    const arcStartAngle = communityArcStart.get(key);
    const arcSpan = arcFraction * 2 * Math.PI * 0.8;
    const centroidAngle = arcStartAngle + arcFraction * Math.PI;

    const numPlanets = g.planets.length;
    g.planets.forEach((n, i) => {
      const angle = arcStartAngle + arcFraction * 2 * Math.PI * ((i + 0.5) / (numPlanets || 1));
      positions.set(n.id, { x: Math.cos(angle)*planetRadius, y: Math.sin(angle)*planetRadius });
    });

    const sortedMoons = [...g.moons].sort((a, b) => {
      if (a.subcluster == null && b.subcluster != null) return 1;
      if (a.subcluster != null && b.subcluster == null) return -1;
      if (a.subcluster != null && b.subcluster != null) return String(a.subcluster).localeCompare(String(b.subcluster));
      return 0;
    });
    const moonLocalRadius = planetRadius * 0.55;
    sortedMoons.forEach((n, i) => {
      if (numPlanets === 0) {
        const offset = sortedMoons.length > 1 ? arcSpan*(i/(sortedMoons.length-1)) - arcSpan/2 : 0;
        positions.set(n.id, { x: Math.cos(centroidAngle+offset)*moonRadius, y: Math.sin(centroidAngle+offset)*moonRadius });
        return;
      }
      const planetIndex = i % numPlanets;
      const planet = g.planets[planetIndex];
      const planetPos = positions.get(planet.id);
      const planetAngle = Math.atan2(planetPos.y, planetPos.x);
      const moonsForPlanet = Math.ceil(sortedMoons.length / numPlanets);
      const indexForPlanet = Math.floor(i / numPlanets);
      const spread = moonsForPlanet > 1 ? (Math.PI * 1.2) / (moonsForPlanet - 1) : 0;
      const moonAngle = planetAngle + indexForPlanet * spread - (spread * (moonsForPlanet - 1) / 2);
      positions.set(n.id, {
        x: planetPos.x + Math.cos(moonAngle) * moonLocalRadius,
        y: planetPos.y + Math.sin(moonAngle) * moonLocalRadius,
      });
    });

    g.asteroids.forEach((n, i) => {
      const jitter = (i*0.5 + 0.3) * (i%2===0 ? 1 : -1);
      const angle = centroidAngle + jitter;
      const r = asteroidRadius * (0.9 + (i%3)*0.1);
      positions.set(n.id, { x: Math.cos(angle)*r, y: Math.sin(angle)*r });
    });
  }

  const orphanGroup = byCommunity.get('__orphan__');
  if (orphanGroup) {
    const orphans = [...orphanGroup.planets, ...orphanGroup.moons, ...orphanGroup.asteroids];
    orphans.forEach((n, i) => {
      const angle = (i / Math.max(1, orphans.length)) * 2 * Math.PI;
      positions.set(n.id, { x: Math.cos(angle)*asteroidRadius, y: Math.sin(angle)*asteroidRadius });
    });
  }

  for (const n of nodes) {
    if (!positions.has(n.id)) positions.set(n.id, { x: Math.random()*100, y: Math.random()*100 });
  }

  return positions;
}

// --- Graph setup ---
const nodeById = new Map(GRAPH_DATA.nodes.map(n => [n.id, n]));
const edgesFrom = new Map(GRAPH_DATA.nodes.map(n => [n.id, []]));
const edgesTo = new Map(GRAPH_DATA.nodes.map(n => [n.id, []]));
GRAPH_DATA.edges.forEach(e => {
  if (edgesFrom.has(e.source)) edgesFrom.get(e.source).push(e.target);
  if (edgesTo.has(e.target)) edgesTo.get(e.target).push(e.source);
});

const neighborMap = new Map(GRAPH_DATA.nodes.map(n => [n.id, new Set()]));
GRAPH_DATA.edges.forEach(e => {
  if (neighborMap.has(e.source)) neighborMap.get(e.source).add(e.target);
  if (neighborMap.has(e.target)) neighborMap.get(e.target).add(e.source);
});

function getPathLabel(url) {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] || '/';
  } catch {
    return url;
  }
}

const nodeRoles = computeNodeRoles(GRAPH_DATA.nodes);

const tierMaxInbound = { sun: 0, planet: 0, moon: 0, asteroid: 0 };
GRAPH_DATA.nodes.forEach(n => {
  const role = nodeRoles.get(n.id);
  if (role && n.inbound > tierMaxInbound[role]) tierMaxInbound[role] = n.inbound;
});

const orbitalPositions = computeOrbitalPositions(GRAPH_DATA.nodes, nodeRoles);

const Graph = graphology.Graph;
const graph = new Graph();

GRAPH_DATA.nodes.forEach(n => {
  const nRole = nodeRoles.get(n.id) || 'moon';
  const pos = orbitalPositions.get(n.id) || { x: 0, y: 0 };
  graph.addNode(n.id, {
    x: pos.x,
    y: pos.y,
    size: getRoleSize(n, nRole, tierMaxInbound),
    color: getRoleColor(n, nRole),
    label: GRAPH_DATA.stats.isMultilingual && n.lang !== 'default'
      ? getPathLabel(n.url) + ' (' + n.lang + ')'
      : getPathLabel(n.url),
    lang: n.lang,
    depth: n.depth,
    section: n.section,
    community: n.community,
    subcluster: n.subcluster,
    navSource: n.navSource,
    navSection: n.navSection,
    orphan: n.orphan,
    dead: n.dead,
    status: n.status,
    title: n.title,
    url: n.url,
    inbound: n.inbound,
    outbound: n.outbound,
    langVariants: n.langVariants,
    missingLangs: n.missingLangs,
    role: nRole,
  });
});

GRAPH_DATA.edges.forEach(e => {
  if (graph.hasNode(e.source) && graph.hasNode(e.target)) {
    graph.addEdge(e.source, e.target, { size: 0.8 });
  }
});

graph.forEachEdge((edge, _attrs, source, target) => {
  const srcCom = graph.getNodeAttribute(source, 'community');
  const tgtCom = graph.getNodeAttribute(target, 'community');
  graph.setEdgeAttribute(edge, 'weight', srcCom != null && srcCom === tgtCom ? 2.0 : 0.3);
});

const _sunNode = GRAPH_DATA.nodes.find(n => n.depth === 0);
if (_sunNode) graph.setNodeAttribute(_sunNode.id, 'fixed', true);

// Set FA2 mass per role so heavier nodes anchor their community
graph.forEachNode((id, attrs) => {
  const mass = ({ sun: 60, planet: 20, moon: 4, asteroid: 1 })[attrs.role] ?? 4;
  graph.setNodeAttribute(id, 'mass', mass);
});

// --- Layout ---
function getFA2Settings(nodeCount) {
  const isSmall  = nodeCount < 300;
  const isMedium = nodeCount >= 300  && nodeCount < 1500;
  const isLarge  = nodeCount >= 1500 && nodeCount < 8000;
  return {
    gravity:                        isSmall ? 0.9 : isMedium ? 0.6 : isLarge ? 0.35 : 0.15,
    scalingRatio:                   isSmall ? 8   : isMedium ? 18  : isLarge ? 40   : 80,
    slowDown:                       isSmall ? 1   : isMedium ? 2   : isLarge ? 3    : 5,
    strongGravityMode:              false,
    barnesHutOptimize:              nodeCount > 200,
    barnesHutTheta:                 isLarge ? 0.8 : 0.6,
    edgeWeightInfluence:            0.8,
    outboundAttractionDistribution: true,
    linLogMode:                     false,
    adjustSizes:                    true,
  };
}

const _nodeCount = GRAPH_DATA.nodes.length;
forceAtlas2.assign(graph, {
  iterations: _nodeCount < 300 ? 200 : _nodeCount < 1500 ? 175 : 150,
  settings: getFA2Settings(_nodeCount),
});

noverlap.assign(graph, { maxIterations: 20, ratio: 1.1, margin: 8, expansion: 1.05 });

// Store baseline positions for deterministic re-clustering
const baselinePositions = {};
GRAPH_DATA.nodes.forEach(n => {
  baselinePositions[n.id] = {
    x: graph.getNodeAttribute(n.id, 'x'),
    y: graph.getNodeAttribute(n.id, 'y'),
  };
});

// --- Sigma ---
const container = document.getElementById('sigma-container');
const sigma = new Sigma(graph, container, {
  renderLabels: true,
  labelSize: 9,
  labelColor: { color: '#64748b' },
  labelDensity: 0.1,
  labelGridCellSize: 70,
  labelRenderedSizeThreshold: 6,
  hideEdgesOnMove: true,
  minCameraRatio: 0.002,
  maxCameraRatio: 50,
  zIndex: true,
  defaultNodeColor: '#999',
  defaultEdgeColor: '#2d3148',
  edgeColor: 'default',
});

let selectedNodeId = null;
let panelNode = null;
let hoveredNodeId = null;
let planetFocusId = null;

// Blend hex color toward dark bg (#0f172a) by amount [0..1]
function dimColor(hex, amount) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const br = 15, bg_ = 23, bb = 42; // #0f172a
  const to = (c, base) => Math.round(base + (c - base) * amount);
  return '#' + [to(r,br), to(g,bg_), to(b,bb)].map(v => v.toString(16).padStart(2,'0')).join('');
}
// Lighten hex color by factor (1.0 = no change, 1.5 = 50% toward white)
function brightenColor(hex, factor) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const up = (c) => Math.round(Math.min(255, c + (255-c)*(factor-1)/factor));
  return '#' + [up(r),up(g),up(b)].map(v => v.toString(16).padStart(2,'0')).join('');
}

sigma.setSetting('nodeReducer', (node, data) => {
  if (!isVisible(data)) return { ...data, hidden: true };
  const isSelected = node === selectedNodeId;
  const isHovered = node === hoveredNodeId;
  const neighbors = hoveredNodeId ? neighborMap.get(hoveredNodeId) : null;
  const isNeighbor = neighbors ? neighbors.has(node) : false;
  const isDim = (planetFocusId && data.community !== graph.getNodeAttribute(planetFocusId, 'community'))
    || (hoveredNodeId && !isHovered && !isNeighbor);
  return {
    ...data,
    color: isDim ? dimColor(data.color, data.orphan ? 0.15 : 0.2) : data.color,
    size: isSelected ? data.size * 1.4 : isHovered ? data.size * 1.2 : data.size,
    zIndex: data.dead ? 2 : (data.orphan ? 0 : 1),
    highlighted: isSelected || isHovered,
    borderColor: isSelected ? '#ffffff' : (data.dead ? '#dc2626' : 'rgba(255,255,255,0.15)'),
    borderSize: isSelected ? 2 : 1,
  };
});

sigma.setSetting('edgeReducer', (edge, data) => {
  const source = graph.source(edge);
  const target = graph.target(edge);
  const sourceData = graph.getNodeAttributes(source);
  const targetData = graph.getNodeAttributes(target);
  if (!isVisible(sourceData) || !isVisible(targetData)) return { ...data, hidden: true };
  if (planetFocusId) {
    const focusedCommunity = graph.getNodeAttribute(planetFocusId, 'community');
    const inFocus = sourceData.community === focusedCommunity && targetData.community === focusedCommunity;
    return { ...data, color: inFocus ? brightenColor('#a78bfa', 1.3) : dimColor('#2d3148', 0.15), size: inFocus ? data.size * 2 : data.size * 0.4 };
  }
  const isHighlighted = hoveredNodeId && (source === hoveredNodeId || target === hoveredNodeId);
  return {
    ...data,
    color: isHighlighted ? brightenColor('#a78bfa', 1.3) : dimColor('#2d3148', hoveredNodeId ? 0.15 : 1.0),
    size: isHighlighted ? Math.max(2, data.size * 3) : data.size * (hoveredNodeId ? 0.4 : 1),
  };
});

// --- Events ---
sigma.on('clickNode', ({ node, event }) => {
  event.original.stopPropagation();
  const role = graph.getNodeAttribute(node, 'role');
  if (role === 'planet') {
    if (planetFocusId === node) {
      planetFocusId = null;
      closePanel();
    } else {
      planetFocusId = node;
      openPanel(nodeById.get(node));
    }
    sigma.refresh();
    return;
  }
  if (selectedNodeId === node) {
    closePanel();
  } else {
    openPanel(nodeById.get(node));
  }
});
sigma.on('clickStage', () => {
  planetFocusId = null;
  closePanel();
});

sigma.on('enterNode', ({ node, event }) => {
  hoveredNodeId = node;
  showTooltip(event, nodeById.get(node));
  sigma.refresh();
});

sigma.on('leaveNode', () => {
  hoveredNodeId = null;
  hideTooltip();
  sigma.refresh();
});

// --- Drag ---
let draggedNode = null;
let dragging = false;
sigma.on('downNode', ({ node }) => {
  draggedNode = node;
  dragging = true;
  sigma.getCamera().disable();
});
sigma.on('moveBody', ({ event }) => {
  if (!dragging || !draggedNode) return;
  const pos = sigma.viewportToGraph({ x: event.x, y: event.y });
  graph.setNodeAttribute(draggedNode, 'x', pos.x);
  graph.setNodeAttribute(draggedNode, 'y', pos.y);
  sigma.refresh();
});
sigma.on('upStage', () => {
  if (dragging) {
    dragging = false;
    draggedNode = null;
    sigma.getCamera().enable();
  }
});
sigma.on('upNode', () => {
  if (dragging) {
    dragging = false;
    draggedNode = null;
    sigma.getCamera().enable();
  }
});

// --- Hulls ---
const hullCanvas = document.getElementById('hull-canvas');
const hullCtx = hullCanvas.getContext('2d');
function resizeHullCanvas() {
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  hullCanvas.width = rect.width * dpr;
  hullCanvas.height = rect.height * dpr;
  hullCanvas.style.width = rect.width + 'px';
  hullCanvas.style.height = rect.height + 'px';
  hullCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeHullCanvas();
window.addEventListener('resize', () => { resizeHullCanvas(); sigma.refresh(); });

sigma.on('afterRender', () => {
  if (!filters.showHulls) {
    hullCtx.clearRect(0, 0, hullCanvas.width, hullCanvas.height);
    return;
  }
  hullCtx.clearRect(0, 0, hullCanvas.width, hullCanvas.height);
  const visibleNodes = GRAPH_DATA.nodes.filter(n => isVisible(n));
  const byGroup = {};
  visibleNodes.forEach(n => {
    const key = getGroupKey(n);
    if (!byGroup[key]) byGroup[key] = [];
    const x = graph.getNodeAttribute(n.id, 'x');
    const y = graph.getNodeAttribute(n.id, 'y');
    byGroup[key].push({ id: n.id, x, y, size: graph.getNodeAttribute(n.id, 'size') });
  });

  Object.entries(byGroup).forEach(([group, nodes]) => {
    if (nodes.length === 0) return;
    const color = colorScale(group);
    hullCtx.fillStyle = colorWithOpacity(color, 0.08);
    hullCtx.strokeStyle = colorWithOpacity(color, 0.30);
    hullCtx.setLineDash([4, 3]);
    hullCtx.lineWidth = 1.5;

    if (nodes.length === 1) {
      const pos = sigma.graphToViewport(nodes[0]);
      const r = nodes[0].size + 12;
      hullCtx.beginPath();
      hullCtx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      hullCtx.fill();
      hullCtx.stroke();
    } else if (nodes.length === 2) {
      const p1 = sigma.graphToViewport(nodes[0]);
      const p2 = sigma.graphToViewport(nodes[1]);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const r = Math.sqrt(dx*dx + dy*dy) / 2 + nodes[0].size + 12;
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      hullCtx.beginPath();
      hullCtx.arc(cx, cy, r, 0, Math.PI * 2);
      hullCtx.fill();
      hullCtx.stroke();
    } else {
      const pts = nodes.map(n => sigma.graphToViewport(n));
      const hull = convexHull(pts);
      if (!hull || hull.length < 3) return;
      hullCtx.beginPath();
      hullCtx.moveTo(hull[0].x, hull[0].y);
      for (let i = 1; i < hull.length; i++) {
        hullCtx.lineTo(hull[i].x, hull[i].y);
      }
      hullCtx.closePath();
      hullCtx.fill();
      hullCtx.stroke();
    }
  });
});

function refreshGraph() {
  sigma.refresh();
}

// --- Tooltip ---
const tooltip = document.getElementById('tooltip');
function showTooltip(e, d) {
  document.getElementById('tt-title').textContent = d.title || '(no title)';
  document.getElementById('tt-url').textContent = d.url;
  document.getElementById('tt-status').textContent = d.status || 'timeout';
  document.getElementById('tt-depth').textContent = d.depth;
  document.getElementById('tt-in').textContent = d.inbound;
  document.getElementById('tt-out').textContent = d.outbound;
  tooltip.style.opacity = 1;
  moveTooltip(e);
}
function moveTooltip(e) {
  const x = (e.x || e.original?.offsetX || 0) + 14;
  const y = (e.y || e.original?.offsetY || 0) - 10;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}
function hideTooltip() { tooltip.style.opacity = 0; }

// --- Stats view ---
function buildStats() {
  const { stats } = GRAPH_DATA;
  const view = document.getElementById('stats-view');

  const cards = [
    ['Total Pages', stats.totalPages],
    ['Unique Templates', stats.totalTemplates],
    ['Sections', stats.totalSections],
    ['Orphan Pages', stats.orphanCount],
    ['Dead Links', stats.deadCount],
    ['Max Depth', stats.maxDepth],
  ];

  const langTableHtml = stats.isMultilingual ? \`
    <h3 class="section-title" style="margin-top:24px">Language Breakdown</h3>
    \${buildTable(['Language', 'Pages'], stats.langBreakdown.map(r => [r.lang, r.pageCount]), 'lang-table')}
  \` : '';

  const i18nCoverageHtml = (() => {
    if (!stats.isMultilingual) return '';
    const nodes = GRAPH_DATA.nodes;
    const withMissing = nodes.filter(n => n.missingLangs && n.missingLangs.length > 0);
    if (withMissing.length === 0) return '<h3 class="section-title" style="margin-top:24px">i18n Coverage</h3><p style="color:#59a14f;font-size:13px;margin-top:8px">All pages translated in all languages ✓</p>';
    const rows = withMissing.map(n => {
      let path; try { path = new URL(n.url).pathname; } catch(_) { path = n.url; }
      return [path, n.langVariants ? Object.keys(n.langVariants).join(', ') : '—', (n.missingLangs || []).join(', ')];
    });
    return \`<h3 class="section-title" style="margin-top:24px">i18n Coverage <span style="color:#64748b;font-weight:normal;font-size:12px">(\${withMissing.length} pages missing translations)</span></h3>
    \${buildTable(['Page', 'Has', 'Missing'], rows, 'i18n-table')}\`;
  })();

  view.innerHTML = \`
    <div class="cards">\${cards.map(([l, v]) => \`<div class="card"><div class="c-label">\${l}</div><div class="c-val">\${v}</div></div>\`).join('')}</div>
    <h3 class="section-title">Section Breakdown</h3>
    \${buildTable(['Section', 'Pages', 'Templates'], stats.sectionBreakdown.map(r => [r.section, r.pageCount, r.templateCount]), 'section-table')}
    <h3 class="section-title" style="margin-top:24px">Template Breakdown</h3>
    \${buildTable(['Pattern', 'Pages', 'Section'], stats.templateBreakdown.map(r => [r.pattern, r.pageCount, r.section]), 'template-table')}
    \${langTableHtml}
    \${i18nCoverageHtml}
  \`;

  initSortable('section-table', stats.sectionBreakdown.map(r => [r.section, r.pageCount, r.templateCount]));
  initSortable('template-table', stats.templateBreakdown.map(r => [r.pattern, r.pageCount, r.section]));
}

function buildTable(headers, rows, id) {
  const ths = headers.map((h, i) => \`<th onclick="sortTable('\${id}',\${i})">\${h}</th>\`).join('');
  const trs = rows.map(row => \`<tr>\${row.map(c => \`<td>\${c}</td>\`).join('')}</tr>\`).join('');
  return \`<table class="data-table" id="\${id}"><thead><tr>\${ths}</tr></thead><tbody>\${trs}</tbody></table>\`;
}

const sortState = {};
function initSortable(id, rows) {
  // No-op: sort state is lazily initialized in sortTable
}
function sortTable(id, colIdx) {
  const table = document.getElementById(id);
  if (!table) return;
  const key = \`\${id}:\${colIdx}\`;
  sortState[key] = sortState[key] === 'asc' ? 'desc' : 'asc';
  const dir = sortState[key];

  const ths = table.querySelectorAll('th');
  ths.forEach((th, i) => { th.classList.remove('sorted-asc', 'sorted-desc'); if (i === colIdx) th.classList.add(dir === 'asc' ? 'sorted-asc' : 'sorted-desc'); });

  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const aVal = a.cells[colIdx].textContent;
    const bVal = b.cells[colIdx].textContent;
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);
    const cmp = isNaN(aNum) || isNaN(bNum) ? aVal.localeCompare(bVal) : aNum - bNum;
    return dir === 'asc' ? cmp : -cmp;
  });
  rows.forEach(r => tbody.appendChild(r));
}

function getSourceNodes(nodeId) {
  return (edgesFrom.get(nodeId) || []).map(id => nodeById.get(id)).filter(Boolean);
}
function getBacklinkNodes(nodeId) {
  return (edgesTo.get(nodeId) || []).map(id => nodeById.get(id)).filter(Boolean);
}

// --- Detail Panel ---
function openPanel(node) {
  panelNode = node;
  selectedNodeId = node.id;
  document.getElementById('dp-title').textContent = node.title || '(no title)';
  document.getElementById('dp-url').textContent = node.url;
  document.getElementById('dp-status').textContent = node.status || 'timeout';
  document.getElementById('dp-depth-meta').textContent = 'Depth: ' + node.depth;
  const navMeta = document.getElementById('dp-nav-meta');
  navMeta.innerHTML = '';
  if (node.navSource) {
    const srcBadge = document.createElement('span');
    const color = node.navSource === 'nav' ? '#a78bfa' : '#76b7b2';
    srcBadge.style.cssText = \`background:#1e2235;border:1px solid \${color};color:\${color};border-radius:4px;padding:1px 6px;font-size:10px;font-weight:600;\`;
    srcBadge.textContent = node.navSource === 'nav' ? '⬆ nav' : '⬇ footer';
    navMeta.appendChild(srcBadge);
  }
  if (node.navSection) {
    const secEl = document.createElement('span');
    let navPath;
    try { navPath = new URL(node.navSection).pathname || '/'; } catch(_) { navPath = node.navSection; }
    secEl.style.cssText = 'color:#64748b;font-size:11px;';
    secEl.textContent = 'nav group: ' + navPath;
    secEl.title = node.navSection;
    navMeta.appendChild(secEl);
  }
  navMeta.style.display = (node.navSource || node.navSection) ? 'flex' : 'none';
  renderLangs(node);
  renderSources(node.id);
  renderBacklinks(node.id);
  document.getElementById('detail-panel').classList.add('open');
  sigma.refresh();
}

function renderNodeList(container, nodes, cap) {
  container.innerHTML = '';
  nodes.slice(0, cap).forEach(n => {
    const item = document.createElement('div');
    item.className = 'dp-list-item';
    const label = document.createElement('span');
    label.className = 'dp-item-label';
    let path;
    try { path = new URL(n.url).pathname || '/'; } catch(_) { path = n.url; }
    label.textContent = n.title || path;
    label.title = n.url;
    item.appendChild(label);
    if (n.dead) {
      const badge = document.createElement('span');
      badge.className = 'dead-badge';
      badge.textContent = 'dead';
      item.appendChild(badge);
    }
    item.addEventListener('click', () => focusNode(n.id));
    container.appendChild(item);
  });
  if (nodes.length > cap) {
    const more = document.createElement('div');
    more.className = 'dp-more';
    more.textContent = '+' + (nodes.length - cap) + ' more';
    container.appendChild(more);
  }
}

function renderLangs(node) {
  const section = document.getElementById('dp-langs-section');
  const container = document.getElementById('dp-langs');
  const countEl = document.getElementById('dp-langs-count');
  if (!node.langVariants) { section.style.display = 'none'; return; }

  const variants = Object.entries(node.langVariants);
  const missing = node.missingLangs || [];
  const total = variants.length + missing.length;
  countEl.textContent = '(' + total + ')';
  section.style.display = '';
  container.innerHTML = '';

  for (const [lang, v] of variants) {
    const row = document.createElement('div');
    row.className = 'dp-lang-row';
    row.innerHTML = \`<span class="dp-lang-code">\${lang}</span><span class="dp-lang-title" title="\${v.title}">\${v.title || '(no title)'}</span><span class="dp-lang-url" onclick="window.open('\${v.url}','_blank')" title="\${v.url}">\${new URL(v.url).pathname}</span>\`;
    container.appendChild(row);
  }

  for (const lang of missing) {
    const row = document.createElement('div');
    row.className = 'dp-lang-row missing';
    row.innerHTML = \`<span class="dp-lang-code">\${lang}</span><span class="dp-lang-title" style="color:#475569">missing</span><span class="missing-badge">missing</span>\`;
    container.appendChild(row);
  }
}

function renderSources(nodeId) {
  const nodes = getSourceNodes(nodeId);
  const container = document.getElementById('dp-sources');
  document.getElementById('dp-sources-count').textContent = '(' + nodes.length + ')';
  if (nodes.length === 0) { container.innerHTML = '<div class="dp-empty">No outbound links</div>'; return; }
  renderNodeList(container, nodes, 50);
}

function renderBacklinks(nodeId) {
  const nodes = getBacklinkNodes(nodeId);
  const container = document.getElementById('dp-backlinks');
  document.getElementById('dp-backlinks-count').textContent = '(' + nodes.length + ')';
  if (nodes.length === 0) { container.innerHTML = '<div class="dp-empty">No backlinks (orphan)</div>'; return; }
  renderNodeList(container, nodes, 50);
}

function closePanel() {
  if (!panelNode) return;
  document.getElementById('detail-panel').classList.remove('open');
  panelNode = null;
  selectedNodeId = null;
  sigma.refresh();
}

function visitPage() {
  if (panelNode) window.open(panelNode.url, '_blank');
}

function focusNode(id) {
  const node = nodeById.get(id);
  if (!node) return;
  openPanel(node);
  const nodeX = graph.getNodeAttribute(id, 'x');
  const nodeY = graph.getNodeAttribute(id, 'y');
  if (nodeX !== undefined) {
    sigma.getCamera().animate({ x: nodeX, y: nodeY, ratio: 0.5 }, { duration: 500 });
  }
}

// --- Links view ---
function buildLinks() {
  const view = document.getElementById('links-view');
  const rows = GRAPH_DATA.nodes.map(n => [n.url, n.title || '(no title)', n.section, n.status || 'timeout', n.depth, n.inbound, n.outbound]);
  view.innerHTML = \`
    <h3 class="section-title">All Pages <span style="color:#64748b;font-weight:normal">(\${rows.length})</span></h3>
    \${buildTable(['URL', 'Title', 'Section', 'Status', 'Depth', 'In', 'Out'], rows, 'links-table')}
  \`;
  initSortable('links-table', rows);
}

// --- Init ---
buildSidebar();
buildStats();
buildLinks();

// set initial btn states
document.getElementById('hulls-btn').classList.add('active');
document.getElementById('orphan-btn').classList.add('active');
document.getElementById('dead-btn').classList.add('active');

// Dismissal
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
// Canvas click handled by clickStage event
</script>
</body>
</html>`
}
