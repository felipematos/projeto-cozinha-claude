// Projeto de marcenaria em PDF: planta com armários numerados, folha por armário (vista frontal cotada,
// corte lateral, frentes), lista de corte das frentes, tampos de granilite e vistas 3D de referência.
import { ROOM, KINDS } from './data.js';
import { DEFS, roomMarkup, itemMarkup, sortedForDraw, dimLine } from './plan2d.js';
import { CAB_KINDS, cabinetSpec, topSpec } from './marcenaria.js';
import { stamp } from './export.js';

const INK = [43, 33, 24], MUTED = [110, 95, 80], ACC = [181, 83, 47];
const FONT = 'helvetica, Arial, sans-serif';
const n1 = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
const f = (v) => Math.round(v * 100) / 100;

function mountSVG(markup) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden';
  div.innerHTML = markup; document.body.appendChild(div);
  return { el: div.firstElementChild, cleanup: () => div.remove() };
}
async function placeSVG(doc, markup, x, y, w, h) {
  const { el, cleanup } = mountSVG(markup);
  try { await doc.svg(el, { x, y, width: w, height: h }); } finally { cleanup(); }
}

/** Lados do móvel encostados em parede (para rodabanca do tampo). */
function wallSides(it) {
  const r = (it.rot * Math.PI) / 180, P = (lx, ly) => ({ x: it.x + lx * Math.cos(r) - ly * Math.sin(r), y: it.y + lx * Math.sin(r) + ly * Math.cos(r) });
  const T = 3, lines = [(p) => Math.abs(p.x) < T, (p) => Math.abs(p.x - ROOM.innerRight) < T, (p) => Math.abs(p.y - ROOM.D) < T, (p) => Math.abs(p.y - ROOM.frontInner) < T];
  const on = (pts) => lines.some((fn) => pts.every(fn)), hw = it.w / 2, hd = it.d / 2, out = [];
  if (on([P(-hw, hd), P(hw, hd)])) out.push(`fundo ${n1(it.w)} cm`);
  if (on([P(-hw, -hd), P(-hw, hd)])) out.push(`lateral ${n1(it.d)} cm`);
  if (on([P(hw, -hd), P(hw, hd)])) out.push(`lateral ${n1(it.d)} cm`);
  return out;
}

// ---------------------------------------------------------------- desenho de um armário (cm, y para cima)
const FILL = { porta: '#ecd9c0', gaveta: '#f4e6d2', nicho: '#d8c2a2', lavaloucas: '#e4e7ea', fixo: '#dcd6cc', cego: '#dcd6cc' };
const LBL = { porta: 'P', gaveta: 'G', nicho: 'N' };

