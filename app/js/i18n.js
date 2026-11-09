// Internacionalização (pt-BR ↔ en). O português é a chave: t('texto em português', {vars}) devolve o texto
// no idioma atual. Textos com variáveis usam {nome}. Nomes dos móveis ficam salvos em português no layout
// e são traduzidos só na exibição (tn). O projeto dos armários (PDF do marceneiro) fica sempre em português.

const LS = 'cozinha-lang';
const LANGS = { pt: 'Português', en: 'English' };

const EN = {
  // ---- cabeçalho / abas / menus
  'Cozinha & Copa — Área Coberta': 'Kitchen & Dining Area — Covered Area',
  'Cozinha & Copa': 'Kitchen & Dining Area',
  'Área Coberta · 4,60 × 6,40 m · rústico com madeira de demolição': 'Covered Area · 4.60 × 6.40 m · rustic, reclaimed wood',
  'Planta baixa': 'Floor plan',
  'Desfazer (⌘Z)': 'Undo (⌘Z)', 'Refazer (⇧⌘Z)': 'Redo (⇧⌘Z)',
  '🪚 Projeto dos armários': '🪚 Cabinet plans',
  'Gerar o projeto dos armários em PDF para o marceneiro': 'Generate the cabinet-making PDF for the carpenter (in Portuguese)',
  'Salvar ▾': 'Save ▾', 'Salvar agora (neste navegador)': 'Save now (in this browser)', 'Salvar como versão…': 'Save as version…',
  'Baixar layout (.json)': 'Download layout (.json)', 'Abrir layout (.json)…': 'Open layout (.json)…',
  'Restaurar proposta original': 'Restore default layout',
  'Exportar ▾': 'Export ▾', 'PDF — planta 1:50': 'PDF — floor plan 1:50', 'PDF — planta + 6 vistas 3D': 'PDF — plan + 6 3D views',
  'PDF — projeto dos armários (marceneiro)': 'PDF — cabinet plans (carpenter, in Portuguese)',
  'PNG — vista 3D atual': 'PNG — current 3D view', 'PNG — todas as vistas 3D': 'PNG — all 3D views', 'PNG — planta': 'PNG — floor plan',
  'Idioma': 'Language',
  // ---- palco
  'Aproximar': 'Zoom in', 'Afastar': 'Zoom out', 'Enquadrar': 'Fit to screen',
  'Preparando materiais…': 'Preparing materials…',
  'Medir distâncias (M)': 'Measure distances (M)', '📏 Medir': '📏 Measure', '📏 Medindo…': '📏 Measuring…',
  'Apagar todas as medidas desta vista': 'Delete all measurements in this view', '✕ Limpar medidas': '✕ Clear measurements',
  '✕ Limpar medidas ({n})': '✕ Clear measurements ({n})',
  'Tela cheia (F)': 'Fullscreen (F)', 'Sair da tela cheia (F ou Esc)': 'Exit fullscreen (F or Esc)',
  'Recolher painel lateral (\\)': 'Collapse side panel (\\)', 'Mostrar painel lateral (\\)': 'Show side panel (\\)',
  // ---- painel lateral
  'Vistas': 'Views', 'Telhado': 'Roof', 'Fachada de vidro': 'Glass facade', 'Entorno': 'Surroundings',
  '🚶 Caminhar': '🚶 Walk', '📷 Salvar PNG': '📷 Save PNG', 'Planta': 'Floor plan',
  'Grade do piso (80 cm)': 'Floor grid (80 cm)', 'Ímã (paredes e móveis)': 'Snap (walls and furniture)',
  'Mostrar armários suspensos (tracejado)': 'Show wall cabinets (dashed)', '+ Adicionar item…': '+ Add item…',
  'Item selecionado': 'Selected item', 'Clique num móvel na planta (ou no 3D) para editar.': 'Click a piece of furniture in the plan (or in 3D) to edit it.',
  'Nome': 'Name', 'Giro (°)': 'Rotation (°)', 'Altura instal.': 'Install height', 'Largura L': 'Width W', 'Profund. P': 'Depth D', 'Altura A': 'Height H',
  'Duplicar': 'Duplicate', 'Excluir': 'Delete', 'Itens': 'Items', 'Cozinha': 'Kitchen', 'Copa': 'Dining area',
  'Cancelar': 'Cancel', 'Gerando…': 'Generating…',
  // ---- status / avisos
  '{n} item(ns) com conflito': '{n} item(s) with conflicts', 'Layout sem conflitos': 'Layout with no conflicts',
  'Nenhuma sobreposição; passagem da porta livre. Salvo automaticamente.': 'No overlaps; door passage clear. Saved automatically.',
  'sobrepõe "{nome}"': 'overlaps "{nome}"', 'fora dos limites do ambiente': 'outside the room limits', 'bloqueia a passagem da porta': 'blocks the door passage',
  '"{nome}" adicionado no centro — arraste para posicionar.': '"{nome}" added at the center — drag it into place.',
  'Layout salvo neste navegador.': 'Layout saved in this browser.',
  'Apagar versão': 'Delete version', 'Apagar a versão "{n}"?': 'Delete version "{n}"?', 'Apagar': 'Delete',
  'Versão "{n}" apagada.': 'Version "{n}" deleted.', 'Versão "{n}" carregada.': 'Version "{n}" loaded.',
  'Nome da versão:': 'Version name:', 'Versão {d}': 'Version {d}', 'Salvar': 'Save', 'Versão "{n}" salva.': 'Version "{n}" saved.',
  'Descartar o layout atual e voltar à proposta original?': 'Discard the current layout and go back to the default layout?',
  'Restaurar': 'Restore', 'Proposta original restaurada.': 'Default layout restored.', 'Desfazer': 'Undo',
  'Gerando PDF da planta…': 'Generating floor plan PDF…', 'Gerando PDF com vistas 3D…': 'Generating PDF with 3D views…',
  'Gerando o projeto dos armários…': 'Generating the cabinet plans…', 'Gerando imagens…': 'Generating images…', 'Gerando imagem da planta…': 'Generating floor plan image…',
  'Exportação concluída.': 'Export finished.', 'Falha na exportação: ': 'Export failed: ',
  'Layout "{f}" carregado.': 'Layout "{f}" loaded.', 'Arquivo inválido — esperado um layout .json exportado por este app.': 'Invalid file — expected a .json layout exported by this app.',
  'Imagem PNG salva (2400×1500).': 'PNG image saved (2400×1500).', '"{nome}" excluído.': '"{nome}" deleted.',
  // ---- origem / tipos / nomes
  'novo': 'new', 'existe': 'existing', 'novo + lava-louças existente': 'new + existing dishwasher', 'existe (reposicionado)': 'existing (relocated)',
  '(cópia)': '(copy)',
  'Bancada c/ armários': 'Counter with cabinets', 'Cuba / pia': 'Basin / sink', 'Fogão a gás 6 bocas': '6-burner gas stove', 'Fogão a lenha': 'Wood-burning stove',
  'Geladeira': 'Fridge', 'Freezer vertical': 'Upright freezer', 'Filtro de pedra': 'Stone water filter', 'Torre lava-louças': 'Dishwasher tower',
  'Armário suspenso': 'Wall cabinet', 'Cristaleira suspensa': 'Wall display cabinet', 'Prateleira': 'Shelf', 'Coifa': 'Range hood',
  'Mesa 8 lugares': '8-seat table', 'Buffet': 'Sideboard', 'Cadeira de balanço': 'Rocking chair', 'Parede de pratos': 'Plate wall',
  'Nichos sobre a bancada': 'Niches above the counter', 'Armário baixo (madeira)': 'Low cabinet (wood)', 'Interfone': 'Intercom', 'Tomada dupla': 'Double outlet',
  'Ganchos': 'Hooks', 'Acessórios': 'Accessories', 'Escorredor de louça e talheres': 'Dish and cutlery drainer', 'Eletroportátil': 'Small appliance',
  'Torre lava-louças (alta)': 'Dishwasher tower (tall)', 'Bancada da pia (granilite)': 'Sink counter (granilite)', 'Pia grande (cuba 80×45)': 'Large sink (80×45 basin)',
  'Fogão 6 bocas': '6-burner gas stove', 'Fogão a lenha (forno elevado + 1 trempe)': 'Wood-burning stove (raised oven + 1 burner ring)',
  'Geladeira ': 'Fridge', 'Filtro de pedra ': 'Stone water filter',
  'Armário sobre geladeira/freezer': 'Cabinet above fridge/freezer', 'Armário em L – fundo (até a janela)': 'L-shaped cabinet – back (up to the window)',
  'Armário em L – lateral': 'L-shaped cabinet – side', 'Buffet de madeira': 'Wooden sideboard', 'Parede de pratos decorativos': 'Decorative plate wall',
  'Bancada em L (canto)': 'L-shaped counter (corner)',
  'Nichos de temperos – lateral (até a parede do fundo)': 'Spice niches – side (up to the back wall)',
  'Vídeo-porteiro (interfone com tela)': 'Video intercom (with screen)', 'Ganchos – panos de prato e toalha': 'Hooks – dish towels and hand towel',
  'Barra de utensílios (sob o armário com nicho)': 'Utensil rail (under the cabinet with niche)', 'Tábua, utensílios, potes e fruteira': 'Cutting board, utensils, jars and fruit bowl',
  'Vasos de ervas no peitoril': 'Herb pots on the windowsill', 'Centro de mesa (fruteira e flores)': 'Centerpiece (fruit bowl and flowers)',
  'Armário baixo ao lado do buffet': 'Low cabinet next to the sideboard', 'Escorredor de louça e talheres (42×32×16,5)': 'Dish and cutlery drainer (42×32×16.5)',
  'Ganchos – panos e toalhas (sob o armário)': 'Hooks – towels (under the cabinet)',
  'Tomada – sobre o fogão a gás (acendimento)': 'Outlet – above the gas stove (igniter)', 'Tomada – bancada lateral': 'Outlet – side counter',
  'Tomada – parede da pia, junto à janela': 'Outlet – sink wall, next to the window', 'Tomada – meia-parede, sobre o fogão a lenha': 'Outlet – half-wall, above the wood stove',
  'Tomada – meia-parede, sobre a bancada': 'Outlet – half-wall, above the counter', 'Liquidificador': 'Blender', 'Sanduicheira': 'Sandwich maker',
  'Prateleira de demolição': 'Reclaimed-wood shelf', 'Cuba': 'Basin', 'Pratos decorativos': 'Decorative plates',
  'Ganchos – panos de prato': 'Hooks – dish towels', 'Barra de utensílios': 'Utensil rail', 'Acessórios de bancada': 'Counter accessories', 'Vasos de ervas': 'Herb pots',
  'Centro de mesa': 'Centerpiece', 'Vídeo-porteiro': 'Video intercom', 'Tomada dupla (4×2)': 'Double outlet (4×2)', 'Escorredor de louça e talheres (grande)': 'Dish and cutlery drainer (large)',
  // ---- rótulos curtos na planta
  'Bancada': 'Counter', 'Pia': 'Sink', 'Fogão 6b': 'Stove 6b', 'Freezer': 'Freezer', 'Filtro': 'Filter', 'Torre LL': 'DW tower', 'Arm. susp.': 'Wall cab.',
  'Cristaleira': 'Display', 'Mesa 8 lug.': 'Table 8', 'Balanço': 'Rocker', 'Pratos': 'Plates', 'Nichos': 'Niches', 'Armário': 'Cabinet', 'Escorredor': 'Drainer',
  'Tomada': 'Outlet', 'Eletro': 'Appliance',
  // ---- desenho da planta
  'muro de divisa': 'boundary wall', 'QUINTAL': 'BACKYARD', 'SUÍTE 2': 'SUITE 2', 'CASA (antiga cozinha / sala)': 'HOUSE (former kitchen / living room)',
  'COPA (frente)': 'DINING AREA (front)', 'COZINHA (fundo)': 'KITCHEN (back)', 'projeção do beiral': 'eave projection',
  'janela existente {w}×{h} / peitoril {s}': 'existing window {w}×{h} / sill {s}', 'azulejos antigos {p}×{p} (h {a}–{b})': 'vintage tiles {p}×{p} (h {a}–{b})',
  'P 80×210': 'D 80×210', 'meia-parede h=110 + janelão': 'half-wall h=110 + large window', 'persiana de vidro': 'glass wall',
  'persiana de vidro retrátil (triângulo superior em madeira)': 'retractable glass wall (upper triangle in wood)',
  '{n} (área coberta {w} + parede)': '{n} (covered area {w} + wall)', '{n} vão interno': '{n} inner span',
  // ---- vistas 3D
  'Do quintal (frente)': 'From the backyard (front)', 'Do fundo (porta da casa)': 'From the back (house door)',
  'Isométrica (sem telhado)': 'Isometric (no roof)', 'Superior (sem telhado)': 'Top (no roof)',
  // ---- PDF da planta
  'Planta baixa — layout proposto · escala 1:50 (A4) · medidas em cm · {d}': 'Floor plan — proposed layout · scale 1:50 (A4) · dimensions in cm · {d}',
  'Quadro de móveis e equipamentos': 'Furniture and equipment schedule', 'Item': 'Item', 'L × P × A': 'W × D × H', 'Origem': 'Source',
  'Envoltória': 'Building envelope',
  'Área coberta {W} × {D} cm; vão interno {IR} cm; pé-direito {H} cm; telhado 1 água (h {a} a {b}).': 'Covered area {W} × {D} cm; inner span {IR} cm; ceiling height {H} cm; single-pitch roof (h {a} to {b}).',
  'Frente: persiana de vidro retrátil; triângulo entre viga e telhado fechado em madeira.': 'Front: retractable glass wall; triangle between beam and roof closed in wood.',
  'Acabamentos: madeira de demolição (armários, vigas, molduras), bancada em granilite avermelhado.': 'Finishes: reclaimed wood (cabinets, beams, frames), reddish granilite counter.',
  'Linhas tracejadas = elementos suspensos (h = altura de instalação). Traço grosso = frente do móvel.': 'Dashed lines = wall-mounted elements (h = installation height). Thick line = front of the piece.',
  'Escala gráfica (1:50)': 'Graphic scale (1:50)', 'Atenção: {n} item(ns) com conflito (em vermelho).': 'Warning: {n} item(s) with conflicts (in red).',
  'Vista 3D — {v}': '3D view — {v}', 'Renderização ilustrativa — proporções conforme planta; materiais e cores indicativos.': 'Illustrative rendering — proportions follow the plan; materials and colors are indicative.',
  'Nº': 'No.', '0,5': '0.5', '1,5': '1.5', 'persiana': 'glass wall', 'parede completa': 'full wall', 'meia-parede h={h} + janelão': 'half-wall h={h} + large window',
  'Direita (da frente ao fundo): {segs}; vão livre de {v} entre os pilares da frente.': 'Right (front to back): {segs}; clear span of {v} between the front pillars.',
  'Esquerda: parede existente da Suíte 2. Fundo: porta 80×210 e janela {w}×{h} (peitoril {s}) existentes.': 'Left: existing Suite 2 wall. Back: existing 80×210 door and {w}×{h} window (sill {s}).',
  'Itens "novo" foram dimensionados pelo projeto; * = medidas estimadas pela foto.': 'Items marked "new" were sized by the project; * = dimensions estimated from the photo.',
  'Planta exportada': 'Floor plan exported', 'Vista {v}': 'View {v}',
};

