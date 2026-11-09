// Planta baixa interativa (SVG em centímetros). As funções *Markup também são usadas na exportação PDF.
import { ROOM, KINDS, clearSpan, lenhaChimney } from './data.js';
import { t, dec } from './i18n.js';
import { conflicts, aabb, footprint, wallGaps, norm, corners } from './state.js';

const R = ROOM;
const INK = '#2b2118';
const FONT = 'helvetica, Arial, sans-serif';

const STYLE = {
  bancada:    { fill: '#d39a86', stroke: '#5a2e22' },
  pia:        { fill: '#e4e8ea', stroke: '#4a4f54' },
  eletro:     { fill: '#f0f1f3', stroke: '#3b3f44' },
  lenha:      { fill: '#d9a07e', stroke: '#6b3a1f' },
  antigo:     { fill: '#ddd0bd', stroke: '#5d4a36' },
  marcenaria: { fill: '#d6b48a', stroke: '#6b4b33' },
  suspenso:   { fill: 'none', stroke: '#6b4b33', dash: '6 4' },
  madeira:    { fill: '#cfa77d', stroke: '#5a3a22' },
  decor:      { fill: '#f3e7d2', stroke: '#8a5a3a' },
  nicho:      { fill: '#ead6b3', stroke: '#6b4b33', dash: '2 2' },
};
const SHORT = {
  bancada: 'Bancada', cuba: 'Pia', fogao: 'Fogão 6b', fogaoLenha: 'Fogão a lenha', geladeira: 'Geladeira', freezer: 'Freezer',
  filtro: 'Filtro', torreLL: 'Torre LL', suspenso: 'Arm. susp.', cristaleira: 'Cristaleira', prateleira: 'Prateleira', coifa: 'Coifa',
  mesa: 'Mesa 8 lug.', buffet: 'Buffet', cadeiraBalanco: 'Balanço', pratos: 'Pratos',
  nicho: 'Nichos', armarioBaixo: 'Armário', escorredor: 'Escorredor', tomada: 'Tomada', interfone: 'Interfone', ganchos: 'Ganchos', acessorios: 'Acessórios', eletroportatil: 'Eletro',
};
const f1 = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
export const fmtLen = (cmv) => (cmv < 100 ? `${f1(cmv)} cm` : `${(cmv / 100).toFixed(2).replace('.', ',')} m`);

