import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { Graph, ScanOptions } from "./types"

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function generateReport(graph: Graph, options: ScanOptions): Promise<void> {
  const sigmaSource = readFileSync(join(__dirname, "../node_modules/sigma/dist/sigma.min.js"), "utf-8")
  const graphologySource = readFileSync(join(__dirname, "../node_modules/graphology/dist/graphology.umd.min.js"), "utf-8")
  const forceAtlas2Source = readFileSync(join(__dirname, "vendor/forceatlas2.bundle.js"), "utf-8")
  const graphJson = JSON.stringify({ nodes: graph.nodes, edges: graph.edges, stats: graph.stats })
  const domain = options.domain
  const timestamp = new Date().toISOString()
  const outputFile = `${domain.replace(/\./g, "-")}-scan.html`

  const html = buildHtml(graphJson, sigmaSource, graphologySource, forceAtlas2Source, domain, timestamp, graph.stats)
  await Bun.write(outputFile, html)
}

function buildHtml(graphJson: string, sigmaSource: string, graphologySource: string, forceAtlas2Source: string, domain: string, timestamp: string, stats: any): string {
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
        <h2>Cluster Strength</h2>
        <input type="range" id="cluster-strength" min="0" max="100" step="1" oninput="onClusterChange()">
        <div class="range-row"><span id="cluster-strength-label">30</span></div>
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
      <button id="dp-visit" onclick="visitPage()">Visit page →</button>
      <div id="dp-body">
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
  clusterStrength: 30,
};

// --- Color palette (Tableau10) ---
const TABLEAU10 = ['#4e79a7','#f28e2c','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ab'];
const hasCommunityData = GRAPH_DATA.nodes.some(n => n.community);
// Group key: community when present (new scans), section fallback (legacy data)
const colorGroups = [...new Set(GRAPH_DATA.nodes.map(n => (hasCommunityData ? n.community : null) || n.section))];
const colorScale = (group) => TABLEAU10[colorGroups.indexOf(group) % TABLEAU10.length];
function getGroupKey(n) { return (hasCommunityData ? n.community : null) || n.section; }

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

  const clusterEl = document.getElementById('cluster-strength');
  clusterEl.value = filters.clusterStrength;
  document.getElementById('cluster-strength-label').textContent = filters.clusterStrength;
}

function onClusterChange() {
  const el = document.getElementById('cluster-strength');
  filters.clusterStrength = +el.value;
  document.getElementById('cluster-strength-label').textContent = filters.clusterStrength;
  refreshGraph();
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

function applyClustering(baseline, strength) {
  const visibleNodes = GRAPH_DATA.nodes.filter(n => isVisible(n));
  const byGroup = {};
  visibleNodes.forEach(n => {
    const key = getGroupKey(n);
    if (!byGroup[key]) byGroup[key] = [];
    byGroup[key].push(n.id);
  });

  const positions = {};
  for (const [id, pos] of Object.entries(baseline)) {
    positions[id] = { x: pos.x, y: pos.y };
  }

  for (let iter = 0; iter < 30; iter++) {
    const centroids = {};
    for (const [group, nodeIds] of Object.entries(byGroup)) {
      let cx = 0, cy = 0;
      for (const id of nodeIds) {
        cx += positions[id].x;
        cy += positions[id].y;
      }
      centroids[group] = { x: cx / nodeIds.length, y: cy / nodeIds.length };
    }
    for (const [group, nodeIds] of Object.entries(byGroup)) {
      const c = centroids[group];
      for (const id of nodeIds) {
        const p = positions[id];
        p.x += strength * (c.x - p.x);
        p.y += strength * (c.y - p.y);
      }
    }
  }

  for (const n of visibleNodes) {
    const p = positions[n.id];
    graph.setNodeAttribute(n.id, 'x', p.x);
    graph.setNodeAttribute(n.id, 'y', p.y);
  }
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

const Graph = graphology.Graph;
const graph = new Graph();

GRAPH_DATA.nodes.forEach(n => {
  graph.addNode(n.id, {
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.max(5, Math.min(20, 5 + n.inbound * 0.8)),
    color: colorScale(getGroupKey(n)),
    label: GRAPH_DATA.stats.isMultilingual && n.lang !== 'default'
      ? getPathLabel(n.url) + ' (' + n.lang + ')'
      : getPathLabel(n.url),
    lang: n.lang,
    depth: n.depth,
    section: n.section,
    community: n.community,
    subcluster: n.subcluster,
    orphan: n.orphan,
    dead: n.dead,
    status: n.status,
    title: n.title,
    url: n.url,
    inbound: n.inbound,
    outbound: n.outbound,
  });
});

GRAPH_DATA.edges.forEach(e => {
  if (graph.hasNode(e.source) && graph.hasNode(e.target)) {
    graph.addEdge(e.source, e.target, { size: 0.8 });
  }
});

// --- Layout ---
forceAtlas2(graph, {
  iterations: 300,
  settings: {
    gravity: 1,
    scalingRatio: 2,
    strongGravityMode: true,
    slowDown: 2,
  },
});

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
  labelDensity: 0,
  labelGridCellSize: 0,
  labelRenderedSizeThreshold: 0,
  zIndex: true,
  defaultNodeColor: '#999',
  defaultEdgeColor: '#2d3148',
  edgeColor: 'default',
});

