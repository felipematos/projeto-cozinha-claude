// Controlador da aplicação: abas, painel lateral, histórico, salvar/abrir, exportações.
import { store, loadLocal, saveLocal, listVersions, saveVersion, deleteVersion, conflicts, norm, migrateItems } from './state.js';
import { KINDS, CATALOG, DEFAULT_ITEMS } from './data.js';
import { PlanEditor } from './plan2d.js';
import { t, tn, getLang, setLang, onLangChange, applyStatic, locale } from './i18n.js';
import { exportPDF, exportPlanPNG, download, stamp } from './export.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

loadLocal();
const plan = new PlanEditor($('#plan'), store);
requestAnimationFrame(() => plan.fit());

// ---------------------------------------------------------------- 3D (carregamento sob demanda)
const viewers = {};
let viewerMod = null;
async function getViewer(kind) {
  if (viewers[kind]) return viewers[kind];
  viewerMod ||= await import('./viewer3d.js');
  const v = new viewerMod.Viewer($(kind === 'high' ? '#threeHigh' : '#threeLow'), kind === 'high', store);
  v.onRoofChange = (on) => { if (current === kind) $('#tRoof').checked = on; };
  v.onWalkChange = (on) => { $('#walkBtn').classList.toggle('on', on); $('#walkHint').hidden = !on; $('#navHint').hidden = on || current === 'plan'; if (on && measureOn) setMeasure(false); };
  v.onMeasuresChange = () => { if (current === kind) updateMeasureUI(); };
  v.setMeasure(measureOn && current === kind);
  viewers[kind] = v;
  if (kind === 'high') $('#hiLoading').hidden = true;
  if (!$('#views').childElementCount) buildViewButtons(viewerMod.VIEWS);
  return v;
}
let viewDefs = null;
function buildViewButtons(VIEWS) {
  if (VIEWS) viewDefs = VIEWS;
  if (!viewDefs) return;
  $('#views').innerHTML = Object.entries(viewDefs).map(([k, v]) => `<button data-view="${k}">${t(v.nome)}</button>`).join('');
}
$('#views').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) activeViewer()?.setView(b.dataset.view); });
const activeViewer = () => (current === 'plan' ? null : viewers[current]);