// ---------------------------------------------------------------- desenho do ambiente
export function roomMarkup({ grid = true } = {}) {
  const W = R.W, D = R.D, IR = R.innerRight;
  let s = '';
  // contexto externo
  s += `<rect x="${IR}" y="-90" width="${R.lot.sideWallX - IR}" height="${D + 90}" fill="#ece8e0"/>`;
  s += `<rect x="-140" y="-145" width="${R.lot.sideWallX + 140}" height="145" fill="#e3ebd9"/>`;
  s += `<rect x="${R.lot.sideWallX}" y="-145" width="13" height="${D + 145}" fill="#9aa096"/>`;
  s += txt(R.lot.sideWallX + 22, 300, t('muro de divisa'), 8, '#6b6f68', 90);
  s += txt(-80, -132, t('QUINTAL'), 11, '#6f8a58', 0, 'bold');
  s += txt(-75, 320, t('SUÍTE 2'), 11, '#8b8174', -90, 'bold');
  s += txt(300, D + 75, t('CASA (antiga cozinha / sala)'), 10, '#8b8174', 0, 'bold');
  // piso
  s += `<rect x="0" y="0" width="${IR}" height="${D}" fill="#fbf8f1"/>`;
  if (grid) {
    for (let x = 80; x < IR; x += 80) s += `<line x1="${x}" y1="${R.frontInner}" x2="${x}" y2="${D}" stroke="#e7dccb" stroke-width="0.6"/>`;
    for (let y = D - 80; y > 0; y -= 80) s += `<line x1="0" y1="${y}" x2="${IR}" y2="${y}" stroke="#e7dccb" stroke-width="0.6"/>`;
  }
  // divisão de zonas
  s += `<line x1="0" y1="330" x2="${IR}" y2="330" stroke="#b9a58c" stroke-width="0.8" stroke-dasharray="14 4 2 4"/>`;
  s += txt(IR - 6, 322, t('COPA (frente)'), 8, '#9b8468', 0, 'bold', 'end');
  s += txt(IR - 6, 344, t('COZINHA (fundo)'), 8, '#9b8468', 0, 'bold', 'end');
  // projeção do beiral
  s += `<polyline points="-20,${-R.overhangFront} ${W + R.overhangRight},${-R.overhangFront} ${W + R.overhangRight},${D + 20}" fill="none" stroke="#8b8174" stroke-width="0.9" stroke-dasharray="8 5"/>`;
  s += txt(120, -R.overhangFront - 5, t('projeção do beiral'), 7.5, '#8b8174');
  // parede da suíte (existente) — hachura
  s += `<rect x="-20" y="0" width="20" height="${D + 20}" fill="url(#hatchExist)" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<rect x="-130" y="0" width="110" height="20" fill="url(#hatchExist)" stroke="${INK}" stroke-width="1.2"/>`;
  // parede do fundo com porta e janela
  const dw = R.door, wn = R.window;
  s += `<rect x="${dw.x1 + 5}" y="${D}" width="${W - dw.x1 - 5}" height="20" fill="url(#hatchExist)" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<rect x="-20" y="${D}" width="${dw.x0 + 20}" height="20" fill="url(#hatchExist)" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<rect x="${wn.x0}" y="${D}" width="${wn.x1 - wn.x0}" height="20" fill="#fff" stroke="${INK}" stroke-width="1"/>`;
  s += `<line x1="${wn.x0}" y1="${D + 8}" x2="${wn.x1}" y2="${D + 8}" stroke="${INK}" stroke-width="0.8"/><line x1="${wn.x0}" y1="${D + 12}" x2="${wn.x1}" y2="${D + 12}" stroke="${INK}" stroke-width="0.8"/>`;
  s += txt((wn.x0 + wn.x1) / 2, D + 34, t('janela existente {w}×{h} / peitoril {s}', { w: dec(wn.x1 - wn.x0), h: wn.top - wn.sill, s: wn.sill }), 7, '#5d4a36');
  if (R.azulejos) {
    const A = R.azulejos;
    s += `<rect x="${A.x0}" y="${D - 2}" width="${A.x1 - A.x0}" height="2" fill="#5f86b8" stroke="none"/>`;
    s += txt((A.x0 + A.x1) / 2 + 40, D + 44, t('azulejos antigos {p}×{p} (h {a}–{b})', { p: A.peca, a: A.y0, b: A.y1 }), 6.5, '#3a5f9a');
  }
  // porta (abre para dentro da casa)
  s += `<line x1="${dw.x1}" y1="${D + 20}" x2="${dw.x1}" y2="${D + 20 + (dw.x1 - dw.x0)}" stroke="${INK}" stroke-width="1.6"/>`;
  const dr = dw.x1 - dw.x0;
  s += `<path d="M ${dw.x0} ${D + 20} A ${dr} ${dr} 0 0 0 ${dw.x1} ${D + 20 + dr}" fill="none" stroke="${INK}" stroke-width="0.7" stroke-dasharray="3 2"/>`;
  s += txt((dw.x0 + dw.x1) / 2 - 8, D + 52, t('P 80×210'), 7, '#5d4a36');
  s += `<rect x="0" y="${D - 70}" width="90" height="70" fill="url(#hatchDoor)" stroke="none"/>`;
  // lado direito: persiana, meia-parede, parede completa, pilares
  const WT = W - IR, xm = IR + WT / 2;
  for (const seg of R.right) {
    const y0 = seg.y0, h = seg.y1 - seg.y0, cs = clearSpan(seg);
    if (seg.tipo === 'parede') s += `<rect x="${IR}" y="${y0}" width="${WT}" height="${h}" fill="url(#hatchNew)" stroke="${INK}" stroke-width="1.4"/>`;
    else if (seg.tipo === 'meia') {
      s += `<rect x="${IR}" y="${y0}" width="${WT}" height="${h}" fill="#e9dccb" stroke="${INK}" stroke-width="1"/>`;
      s += `<line x1="${xm - 3}" y1="${cs.y0}" x2="${xm - 3}" y2="${cs.y1}" stroke="#3a6b8a" stroke-width="0.9"/><line x1="${xm + 3}" y1="${cs.y0}" x2="${xm + 3}" y2="${cs.y1}" stroke="#3a6b8a" stroke-width="0.9"/>`;
      s += txt(W + 14, (seg.y0 + seg.y1) / 2, t('meia-parede h=110 + janelão'), 7.5, '#3a6b8a', 90);
    } else {
      s += glass(xm, cs.y0, xm, cs.y1);
      s += txt(W + 14, (seg.y0 + seg.y1) / 2 + 5, t('persiana de vidro'), 7.5, '#3a6b8a', 90);
    }
  }
  for (const p of R.pillars) s += `<rect x="${p.x0}" y="${p.y0}" width="${p.x1 - p.x0}" height="${p.y1 - p.y0}" fill="${INK}"/>`;
  // frente: persiana de vidro retrátil
  s += glass(0, R.frontInner / 2, IR, R.frontInner / 2);
  s += txt(IR / 2, -10, t('persiana de vidro retrátil (triângulo superior em madeira)'), 8, '#3a6b8a');
  s += dimsMarkup();
  return s;
}

function glass(x1, y1, x2, y2) {
  const horiz = y1 === y2, len = horiz ? x2 - x1 : y2 - y1, n = Math.max(2, Math.round(len / 60));
  let s = '';
  for (const o of [-2.5, 2.5]) s += horiz
    ? `<line x1="${x1}" y1="${y1 + o}" x2="${x2}" y2="${y2 + o}" stroke="#3a6b8a" stroke-width="0.9"/>`
    : `<line x1="${x1 + o}" y1="${y1}" x2="${x2 + o}" y2="${y2}" stroke="#3a6b8a" stroke-width="0.9"/>`;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
    s += horiz ? `<line x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}" stroke="#3a6b8a" stroke-width="0.9"/>` : `<line x1="${x - 5}" y1="${y}" x2="${x + 5}" y2="${y}" stroke="#3a6b8a" stroke-width="0.9"/>`;
  }
  return s;
}

function txt(x, y, t, size = 8, fill = INK, rot = 0, weight = 'normal', anchor = 'middle') {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="middle"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}>${t}</text>`;
}

export function dimLine(x1, y1, x2, y2, label, { color = '#5d4a36', size = 8, tick = 4 } = {}) {
  const horiz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
  let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="0.7"/>`;
  for (const [x, y] of [[x1, y1], [x2, y2]]) {
    s += `<line x1="${x - tick}" y1="${y + tick}" x2="${x + tick}" y2="${y - tick}" stroke="${color}" stroke-width="1"/>`;
    s += horiz ? `<line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}" stroke="${color}" stroke-width="0.4"/>` : `<line x1="${x - 6}" y1="${y}" x2="${x + 6}" y2="${y}" stroke="${color}" stroke-width="0.4"/>`;
  }
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  s += horiz ? txt(mx, my - 6, label, size, color) : txt(mx - 6, my, label, size, color, -90);
  return s;
}