function elevationSVG(spec, scale) {
  const { L: W, A: H, P: D, elev } = spec;
  const fs = 0.3 * scale, sw = 0.035 * scale, gap = 35;               // tamanhos em cm de desenho
  const X = (xl) => W / 2 - xl;                                         // espelha: esquerda do desenho = esquerda de quem olha
  const Y = (yl) => -(elev + yl);
  const isBase = spec.kind === 'bancada' || spec.kind === 'armarioBaixo' || spec.kind === 'torreLL';
  let s = '';
  // piso
  s += `<line x1="-25" y1="0" x2="${W + gap + D + 25}" y2="0" stroke="#2b2118" stroke-width="${sw * 1.6}"/>`;
  s += `<text x="-24" y="${f(fs * 1.4)}" font-family="${FONT}" font-size="${f(fs * 0.85)}" fill="#6e5f50">piso</text>`;
  // corpo
  s += `<rect x="0" y="${Y(H)}" width="${W}" height="${H}" fill="#f7efe3" stroke="#2b2118" stroke-width="${sw * 1.4}"/>`;
  if (spec.kind === 'bancada') {
    s += `<rect x="0" y="${Y(H)}" width="${W}" height="3" fill="#c98e7c" stroke="#5a2e22" stroke-width="${sw}"/>`;
    s += `<rect x="1" y="${Y(10)}" width="${W - 2}" height="10" fill="#4a3c33" stroke="none"/>`;
  } else if (spec.kind === 'armarioBaixo') {
    s += `<rect x="0" y="${Y(H)}" width="${W}" height="3.5" fill="#8a6440" stroke="#2b2118" stroke-width="${sw}"/>`;
    s += `<rect x="1" y="${Y(8)}" width="${W - 2}" height="8" fill="#4a3c33" stroke="none"/>`;
  } else if (spec.kind === 'torreLL') {
    s += `<rect x="1" y="${Y(10)}" width="${W - 2}" height="10" fill="#4a3c33" stroke="none"/>`;
  }
  // frentes
  const count = {};
  for (const p of spec.panels) {
    const x0 = Math.min(X(p.x0), X(p.x1)), w = Math.abs(p.x1 - p.x0), h = p.y1 - p.y0, cx = x0 + w / 2, cy = Y((p.y0 + p.y1) / 2);
    s += `<rect x="${f(x0 + 0.3)}" y="${f(Y(p.y1) + 0.3)}" width="${f(w - 0.6)}" height="${f(h - 0.6)}" fill="${FILL[p.tipo] || '#eee'}" stroke="#5d4a36" stroke-width="${sw}"/>`;
    if (p.tipo === 'nicho' && p.prateleiras) s += `<line x1="${f(x0 + 1)}" y1="${f(cy)}" x2="${f(x0 + w - 1)}" y2="${f(cy)}" stroke="#5d4a36" stroke-width="${sw * 1.6}"/>`;
    if (p.tipo === 'porta') {                                                  // indicação de abertura (lado da dobradiça)
      const kx = X(p.knob[0]), hinge = kx > cx ? x0 + 0.6 : x0 + w - 0.6, far = kx > cx ? x0 + w - 0.6 : x0 + 0.6;
      s += `<polyline points="${f(far)},${f(Y(p.y1) + 0.6)} ${f(hinge)},${f(cy)} ${f(far)},${f(Y(p.y0) - 0.6)}" fill="none" stroke="#9b8468" stroke-width="${sw * 0.7}" stroke-dasharray="${f(fs * 0.4)} ${f(fs * 0.3)}"/>`;
    }
    if (p.knob) s += `<circle cx="${f(X(p.knob[0]))}" cy="${f(Y(p.knob[1]))}" r="${f(Math.max(1.4, fs * 0.28))}" fill="#1d1b1a"/>`;
    let label;
    if (LBL[p.tipo]) { count[p.tipo] = (count[p.tipo] || 0) + 1; label = `${LBL[p.tipo]}${count[p.tipo]}`; p.ref = label; }
    else label = p.tipo === 'lavaloucas' ? 'LAVA-LOUÇAS' : 'FIXO';
    const tfs = Math.min(fs, h * 0.28, w * 0.18);
    s += `<text x="${f(cx)}" y="${f(cy - tfs * 0.15)}" font-family="${FONT}" font-size="${f(tfs)}" font-weight="bold" fill="#2b2118" text-anchor="middle">${label}</text>`;
    if (h > tfs * 2.6 && LBL[p.tipo] && p.tipo !== 'nicho') s += `<text x="${f(cx)}" y="${f(cy + tfs * 0.95)}" font-family="${FONT}" font-size="${f(tfs * 0.8)}" fill="#5d4a36" text-anchor="middle">${n1(w - 0.6)}×${n1(h - 0.6)}</text>`;
    else if (h > tfs * 2.6) s += `<text x="${f(cx)}" y="${f(cy + tfs * 0.95)}" font-family="${FONT}" font-size="${f(tfs * 0.8)}" fill="#5d4a36" text-anchor="middle">${n1(w)}×${n1(h)}</text>`;
  }
  // cotas: largura total, divisões horizontais, altura total, divisões verticais e altura de instalação
  const col = { color: '#b5532f', size: fs, tick: fs * 0.45 };
  const top = Y(H) - fs * 3.2;
  s += dimLine(0, top, W, top, `${n1(W)}`, col);
  const xs = [...new Set(spec.panels.flatMap((p) => [X(p.x0), X(p.x1)]).map((v) => Math.round(v * 10) / 10))].filter((v) => v > 0.5 && v < W - 0.5).sort((a, b) => a - b);
  const chainX = [0, ...xs, W];
  const bot = Math.min(-0.01, Y(0)) + fs * 2.6 + (elev > 0 ? 0 : 0);
  for (let i = 0; i + 1 < chainX.length; i++) if (chainX[i + 1] - chainX[i] > 3) s += dimLine(chainX[i], bot, chainX[i + 1], bot, n1(chainX[i + 1] - chainX[i]), { ...col, color: '#5d4a36' });
  const right = W + fs * 3;
  s += dimLine(right, Y(H), right, Y(0), `${n1(H)}`, col);
  if (elev > 0) s += dimLine(right, Y(0), right, 0, `${n1(elev)} do piso`, { ...col, color: '#3a6b8a' });
  const ys = [...new Set(spec.panels.flatMap((p) => [p.y0, p.y1]).map((v) => Math.round(v * 10) / 10))].filter((v) => v > 0.5 && v < H - 0.5).sort((a, b) => a - b);
  const chainY = [0, ...ys, H], left = -fs * 3;
  for (let i = 0; i + 1 < chainY.length; i++) if (chainY[i + 1] - chainY[i] > 2.5) s += dimLine(left, Y(chainY[i + 1]), left, Y(chainY[i]), n1(chainY[i + 1] - chainY[i]), { ...col, color: '#5d4a36' });
  // corte lateral
  const sx = W + gap;
  s += `<text x="${f(sx + D / 2)}" y="${f(Y(H) - fs * 4.6)}" font-family="${FONT}" font-size="${f(fs)}" font-weight="bold" fill="#2b2118" text-anchor="middle">CORTE LATERAL</text>`;
  s += `<rect x="${sx}" y="${Y(H)}" width="${D}" height="${H}" fill="#f7efe3" stroke="#2b2118" stroke-width="${sw * 1.4}"/>`;
  s += `<line x1="${sx + D}" y1="${Y(H)}" x2="${sx + D}" y2="${Y(0)}" stroke="#3a6b8a" stroke-width="${sw * 2}"/>`;
  s += `<text x="${f(sx + D + fs * 0.6)}" y="${f(Y(H / 2))}" font-family="${FONT}" font-size="${f(fs * 0.8)}" fill="#3a6b8a" transform="rotate(90 ${f(sx + D + fs * 0.6)} ${f(Y(H / 2))})" text-anchor="middle">parede</text>`;
  if (isBase) {
    const rod = spec.estrutura.rodape || 10, rec = spec.estrutura.recuoRodape || 5;
    s += `<rect x="${sx}" y="${Y(rod)}" width="${rec}" height="${rod}" fill="#fff" stroke="none"/>`;
    s += `<rect x="${sx + rec}" y="${Y(rod)}" width="${D - rec}" height="${rod}" fill="#4a3c33"/>`;
  }
  if (spec.kind === 'bancada') s += `<rect x="${sx - 2}" y="${Y(H)}" width="${D + 2}" height="3" fill="#c98e7c" stroke="#5a2e22" stroke-width="${sw}"/>`;
  s += `<rect x="${sx}" y="${Y(H) + (spec.kind === 'bancada' ? 3 : 0)}" width="2" height="${H - (isBase ? (spec.estrutura.rodape || 10) : 0) - (spec.kind === 'bancada' ? 3 : 0)}" fill="#c9a77d"/>`;
  s += dimLine(sx, Y(0) + fs * 2.6, sx + D, Y(0) + fs * 2.6, `${n1(D)}`, col);
  // caixa do desenho
  const x0 = -fs * 6.5, y0 = Y(H) - fs * 6.5, x1 = sx + D + fs * 3.5, y1 = Math.max(0, Y(0)) + fs * 5.5;
  return { markup: s, box: { x0, y0, w: x1 - x0, h: y1 - y0 } };
}