// ---------------------------------------------------------------- abas
let current = 'plan';
async function setTab(tab) {
  current = tab;
  document.body.dataset.tab = tab;
  $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  $$('.pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === tab));
  Object.entries(viewers).forEach(([k, v]) => v.setVisible(k === tab));
  $('#walkHint').hidden = true;
  $('#navHint').hidden = tab === 'plan';
  if (tab !== 'plan') {
    const v = await getViewer(tab);
    v.setVisible(current === tab);
    $('#tRoof').checked = v.roomGroups.telhado.visible;
    $('#tFront').checked = v.roomGroups.frente.visible;
    $('#tExt').checked = v.roomGroups.externo.visible;
    $('#walkBtn').classList.toggle('on', v.walk); $('#walkHint').hidden = !v.walk; $('#navHint').hidden = v.walk;
  }
  applyMeasure();
  try { localStorage.setItem('cozinha-tab', tab); } catch { /* */ }
}
$$('.tabs button').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
document.body.dataset.tab = 'plan';

$('#tRoof').addEventListener('change', (e) => activeViewer()?.setRoof(e.target.checked));
$('#tFront').addEventListener('change', (e) => activeViewer()?.setFront(e.target.checked));
$('#tExt').addEventListener('change', (e) => activeViewer()?.setExterior(e.target.checked));
$('#walkBtn').addEventListener('click', () => { const v = activeViewer(); v?.setWalk(!v.walk); });
$('#shotBtn').addEventListener('click', () => shotCurrent());
$('#tGrid').addEventListener('change', (e) => plan.setGrid(e.target.checked));
$('#tSnap').addEventListener('change', (e) => { plan.snap = e.target.checked; });
$('#tSusp').addEventListener('change', (e) => { plan.showSusp = e.target.checked; plan.render(); });
$('#zoomIn').addEventListener('click', () => plan.zoom(0.8));
$('#zoomOut').addEventListener('click', () => plan.zoom(1.25));
$('#zoomFit').addEventListener('click', () => plan.fit());

// ---------------------------------------------------------------- catálogo
const buildCatalog = () => { $('#addSel').innerHTML = `<option value="">${t('+ Adicionar item…')}</option>` + CATALOG.map((c, i) => `<option value="${i}">${tn(c.nome)} (${c.w}×${c.d})</option>`).join(''); };
buildCatalog();
$('#addSel').addEventListener('change', (e) => {
  const c = CATALOG[+e.target.value]; e.target.value = '';
  if (c) { store.add({ ...c }); toast(t('"{nome}" adicionado no centro — arraste para posicionar.', { nome: tn(c.nome) })); }
});

// ---------------------------------------------------------------- painel do item
const form = $('#propForm');
const NUM = ['x', 'y', 'rot', 'elev', 'w', 'd', 'h'];
function fillForm() {
  const it = store.selected;
  form.hidden = !it; $('#noSel').hidden = !!it;
  if (!it) return;
  for (const k of ['nome', ...NUM]) { const inp = form.elements[k]; if (document.activeElement !== inp) inp.value = k === 'nome' ? tn(it.nome) : Math.round((it[k] || 0) * 10) / 10; }
  $('#origem').textContent = `${t(KINDS[it.kind]?.label || it.kind)} · ${t(it.origem || '')}`;
  const cf = conflicts(store.items)[it.id] || [];
  $('#warns').innerHTML = cf.map((m) => `<li>⚠ ${m}</li>`).join('');
}
form.addEventListener('input', (e) => {
  const it = store.selected; if (!it) return;
  const k = e.target.name;
  if (k === 'nome') return store.update(it.id, { nome: e.target.value }, 'drag');
  const v = parseFloat(e.target.value); if (Number.isNaN(v)) return;
  store.update(it.id, { [k]: k === 'rot' ? norm(v) : v }, 'drag');
});
form.addEventListener('change', () => store.emit('change'));
form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('click', (e) => {
  const op = e.target.dataset.op, it = store.selected; if (!op || !it) return;
  if (op === 'rot90') store.update(it.id, { rot: norm(it.rot + 90) });
  if (op === 'dup') store.duplicate(it.id);
  if (op === 'del') removeItem(it);
});

// ---------------------------------------------------------------- lista + status
const CATCOLOR = { bancada: '#d39a86', pia: '#e4e8ea', eletro: '#f0f1f3', lenha: '#d9a07e', antigo: '#ddd0bd', marcenaria: '#d6b48a', suspenso: '#fff', madeira: '#cfa77d', decor: '#f3e7d2' };
function renderList() {
  const cf = conflicts(store.items);
  const zone = (it) => (it.y >= 330 ? 'Cozinha' : 'Copa');
  let html = '';
  for (const z of ['Cozinha', 'Copa']) {
    const its = store.items.filter((i) => zone(i) === z);
    if (!its.length) continue;
    html += `<li class="grp">${t(z)}</li>`;
    html += its.map((it) => `<li class="it${it.id === store.selectedId ? ' on' : ''}${cf[it.id] ? ' bad' : ''}" data-id="${it.id}"><span class="sw" style="background:${CATCOLOR[KINDS[it.kind]?.cat] || '#ccc'}"></span><span class="nm">${tn(it.nome)}</span><span class="dim">${it.w}×${it.d}×${it.h}</span></li>`).join('');
  }
  $('#list').innerHTML = html;
  $('#count').textContent = `(${store.items.length})`;
  const n = Object.keys(cf).length, st = $('#status');
  st.className = 'card status ' + (n ? 'bad' : 'ok');
  st.innerHTML = n
    ? `<span class="dot"></span><div><b>${t('{n} item(ns) com conflito', { n })}</b><ul>${Object.entries(cf).slice(0, 6).map(([id, m]) => `<li>${tn(store.get(id)?.nome)}: ${m[0]}</li>`).join('')}</ul></div>`
    : `<span class="dot"></span><div><b>${t('Layout sem conflitos')}</b><div class="muted small">${t('Nenhuma sobreposição; passagem da porta livre. Salvo automaticamente.')}</div></div>`;
}
$('#list').addEventListener('click', (e) => { const li = e.target.closest('li.it'); if (li) store.select(li.dataset.id); });

// ---------------------------------------------------------------- histórico
const hist = { stack: [JSON.stringify(store.items)], i: 0, restoring: false };
store.on((reason) => {
  if (reason === 'change' && !hist.restoring) {
    const s = JSON.stringify(store.items);
    if (s !== hist.stack[hist.i]) { hist.stack = hist.stack.slice(0, hist.i + 1); hist.stack.push(s); if (hist.stack.length > 100) hist.stack.shift(); hist.i = hist.stack.length - 1; }
  }
  fillForm(); renderList();
});
function restore(i) {
  hist.i = i; hist.restoring = true;
  const sel = store.selectedId; store.setItems(JSON.parse(hist.stack[i]));
  if (store.get(sel)) store.select(sel);
  hist.restoring = false;
}
const undo = () => hist.i > 0 && restore(hist.i - 1);
const redo = () => hist.i < hist.stack.length - 1 && restore(hist.i + 1);
$('#undo').addEventListener('click', undo);
$('#redo').addEventListener('click', redo);

// ---------------------------------------------------------------- teclado
window.addEventListener('keydown', (e) => {
  const t = e.target; if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA') return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveLocal(); toast(t('Layout salvo neste navegador.')); return; }
  const v = activeViewer();
  if (!mod && (e.key === 'm' || e.key === 'M') && !v?.walk) { setMeasure(!measureOn); return; }
  if (!mod && (e.key === 'f' || e.key === 'F') && !v?.walk) { toggleFullscreen(); return; }
  if (!mod && e.key === '\\') { toggleSide(); return; }
  if (e.key === 'Escape' && document.body.classList.contains('pseudo-full')) { toggleFullscreen(); return; }
  if (measureOn) {
    if (e.key === 'Escape') { setMeasure(false); return; }
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); measureTarget()?.undoMeasure(); updateMeasureUI(); return; }
  }
  if (e.key === 'Escape') { if (v?.walk) v.setWalk(false); else store.select(null); return; }
  if (v?.walk) return;
  const it = store.selected; if (!it) return;
  const step = e.shiftKey ? 10 : 1;
  const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (mv && current === 'plan') { e.preventDefault(); store.update(it.id, { x: it.x + mv[0], y: it.y + mv[1] }); return; }
  if (e.key === 'r' || e.key === 'R') store.update(it.id, { rot: norm(it.rot + (e.shiftKey ? -90 : 90)) });
  else if (e.key === 'q' || e.key === 'Q') store.update(it.id, { rot: norm(it.rot - 15) });
  else if (e.key === 'e' || e.key === 'E') store.update(it.id, { rot: norm(it.rot + 15) });
  else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeItem(it); }
  else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); store.duplicate(it.id); }
});