function dimsMarkup() {
  const W = R.W, D = R.D, IR = R.innerRight;
  let s = '';
  s += dimLine(-20, -118, W, -118, t('{n} (área coberta {w} + parede)', { n: W + 20, w: W }));
  s += dimLine(0, -98, IR, -98, t('{n} vão interno', { n: IR }));
  s += dimLine(IR, -98, W, -98, `${W - IR}`);
  s += dimLine(-50, 0, -50, D, `${D}`);
  let y = 0;
  for (const seg of R.right) { s += dimLine(W + 105, seg.y0, W + 105, seg.y1, `${seg.y1 - seg.y0}`); y = seg.y1; }
  // vãos livres entre pilares
  for (let i = 0; i + 1 < R.pillars.length; i++) {
    const a = R.pillars[i], b = R.pillars[i + 1];
    s += dimLine(W + 72, a.y1, W + 72, b.y0, `${b.y0 - a.y1} livre`, { color: '#3a6b8a', size: 7.5 });
  }
  const lastP = R.pillars[R.pillars.length - 1];
  if (lastP) s += dimLine(W + 72, lastP.y1, W + 72, D, `${D - lastP.y1} livre`, { color: '#3a6b8a', size: 7.5 });
  void y;
  const dw = R.door, wn = R.window;
  s += dimLine(0, D + 125, dw.x1 + 5, D + 125, `${dw.x1 + 5}`);
  s += dimLine(dw.x1 + 5, D + 125, wn.x0, D + 125, `${wn.x0 - dw.x1 - 5}`);
  s += dimLine(wn.x0, D + 125, wn.x1, D + 125, `${wn.x1 - wn.x0}`);
  s += dimLine(wn.x1, D + 125, IR, D + 125, `${IR - wn.x1}`);
  return s;
}

export const DEFS = `<defs>
  <pattern id="hatchExist" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#bfb3a3"/><line x1="0" y1="0" x2="0" y2="6" stroke="#6b5d4c" stroke-width="1.2"/></pattern>
  <pattern id="hatchNew" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="5" height="5" fill="#d9a07e"/><line x1="0" y1="0" x2="0" y2="5" stroke="#8a4b2a" stroke-width="1"/></pattern>
  <pattern id="hatchDoor" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#c9b9a2" stroke-width="0.8"/></pattern>
</defs>`;

