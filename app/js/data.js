// Geometria do ambiente e layout proposto. Unidades: centímetros.
// Planta vista com a FRENTE (quintal / persiana de vidro) em cima.
//   x: 0 = face da parede da Suíte 2 (esquerda) → 460 = borda do piso (direita)
//   y: 0 = borda da frente (persiana) → 640 = face da parede da casa (fundo)
//   z: altura a partir do piso
// rot (graus, horário na planta): 0 = frente do móvel virada para a persiana (−y)
//   90 = virada para +x (móvel encostado na parede esquerda)
//   180 = virada para o fundo; 270 = virada para −x (encostado na parede direita)

export const ROOM = {
  W: 460, D: 640,
  innerRight: 428,      // face interna do lado direito = face interna dos pilares (4,28 m medidos com trena na frente)
  frontInner: 8,        // face interna do trilho da persiana frontal
  wallH: 300,           // pé-direito das paredes (Corte A-A)
  beamBottom: 280,      // base da viga de madeira sobre o vidro / janelão
  roofHigh: 433,        // altura sob o telhado junto à parede da suíte (cumeeira)
  roofLow: 300,         // altura sob o telhado na borda direita
  overhangFront: 70, overhangRight: 80,
  suiteWallT: 20, backWallT: 20,
  // porta para a casa (folha 80×210 + batentes); a parede do fundo recomeça em x1 + 5 = 108
  // → 3,20 m de parede até a face interna direita (medido com trena)
  door: { x0: 20, x1: 103, h: 210 },
  window: { x0: 168.5, x1: 305.5, sill: 120, top: 269 },   // janela existente: 1,37 × 1,49 m (medida real), peitoril 1,20 (Corte A-A)
  // azulejos antigos sortidos 15×15 na parede da pia: da bancada até a altura dos armários/janela, contornando a janela
  azulejos: { x0: 173, x1: 428, y0: 90, y1: 269, peca: 15 },   // começa depois da torre (que vai até o topo da janela)
  // trechos do lado direito (limites no eixo dos pilares)
  right: [
    { tipo: 'persiana', y0: 0, y1: 216, nome: 'Persiana de vidro (lateral)' },
    { tipo: 'meia', y0: 216, y1: 437, h: 110, nome: 'Meia-parede + janelão' },
    { tipo: 'parede', y0: 437, y1: 640, nome: 'Parede completa' },
  ],
  // pilares 30×30 (medidos com trena): vãos livres 1,71 · 1,91 · 1,88 m → 30+171+30+191+30+188 = 640
  pillars: [
    { x0: 428, x1: 458, y0: 0, y1: 30 },
    { x0: 428, x1: 458, y0: 201, y1: 231 },
    { x0: 428, x1: 458, y0: 422, y1: 452 },
  ],
  lot: { sideWallX: 600, rearWallY: -470, wallH: 200 },
};

/** Trecho livre de um segmento do lado direito, descontando os pilares nas extremidades. */
export function clearSpan(seg) {
  let y0 = seg.y0, y1 = seg.y1;
  for (const p of ROOM.pillars) {
    if (p.y0 <= y0 + 0.5 && p.y1 > y0) y0 = p.y1;
    if (p.y0 < y1 && p.y1 >= y1 - 0.5) y1 = p.y0;
  }
  return { y0, y1 };
}

/**
 * Posição da chaminé do fogão a lenha (cm, eixo local X do móvel).
 * Se houver um pilar logo atrás do fogão, a chaminé se alinha ao eixo do pilar (sem tampar janelas)
 * e a fornalha é espelhada para ficar embaixo dela.
 */
