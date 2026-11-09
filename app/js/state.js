// Estado do layout, persistência e geometria (colisões / limites).
import { ROOM, DEFAULT_ITEMS, KINDS } from './data.js';

const LS_KEY = 'cozinha-layout-v1';
const GEOM = 2; // v2: lado direito em 4,28 m (pilares 30×30) e parede do fundo a partir de 1,08 m
const LS_VERSIONS = 'cozinha-versoes-v1';

const clone = (o) => JSON.parse(JSON.stringify(o));
const listeners = new Set();

export const store = {
  items: clone(DEFAULT_ITEMS),
  selectedId: null,
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  emit(reason = 'change') { listeners.forEach((fn) => fn(reason)); if (reason !== 'select') scheduleSave(); },
  get(id) { return this.items.find((i) => i.id === id); },
  get selected() { return this.get(this.selectedId); },
  select(id) { this.selectedId = id; this.emit('select'); },
  update(id, patch, reason = 'change') { Object.assign(this.get(id), patch); this.emit(reason); },
  add(item) {
    let n = 1; while (this.get(`${item.kind}${n}`)) n++;
    const it = { id: `${item.kind}${n}`, x: 220, y: 320, rot: 0, origem: 'novo', ...item };
    this.items.push(it); this.selectedId = it.id; this.emit('change'); return it;
  },
  remove(id) { this.items = this.items.filter((i) => i.id !== id); if (this.selectedId === id) this.selectedId = null; this.emit('change'); },
  duplicate(id) { const s = this.get(id); if (!s) return; const { id: _, ...rest } = clone(s); return this.add({ ...rest, nome: s.nome + ' (cópia)', x: s.x + 20, y: s.y + 20 }); },
  setItems(items) { this.items = clone(items); this.selectedId = null; this.emit('change'); },
  reset() { this.setItems(DEFAULT_ITEMS); },
  toJSON() { return { versao: 1, geom: GEOM, salvoEm: new Date().toISOString(), items: this.items }; },
};

// ---------- Persistência ----------
let saveTimer = null;
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveLocal, 400); }
export function saveLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(store.toJSON())); return true; } catch { return false; }
}
export function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (Array.isArray(data.items) && data.items.length) {
      store.items = migrateGeom(data.items, data.geom);
      if ((data.geom || 1) < GEOM) saveLocal();
      return true;
    }
  } catch { /* sem armazenamento */ }
  return false;
}
/** Ajusta layouts salvos com a geometria antiga (face direita em 440, parede do fundo a partir de 90). */
export function migrateGeom(items, geom) {
  if ((geom || 1) >= GEOM) return items;
  const shift = ROOM.innerRight - 440; // −12
  for (const it of items) {
    const b = aabb(it, footprint(it));
    if (Math.abs(b.x1 - 440) < 1.5) it.x += shift;              // encostados na parede direita
  }
  const near = (it, x0, x1) => { const b = aabb(it); return Math.abs(b.x0 - x0) < 1.5 && Math.abs(b.x1 - x1) < 1.5 && b.y1 > ROOM.D - 2; };
  const g = (id) => items.find((i) => i.id === id);
  const t = g('torre'), bp = g('bancadaPia'), fo = g('fogao'), co = g('coifa');
  if (t && near(t, 95, 160)) t.x += 13;                          // torre começa no batente (108)
  if (fo && near(fo, 300, 376)) fo.x += shift;
  if (co && Math.abs(co.x - 338) < 1.5) co.x += shift;
  if (bp && near(bp, 160, 300)) { bp.w = 115; bp.x = 173 + 115 / 2; }
  return items;
}
export const migrateItems = (items, geom) => migrateGeom(JSON.parse(JSON.stringify(items)), geom);

export function listVersions() {
  try { return JSON.parse(localStorage.getItem(LS_VERSIONS) || '[]'); } catch { return []; }
}
export function saveVersion(nome) {
  const v = listVersions().filter((x) => x.nome !== nome);
  v.unshift({ nome, data: new Date().toISOString(), geom: GEOM, items: clone(store.items) });
  try { localStorage.setItem(LS_VERSIONS, JSON.stringify(v.slice(0, 30))); return true; } catch { return false; }
}
export function deleteVersion(nome) {
  try { localStorage.setItem(LS_VERSIONS, JSON.stringify(listVersions().filter((x) => x.nome !== nome))); } catch { /* */ }
}