// ---------------------------------------------------------------- desenho dos itens
export function itemMarkup(it, { conflict = false, selected = false, number = null, halo = false } = {}) {
  const cat = KINDS[it.kind]?.cat || 'madeira';
  const st = STYLE[cat];
  const w = it.w, d = it.d, hw = w / 2, hd = d / 2;
  const stroke = conflict ? '#d0201b' : st.stroke;
  const sw = conflict ? 2 : 1.1;
  const dash = st.dash ? ` stroke-dasharray="${st.dash}"` : '';
  let g = `<g class="item${selected ? ' sel' : ''}" data-id="${it.id}" transform="translate(${f(it.x)} ${f(it.y)}) rotate(${f(it.rot)})">`;
  const rect = (x, y, ww, hh, fill, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(ww)}" height="${f(hh)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${extra}/>`;
  const line = (x1, y1, x2, y2, c = stroke, wdt = 0.8, extra = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${wdt}"${extra}/>`;
  const circ = (cx, cy, r, fill = 'none', c = stroke, wdt = 0.8) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="${c}" stroke-width="${wdt}"/>`;

  switch (it.kind) {
    case 'mesa': {
      const n = it.lugares ?? 8, per = Math.max(1, Math.floor((n - 2) / 2));
      const ch = (cx, cy, a) => `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${a})"><rect x="-20" y="-19" width="40" height="38" rx="9" fill="#e8d2b0" stroke="${stroke}" stroke-width="0.8"/><path d="M -18 15 Q 0 24 18 15" fill="none" stroke="${stroke}" stroke-width="2"/></g>`;
      for (let i = 0; i < per; i++) { const x = -hw + (w / per) * (i + 0.5); g += ch(x, -hd - 12, 180) + ch(x, hd + 12, 0); }
      g += ch(-hw - 12, 0, 90) + ch(hw + 12, 0, -90);
      g += rect(-hw, -hd, w, d, st.fill);
      g += `<rect x="${f(-hw + 4)}" y="${f(-hd + 4)}" width="${f(w - 8)}" height="${f(d - 8)}" fill="none" stroke="${stroke}" stroke-width="0.4"/>`;
      break;
    }
    case 'cuba': {
      const rb = it.rebaixo;
      if (rb?.prof) g += `<rect x="${f(-hw - (rb.esq || 0))}" y="${f(-hd - (rb.frente || 0))}" width="${f(w + (rb.esq || 0) + (rb.dir || 0))}" height="${f(d + (rb.frente || 0) + (rb.fundo || 0))}" rx="2" fill="#c98e7c" fill-opacity="0.35" stroke="${stroke}" stroke-width="0.6" stroke-dasharray="3 2"/>`;
      g += `<rect x="${f(-hw)}" y="${f(-hd)}" width="${f(w)}" height="${f(d)}" rx="6" fill="${st.fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      g += `<rect x="${f(-hw + 3)}" y="${f(-hd + 3)}" width="${f(w - 6)}" height="${f(d - 6)}" rx="5" fill="none" stroke="${stroke}" stroke-width="0.5"/>`;
      g += circ(0, 0, 3) + circ(0, hd + 4, 2.5, stroke);
      break;
    }
    default:
      g += rect(-hw, -hd, w, d, st.fill, dash);
  }
  switch (it.kind) {
    case 'fogao': {
      const r1 = Math.min(w, d) * 0.09;
      for (const yy of [-d * 0.2, d * 0.2]) for (const xx of [-w * 0.3, 0, w * 0.3]) g += circ(xx, yy, xx === 0 ? r1 * 1.25 : r1) + circ(xx, yy, (xx === 0 ? r1 * 1.25 : r1) * 0.45);
      break;
    }
    case 'fogaoLenha': {
      // croqui: bloco do forno (lado da chaminé) + chapa com uma trempe
      const ch = lenhaChimney(it), m = ch.mirrored ? -1 : 1, chL = m * ch.lx;
      const ow = Math.min(w - 40, Math.max(w * 0.45, chL + hw + 19));
      const ox0 = m > 0 ? -hw : hw - ow;
      g += `<rect x="${f(ox0)}" y="${f(-hd)}" width="${f(ow)}" height="${f(d)}" fill="#a85a36" stroke="${stroke}" stroke-width="0.6"/>`;
      g += `<text x="${f(ox0 + ow / 2)}" y="${f(-hd + 9)}" font-size="6" text-anchor="middle" fill="#fff">forno</text>`;
      const cpw = w - ow, cx0 = m > 0 ? -hw + ow : -hw;
      g += `<rect x="${f(cx0 + 1)}" y="${f(-hd + 2)}" width="${f(cpw - 3)}" height="${f(d - 4)}" fill="#5a4a40" stroke="${stroke}" stroke-width="0.6"/>`;
      for (let r = 1; r <= 3; r++) g += circ(cx0 + cpw / 2, -3, 4.5 * r + 0.5, 'none', '#e8d5c4', 0.6);
      const x0 = ch.lx - 15, x1 = ch.lx + 15;
      g += `<rect x="${f(x0)}" y="${f(hd - 30)}" width="30" height="30" fill="#8a4b2a" stroke="${stroke}" stroke-width="0.8"/>`;
      g += line(x0, hd - 30, x1, hd, '#fff', 0.6) + line(x1, hd - 30, x0, hd, '#fff', 0.6);
      break;
    }
    case 'geladeira': case 'freezer':
      g += line(-hw + 3, -hd + 4, hw - 3, -hd + 4, stroke, 0.6);
      break;
    case 'filtro':
      g += circ(0, 0, Math.min(w, d) * 0.22, '#c98a5a') + circ(0, 0, Math.min(w, d) * 0.38, 'none', stroke, 0.5);
      break;
    case 'torreLL':
      g += line(-hw, -hd, hw, hd) + line(hw, -hd, -hw, hd);
      break;
    case 'suspenso': case 'coifa':
      g += line(-hw, -hd, hw, hd, stroke, 0.6, ' stroke-dasharray="4 3"');
      if (it.kind === 'suspenso' && it.nichos?.length) {
        const n = Math.max(1, Math.round(w / 45));
        for (const i of it.nichos) if (i < n) g += `<rect x="${f(-hw + (w / n) * i + 2)}" y="${f(-hd + 2)}" width="${f(w / n - 4)}" height="${f(d - 4)}" fill="none" stroke="${stroke}" stroke-width="0.5" stroke-dasharray="1 2"/>`;
      }
      if (it.kind === 'coifa') g += line(hw, -hd, -hw, hd, stroke, 0.6, ' stroke-dasharray="4 3"');
      break;
    case 'cristaleira':
      g += line(-hw, -hd + 4, hw, -hd + 4, '#3a6b8a', 0.8, ' stroke-dasharray="4 3"');
      break;
    case 'armarioBaixo': {
      const n = Math.max(1, Math.round(w / 55));
      for (let i = 1; i < n; i++) g += line(-hw + (w / n) * i, -hd, -hw + (w / n) * i, hd, stroke, 0.5);
      break;
    }
    case 'buffet':
      for (const t of [-1 / 6, 1 / 6]) g += line(w * t * 2 * 0.75, -hd, w * t * 2 * 0.75, hd, stroke, 0.5);
      break;
    case 'cadeiraBalanco':
      g += `<path d="M ${f(-hw * 0.9)} ${f(-hd)} Q ${f(-hw)} 0 ${f(-hw * 0.9)} ${f(hd)} M ${f(hw * 0.9)} ${f(-hd)} Q ${f(hw)} 0 ${f(hw * 0.9)} ${f(hd)}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
      g += circ(0, -2, Math.min(w, d) * 0.38, '#ead8b8') + `<path d="M ${f(-hw * 0.7)} ${f(hd * 0.55)} Q 0 ${f(hd * 0.85)} ${f(hw * 0.7)} ${f(hd * 0.55)}" fill="none" stroke="${stroke}" stroke-width="2.4"/>`;
      break;
    case 'nicho': {
      const n = Math.max(1, Math.round(w / 35));
      for (let i = 1; i < n; i++) g += line(-hw + (w / n) * i, -hd, -hw + (w / n) * i, hd, stroke, 0.5);
      break;
    }
    case 'tomada':
      g += `<rect x="${f(-hw)}" y="${f(-hd - 3)}" width="${f(w)}" height="3" fill="#fff" stroke="${stroke}" stroke-width="0.6"/>` + circ(0, -hd - 1.5, 1, '#3b3f44', '#3b3f44', 0.3);
      break;
    case 'interfone':
      g += `<rect x="${f(-hw)}" y="${f(-hd - 4)}" width="${f(w)}" height="4" fill="#fff" stroke="${stroke}" stroke-width="0.6"/>`;
      break;
    case 'ganchos': {
      const n = Math.max(2, Math.round(w / 12));
      for (let i = 0; i < n; i++) g += circ(-hw + (w / n) * (i + 0.5), -hd - 3, 1.6, '#fff', stroke, 0.5);
      break;
    }
    case 'escorredor': {
      for (let i = 1; i < 7; i++) g += line(-hw + (w / 7) * i, -hd + 3, -hw + (w / 7) * i, hd - 3, stroke, 0.4);
      g += `<rect x="${f(-hw + 2)}" y="${f(-hd + 2)}" width="10" height="8" fill="none" stroke="${stroke}" stroke-width="0.5"/>`;
      break;
    }
    case 'eletroportatil':
      if (it.variante === 'liquidificador') g += circ(0, 0, Math.min(w, d) * 0.38, '#fff', stroke, 0.5) + circ(0, 0, Math.min(w, d) * 0.12, 'none', stroke, 0.4);
      else g += `<rect x="${f(-hw + 2)}" y="${f(-hd + 2)}" width="${f(w - 4)}" height="${f(d - 4)}" rx="3" fill="#fff" stroke="${stroke}" stroke-width="0.5"/>` + line(-hw + 2, -hd + 6, hw - 2, -hd + 6, stroke, 0.4);
      break;
    case 'acessorios':
      g += circ(-w * 0.25, 0, Math.min(w, d) * 0.22, '#fff', stroke, 0.5) + circ(w * 0.2, 0, Math.min(w, d) * 0.16, '#fff', stroke, 0.5);
      break;
    case 'pratos': {
      const n = Math.max(2, Math.round(w / 36));
      for (let i = 0; i < n; i++) g += circ(-hw + (w / n) * (i + 0.5), -hd - 6, Math.min(8, w / n / 2.6), '#fff', '#3a5f9a', 0.6);
      break;
    }
  }
  // frente do móvel
  if (!['pratos', 'cuba', 'interfone', 'ganchos', 'acessorios', 'escorredor', 'tomada'].includes(it.kind)) g += line(-hw, -hd, hw, -hd, stroke, cat === 'suspenso' ? 1 : 2.2, dash);
  // rótulo (sempre legível)
  const up = norm(it.rot) > 90 && norm(it.rot) <= 270 ? 180 : 0;
  const along = w >= d * 0.8 || it.kind === 'mesa';
  const big = Math.max(w, d), small = Math.min(w, d);
  const label = number != null ? `${number}` : t(SHORT[it.kind] || it.kind);
  const fs = number != null ? Math.min(14, Math.max(7, small * 0.4)) : Math.max(5.5, Math.min(10, small * 0.24, (big * 1.6) / Math.max(4, label.length)));
  const tr = along ? up : (norm(it.rot) >= 180 ? 90 : -90);
  const susp = cat === 'suspenso' || !!KINDS[it.kind]?.small;
  // suspensos: rótulo junto à borda frontal (para não cobrir o móvel de piso abaixo)
  const sfs = Math.max(5, Math.min(7.5, fs * 0.8));
  const cy = it.kind === 'pratos' ? -hd - 20 : susp ? -hd + sfs * 0.95 + 1 : 0;
  const H = halo ? ' stroke="#fffdf8" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke"' : '';
  g += `<g transform="translate(0 ${f(cy)}) rotate(${number != null ? f(-it.rot) : susp && it.kind !== 'pratos' ? up : tr})">`;
  if (number != null) {
    const nfs = susp ? sfs * 1.1 : fs;
    g += `<circle r="${f(nfs * 0.85)}" fill="${susp ? '#f3e7d2' : '#fff'}" stroke="${INK}" stroke-width="0.6"${susp ? ' stroke-dasharray="2 1.5"' : ''}/>`;
    g += `<text x="0" y="0" font-family="${FONT}" font-size="${f(nfs)}" font-weight="bold" fill="${INK}" text-anchor="middle" dominant-baseline="central">${label}</text>`;
  } else if (susp) {
    g += `<text x="0" y="0" font-family="${FONT}" font-size="${f(sfs)}" font-style="italic" fill="#6b4b33" text-anchor="middle" dominant-baseline="middle"${H}>${label} · h${f1(it.elev || 0)}</text>`;
  } else {
    g += `<text x="0" y="${f(-fs * 0.15)}" font-family="${FONT}" font-size="${f(fs)}" font-weight="bold" fill="${INK}" text-anchor="middle" dominant-baseline="middle"${H}>${label}</text>`;
    if (small > 20) g += `<text x="0" y="${f(fs * 0.95)}" font-family="${FONT}" font-size="${f(fs * 0.72)}" fill="#5d4a36" text-anchor="middle" dominant-baseline="middle"${H}>${f1(it.w)}×${f1(it.d)}</text>`;
  }
  g += '</g>';
  if (conflict) g += `<circle cx="${f(hw - 5)}" cy="${f(-hd + 5)}" r="5" fill="#d0201b"/><text x="${f(hw - 5)}" y="${f(-hd + 5.5)}" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle" font-family="${FONT}">!</text>`;
  g += '</g>';
  return g;
}
const f = (v) => Math.round(v * 100) / 100;