export function lenhaChimney(it) {
  const half = it.w / 2, lim = half - 16;
  const r = (-it.rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  let best = null;
  for (const p of ROOM.pillars) {
    const dx = (p.x0 + p.x1) / 2 - it.x, dy = (p.y0 + p.y1) / 2 - it.y;
    const lx = dx * c - dy * s, ly = dx * s + dy * c;            // centro do pilar em coordenadas locais
    const behind = ly - it.d / 2;                                   // distância atrás da face traseira
    if (behind > -5 && behind < 45 && Math.abs(lx) < half + 10 && (!best || Math.abs(behind) < best.behind)) best = { lx, behind: Math.abs(behind) };
  }
  if (!best) return { lx: -half + 20, mirrored: false, aligned: false };
  const lx = Math.max(-lim, Math.min(lim, best.lx));
  return { lx, mirrored: lx > 0, aligned: true };
}

export const roofZ = (x) => ROOM.roofHigh - (ROOM.roofHigh - ROOM.roofLow) * x / ROOM.W;

// Categorias → cor na planta e camada
export const KINDS = {
  bancada:        { label: 'Bancada c/ armários', cat: 'bancada' },
  cuba:           { label: 'Cuba / pia', cat: 'pia', onTop: true },
  fogao:          { label: 'Fogão a gás 6 bocas', cat: 'eletro' },
  fogaoLenha:     { label: 'Fogão a lenha', cat: 'lenha' },
  geladeira:      { label: 'Geladeira', cat: 'eletro' },
  freezer:        { label: 'Freezer vertical', cat: 'eletro' },
  filtro:         { label: 'Filtro de pedra', cat: 'antigo' },
  torreLL:        { label: 'Torre lava-louças', cat: 'marcenaria' },
  suspenso:       { label: 'Armário suspenso', cat: 'suspenso' },
  cristaleira:    { label: 'Cristaleira suspensa', cat: 'suspenso' },
  prateleira:     { label: 'Prateleira', cat: 'suspenso' },
  coifa:          { label: 'Coifa', cat: 'suspenso' },
  mesa:           { label: 'Mesa 8 lugares', cat: 'madeira' },
  buffet:         { label: 'Buffet', cat: 'madeira' },
  cadeiraBalanco: { label: 'Cadeira de balanço', cat: 'madeira' },
  pratos:         { label: 'Parede de pratos', cat: 'decor', parede: true, small: true },
  nicho:          { label: 'Nichos sobre a bancada', cat: 'nicho', small: true },
  armarioBaixo:   { label: 'Armário baixo (madeira)', cat: 'marcenaria' },
  interfone:      { label: 'Interfone', cat: 'decor', parede: true, small: true },
  tomada:         { label: 'Tomada dupla', cat: 'decor', parede: true, small: true },
  ganchos:        { label: 'Ganchos', cat: 'decor', parede: true, small: true },
  acessorios:     { label: 'Acessórios', cat: 'decor', onTop: true, small: true },
  escorredor:     { label: 'Escorredor de louça e talheres', cat: 'pia', onTop: true, small: true },
  eletroportatil: { label: 'Eletroportátil', cat: 'eletro', onTop: true, small: true },
};

// "existe" = móvel atual (medidas do usuário); "novo" = proposto pelo projeto
export const DEFAULT_ITEMS = [
  // ---------- COZINHA (fundo) ----------
  { id: 'torre', kind: 'torreLL', nome: 'Torre lava-louças (alta)', origem: 'novo + lava-louças existente',
    x: 140.5, y: 609, rot: 0, w: 65, d: 62, h: 269, elev: 0, llElev: 50 },   // topo alinhado à janela (2,69)
  { id: 'bancadaPia', kind: 'bancada', nome: 'Bancada da pia (granilite)', origem: 'novo',
    x: 230.5, y: 609, rot: 0, w: 115, d: 62, h: 90, elev: 0 },
  { id: 'cuba', kind: 'cuba', nome: 'Pia grande (cuba 80×45)', origem: 'novo',
    x: 220, y: 606, rot: 0, w: 80, d: 45, h: 2, elev: 89,
    rebaixo: { prof: 1.5, esq: 4, dir: 26, frente: 3.5, fundo: 7.5 } },   // área molhada rebaixada 1,5 cm em volta da cuba
  { id: 'fogao', kind: 'fogao', nome: 'Fogão 6 bocas', origem: 'existe',
    x: 326, y: 607, rot: 0, w: 76, d: 66, h: 97, elev: 0 },
  { id: 'bancadaCanto', kind: 'bancada', nome: 'Bancada em L (canto)', origem: 'novo',
    x: 396, y: 585, rot: 270, w: 110, d: 64, h: 90, elev: 0 },
  { id: 'lenha', kind: 'fogaoLenha', nome: 'Fogão a lenha (forno elevado + 1 trempe)', origem: 'novo',
    x: 395.5, y: 475, rot: 270, w: 110, d: 65, h: 85, elev: 0 },
  { id: 'geladeira', kind: 'geladeira', nome: 'Geladeira', origem: 'existe',
    x: 41, y: 499, rot: 90, w: 82, d: 82, h: 190, elev: 0 },
  { id: 'filtro', kind: 'filtro', nome: 'Filtro de pedra', origem: 'existe',
    x: 27, y: 427, rot: 90, w: 54, d: 54, h: 150, elev: 0 },
  { id: 'freezer', kind: 'freezer', nome: 'Freezer vertical', origem: 'novo',
    x: 35, y: 366, rot: 90, w: 60, d: 70, h: 170, elev: 0 },
  { id: 'susGeladeira', kind: 'suspenso', nome: 'Armário sobre geladeira/freezer', origem: 'novo',
    x: 22, y: 438, rot: 90, w: 204, d: 44, h: 60, elev: 205, portas: 4 },
  // armário em L: do canto até a janela; base a 1,70 m (73 cm acima das bocas do fogão a gás), nicho aberto junto à janela
  { id: 'susCanto', kind: 'suspenso', nome: 'Armário em L – fundo (até a janela)', origem: 'novo',
    x: 366.75, y: 622.5, rot: 0, w: 122.5, d: 35, h: 99, elev: 170, nichos: [0] },   // rente à janela, topo = topo da janela (2,69)
  { id: 'susLateral', kind: 'suspenso', nome: 'Armário em L – lateral', origem: 'novo',
    x: 410.5, y: 567.5, rot: 270, w: 75, d: 35, h: 99, elev: 170 },
  // nichos abertos apoiados na bancada, ocupando o espaço até o armário (temperos à mão)
  { id: 'nichoLateral', kind: 'nicho', nome: 'Nichos de temperos – lateral (até a parede do fundo)', origem: 'novo',
    x: 418, y: 585, rot: 270, w: 110, d: 20, h: 40, elev: 130, niveis: 1 },   // só a fileira de cima (bancada livre embaixo)
  { id: 'ganchosPanos', kind: 'ganchos', nome: 'Ganchos – panos de prato e toalha', origem: 'novo', variante: 'panos',
    x: 174.5, y: 609, rot: 90, w: 45, d: 3, h: 30, elev: 112 },
  { id: 'ganchosUtensilios', kind: 'ganchos', nome: 'Barra de utensílios (colheres, concha)', origem: 'novo', variante: 'utensilios',
    x: 326, y: 638.5, rot: 0, w: 66, d: 3, h: 40, elev: 110 },
  { id: 'acessBancada', kind: 'acessorios', nome: 'Tábua, utensílios, potes e fruteira', origem: 'novo', variante: 'bancada',
    x: 386, y: 560, rot: 270, w: 60, d: 30, h: 30, elev: 90 },
  { id: 'escorredor', kind: 'escorredor', nome: 'Escorredor de louça e talheres (42×32×16,5)', origem: 'novo',
    x: 386, y: 612, rot: 270, w: 42, d: 32, h: 16.5, elev: 90 },
  { id: 'ervas', kind: 'acessorios', nome: 'Vasos de ervas no peitoril', origem: 'novo', variante: 'ervas',
    x: 422, y: 330, rot: 270, w: 60, d: 12, h: 25, elev: 115 },
  { id: 'tomada1', kind: 'tomada', nome: 'Tomada – parede direita (bancada do canto)', origem: 'novo',
    x: 427.5, y: 545, rot: 270, w: 7.5, d: 1, h: 11.5, elev: 104 },
  { id: 'tomada2', kind: 'tomada', nome: 'Tomada – parede do fundo (canto)', origem: 'novo',
    x: 390, y: 639.5, rot: 0, w: 7.5, d: 1, h: 11.5, elev: 104 },
  { id: 'interfone', kind: 'interfone', nome: 'Vídeo-porteiro (interfone com tela)', origem: 'existe (reposicionado)',
    x: 1.5, y: 618, rot: 90, w: 20, d: 3, h: 18, elev: 140 },   // perto do canto com a parede da casa

  // ---------- COPA (frente) ----------
  { id: 'mesa', kind: 'mesa', nome: 'Mesa 8 lugares', origem: 'existe',
    x: 242, y: 170, rot: 90, w: 200, d: 88, h: 83, elev: 0, lugares: 8 },
  { id: 'buffet', kind: 'buffet', nome: 'Buffet de madeira', origem: 'existe',
    x: 28, y: 220, rot: 90, w: 175, d: 56, h: 86, elev: 0 },
  { id: 'armarioCopa', kind: 'armarioBaixo', nome: 'Armário baixo ao lado do buffet', origem: 'novo',
    x: 28, y: 72.5, rot: 90, w: 120, d: 56, h: 86, elev: 0 },   // entre a persiana (folga 5 cm) e o buffet, mesma altura
  { id: 'pratos', kind: 'pratos', nome: 'Parede de pratos decorativos', origem: 'novo',
    x: 1.5, y: 220, rot: 90, w: 175, d: 3, h: 115, elev: 150 },   // sobre o buffet, na largura dele; topo alinhado ao armário suspenso (2,65)
  { id: 'centroMesa', kind: 'acessorios', nome: 'Centro de mesa (fruteira e flores)', origem: 'novo', variante: 'mesa',
    x: 242, y: 170, rot: 90, w: 40, d: 25, h: 25, elev: 83 },
];

// Itens que podem ser adicionados pelo usuário
export const CATALOG = [
  { kind: 'bancada', nome: 'Bancada c/ armários', w: 100, d: 62, h: 90, elev: 0 },
  { kind: 'suspenso', nome: 'Armário suspenso', w: 80, d: 35, h: 70, elev: 160 },
  { kind: 'cristaleira', nome: 'Cristaleira suspensa', w: 100, d: 35, h: 75, elev: 155 },
  { kind: 'prateleira', nome: 'Prateleira de demolição', w: 100, d: 25, h: 4, elev: 160 },
  { kind: 'cuba', nome: 'Cuba', w: 60, d: 40, h: 2, elev: 89 },
  { kind: 'pratos', nome: 'Pratos decorativos', w: 80, d: 3, h: 80, elev: 120 },
  { kind: 'nicho', nome: 'Nichos sobre a bancada', w: 60, d: 20, h: 70, elev: 90 },
  { kind: 'armarioBaixo', nome: 'Armário baixo (madeira)', w: 100, d: 56, h: 86, elev: 0 },
  { kind: 'ganchos', nome: 'Ganchos – panos de prato', w: 45, d: 3, h: 30, elev: 112, variante: 'panos' },
  { kind: 'ganchos', nome: 'Barra de utensílios', w: 60, d: 3, h: 40, elev: 110, variante: 'utensilios' },
  { kind: 'acessorios', nome: 'Acessórios de bancada', w: 60, d: 30, h: 30, elev: 90, variante: 'bancada' },
  { kind: 'acessorios', nome: 'Vasos de ervas', w: 60, d: 12, h: 25, elev: 90, variante: 'ervas' },
  { kind: 'acessorios', nome: 'Centro de mesa', w: 40, d: 25, h: 25, elev: 83, variante: 'mesa' },
  { kind: 'interfone', nome: 'Vídeo-porteiro', w: 20, d: 3, h: 18, elev: 140 },
  { kind: 'tomada', nome: 'Tomada dupla (4×2)', w: 7.5, d: 1, h: 11.5, elev: 105 },
  { kind: 'escorredor', nome: 'Escorredor de louça e talheres (grande)', w: 42, d: 32, h: 16.5, elev: 90 },
  { kind: 'eletroportatil', nome: 'Sanduicheira', w: 28, d: 26, h: 11, elev: 90, variante: 'sanduicheira' },
  { kind: 'eletroportatil', nome: 'Liquidificador', w: 20, d: 20, h: 42, elev: 90, variante: 'liquidificador' },
];
