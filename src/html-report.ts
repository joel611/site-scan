import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { Graph, ScanOptions } from "./types"

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function generateReport(graph: Graph, options: ScanOptions): Promise<void> {
  const d3Source = readFileSync(join(__dirname, "vendor/d3.min.js"), "utf-8")
  const graphJson = JSON.stringify({ nodes: graph.nodes, edges: graph.edges, stats: graph.stats })
  const domain = options.domain
  const timestamp = new Date().toISOString()
  const outputFile = `${domain.replace(/\./g, "-")}-scan.html`

  const html = buildHtml(graphJson, d3Source, domain, timestamp, graph.stats)
  await Bun.write(outputFile, html)
}

function buildHtml(graphJson: string, d3Source: string, domain: string, timestamp: string, stats: any): string {
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
svg#graph-svg { width: 100%; height: 100%; }

/* Tooltip */
#tooltip { position: absolute; background: #1a1d27; border: 1px solid #2d3148; border-radius: 8px; padding: 10px 14px; font-size: 12px; pointer-events: none; max-width: 280px; z-index: 100; opacity: 0; transition: opacity 0.1s; }
#tooltip .t-title { font-weight: 600; color: #e2e8f0; margin-bottom: 4px; word-break: break-word; }
#tooltip .t-url { color: #64748b; font-size: 11px; word-break: break-all; margin-bottom: 6px; }
#tooltip .t-row { display: flex; gap: 12px; color: #94a3b8; }
#tooltip .t-row span { color: #e2e8f0; }

/* Stats view */
#stats-view { flex: 1; overflow-y: auto; padding: 24px; display: none; }
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
        <button class="toggle-btn" id="orphan-btn" onclick="toggleFilter('orphan')">Show Orphans</button>
      </div>
      <div class="filter-group">
        <button class="toggle-btn" id="dead-btn" onclick="toggleFilter('dead')">Show Dead</button>
      </div>
    </div>
    <div id="graph-canvas">
      <svg id="graph-svg"></svg>
      <div id="tooltip">
        <div class="t-title" id="tt-title"></div>
        <div class="t-url" id="tt-url"></div>
        <div class="t-row">Status: <span id="tt-status"></span> &nbsp; Depth: <span id="tt-depth"></span></div>
        <div class="t-row">In: <span id="tt-in"></span> &nbsp; Out: <span id="tt-out"></span></div>
      </div>
    </div>
  </div>
  <div id="stats-view"></div>
</div>

<script>
const GRAPH_DATA = ${graphJson};
</script>
<script>
${d3Source}
</script>
<script>
// --- State ---
const filters = {
  sections: new Set(),
  depthMin: 0,
  depthMax: Infinity,
  showOrphan: true,
  showDead: true,
};

// --- Tab switcher ---
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', (i === 0) === (tab === 'graph')));
  document.getElementById('graph-view').style.display = tab === 'graph' ? 'flex' : 'none';
  document.getElementById('stats-view').style.display = tab === 'stats' ? 'block' : 'none';
}

// --- Color scale ---
const sections = [...new Set(GRAPH_DATA.nodes.map(n => n.section))];
const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(sections);