/** Ordem de desenho: piso → itens altos → suspensos por cima. */
export function sortedForDraw(items) {
  const rank = (it) => (KINDS[it.kind]?.cat === 'suspenso' ? 1000 : 0) + (it.elev || 0);
  return [...items].sort((a, b) => rank(a) - rank(b));
}

// ---------------------------------------------------------------- editor interativo
export class PlanEditor {
  constructor(svg, store) {
    this.svg = svg; this.store = store;
    this.snap = true; this.showGrid = true; this.showSusp = true;
    this.vb = { x: -150, y: -200, w: 800, h: 1000 };
    svg.innerHTML = `${DEFS}<g id="pl-room"></g><g id="pl-items"></g><g id="pl-overlay"></g><g id="pl-measure"></g>`;
    this.gRoom = svg.querySelector('#pl-room'); this.gItems = svg.querySelector('#pl-items'); this.gOver = svg.querySelector('#pl-overlay');
    this.gMeas = svg.querySelector('#pl-measure');
    this.measureOn = false; this.measures = []; this.mCur = null; this.mHover = null;
    this.renderRoom();
    this.render();
    store.on(() => this.render());
    this.bind();
    new ResizeObserver(() => this.fit(false)).observe(svg);
  }
  renderRoom() { this.gRoom.innerHTML = roomMarkup({ grid: this.showGrid }); }
  render() {
    const cf = (this.conflicts = conflicts(this.store.items));
    this.gItems.innerHTML = sortedForDraw(this.store.items).filter((it) => this.showSusp || KINDS[it.kind]?.cat !== 'suspenso' || it.id === this.store.selectedId).map((it) => itemMarkup(it, { conflict: !!cf[it.id], selected: it.id === this.store.selectedId, halo: true })).join('');
    this.renderOverlay();
  }
  renderOverlay() {
    const it = this.store.selected;
    if (!it) { this.gOver.innerHTML = ''; return; }
    const fp = footprint(it), r = (it.rot * Math.PI) / 180;
    const bb = aabb(it, fp);
    let s = `<rect x="${f(bb.x0 - 3)}" y="${f(bb.y0 - 3)}" width="${f(bb.x1 - bb.x0 + 6)}" height="${f(bb.y1 - bb.y0 + 6)}" fill="none" stroke="#d2552b" stroke-width="1" stroke-dasharray="4 3"/>`;
    // cotas até as paredes
    const gp = wallGaps(it), cy = (bb.y0 + bb.y1) / 2, cx = (bb.x0 + bb.x1) / 2, col = { color: '#d2552b', size: 9 };
    if (gp.esq > 0.5) s += dimLine(0, cy, bb.x0, cy, f1(gp.esq), col);
    if (gp.dir > 0.5) s += dimLine(bb.x1, cy, R.innerRight, cy, f1(gp.dir), col);
    if (gp.frente > 0.5) s += dimLine(cx, R.frontInner, cx, bb.y0, f1(gp.frente), col);
    if (gp.fundo > 0.5) s += dimLine(cx, bb.y1, cx, R.D, f1(gp.fundo), col);
    // alça de rotação
    const hl = fp.d / 2 + 28;
    const hx = it.x + hl * Math.sin(r), hy = it.y - hl * Math.cos(r);
    s += `<line x1="${f(it.x)}" y1="${f(it.y)}" x2="${f(hx)}" y2="${f(hy)}" stroke="#d2552b" stroke-width="1"/>`;
    s += `<circle class="rot-handle" cx="${f(hx)}" cy="${f(hy)}" r="8" fill="#fff" stroke="#d2552b" stroke-width="2"/>`;
    s += `<path class="rot-handle" d="M ${f(hx - 4)} ${f(hy - 1)} A 4 4 0 1 1 ${f(hx + 1)} ${f(hy + 4)}" fill="none" stroke="#d2552b" stroke-width="1.4" pointer-events="none"/>`;
    s += `<circle cx="${f(it.x)}" cy="${f(it.y)}" r="2.5" fill="#d2552b"/>`;
    this.gOver.innerHTML = s;
  }
  setGrid(v) { this.showGrid = v; this.renderRoom(); }