// Blocos com HTML (dicas com <kbd>): o português é o próprio innerHTML do index.html, guardado na 1ª execução.
const EN_HTML = {
  hintPlan: 'Drag to move · orange handle rotates · <kbd>R</kbd> 90° · <kbd>Q</kbd>/<kbd>E</kbd> 15° · arrows nudge 1 cm (⇧ 10) · <kbd>Alt</kbd> no snap',
  hintMeasure: '<b>Measure:</b> click and drag between two points · snaps to corners and edges (<kbd>Alt</kbd> turns it off) · <kbd>⇧</kbd> locks the axis · <kbd>⌫</kbd> deletes the last one · <kbd>Esc</kbd> exits',
  hintNav: 'Keyboard: <kbd>↑</kbd><kbd>↓</kbd> move · <kbd>←</kbd><kbd>→</kbd> turn · <kbd>W</kbd>/<kbd>S</kbd> up/down · <kbd>A</kbd>/<kbd>D</kbd> sideways · <kbd>Z</kbd> zoom in · <kbd>⇧Z</kbd> zoom out · <kbd>⇧</kbd> faster',
  hintWalk: 'Walk mode: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows · drag to look around · <kbd>⇧</kbd> runs · <kbd>Esc</kbd> exits',
};

let lang = 'pt';
try {
  const q = new URLSearchParams(location.search).get('lang');
  const saved = localStorage.getItem(LS);
  lang = [q, saved].find((v) => v in LANGS) || ((navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en');
} catch { /* */ }

const listeners = [];
export const getLang = () => lang;
export const langs = LANGS;
export const locale = () => (lang === 'en' ? 'en-US' : 'pt-BR');
/** Decimal com vírgula (pt) ou ponto (en). */
export const dec = (v) => (lang === 'en' ? String(v) : String(v).replace('.', ','));

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s);
/** Traduz um texto em português (com variáveis {x} opcionais). */
export function t(pt, vars) {
  return fill(lang === 'en' ? EN[pt] ?? pt : pt, vars);
}
/** Traduz o nome de um móvel (guardado em português), cuidando dos sufixos "(cópia)". */
export function tn(nome) {
  if (lang === 'pt' || !nome) return nome || '';
  const m = nome.match(/^(.*?)((?: \(cópia\))*)$/);
  const base = m[1], copies = m[2];
  return (EN[base] ?? base) + copies.replace(/\(cópia\)/g, '(copy)');
}

// ---- DOM estático (index.html): textos, title, placeholder e blocos HTML
const orig = new WeakMap();
const SKIP = new Set(['SCRIPT', 'STYLE', 'SVG', 'TEXTAREA']);
export function applyStatic(root = document.body) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = []; for (let n = w.nextNode(); n; n = w.nextNode()) nodes.push(n);
  for (const n of nodes) {
    const p = n.parentElement; if (!p || SKIP.has(p.tagName.toUpperCase()) || p.closest('[data-i18n-html],[data-noi18n]')) continue;
    if (!orig.has(n)) { if (!n.data.trim()) continue; orig.set(n, n.data); }
    const o = orig.get(n), key = o.trim(), lead = o.match(/^\s*/)[0], trail = o.match(/\s*$/)[0];
    n.data = lead + t(key) + trail;
  }
  root.querySelectorAll('[title],[placeholder],[aria-label]').forEach((el) => {
    for (const a of ['title', 'placeholder', 'aria-label']) {
      if (!el.hasAttribute(a)) continue;
      const k = `i18n_${a.replace("-", "_")}`; el.dataset[k] ??= el.getAttribute(a);
      el.setAttribute(a, a === 'aria-label' && el.id === 'langSel' ? t('Idioma') + ' / Language' : t(el.dataset[k]));
    }
  });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.dataset.pt ??= el.innerHTML;
    el.innerHTML = lang === 'en' ? EN_HTML[el.dataset.i18nHtml] ?? el.dataset.pt : el.dataset.pt;
  });
  document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
  document.title = t('Cozinha & Copa — Área Coberta');
}

export function setLang(l) {
  if (!(l in LANGS) || l === lang) return;
  lang = l;
  try { localStorage.setItem(LS, l); } catch { /* */ }
  applyStatic();
  listeners.forEach((fn) => fn(l));
}
/** Registra um callback chamado quando o idioma muda (para redesenhar o que o JS gera). */
export const onLangChange = (fn) => listeners.push(fn);
