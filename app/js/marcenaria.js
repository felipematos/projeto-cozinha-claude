// Especificação dos armários (marcenaria) — fonte única para o 3D e para o projeto em PDF.
// Unidades: cm. Coordenadas locais do móvel: x de −L/2 a +L/2 (vista de frente, esquerda → direita
// do observador = −x → +x no eixo local), y = altura a partir da base do móvel (0 = chão para móveis de piso).
import { ROOM } from './data.js';
import { t } from './i18n.js';

export const CAB_KINDS = ['bancada', 'armarioBaixo', 'torreLL', 'suspenso', 'nicho'];
export const GAP = 0.6; // folga entre frentes (cm)

const toLocal = (host, p) => {
  const r = (-host.rot * Math.PI) / 180, dx = p.x - host.x, dy = p.y - host.y;
  return { x: dx * Math.cos(r) - dy * Math.sin(r), y: dx * Math.sin(r) + dy * Math.cos(r) };
};
const toPlan = (it, lx, ly) => {
  const r = (it.rot * Math.PI) / 180;
  return { x: it.x + lx * Math.cos(r) - ly * Math.sin(r), y: it.y + lx * Math.sin(r) + ly * Math.cos(r) };
};
const r1 = (v) => Math.round(v * 10) / 10;

/** Trechos livres (cm, eixo local X) da frente, descontando móveis de piso encostados nela (canto cego). */
export function frontFreeSpans(it, items) {
  const hw = it.w / 2, hd = it.d / 2, blocked = [];
  const FLOOR = new Set(['bancada', 'fogao', 'fogaoLenha', 'torreLL', 'armarioBaixo', 'geladeira', 'freezer', 'buffet']);
  for (const o of items) {
    if (o.id === it.id || !FLOOR.has(o.kind) || (o.elev || 0) > 5) continue;
    const pts = [[-o.w / 2, -o.d / 2], [o.w / 2, -o.d / 2], [o.w / 2, o.d / 2], [-o.w / 2, o.d / 2]].map(([lx, ly]) => toLocal(it, toPlan(o, lx, ly)));
    const x0 = Math.min(...pts.map((p) => p.x)), x1 = Math.max(...pts.map((p) => p.x));
    const y0 = Math.min(...pts.map((p) => p.y)), y1 = Math.max(...pts.map((p) => p.y));
    if (y1 < -hd - 5 || y0 > -hd + 2) continue;
    const a = Math.max(-hw, x0), b = Math.min(hw, x1);
    if (b - a > 1) blocked.push([a, b]);
  }
  let free = [[-hw, hw]];
  for (const [a, b] of blocked) free = free.flatMap(([f0, f1]) => (b <= f0 || a >= f1 ? [[f0, f1]] : [[f0, a], [b, f1]].filter(([u, v]) => v - u > 0.5)));
  return { free, blocked };
}

/** Faixas (cm, eixo local X) ocupadas por cubas embutidas no tampo. */
export function sinkSpans(it, items) {
  return items.filter((c) => c.kind === 'cuba').map((c) => ({ c, l: toLocal(it, c) }))
    .filter(({ l }) => Math.abs(l.x) < it.w / 2 && Math.abs(l.y) < it.d / 2)
    .map(({ c, l }) => ({ x0: l.x - c.w / 2, x1: l.x + c.w / 2, y: l.y, w: c.w, d: c.d, cuba: c }));
}

