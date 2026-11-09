// Exportação: PDF da planta (escala 1:50, A4 paisagem) + páginas com vistas 3D; PNG das vistas.
import { ROOM, KINDS } from './data.js';
import { DEFS, roomMarkup, itemMarkup, sortedForDraw } from './plan2d.js';
import { conflicts } from './state.js';
import { VIEWS } from './viewer3d.js';

// área da planta exportada (cm) → 1:50 = 0,2 mm/cm
const EXP = { x0: -140, y0: -145, x1: 640, y1: 770 };
const SCALE = 0.2;

export function exportSVGElement(items, { numbered = true } = {}) {
  const w = EXP.x1 - EXP.x0, h = EXP.y1 - EXP.y0;
  const ordered = sortedForDraw(items);
  const num = new Map(items.map((it, i) => [it.id, i + 1]));
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${EXP.x0} ${EXP.y0} ${w} ${h}" width="${w}" height="${h}">${DEFS}
    <rect x="${EXP.x0}" y="${EXP.y0}" width="${w}" height="${h}" fill="#ffffff"/>
    ${roomMarkup({ grid: true })}
    ${ordered.map((it) => itemMarkup(it, { number: numbered ? num.get(it.id) : null })).join('')}
  </svg>`;
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden';
  div.innerHTML = markup;
  document.body.appendChild(div);
  return { el: div.firstElementChild, cleanup: () => div.remove(), w, h };
}

async function svgToPNG(el, w, h, pxPerCm = 3) {
  const s = new XMLSerializer().serializeToString(el);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }));
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c = document.createElement('canvas'); c.width = w * pxPerCm; c.height = h * pxPerCm;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL('image/png');
}

export function download(url, name) {
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
const stamp = () => new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', 'h');

export async function exportPlanPNG(items) {
  const { el, cleanup, w, h } = exportSVGElement(items, { numbered: false });
  try { download(await svgToPNG(el, w, h, 4), `planta-cozinha_${stamp()}.png`); } finally { cleanup(); }
}

/** Gera o PDF. getViewer: () => Viewer detalhado (para as páginas 3D); views: lista de chaves de VIEWS. */
export async function exportPDF(items, { views = [], getViewer, onProgress } = {}) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = 297, PH = 210;
  const ink = [43, 33, 24], muted = [110, 95, 80], accent = [181, 83, 47];

  // ---------- página 1: planta ----------
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...ink);
  doc.text('Cozinha & Copa — Área Coberta', 10, 12);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...muted);
  doc.text(`Planta baixa — layout proposto · escala 1:50 (A4) · medidas em cm · ${new Date().toLocaleDateString('pt-BR')}`, 10, 17);

  const { el, cleanup, w, h } = exportSVGElement(items);
  const px = 8, py = 21, pw = w * SCALE, ph = h * SCALE;
  try {
    if (typeof doc.svg === 'function') await doc.svg(el, { x: px, y: py, width: pw, height: ph });
    else doc.addImage(await svgToPNG(el, w, h, 6), 'PNG', px, py, pw, ph);
  } catch (err) {
    console.warn('svg2pdf falhou, usando imagem', err);
    doc.addImage(await svgToPNG(el, w, h, 6), 'PNG', px, py, pw, ph);
  } finally { cleanup(); }
  onProgress?.('Planta exportada');


  // legenda / quadro de móveis
  let lx = px + pw + 6; const lw = PW - lx - 8; let y = 25;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...ink);
  doc.text('Quadro de móveis e equipamentos', lx, y); y += 5;
  doc.setFontSize(6.8); doc.setTextColor(...muted);
  const cols = [0, 7, 58, 84];
  ['Nº', 'Item', 'L × P × A', 'Origem'].forEach((t, i) => doc.text(t, lx + cols[i], y));
  y += 1.5; doc.setDrawColor(...muted); doc.line(lx, y, lx + lw, y); y += 3.6;
  const cf = conflicts(items);
  doc.setFont('helvetica', 'normal');
  items.forEach((it, i) => {
    doc.setTextColor(...(cf[it.id] ? [200, 30, 25] : ink));
    doc.setFont('helvetica', 'bold'); doc.text(String(i + 1), lx + cols[0], y);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(it.nome, 49)[0], lx + cols[1], y);
    doc.text(`${it.w} × ${it.d} × ${it.h}${it.elev ? `  (h ${it.elev})` : ''}`, lx + cols[2], y);
    doc.setTextColor(...muted); doc.text(doc.splitTextToSize(String(it.origem || '').replace(' (medidas estimadas)', '*'), 30)[0], lx + cols[3], y);
    y += 4.4;
  });
  y += 2; doc.setDrawColor(...muted); doc.line(lx, y, lx + lw, y); y += 4.5;
  doc.setFontSize(7); doc.setTextColor(...ink); doc.setFont('helvetica', 'bold');
  doc.text('Envoltória', lx, y); y += 3.8; doc.setFont('helvetica', 'normal'); doc.setTextColor(...muted);
  const env = [
    `Área coberta ${ROOM.W} × ${ROOM.D} cm; vão interno ${ROOM.innerRight} cm; pé-direito ${ROOM.wallH} cm; telhado 1 água (h ${ROOM.roofHigh} a ${ROOM.roofLow}).`,
    'Frente: persiana de vidro retrátil; triângulo entre viga e telhado fechado em madeira.',
    `Direita (da frente ao fundo): ${ROOM.right.map((g) => `${g.tipo === 'persiana' ? 'persiana' : g.tipo === 'meia' ? `meia-parede h=${g.h} + janelão` : 'parede completa'} ${g.y1 - g.y0}`).join(' · ')}; vão livre de ${ROOM.pillars[1].y0 - ROOM.pillars[0].y1} entre os pilares da frente.`,
    `Esquerda: parede existente da Suíte 2. Fundo: porta 80×210 e janela ${ROOM.window.x1 - ROOM.window.x0}×${ROOM.window.top - ROOM.window.sill} (peitoril ${ROOM.window.sill}) existentes.`,
    'Acabamentos: madeira de demolição (armários, vigas, molduras), bancada em granilite avermelhado.',
    'Linhas tracejadas = elementos suspensos (h = altura de instalação). Traço grosso = frente do móvel.',
    'Itens "novo" foram dimensionados pelo projeto; * = medidas estimadas pela foto.',
  ];
  for (const t of env) { const lines = doc.splitTextToSize('• ' + t, lw); doc.text(lines, lx, y); y += lines.length * 3.2 + 0.6; }
  // escala gráfica
  y += 3; doc.setFontSize(6.5); doc.setTextColor(...ink); doc.text('Escala gráfica (1:50)', lx, y); y += 2.5;
  for (let i = 0; i < 4; i++) { doc.setFillColor(...(i % 2 ? [255, 255, 255] : ink)); doc.setDrawColor(...ink); doc.setLineWidth(0.2); doc.rect(lx + i * 10, y, 10, 1.6, 'FD'); }
  ['0', '0,5', '1', '1,5', '2 m'].forEach((t, i) => doc.text(t, lx + i * 10, y + 4.5, { align: 'center' }));
  y += 8;
  const nConf = Object.keys(cf).length;
  if (nConf) { y += 1; doc.setTextColor(200, 30, 25); doc.text(doc.splitTextToSize(`Atenção: ${nConf} item(ns) com conflito (em vermelho).`, lw), lx, y); }
  doc.setDrawColor(...accent); doc.setLineWidth(0.4); doc.rect(4, 4, PW - 8, PH - 8);

  // ---------- páginas 3D ----------
  if (views.length && getViewer) {
    const viewer = await getViewer();
    const cam = viewer.camera.position.clone(), tgt = viewer.controls.target.clone(), roof = viewer.roomGroups.telhado.visible;
    for (const key of views) {
      viewer.setView(key, true);
      await new Promise((r) => setTimeout(r, 60));
      const url = viewer.snapshot(2400, 1440, 'image/jpeg', 0.9);
      doc.addPage('a4', 'landscape');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...ink);
      doc.text(`Vista 3D — ${VIEWS[key].nome}`, 10, 12);
      doc.addImage(url, url.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG', 10, 17, 277, 166.2);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...muted);
      doc.text('Renderização ilustrativa — proporções conforme planta; materiais e cores indicativos.', 10, 190);
      doc.setDrawColor(...accent); doc.rect(4, 4, PW - 8, PH - 8);
      onProgress?.(`Vista ${VIEWS[key].nome}`);
    }
    viewer.camera.position.copy(cam); viewer.controls.target.copy(tgt); viewer.setRoof(roof); viewer.onRoofChange?.(roof);
  }
  doc.save(`projeto-cozinha_${stamp()}.pdf`);
}

export { stamp, KINDS };