// ---------------------------------------------------------------- menus
$$('.menu > .btn').forEach((b) => b.addEventListener('click', (e) => {
  e.stopPropagation();
  const m = b.parentElement, was = m.classList.contains('open');
  $$('.menu').forEach((x) => x.classList.remove('open'));
  if (!was) { m.classList.add('open'); renderVersions(); }
}));
document.addEventListener('click', (e) => { if (!e.target.closest('.menu-pop')) $$('.menu').forEach((x) => x.classList.remove('open')); });

function renderVersions() {
  const v = listVersions();
  $('#versions').innerHTML = v.length ? v.map((x) => `<button data-ver="${encodeURIComponent(x.nome)}"><span>↺ ${x.nome}</span><span class="x" data-delver="${encodeURIComponent(x.nome)}" title="${t('Apagar versão')}">×</span></button>`).join('') : '';
}
$('#versions').addEventListener('click', (e) => {
  const del = e.target.closest('[data-delver]');
  if (del) {
    e.stopPropagation(); const n = decodeURIComponent(del.dataset.delver);
    ask(t('Apagar a versão "{n}"?', { n }), { ok: t('Apagar'), danger: true }).then((r) => { if (r !== null) { deleteVersion(n); renderVersions(); toast(t('Versão "{n}" apagada.', { n })); } });
    return;
  }
  const b = e.target.closest('[data-ver]'); if (!b) return;
  const n = decodeURIComponent(b.dataset.ver), ver = listVersions().find((x) => x.nome === n);
  if (ver) { store.setItems(migrateItems(ver.items, ver.geom)); toast(t('Versão "{n}" carregada.', { n })); }
});