/** Módulos de ~90 cm alternando gaveteiro (2 gavetas finas + 1 funda) e par de portas; sob cuba, portas. */
export function moduleFronts(a, b, y0, y1, isSink = () => false) {
  const panels = [], len = b - a, n = Math.max(1, Math.round(len / 90)), mw = len / n, h = y1 - y0;
  for (let i = 0; i < n; i++) {
    const m0 = a + mw * i, m1 = m0 + mw, cx = (m0 + m1) / 2;
    const doors = i % 2 === 1 || isSink(m0, m1) || (n === 1 && mw < 60);
    if (doors) {
      const nd = mw >= 55 ? 2 : 1, dw = mw / nd;
      for (let k = 0; k < nd; k++) {
        const kx = nd === 2 ? (k === 0 ? m0 + dw - 4.5 : m0 + dw + 4.5) : m0 + dw * (k + 0.5) + dw / 2 - 5;
        panels.push({ tipo: 'porta', x0: m0 + dw * k, x1: m0 + dw * (k + 1), y0, y1, knob: [kx, y0 + h * 0.58], abertura: nd === 2 ? (k === 0 ? 'esq' : 'dir') : 'esq' });
      }
    } else {
      const hTop = h * 0.45, thin = hTop / 2;
      for (const [ya, yb] of [[y1 - thin, y1], [y1 - 2 * thin, y1 - thin], [y0, y1 - hTop]]) {
        panels.push({ tipo: 'gaveta', x0: m0, x1: m1, y0: ya, y1: yb, knob: [cx, (ya + yb) / 2] });   // puxador centralizado na gaveta
      }
    }
  }
  return panels;
}

/** Em qual parede o fundo do móvel encosta. */
export function wallOf(it) {
  const p = toPlan(it, 0, it.d / 2), T = 4;
  if (Math.abs(p.y - ROOM.D) < T) return { nome: t('Parede do fundo (pia)'), ref: t('da parede da suíte'), pos: (q) => q.x };
  if (Math.abs(p.x - ROOM.innerRight) < T) return { nome: t('Parede direita (janelão)'), ref: t('da frente (vidro)'), pos: (q) => q.y };
  if (Math.abs(p.x) < T) return { nome: t('Parede da suíte (esquerda)'), ref: t('da frente (vidro)'), pos: (q) => q.y };
  return { nome: t('Solto (ilha)'), ref: '', pos: (q) => q.x };
}

/**
 * Especificação completa de um armário: medidas, frentes (portas/gavetas/nichos/painéis), estrutura e notas.
 * panels: {tipo:'porta'|'gaveta'|'nicho'|'fixo'|'lavaloucas'|'prateleira', x0,x1,y0,y1, knob?:[x,y]}
 */