// ---------- Geometria ----------
export const norm = (a) => ((a % 360) + 360) % 360;

/** Retângulo ocupado (com cadeiras, no caso da mesa) em coordenadas locais. */
export function footprint(it) {
  if (it.kind === 'mesa') return { w: it.w + 2 * 42, d: it.d + 2 * 50 };
  if (it.kind === 'cadeiraBalanco') return { w: it.w, d: it.d };
  return { w: it.w, d: it.d };
}

/** Cantos do retângulo do item em coordenadas de planta. */
export function corners(it, fp = { w: it.w, d: it.d }) {
  const r = (it.rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const hw = fp.w / 2, hd = fp.d / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, ly]) => [it.x + lx * c - ly * s, it.y + lx * s + ly * c]);
}
export function aabb(it, fp) {
  const p = corners(it, fp);
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
function sat(a, b) {
  for (const poly of [a, b]) {
    for (let i = 0; i < 4; i++) {
      const p1 = poly[i], p2 = poly[(i + 1) % 4];
      const nx = p2[1] - p1[1], ny = p1[0] - p2[0];
      let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
      for (const q of a) { const v = q[0] * nx + q[1] * ny; amin = Math.min(amin, v); amax = Math.max(amax, v); }
      for (const q of b) { const v = q[0] * nx + q[1] * ny; bmin = Math.min(bmin, v); bmax = Math.max(bmax, v); }
      const len = Math.hypot(nx, ny) || 1;
      if (amax - bmin < 0.6 * len || bmax - amin < 0.6 * len) return false; // tolerância de ~0,5 cm
    }
  }
  return true;
}
const zr = (it) => [it.elev || 0, (it.elev || 0) + it.h];

/** Retorna {id: [mensagens]} com conflitos de sobreposição e limites. */
export function conflicts(items = store.items) {
  const out = {};
  const add = (id, msg) => (out[id] ||= []).push(msg);
  const polys = items.map((it) => corners(it, footprint(it)));
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      // itens "apoiados" (cuba, acessórios) não conflitam com o móvel sobre o qual estão
      const restsOn = (x, y) => KINDS[x.kind]?.onTop && Math.abs((y.elev || 0) + y.h - (x.elev || 0)) < 3;
      const sinkIn = (x, y) => x.kind === 'cuba' && y.kind === 'bancada';
      if (restsOn(a, b) || restsOn(b, a) || sinkIn(a, b) || sinkIn(b, a)) continue;
      const [a0, a1] = zr(a), [b0, b1] = zr(b);
      const zOver = a.kind === 'mesa' || b.kind === 'mesa' ? Math.min(a1, b1) > Math.max(a0, b0) && Math.max(a0, b0) < 100 : Math.min(a1, b1) - Math.max(a0, b0) > 0.5;
      if (!zOver) continue;
      if (sat(polys[i], polys[j])) { add(a.id, `sobrepõe "${b.nome}"`); add(b.id, `sobrepõe "${a.nome}"`); }
    }
    // limites do ambiente
    const it = items[i], bb = aabb(it, footprint(it));
    const tol = 0.6;
    if (bb.x0 < -tol || bb.x1 > ROOM.innerRight + tol || bb.y0 < ROOM.frontInner - tol || bb.y1 > ROOM.D + tol) add(it.id, 'fora dos limites do ambiente');
    // passagem da porta (área de 90 × 70 cm em frente à porta)
    if ((it.elev || 0) < 200 && bb.x0 < ROOM.door.x1 + 5 - tol && bb.y1 > ROOM.D - 70 && !KINDS[it.kind]?.parede) add(it.id, 'bloqueia a passagem da porta');
  }
  return out;
}

/** Distâncias livres do item até as faces das paredes (para cotas dinâmicas). */
export function wallGaps(it) {
  const bb = aabb(it, footprint(it));
  return { esq: bb.x0, dir: ROOM.innerRight - bb.x1, frente: bb.y0 - ROOM.frontInner, fundo: ROOM.D - bb.y1, bb };
}