const ACTS = {
  save: () => { saveLocal(); toast(t('Layout salvo neste navegador.')); },
  saveVersion: async () => {
    const n = await ask(t('Nome da versão:'), { input: t('Versão {d}', { d: new Date().toLocaleString(locale()) }), ok: t('Salvar') });
    if (n && n.trim()) { saveVersion(n.trim()); toast(t('Versão "{n}" salva.', { n: n.trim() })); }
  },
  downloadJSON: () => download(URL.createObjectURL(new Blob([JSON.stringify(store.toJSON(), null, 2)], { type: 'application/json' })), `layout-cozinha_${stamp()}.json`),
  openJSON: () => $('#fileJSON').click(),
  reset: async () => {
    if ((await ask(t('Descartar o layout atual e voltar à proposta original?'), { ok: t('Restaurar'), danger: true })) !== null) {
      store.setItems(DEFAULT_ITEMS); toast(t('Proposta original restaurada.'), { label: t('Desfazer'), fn: undo });
    }
  },
  pdfPlan: () => busy('Gerando PDF da planta…', () => exportPDF(store.items)),
  pdfFull: () => busy('Gerando PDF com vistas 3D…', () => exportPDF(store.items, {
    views: ['quintal', 'isometrica', 'cozinha', 'lenha', 'copa', 'entrada'],
    getViewer: async () => { const v = await getViewer('high'); await (await import('./textures.js')).whenTexturesLoaded(); return v; },
    onProgress: (m) => { $('#busyMsg').textContent = m + '…'; },
  })),
  marcenaria: () => busy('Gerando o projeto dos armários…', async () => {
    const { exportMarcenaria } = await import('./projeto_marcenaria.js');
    await exportMarcenaria(store.items, {
      getViewer: async () => { const v = await getViewer('high'); await (await import('./textures.js')).whenTexturesLoaded(); return v; },
      onProgress: (m) => { $('#busyMsg').textContent = `${t('Gerando o projeto dos armários…')} ${m}`; },
    });
  }),
  pngView: () => shotCurrent(),
  pngAll: () => busy('Gerando imagens…', async () => {
    const v = activeViewer() || (await setTab('high'), viewers.high);
    const cam = v.camera.position.clone(), tgt = v.controls.target.clone();
    for (const k of Object.keys(viewerMod.VIEWS)) {
      v.setView(k, true); await new Promise((r) => setTimeout(r, 80));
      download(v.snapshot(2400, 1500), `cozinha-3d-${current}-${k}_${stamp()}.png`);
      await new Promise((r) => setTimeout(r, 350));
    }
    v.camera.position.copy(cam); v.controls.target.copy(tgt);
  }),
  pngPlan: () => busy('Gerando imagem da planta…', () => exportPlanPNG(store.items)),
};
$('#marcenariaBtn').addEventListener('click', () => ACTS.marcenaria());
$$('[data-act]').forEach((b) => b.addEventListener('click', () => { $$('.menu').forEach((x) => x.classList.remove('open')); ACTS[b.dataset.act]?.(); }));
$('#fileJSON').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const data = JSON.parse(await f.text()); if (!Array.isArray(data.items)) throw new Error('formato'); store.setItems(migrateItems(data.items, data.geom)); toast(t('Layout "{f}" carregado.', { f: f.name })); }
  catch { toast(t('Arquivo inválido — esperado um layout .json exportado por este app.')); }
});

async function shotCurrent() {
  let v = activeViewer();
  if (!v) { await setTab('high'); v = viewers.high; }
  download(v.snapshot(2400, 1500), `cozinha-3d-${current}_${stamp()}.png`);
  toast(t('Imagem PNG salva (2400×1500).'));
}

// ---------------------------------------------------------------- utilidades de UI
let toastT;
/** Aviso no rodapé; `action` opcional ({label, fn}) vira um botão (ex.: Desfazer). */
function toast(msg, action) {
  const t = $('#toast');
  t.textContent = msg;
  if (action) {
    const b = document.createElement('button'); b.className = 'toast-act'; b.textContent = action.label;
    b.addEventListener('click', () => { t.hidden = true; action.fn(); });
    t.appendChild(b);
  }
  t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, action ? 6000 : 2800);
}

/** Exclui o item na hora (sem diálogo nativo, que navegadores embutidos bloqueiam) e oferece Desfazer. */
function removeItem(it) {
  store.remove(it.id);
  toast(t('"{nome}" excluído.', { nome: tn(it.nome) }), { label: t('Desfazer'), fn: undo });
}

/** Diálogo próprio (substitui confirm/prompt). Resolve com o texto/'' ao confirmar, ou null ao cancelar. */
function ask(msg, { input = null, ok = 'OK', cancel = t('Cancelar'), danger = false } = {}) {
  const d = $('#dlg'), inp = $('#dlgInput'), okB = $('#dlgOk'), cB = $('#dlgCancel');
  $('#dlgMsg').textContent = msg;
  inp.hidden = input === null; inp.value = input ?? '';
  okB.textContent = ok; cB.textContent = cancel; okB.classList.toggle('danger-fill', danger);
  d.hidden = false;
  setTimeout(() => (input !== null ? (inp.focus(), inp.select()) : okB.focus()), 0);
  return new Promise((resolve) => {
    const close = (v) => { d.hidden = true; okB.onclick = cB.onclick = d.onkeydown = d.onclick = null; resolve(v); };
    okB.onclick = () => close(input !== null ? inp.value : '');
    cB.onclick = () => close(null);
    d.onclick = (e) => { if (e.target === d) close(null); };
    d.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Escape') close(null); if (e.key === 'Enter') okB.onclick(); };
  });
}
async function busy(msg, fn) {
  $('#busyMsg').textContent = t(msg); $('#busy').hidden = false;
  try { await new Promise((r) => setTimeout(r, 30)); await fn(); toast(t('Exportação concluída.')); }
  catch (err) { console.error(err); toast(t('Falha na exportação: ') + err.message); }
  finally { $('#busy').hidden = true; }
}