export function cabinetSpec(it, items) {
  const W = it.w, D = it.d, H = it.h, hw = W / 2;
  const s = { id: it.id, kind: it.kind, nome: it.nome, L: W, A: H, P: D, elev: it.elev || 0, panels: [], estrutura: {}, notas: [] };
  const wall = wallOf(it), pts = [toPlan(it, -hw, D / 2), toPlan(it, hw, D / 2)];
  const ps = pts.map(wall.pos).sort((a, b) => a - b);
  s.parede = wall.nome; s.posicao = wall.ref ? t('{a} a {b} cm {ref}', { a: r1(ps[0]), b: r1(ps[1]), ref: wall.ref }) : '';
  if (it.kind === 'bancada') {
    const plinth = 10, top = 3, carcH = H - plinth - top;
    s.estrutura = { rodape: plinth, recuoRodape: 5, corpo: carcH, tampo: t('{n} cm (granilite — marmorista)', { n: top }) };
    const sinks = sinkSpans(it, items);
    const isSink = (m0, m1) => sinks.some((k) => k.x1 > m0 + 5 && k.x0 < m1 - 5);
    const { free, blocked } = frontFreeSpans(it, items);
    for (const [a, b] of free) {
      if (b - a < 12) { s.panels.push({ tipo: 'fixo', x0: a, x1: b, y0: plinth, y1: plinth + carcH }); continue; }
      s.panels.push(...moduleFronts(a, b, plinth + 0.4, plinth + carcH - 0.4, isSink));
    }
    for (const [a, b] of blocked) s.panels.push({ tipo: 'cego', x0: a, x1: b, y0: plinth, y1: plinth + carcH });
    if (blocked.length) s.notas.push(t('Canto cego: trecho da frente encoberto pelo móvel vizinho fica fechado (painel fixo).'));
    for (const k of sinks) s.notas.push(t('Gabinete sob cuba {w}×{d} cm: corpo sem tampo, portas (sem gavetas); prever passagem de hidráulica.', { w: k.w, d: k.d }));
  } else if (it.kind === 'armarioBaixo') {
    const plinth = 8, top = 3.5, carcH = H - plinth - top;
    s.estrutura = { rodape: plinth, recuoRodape: 4, corpo: carcH, tampo: t('{n} cm (madeira, mesmo acabamento)', { n: top }) };
    s.panels.push(...moduleFronts(-hw + 1, hw - 1, plinth + 0.4, plinth + carcH - 0.4));
  } else if (it.kind === 'torreLL') {
    const e = it.llElev ?? 50, upH = H - (e + 86), nUp = upH > 75 ? 2 : 1, dh = upH / nUp;
    s.estrutura = { rodape: 10, recuoRodape: 6, corpo: H - 10 };
    s.panels.push({ tipo: 'gaveta', x0: -hw + 0.5, x1: hw - 0.5, y0: 10.5, y1: e - 0.5, knob: [0, (10.5 + e - 0.5) / 2] });
    s.panels.push({ tipo: 'lavaloucas', x0: -29.5, x1: 29.5, y0: e, y1: e + 85 });
    for (let i = 0; i < nUp; i++) {
      const y0 = e + 86 + dh * i;
      s.panels.push({ tipo: 'porta', x0: -hw + 0.5, x1: hw - 0.5, y0, y1: y0 + dh - 1, knob: [hw - 6, i === 0 ? y0 + dh - 10 : y0 + 10], abertura: 'esq' });
    }
    s.notas.push(t('Vão para lava-louças embutida: 60 × 86 cm (aparelho 59 × 85 × 59), base a {e} cm do piso; prever ponto de água, esgoto e tomada.', { e }));
  } else if (it.kind === 'suspenso') {
    const n = it.portas || Math.max(1, Math.round(W / 45)), dw = W / n, open = new Set(it.nichos || []);   // it.portas fixa a quantidade
    s.estrutura = { corpo: H, fixacao: t('trilho/suporte oculto na parede') };
    for (let i = 0; i < n; i++) {
      const x0 = -hw + dw * i, x1 = x0 + dw, cx = (x0 + x1) / 2;
      if (open.has(i)) { s.panels.push({ tipo: 'nicho', x0, x1, y0: 0, y1: H, prateleiras: 1 }); continue; }
      s.panels.push({ tipo: 'porta', x0, x1, y0: 0.5, y1: H - 0.5, knob: [cx + (i % 2 ? -1 : 1) * (dw / 2 - 4.5), 8], abertura: i % 2 ? 'dir' : 'esq' });
    }
    if (open.size) s.notas.push(t('Vão(s) de nicho aberto com 1 prateleira no meio, fundo em madeira escura.'));
  } else if (it.kind === 'nicho') {
    const n = Math.max(1, Math.round(W / 35)), dw = W / n, one = (it.niveis ?? 2) === 1;
    s.estrutura = { corpo: H, fixacao: t('parafusado na parede (sem portas)') };
    for (let i = 0; i < n; i++) s.panels.push({ tipo: 'nicho', x0: -hw + dw * i, x1: -hw + dw * (i + 1), y0: 0, y1: H, prateleiras: one ? 0 : 1 });
    s.notas.push(t('Nicho aberto para temperos: {n} vão(s), {pr}, chapas de 2 cm, fundo de 1,2 cm.', { n, pr: one ? t('sem prateleira intermediária') : t('1 prateleira intermediária') }));
  }
  s.portas = s.panels.filter((p) => p.tipo === 'porta').length;
  s.gavetas = s.panels.filter((p) => p.tipo === 'gaveta').length;
  s.nichos = s.panels.filter((p) => p.tipo === 'nicho').length;
  s.puxadores = s.panels.filter((p) => p.knob).length;
  return s;
}

/** Tampo de granilite de uma bancada (para o marmorista). */
export function topSpec(it, items, sidesOnWall) {
  const sinks = sinkSpans(it, items);
  return {
    nome: it.nome, L: it.w, P: it.d + 2, esp: 3,
    recortes: sinks.map((k) => ({ w: k.w - 4, d: k.d - 4, x: r1(k.x0 + it.w / 2 + 2), rebaixo: k.cuba.rebaixo })),
    rodabanca: it.rodabanca === false ? [] : sidesOnWall,
  };
}