// --- Build filter sidebar ---
function buildSidebar() {
  const container = document.getElementById('section-filters');
  filters.sections = new Set(sections);
  sections.forEach(sec => {
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
    dot.style.cssText = \`width:10px;height:10px;border-radius:50%;background:\${colorScale(sec)};display:inline-block;flex-shrink:0\`;
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
  updateGraph();
}

function toggleFilter(type) {
  if (type === 'orphan') {
    filters.showOrphan = !filters.showOrphan;
    document.getElementById('orphan-btn').classList.toggle('active', filters.showOrphan);
  } else {
    filters.showDead = !filters.showDead;
    document.getElementById('dead-btn').classList.toggle('active', filters.showDead);
  }
  updateGraph();
}

// --- D3 Graph ---
let simulation, nodeSelection, linkSelection, labelSelection;

function initGraph() {
  const svg = d3.select('#graph-svg');
  const width = document.getElementById('graph-canvas').clientWidth;
  const height = document.getElementById('graph-canvas').clientHeight;

  svg.attr('viewBox', [0, 0, width, height]);

  const g = svg.append('g');

  svg.call(d3.zoom().scaleExtent([0.05, 8]).on('zoom', (e) => g.attr('transform', e.transform)));

  const defs = svg.append('defs');
  defs.append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#3d4166');

  linkSelection = g.append('g').attr('class', 'links').selectAll('line');
  nodeSelection = g.append('g').attr('class', 'nodes').selectAll('circle');
  labelSelection = g.append('g').attr('class', 'labels').selectAll('text');

  simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id).distance(60).strength(0.5))
    .force('charge', d3.forceManyBody().strength(-120))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => nodeRadius(d) + 4));

  simulation.on('tick', () => {
    linkSelection
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    nodeSelection
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    labelSelection
      .attr('x', d => d.x)
      .attr('y', d => d.y + nodeRadius(d) + 11);
  });

  updateGraph();
}

function nodeRadius(d) {
  return Math.max(5, Math.min(20, 5 + d.inbound * 0.8));
}

function isVisible(n) {
  return filters.sections.has(n.section)
    && n.depth >= filters.depthMin
    && n.depth <= filters.depthMax
    && (filters.showOrphan || !n.orphan)
    && (filters.showDead || !n.dead);
}

function updateGraph() {
  const visibleIds = new Set(GRAPH_DATA.nodes.filter(isVisible).map(n => n.id));
  const visibleNodes = GRAPH_DATA.nodes.filter(n => visibleIds.has(n.id));
  const visibleEdges = GRAPH_DATA.edges.filter(e => visibleIds.has(e.source.id || e.source) && visibleIds.has(e.target.id || e.target));

  // Rebuild links
  linkSelection = linkSelection.data(visibleEdges, d => \`\${d.source}-\${d.target}\`);
  linkSelection.exit().remove();
  linkSelection = linkSelection.enter().append('line')
    .attr('stroke', '#2d3148')
    .attr('stroke-width', 0.8)
    .attr('marker-end', 'url(#arrow)')
    .merge(linkSelection);

  // Rebuild nodes
  nodeSelection = nodeSelection.data(visibleNodes, d => d.id);
  nodeSelection.exit().remove();
  const nodeEnter = nodeSelection.enter().append('circle')
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    )
    .on('mouseover', showTooltip)
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip)
    .on('click', (e, d) => window.open(d.url, '_blank'));

  nodeSelection = nodeEnter.merge(nodeSelection)
    .attr('r', nodeRadius)
    .attr('fill', d => d.dead ? '#ef4444' : colorScale(d.section))
    .attr('opacity', d => d.orphan ? 0.35 : 0.9)
    .attr('stroke', d => d.dead ? '#dc2626' : 'rgba(255,255,255,0.15)')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer');

  // Labels (only for low-node-count views)
  labelSelection = labelSelection.data(visibleNodes.length < 80 ? visibleNodes : [], d => d.id);
  labelSelection.exit().remove();
  labelSelection = labelSelection.enter().append('text')
    .attr('text-anchor', 'middle')
    .attr('font-size', 9)
    .attr('fill', '#64748b')
    .attr('pointer-events', 'none')
    .text(d => {
      const path = new URL(d.url).pathname;
      const parts = path.split('/').filter(Boolean);
      return parts[parts.length - 1] || '/';
    })
    .merge(labelSelection);

  simulation.nodes(visibleNodes);
  simulation.force('link').links(visibleEdges);
  simulation.alpha(0.3).restart();
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
  const x = e.offsetX + 14;
  const y = e.offsetY - 10;
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

  view.innerHTML = \`
    <div class="cards">\${cards.map(([l, v]) => \`<div class="card"><div class="c-label">\${l}</div><div class="c-val">\${v}</div></div>\`).join('')}</div>
    <h3 class="section-title">Section Breakdown</h3>
    \${buildTable(['Section', 'Pages', 'Templates'], stats.sectionBreakdown.map(r => [r.section, r.pageCount, r.templateCount]), 'section-table')}
    <h3 class="section-title" style="margin-top:24px">Template Breakdown</h3>
    \${buildTable(['Pattern', 'Pages', 'Section'], stats.templateBreakdown.map(r => [r.pattern, r.pageCount, r.section]), 'template-table')}
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

// --- Init ---
buildSidebar();
initGraph();
buildStats();

// set initial btn states
document.getElementById('orphan-btn').classList.add('active');
document.getElementById('dead-btn').classList.add('active');
</script>
</body>
</html>`
}