// ---------------------------------------------------------------- trena (medição) — planta e 3D
let measureOn = false;
const measureTarget = () => (current === 'plan' ? plan : viewers[current]);
function applyMeasure() {
  plan.setMeasure(measureOn && current === 'plan');
  Object.entries(viewers).forEach(([k, v]) => v.setMeasure(measureOn && current === k));
  updateMeasureUI();
}
function setMeasure(on) {
  measureOn = on;
  if (on) store.select(null);
  applyMeasure();
}
function updateMeasureUI() {
  $('#measureBtn').classList.toggle('on', measureOn);
  $('#measureBtn').textContent = t(measureOn ? '📏 Medindo…' : '📏 Medir');
  $('#measureHint').hidden = !measureOn;
  const n = measureTarget()?.measures?.length || 0;
  $('#measureClear').hidden = !n;
  $('#measureClear').textContent = t('✕ Limpar medidas ({n})', { n });
}
plan.onMeasuresChange = () => { if (current === 'plan') updateMeasureUI(); };
$('#measureBtn').addEventListener('click', () => setMeasure(!measureOn));
$('#measureClear').addEventListener('click', () => { measureTarget()?.clearMeasures(); updateMeasureUI(); });

// ---------------------------------------------------------------- tela cheia e painel lateral
const stage = $('.stage');
// Tela cheia real (Fullscreen API); se o navegador recusar, a vista ocupa a janela inteira.
const isFull = () => !!document.fullscreenElement || document.body.classList.contains('pseudo-full');
function fullUI() {
  const on = isFull();
  $('#fullBtn').textContent = on ? '🗗' : '⛶';
  $('#fullBtn').title = t(on ? 'Sair da tela cheia (F ou Esc)' : 'Tela cheia (F)');
  $('#sideBtn').hidden = on;
}
async function toggleFullscreen() {
  if (document.fullscreenElement) { await document.exitFullscreen?.(); return; }
  if (document.body.classList.contains('pseudo-full')) { document.body.classList.remove('pseudo-full'); fullUI(); return; }
  try {
    if (!stage.requestFullscreen) throw new Error('sem suporte');
    // alguns navegadores embutidos recusam ou nunca respondem: cai para "janela inteira" após 800 ms
    const ok = await Promise.race([stage.requestFullscreen().then(() => true), new Promise((r) => setTimeout(() => r(false), 800))]);
    if (!ok && !document.fullscreenElement) throw new Error('sem resposta');
  } catch {
    document.body.classList.add('pseudo-full'); fullUI();
  }
}
document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement) document.body.classList.remove('pseudo-full'); fullUI(); });
$('#fullBtn').addEventListener('click', toggleFullscreen);
function setSide(collapsed) {
  document.body.classList.toggle('side-collapsed', collapsed);
  $('#sideBtn').textContent = collapsed ? '⟨' : '⟩';
  $('#sideBtn').title = t(collapsed ? 'Mostrar painel lateral (\\)' : 'Recolher painel lateral (\\)');
  try { localStorage.setItem('cozinha-painel', collapsed ? '1' : '0'); } catch { /* */ }
}
const toggleSide = () => setSide(!document.body.classList.contains('side-collapsed'));
$('#sideBtn').addEventListener('click', toggleSide);
try { if (localStorage.getItem('cozinha-painel') === '1') setSide(true); } catch { /* */ }

// ---------------------------------------------------------------- idioma
$('#langSel').value = getLang();
$('#langSel').addEventListener('change', (e) => setLang(e.target.value));
onLangChange(() => {
  buildCatalog(); buildViewButtons(); renderVersions(); fillForm(); renderList(); updateMeasureUI(); fullUI();
  setSide(document.body.classList.contains('side-collapsed')); plan.renderRoom(); plan.render();
});
applyStatic(); buildCatalog();
fillForm(); renderList(); updateMeasureUI();
let saved = null; try { saved = localStorage.getItem('cozinha-tab'); } catch { /* */ }
const hashTab = location.hash.slice(1);
const asTab = (t) => (t === 'low' ? 'high' : t); // a aba 3D simples foi removida
if (['plan', 'low', 'high'].includes(hashTab)) setTab(asTab(hashTab)); else if (saved && saved !== 'plan') setTab(asTab(saved));
window.__app = { store, plan, viewers, getViewer, setTab };