  // ---------- view box ----------
  applyVB() { const v = this.vb; this.svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`); if (this.measures?.length || this.mCur || this.mHover) this.renderMeasures(); }
  fit(force = true) {
    const bw = R.lot.sideWallX + 190, bh = R.D + 380, x0 = -150, y0 = -205;
    const r = this.svg.getBoundingClientRect(); if (!r.width) return;
    if (!force && this._fitted) { this.vb.h = this.vb.w * (r.height / r.width); this.applyVB(); return; }
    const ar = r.width / r.height;
    if (bw / bh > ar) { this.vb = { x: x0, w: bw, h: bw / ar, y: y0 - (bw / ar - bh) / 2 }; } else { this.vb = { y: y0, h: bh, w: bh * ar, x: x0 - (bh * ar - bw) / 2 }; }
    this._fitted = true; this.applyVB();
  }
  zoom(k, cx, cy) {
    const v = this.vb;
    if (cx == null) { cx = v.x + v.w / 2; cy = v.y + v.h / 2; }
    const nw = Math.min(4000, Math.max(80, v.w * k)), kk = nw / v.w;
    this.vb = { x: cx - (cx - v.x) * kk, y: cy - (cy - v.y) * kk, w: nw, h: v.h * kk };
    this.applyVB();
  }
  pt(e) { const p = this.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(this.svg.getScreenCTM().inverse()); }

  // ---------- interação ----------
  bind() {
    const svg = this.svg;
    let mode = null, start = null, startItem = null, moved = false;
    svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.button !== 1) return;
      const p = this.pt(e);
      const handleEl = e.target.closest('.rot-handle');
      const itemEl = e.target.closest('.item');
      svg.setPointerCapture(e.pointerId);
      moved = false;
      if (this.measureOn && e.button === 0) {
        const q = this.snapMeasure(p, null, e);
        this.mCur = { a: q, b: q }; mode = 'measure'; this.renderMeasures(); return;
      }
      if (handleEl && this.store.selected) { mode = 'rotate'; startItem = { ...this.store.selected }; }
      else if (itemEl && e.button === 0) {
        const id = itemEl.dataset.id;
        if (this.store.selectedId !== id) this.store.select(id);
        mode = 'move'; startItem = { ...this.store.get(id) }; start = p;
      } else { mode = 'pan'; start = { x: e.clientX, y: e.clientY, vb: { ...this.vb } }; }
    });
    svg.addEventListener('pointermove', (e) => {
      const p = this.pt(e);
      if (mode === 'measure') { this.mCur.b = this.snapMeasure(p, this.mCur.a, e); this.mHover = null; this.renderMeasures(); return; }
      if (!mode) {
        if (this.measureOn) { svg.style.cursor = 'crosshair'; this.mHover = this.snapMeasure(p, null, e); this.renderMeasures(); return; }
        svg.style.cursor = e.target.closest('.rot-handle') ? 'grab' : e.target.closest('.item') ? 'move' : 'default'; return;
      }
      if (mode === 'pan') {
        const r = svg.getBoundingClientRect(), k = this.vb.w / r.width;
        this.vb.x = start.vb.x - (e.clientX - start.x) * k; this.vb.y = start.vb.y - (e.clientY - start.y) * k; this.applyVB(); moved = true; return;
      }
      const it = this.store.selected; if (!it) return;
      if (mode === 'move') {
        let nx = startItem.x + (p.x - start.x), ny = startItem.y + (p.y - start.y);
        if (Math.hypot(p.x - start.x, p.y - start.y) < 1.5 && !moved) return;
        moved = true;
        if (!e.altKey) ({ x: nx, y: ny } = this.snapPos(it, nx, ny));
        this.store.update(it.id, { x: Math.round(nx * 10) / 10, y: Math.round(ny * 10) / 10 }, 'drag');
      } else if (mode === 'rotate') {
        let a = (Math.atan2(p.x - it.x, -(p.y - it.y)) * 180) / Math.PI;
        a = e.shiftKey ? Math.round(a) : Math.round(a / 15) * 15;
        moved = true;
        this.store.update(it.id, { rot: norm(a) }, 'drag');
      }
    });
    const end = () => {
      if (mode === 'measure') {
        const m = this.mCur; this.mCur = null;
        if (m && Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y) > 0.5) { this.measures.push(m); this.onMeasuresChange?.(this.measures.length); }
        this.renderMeasures(); mode = null; return;
      }
      if ((mode === 'move' || mode === 'rotate') && moved) this.store.emit('change');
      if (mode === 'pan' && !moved) this.store.select(null);
      mode = null;
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('pointerleave', () => { if (this.mHover) { this.mHover = null; this.renderMeasures(); } });
    svg.addEventListener('wheel', (e) => { e.preventDefault(); const p = this.pt(e); this.zoom(Math.exp(e.deltaY * 0.0015), p.x, p.y); }, { passive: false });
  }

  // ---------- medição ----------
  setMeasure(on) { this.measureOn = on; this.svg.classList.toggle('measuring', on); this.mHover = null; this.mCur = null; this.renderMeasures(); }
  clearMeasures() { this.measures = []; this.renderMeasures(); this.onMeasuresChange?.(0); }
  undoMeasure() { this.measures.pop(); this.renderMeasures(); this.onMeasuresChange?.(this.measures.length); }
  /** cm por pixel de tela (para manter traços/textos da medição com tamanho constante). */
  pxk() { const r = this.svg.getBoundingClientRect(); return r.width ? this.vb.w / r.width : 1; }

  /** Pontos e segmentos de referência para o ímã da trena: paredes, vãos, pilares e cantos/bordas dos móveis. */
  measureRefs() {
    const W = R.W, D = R.D, IR = R.innerRight, FI = R.frontInner;
    const pts = [[0, FI], [IR, FI], [0, D], [IR, D], [0, 0], [W, 0], [W, D], [-20, 0], [-20, D + 20], [W, D + 20],
      [R.door.x0, D], [R.door.x1, D], [R.door.x1 + 5, D], [R.window.x0, D], [R.window.x1, D], [R.lot.sideWallX, 0], [R.lot.sideWallX, D]];
    const segs = [[[0, 0], [0, D]], [[IR, 0], [IR, D]], [[W, 0], [W, D]], [[0, FI], [IR, FI]], [[0, D], [W, D]], [[-20, 0], [W, 0]], [[R.lot.sideWallX, -145], [R.lot.sideWallX, D]]];
    for (const p of R.pillars) {
      const c = [[p.x0, p.y0], [p.x1, p.y0], [p.x1, p.y1], [p.x0, p.y1]];
      pts.push(...c); for (let i = 0; i < 4; i++) segs.push([c[i], c[(i + 1) % 4]]);
    }
    for (const seg of R.right) pts.push([IR, seg.y0], [IR, seg.y1]);
    for (const it of this.store.items) {
      if (!this.showSusp && KINDS[it.kind]?.cat === 'suspenso') continue;
      const c = corners(it);
      pts.push(...c, [it.x, it.y]); for (let i = 0; i < 4; i++) segs.push([c[i], c[(i + 1) % 4]]);
    }
    return { pts, segs };
  }
  snapMeasure(p, from, e) {
    let q = { x: p.x, y: p.y, kind: 'livre' };
    if (!e.altKey) {
      const T = 12 * this.pxk();
      const { pts, segs } = this.measureRefs();
      let best = T;
      for (const [x, y] of pts) { const d = Math.hypot(x - p.x, y - p.y); if (d < best) { best = d; q = { x, y, kind: 'ponto' }; } }
      if (q.kind === 'livre') {
        best = T * 0.8;
        for (const [[x1, y1], [x2, y2]] of segs) {
          const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy; if (!L2) continue;
          const t = Math.max(0, Math.min(1, ((p.x - x1) * dx + (p.y - y1) * dy) / L2));
          const px = x1 + t * dx, py = y1 + t * dy, d = Math.hypot(px - p.x, py - p.y);
          if (d < best) { best = d; q = { x: px, y: py, kind: 'borda' }; }
        }
      }
      if (q.kind === 'livre') { q.x = Math.round(q.x); q.y = Math.round(q.y); }
    }
    if (from && e.shiftKey) { if (Math.abs(q.x - from.x) >= Math.abs(q.y - from.y)) q.y = from.y; else q.x = from.x; }
    return q;
  }
  renderMeasures() {
    const k = this.pxk(), C = '#0f7a8a';
    let s = '';
    const all = this.mCur ? [...this.measures, this.mCur] : this.measures;
    for (const m of all) {
      const { a, b } = m, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
      if (L < 0.1) continue;
      const nx = -dy / L, ny = dx / L, t = 6 * k;
      s += `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="${C}" stroke-width="${f(2 * k)}"/>`;
      for (const q of [a, b]) {
        s += `<line x1="${f(q.x - nx * t)}" y1="${f(q.y - ny * t)}" x2="${f(q.x + nx * t)}" y2="${f(q.y + ny * t)}" stroke="${C}" stroke-width="${f(2 * k)}"/>`;
        s += `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="${f(2.6 * k)}" fill="#fff" stroke="${C}" stroke-width="${f(1.4 * k)}"/>`;
      }
      if (Math.abs(dx) > 1 && Math.abs(dy) > 1) s += `<polyline points="${f(a.x)},${f(a.y)} ${f(b.x)},${f(a.y)} ${f(b.x)},${f(b.y)}" fill="none" stroke="${C}" stroke-width="${f(k)}" stroke-dasharray="${f(4 * k)} ${f(3 * k)}" opacity="0.6"/>`;
      let ang = (Math.atan2(dy, dx) * 180) / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const main = fmtLen(L), sub = Math.abs(dx) > 1 && Math.abs(dy) > 1 ? `↔ ${f1(Math.abs(dx))} · ↕ ${f1(Math.abs(dy))} cm` : '';
      const fs = 12 * k, w = Math.max(main.length * 7.2, sub.length * 5.6) * k + 12 * k, h = (sub ? 32 : 19) * k;
      s += `<g transform="translate(${f(mx)} ${f(my)}) rotate(${f(ang)})">`;
      s += `<rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(5 * k)}" fill="${C}"/>`;
      s += `<text x="0" y="${f(sub ? -5 * k : 0)}" font-family="${FONT}" font-size="${f(fs)}" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="central">${main}</text>`;
      if (sub) s += `<text x="0" y="${f(8.5 * k)}" font-family="${FONT}" font-size="${f(9.5 * k)}" fill="#e2f4f6" text-anchor="middle" dominant-baseline="central">${sub}</text>`;
      s += '</g>';
    }
    if (this.mHover && this.measureOn) {
      const q = this.mHover, r = 5 * k;
      s += q.kind === 'ponto'
        ? `<rect x="${f(q.x - r)}" y="${f(q.y - r)}" width="${f(2 * r)}" height="${f(2 * r)}" fill="none" stroke="${C}" stroke-width="${f(2 * k)}"/>`
        : q.kind === 'borda' ? `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="${f(r)}" fill="none" stroke="${C}" stroke-width="${f(2 * k)}"/>`
          : `<path d="M ${f(q.x - r)} ${f(q.y)} H ${f(q.x + r)} M ${f(q.x)} ${f(q.y - r)} V ${f(q.y + r)}" stroke="${C}" stroke-width="${f(1.5 * k)}"/>`;
    }
    this.gMeas.innerHTML = s;
  }

  /** Encaixe magnético nas paredes e nas bordas dos outros móveis (segure Alt para desativar). */
  snapPos(it, nx, ny) {
    if (this.snap) { nx = Math.round(nx); ny = Math.round(ny); }
    const fp = footprint(it);
    const bb = aabb({ ...it, x: nx, y: ny }, fp);
    const T = 9;
    const xs = [0, R.innerRight], ys = [R.frontInner, R.D];
    const susp = KINDS[it.kind]?.cat === 'suspenso';
    for (const o of this.store.items) {
      if (o.id === it.id) continue;
      if ((KINDS[o.kind]?.cat === 'suspenso') !== susp && !susp) continue;
      const b = aabb(o, footprint(o)); xs.push(b.x0, b.x1); ys.push(b.y0, b.y1);
    }
    const best = (edges, cands) => {
      let d = Infinity;
      for (const e of edges) for (const c of cands) if (Math.abs(c - e) < Math.abs(d)) d = c - e;
      return Math.abs(d) <= T ? d : 0;
    };
    nx += best([bb.x0, bb.x1], xs); ny += best([bb.y0, bb.y1], ys);
    return { x: nx, y: ny };
  }
}