function svgWrap(inner, b) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(b.x0)} ${f(b.y0)} ${f(b.w)} ${f(b.h)}" width="${f(b.w)}" height="${f(b.h)}">${DEFS}<rect x="${f(b.x0)}" y="${f(b.y0)}" width="${f(b.w)}" height="${f(b.h)}" fill="#ffffff"/>${inner}</svg>`;
}

// ---------------------------------------------------------------- PDF
export async function exportMarcenaria(items, { getViewer, onProgress } = {}) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = 297, PH = 210;
  const cabs = items.filter((it) => CAB_KINDS.includes(it.kind));
  const order = ['bancada', 'armarioBaixo', 'torreLL', 'suspenso', 'nicho'];
  cabs.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.y - b.y || a.x - b.x);
  const clean = (n) => n.replace(/\s*\(cópia\)/g, '');
  const specs = cabs.map((it, i) => { const sp = cabinetSpec(it, items); return { ...sp, nome: clean(sp.nome), num: i + 1 }; });
  const frame = () => { doc.setDrawColor(...ACC); doc.setLineWidth(0.4); doc.rect(4, 4, PW - 8, PH - 8); };
  const header = (t, sub) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...INK); doc.text(t, 10, 12);
    if (sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED); doc.text(sub, 10, 17); }
    doc.setFontSize(7); doc.setTextColor(...MUTED); doc.text(`Projeto de marcenaria · Cozinha & Copa · ${new Date().toLocaleDateString('pt-BR')}`, PW - 10, 12, { align: 'right' });
  };

  // ---------- 1. capa: planta com armários numerados + quadro-resumo
  header('Projeto dos armários — marcenaria', 'Planta com os armários numerados · medidas em cm · conferir no local antes de produzir');
  const num = new Map(specs.map((s) => [s.id, s.num]));
  const EX = { x0: -40, y0: -20, x1: 520, y1: 700 };
  const plan = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${EX.x0} ${EX.y0} ${EX.x1 - EX.x0} ${EX.y1 - EX.y0}" width="${EX.x1 - EX.x0}" height="${EX.y1 - EX.y0}">${DEFS}<rect x="${EX.x0}" y="${EX.y0}" width="${EX.x1 - EX.x0}" height="${EX.y1 - EX.y0}" fill="#fff"/>${roomMarkup({ grid: false })}${sortedForDraw(items).map((it) => itemMarkup(it, { number: num.get(it.id) ?? null })).join('')}</svg>`;
  const ph = 180, pw = ph * (EX.x1 - EX.x0) / (EX.y1 - EX.y0);
  await placeSVG(doc, plan, 8, 22, pw, ph);
  let x = 8 + pw + 6, y = 26;
  const lw = PW - x - 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.text('Quadro de armários', x, y); y += 5;
  const cols = [0, 7, 66, 96, 112];
  doc.setFontSize(6.6); doc.setTextColor(...MUTED);
  ['Nº', 'Armário · parede', 'L × A × P', 'h instal.', 'Frentes'].forEach((t, i) => doc.text(t, x + cols[i], y));
  y += 1.5; doc.setDrawColor(...MUTED); doc.setLineWidth(0.2); doc.line(x, y, x + lw, y); y += 3.4;
  for (const s of specs) {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK); doc.text(String(s.num), x + cols[0], y);
    doc.setFont('helvetica', 'normal'); doc.text(doc.splitTextToSize(s.nome, 57)[0], x + cols[1], y);
    doc.text(`${n1(s.L)} × ${n1(s.A)} × ${n1(s.P)}`, x + cols[2], y);
    doc.text(s.elev ? n1(s.elev) : 'piso', x + cols[3], y);
    doc.text([s.portas && `${s.portas}P`, s.gavetas && `${s.gavetas}G`, s.nichos && `${s.nichos}N`].filter(Boolean).join(' ') || '—', x + cols[4], y);
    doc.setTextColor(...MUTED); doc.setFontSize(5.8); doc.text(doc.splitTextToSize(`${s.parede}${s.posicao ? ' · ' + s.posicao : ''}`, 88)[0], x + cols[1], y + 2.6); doc.setFontSize(6.6);
    y += 6.4;
  }
  y += 2; doc.line(x, y, x + lw, y); y += 4.5;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...INK); doc.text('Especificações gerais', x, y); y += 4;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(...MUTED);
  const gerais = [
    'Caixas e frentes em MDF 18 mm (ou madeira maciça) com acabamento amadeirado rústico — madeira serrada clara com nós aparentes (ver foto de referência).',
    'Puxadores tipo flor/roseta em ferro preto envelhecido (1 por frente; posição indicada nas vistas).',
    'Dobradiças com amortecimento; corrediças telescópicas para gavetas; gavetas finas para talheres/temperos.',
    'Rodapé recuado (5 cm) em MDF escuro. Fundo dos nichos em madeira escura.',
    'Tampos das bancadas em granilite avermelhado 3 cm — fornecidos pelo marmorista (ver folha de tampos).',
    'P = porta · G = gaveta · N = nicho aberto. Vistas frontais desenhadas como vistas de quem está de frente para o armário.',
  ];
  for (const t of gerais) { const l = doc.splitTextToSize('• ' + t, lw); doc.text(l, x, y); y += l.length * 2.9 + 0.6; }
  try {
    const ref = await fetch('assets/ref/armario_referencia.jpg').then((r) => (r.ok ? r.blob() : null)).catch(() => null) || await fetch('assets/tex/madeira_armario_v.jpg').then((r) => r.blob());
    const url = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(ref); });
    const ih = Math.min(PH - 10 - y - 2, 34);
    if (ih > 15) { doc.addImage(url, 'JPEG', x, y + 1, ih * 16 / 9, ih); doc.setFontSize(6); doc.text('Referência de acabamento', x, y + ih + 3.5); }
  } catch { /* sem imagem de referência */ }
  frame();

  // ---------- 2. uma folha por armário
  for (const s of specs) {
    onProgress?.(`Armário ${s.num}`);
    doc.addPage('a4', 'landscape');
    header(`${s.num} — ${s.nome}`, `${s.parede}${s.posicao ? ' · ' + s.posicao : ''} · ${s.elev ? `instalado a ${n1(s.elev)} cm do piso` : 'apoiado no piso'}`);
    const areaW = 190, areaH = 165;
    let scale = 10, drawing;
    for (const sc of [10, 15, 20, 25, 30]) { scale = sc; drawing = elevationSVG(s, sc); if (drawing.box.w * 10 / sc <= areaW && drawing.box.h * 10 / sc <= areaH) break; }
    const mmW = drawing.box.w * 10 / scale, mmH = drawing.box.h * 10 / scale;
    await placeSVG(doc, svgWrap(drawing.markup, drawing.box), 10, 24, mmW, mmH);
    doc.setFontSize(7); doc.setTextColor(...MUTED); doc.text(`Vista frontal e corte lateral · escala 1:${scale} (A4)`, 10, PH - 9);
    // tabela de especificação
    let tx = 205, ty = 26; const tw = PW - tx - 8;
    const line = (k, v) => { doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK); doc.text(k, tx, ty); doc.setFont('helvetica', 'normal'); const l = doc.splitTextToSize(String(v), tw - 30); doc.text(l, tx + 30, ty); ty += l.length * 3.3 + 0.8; };
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK); doc.text('Especificação', tx, ty); ty += 5; doc.setFontSize(7.2);
    line('Medida externa', `${n1(s.L)} (L) × ${n1(s.A)} (A) × ${n1(s.P)} (P) cm`);
    line('Instalação', s.elev ? `suspenso, base a ${n1(s.elev)} cm do piso` : 'piso');
    if (s.estrutura.rodape) line('Rodapé', `${s.estrutura.rodape} cm, recuado ${s.estrutura.recuoRodape} cm`);
    if (s.estrutura.tampo) line('Tampo', s.estrutura.tampo);
    if (s.estrutura.fixacao) line('Fixação', s.estrutura.fixacao);
    line('Frentes', `${s.portas} porta(s) · ${s.gavetas} gaveta(s) · ${s.nichos} nicho(s)`);
    line('Puxadores', `${s.puxadores} un. (flor, ferro preto)`);
    ty += 2; doc.setDrawColor(...MUTED); doc.line(tx, ty, tx + tw, ty); ty += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('Frentes (L × A, cm)', tx, ty); ty += 4; doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    for (const p of s.panels.filter((p) => p.ref)) {
      const w = Math.abs(p.x1 - p.x0) - 0.6, h = p.y1 - p.y0 - 0.6;
      doc.setTextColor(...INK); doc.text(`${p.ref}`, tx, ty); doc.setTextColor(...MUTED);
      doc.text(`${p.tipo === 'nicho' ? 'vão aberto' : p.tipo} · ${n1(w)} × ${n1(h)}${p.tipo === 'nicho' ? (p.prateleiras ? ' · 1 prateleira' : '') : ''}`, tx + 8, ty); ty += 3.4;
      if (ty > PH - 40) { doc.text('…', tx, ty); break; }
    }
    if (s.notas.length) {
      ty += 2; doc.setDrawColor(...MUTED); doc.line(tx, ty, tx + tw, ty); ty += 4;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...INK); doc.text('Observações', tx, ty); ty += 4; doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(...MUTED);
      for (const t of s.notas) { const l = doc.splitTextToSize('• ' + t, tw); doc.text(l, tx, ty); ty += l.length * 2.9 + 0.6; }
    }
    frame();
  }

  // ---------- 3. lista de corte das frentes
  doc.addPage('a4', 'landscape');
  header('Lista de frentes (portas, gavetas) e caixas', 'Medidas das frentes já descontadas as folgas de 3 mm de cada lado · conferir no local');
  const agg = new Map();
  for (const s of specs) for (const p of s.panels) {
    if (!['porta', 'gaveta'].includes(p.tipo)) continue;
    const w = Math.round((Math.abs(p.x1 - p.x0) - 0.6) * 2) / 2, h = Math.round((p.y1 - p.y0 - 0.6) * 2) / 2, k = `${p.tipo}|${w}|${h}`;
    const e = agg.get(k) || { tipo: p.tipo, w, h, q: 0, onde: new Set() }; e.q++; e.onde.add(s.num); agg.set(k, e);
  }
  let ly = 28; const lx = 12;
  doc.setFontSize(7.5); doc.setTextColor(...MUTED);
  ['Tipo', 'Largura', 'Altura', 'Qtd.', 'Armários (Nº)'].forEach((t, i) => doc.text(t, lx + [0, 30, 55, 80, 95][i], ly));
  ly += 1.5; doc.line(lx, ly, 150, ly); ly += 4; doc.setTextColor(...INK);
  let totP = 0, totG = 0;
  for (const e of [...agg.values()].sort((a, b) => a.tipo.localeCompare(b.tipo) || b.h - a.h || b.w - a.w)) {
    doc.text(e.tipo, lx, ly); doc.text(n1(e.w), lx + 30, ly); doc.text(n1(e.h), lx + 55, ly); doc.text(String(e.q), lx + 80, ly); doc.text([...e.onde].join(', '), lx + 95, ly);
    if (e.tipo === 'porta') totP += e.q; else totG += e.q; ly += 4.2;
  }
  ly += 2; doc.line(lx, ly, 150, ly); ly += 4.5;
  doc.setFont('helvetica', 'bold'); doc.text(`Total: ${totP} portas · ${totG} gavetas · ${specs.reduce((a, s) => a + s.puxadores, 0)} puxadores · ${specs.reduce((a, s) => a + s.nichos, 0)} vãos de nicho`, lx, ly);
  doc.setFont('helvetica', 'normal');
  // caixas
  let cy = 28; const cx0 = 165;
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('Caixas (medida externa)', cx0, cy - 4); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED);
  ['Nº', 'Armário', 'L × A × P'].forEach((t, i) => doc.text(t, cx0 + [0, 8, 82][i], cy)); cy += 1.5; doc.line(cx0, cy, PW - 12, cy); cy += 4; doc.setTextColor(...INK);
  for (const s of specs) { doc.text(String(s.num), cx0, cy); doc.text(doc.splitTextToSize(s.nome, 72)[0], cx0 + 8, cy); doc.text(`${n1(s.L)} × ${n1(s.A)} × ${n1(s.P)}`, cx0 + 82, cy); cy += 4.2; }
  frame();

  // ---------- 4. tampos de granilite (marmorista)
  const bancadas = cabs.filter((c) => c.kind === 'bancada');
  if (bancadas.length) {
    doc.addPage('a4', 'landscape');
    header('Tampos em granilite avermelhado (marmorista)', 'Espessura 3 cm · beiral frontal 2 cm · rodabanca 10 cm nas laterais encostadas na parede · medidas em cm');
    let ty = 28; doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    ['Nº', 'Bancada', 'Tampo L × P × esp.', 'Recortes / rebaixo', 'Rodabanca'].forEach((t, i) => doc.text(t, 12 + [0, 8, 80, 125, 215][i], ty)); ty += 1.5; doc.line(12, ty, PW - 12, ty); ty += 4.5; doc.setTextColor(...INK);
    for (const it of bancadas) {
      const t = topSpec(it, items, wallSides(it));
      const rec = t.recortes.map((r) => `cuba: recorte ${n1(r.w)} × ${n1(r.d)} a ${n1(r.x)} da borda esq. (vista de cima)${r.rebaixo?.prof ? `; rebaixo ${n1(r.rebaixo.prof)} cm em volta (esq ${r.rebaixo.esq}, dir ${r.rebaixo.dir}, frente ${r.rebaixo.frente}, fundo ${r.rebaixo.fundo})` : ''}`).join(' · ') || '—';
      const lines = doc.splitTextToSize(rec, 86);
      doc.text(String(num.get(it.id)), 12, ty); doc.text(doc.splitTextToSize(clean(it.nome), 70)[0], 20, ty); doc.text(`${n1(t.L)} × ${n1(t.P)} × ${t.esp}`, 92, ty); doc.text(lines, 137, ty);
      doc.text(t.rodabanca.length ? t.rodabanca.join(' + ') : 'sem rodabanca', 227, ty);
      ty += Math.max(1, lines.length) * 3.6 + 2.5;
    }
    frame();
  }

  // ---------- 5. vistas 3D de referência
  if (getViewer) {
    const viewer = await getViewer();
    const cam = viewer.camera.position.clone(), tgt = viewer.controls.target.clone();
    for (const key of ['cozinha', 'lenha']) {
      viewer.setView(key, true); await new Promise((r) => setTimeout(r, 60));
      const url = viewer.snapshot(2400, 1440, 'image/jpeg', 0.9);
      doc.addPage('a4', 'landscape'); header(`Vista 3D de referência — ${key === 'cozinha' ? 'cozinha' : 'lateral'}`, 'Imagem ilustrativa; prevalecem as medidas das folhas técnicas');
      doc.addImage(url, 'JPEG', 10, 22, 277, 166.2); frame();
    }
    viewer.camera.position.copy(cam); viewer.controls.target.copy(tgt);
  }
  doc.save(`projeto-armarios-marcenaria_${stamp()}.pdf`);
}

export { KINDS };