let selectedNodeId = null;
let panelNode = null;
let hoveredNodeId = null;

sigma.setSetting('nodeReducer', (node, data) => {
  if (!isVisible(data)) return { ...data, hidden: true };
  const isSelected = node === selectedNodeId;
  const isHovered = node === hoveredNodeId;
  const neighbors = hoveredNodeId ? neighborMap.get(hoveredNodeId) : null;
  const isNeighbor = neighbors ? neighbors.has(node) : false;
  let opacity = data.orphan ? 0.35 : 0.9;
  if (hoveredNodeId && node !== hoveredNodeId && !isNeighbor) {
    opacity = 0.15;
  }
  return {
    ...data,
    color: data.dead ? '#ef4444' : colorScale(getGroupKey(data)),
    zIndex: data.dead ? 2 : (data.orphan ? 0 : 1),
    highlighted: isSelected || isHovered,
    borderColor: isSelected ? '#ffffff' : (data.dead ? '#dc2626' : 'rgba(255,255,255,0.15)'),
    borderSize: isSelected ? 2 : 1,
    opacity,
  };
});

sigma.setSetting('edgeReducer', (edge, data) => {
  const source = graph.source(edge);
  const target = graph.target(edge);
  const sourceData = graph.getNodeAttributes(source);
  const targetData = graph.getNodeAttributes(target);
  if (!isVisible(sourceData) || !isVisible(targetData)) return { ...data, hidden: true };
  const isHighlighted = hoveredNodeId && (source === hoveredNodeId || target === hoveredNodeId);
  return {
    ...data,
    color: isHighlighted ? '#a78bfa' : '#2d3148',
    opacity: hoveredNodeId && !isHighlighted ? 0.1 : 1,
  };
});

// --- Events ---
sigma.on('clickNode', ({ node, event }) => {
  event.original.stopPropagation();
  if (selectedNodeId === node) {
    closePanel();
  } else {
    openPanel(nodeById.get(node));
  }
});
sigma.on('clickStage', () => closePanel());

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
  applyClustering(baselinePositions, filters.clusterStrength / 100);
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

  view.innerHTML = \`
    <div class="cards">\${cards.map(([l, v]) => \`<div class="card"><div class="c-label">\${l}</div><div class="c-val">\${v}</div></div>\`).join('')}</div>
    <h3 class="section-title">Section Breakdown</h3>
    \${buildTable(['Section', 'Pages', 'Templates'], stats.sectionBreakdown.map(r => [r.section, r.pageCount, r.templateCount]), 'section-table')}
    <h3 class="section-title" style="margin-top:24px">Template Breakdown</h3>
    \${buildTable(['Pattern', 'Pages', 'Section'], stats.templateBreakdown.map(r => [r.pattern, r.pageCount, r.section]), 'template-table')}
    \${langTableHtml}
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
