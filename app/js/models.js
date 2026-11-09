// Construção 3D do ambiente e dos móveis. Unidades three.js = metros.
// Coordenadas: X = x/100, Z = y/100 (planta), Y = altura. Frente dos móveis = −Z local.
import * as THREE from 'three';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import { ROOM, roofZ, clearSpan, lenhaChimney } from './data.js';
import { cabinetSpec } from './marcenaria.js';
import * as T from './textures.js';

const cm = (v) => v / 100;

// ---------------------------------------------------------------- materiais
export function makeMaterials(hi) {
  const M = {};
  const mk = (color, opts = {}) => {
    const { map, texSize = 1, rough = 0.8, metal = 0, transparent, opacity, side, emissive, envInt } = opts;
    let m;
    if (hi) {
      m = new THREE.MeshStandardMaterial({ color, map: map || null, roughness: rough, metalness: metal, side: side ?? THREE.FrontSide });
      if (envInt !== undefined) m.envMapIntensity = envInt;
    } else {
      m = new THREE.MeshLambertMaterial({ color: opts.lowColor ?? color, side: side ?? THREE.FrontSide });
    }
    if (transparent) { m.transparent = true; m.opacity = opacity ?? 0.3; m.depthWrite = false; }
    if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 1; }
    m.userData.texSize = texSize;
    return m;
  };
  const W = 0xffffff;
  // madeira dos armários: textura tirada da foto de referência (madeira serrada, nós e veios marcados)
  M.madeira = mk(hi ? W : 0xa57b52, { map: hi && T.photo('madeira_armario_h', { mirror: true }), texSize: 0.75, rough: 0.8 });
  M.madeiraV = mk(hi ? W : 0xa57b52, { map: hi && T.photo('madeira_armario_v', { mirror: true }), texSize: 0.75, rough: 0.8 });
  M.madeiraEscura = mk(hi ? W : 0x6b4b33, { map: hi && T.woodDemolicao('b'), texSize: 1.2, rough: 0.8 });
  M.madeiraClara = mk(hi ? W : 0xc49a6c, { map: hi && T.woodDemolicao('c'), texSize: 1.2, rough: 0.75 });
  M.mesa = mk(hi ? 0xd8b48a : 0xa57c52, { map: hi && T.woodDemolicao('c'), texSize: 1.5, rough: 0.55 });
  // cadeiras: compensado/madeira curvada clara envernizada (como as cadeiras reais da mesa)
  M.cadeira = hi
    ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: T.madeiraCurvada(), roughness: 0.52, clearcoat: 0.35, clearcoatRoughness: 0.5, side: THREE.DoubleSide })
    : mk(0xc8a070, { side: THREE.DoubleSide });
  if (hi) M.cadeira.userData.texSize = 0.5;
  M.balanco = mk(hi ? 0x5e3a22 : 0x5a3a22, { rough: 0.38 });
  M.granilite = mk(hi ? W : 0xb0604c, { map: hi && T.granilite(), texSize: 0.6, rough: 0.35, envInt: 0.6 });
  M.inox = mk(0xc9ccce, { rough: 0.28, metal: 0.9, lowColor: 0xc4c7ca });
  M.inoxEscuro = mk(0x7d8185, { rough: 0.35, metal: 0.85, side: THREE.BackSide, lowColor: 0x8a8d90 });
  M.ferro = mk(hi ? W : 0x2a2522, { map: hi && T.ferro(), texSize: 0.4, rough: 0.6, metal: 0.6, lowColor: 0x2a2522 });
  M.ferroPreto = mk(0x1d1b1a, { rough: 0.5, metal: 0.5 });
  M.latao = mk(0xb08a4a, { rough: 0.35, metal: 0.9 });
  M.branco = mk(0xf1f1ef, { rough: 0.3, envInt: 0.7 });
  M.vidro = mk(0xcfe3ea, { rough: 0.05, metal: 0.1, transparent: true, opacity: hi ? 0.18 : 0.25, envInt: 1.0 });
  M.vidroPreto = mk(0x15171a, { rough: 0.12, metal: 0.3 });
  M.parede = mk(hi ? 0xfff4e6 : 0xdccdb6, { map: hi && T.photo('parede_textura', { repeat: [1, 1], mirror: true }), texSize: 0.6, rough: 0.95 });
  M.reboco = mk(0xe9e1d3, { rough: 0.95, lowColor: 0xe3d9c8 });
  M.pilar = mk(0xe2d8c6, { rough: 0.9 });
  M.piso = mk(hi ? W : 0xcfc8bd, { map: hi && T.porcelanato(), texSize: 0.8, rough: 0.35, envInt: 0.5 });
  M.telhas = mk(hi ? W : 0xb7b7b2, { map: hi && T.telhas(), texSize: 0.9, rough: 0.8, side: THREE.DoubleSide });
  M.grama = mk(hi ? W : 0x7fa05a, { map: hi && T.grama(), texSize: 1.5, rough: 1 });
  M.brita = mk(0x8f8c86, { rough: 1 });
  M.muro = mk(0x8e948b, { rough: 0.95 });
  M.calcada = mk(0xb9b2a6, { rough: 0.95 });
  M.tijolo = mk(hi ? W : 0xb4603c, { texSize: 0.46, rough: 0.92 });
  if (hi) { const [c, b] = T.tijoloPar(); M.tijolo.map = c; M.tijolo.bumpMap = b; M.tijolo.bumpScale = 3; }
  // ferro fundido (portas, chapa) — superfície areada; a chapa é mais lisa/polida pelo uso
  M.ferroFundido = mk(hi ? W : 0x2a2826, { texSize: 0.35, rough: 0.78, metal: 0.45 });
  M.ferroChapa = mk(hi ? 0xbdbdbd : 0x2a2826, { texSize: 0.35, rough: 0.5, metal: 0.6 });
  if (hi) { const [c, b] = T.ferroFundidoPar(); for (const m of [M.ferroFundido, M.ferroChapa]) { m.map = c; m.bumpMap = b; m.bumpScale = 1.2; } }
  M.casca = mk(hi ? W : 0x4a3828, { map: hi && T.casca(), rough: 1 });
  M.topoTora = mk(hi ? W : 0xc9a477, { map: hi && T.topoTora(), rough: 0.95 });
  M.termometro = mk(W, { map: hi && T.termometro(), rough: 0.15, envInt: 0.8, lowColor: 0xf3efe4 });
  M.cromado = mk(0xdfe2e4, { rough: 0.15, metal: 1, lowColor: 0xc9ccce });
  M.plasticoPreto = mk(0x1c1c1e, { rough: 0.35, envInt: 0.7 });
  M.plasticoFosco = mk(0x2a2a2c, { rough: 0.7 });
  M.inoxEscovado = mk(0xdadde0, { rough: 0.38, metal: 0.75, lowColor: 0xc4c7ca });
  M.antiaderente = mk(0x202022, { rough: 0.45, metal: 0.3 });
  M.ledVerde = mk(0x2bd46a, { emissive: hi ? 0x1fae55 : 0x000000, rough: 0.3 });
  M.ledVermelho = mk(0xe03a2a, { emissive: hi ? 0xb02a1e : 0x000000, rough: 0.3 });
  M.cabo = mk(0xf0f0ec, { rough: 0.6 });
  M.copo = hi ? new THREE.MeshPhysicalMaterial({ color: 0xeef4f6, roughness: 0.06, transparent: true, opacity: 0.32, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.3, side: THREE.DoubleSide, depthWrite: false })
    : mk(0xdfe8ea, { transparent: true, opacity: 0.35 });
  M.barro = mk(0xb5653a, { rough: 0.85, lowColor: 0xb5653a });
  M.pedra = mk(hi ? W : 0xb8aa98, { map: hi && T.photo('filtro_pedra'), rough: 0.95 });
  M.pedraEscura = mk(0x4a4744, { rough: 0.9 });
  M.palhinha = mk(hi ? W : 0xe0cfa4, { map: hi && T.palhinha(), rough: 0.8, side: THREE.DoubleSide });
  M.palhinhaVazada = mk(W, { map: hi && T.palhinhaVazada(), rough: 0.75, side: THREE.DoubleSide, lowColor: 0xe0cfa4 });
  if (hi) { M.palhinhaVazada.alphaTest = 0.4; M.palhinhaVazada.transparent = false; }
  M.ferroVelho = mk(0x5b3b27, { rough: 0.55, metal: 0.55, lowColor: 0x4a3324 });
  M.metalVelho = mk(0x55554e, { rough: 0.5, metal: 0.7, lowColor: 0x5a5a54 });
  M.pedraLado = mk(hi ? W : 0xa89a86, { map: hi && T.pedraClara(), rough: 0.95 });
  M.pedraBacia = mk(hi ? W : 0x4a4744, { map: hi && T.pedraBacia(), rough: 0.95, lowColor: 0x4a4744 });
  M.barroT = mk(hi ? W : 0xb5653a, { map: hi && T.barroTex(), rough: 0.85, lowColor: 0xb5653a });
  M.barroFaixa = mk(0x8e1f1c, { rough: 0.6 });
  M.torneiraLaranja = mk(0xe8741e, { rough: 0.4 });
  M.escuro = mk(0x2a2420, { rough: 0.9 });
  M.lenha = mk(0x7a5638, { rough: 1 });
  M.lampada = mk(0xfff1cf, { emissive: hi ? 0xffd9a0 : 0x000000, rough: 0.4 });
  M.fogaoFrente = mk(W, { map: T.photo('fogao_frente'), rough: 0.3, lowColor: 0xc4c7ca });
  M.geladeiraFrente = mk(W, { map: T.photo('geladeira_frente'), rough: 0.3, lowColor: 0xf0f0f0 });
  M.llFrente = mk(W, { map: hi && T.lavaLoucasFrente(), rough: 0.3, lowColor: 0xf0f0f0, envInt: 0.6 });
  M.buffetFrente = mk(W, { map: T.photo('buffet_frente'), rough: 0.6, lowColor: 0x6e4a30 });
  M.talha = mk(W, { map: T.photo('filtro_talha'), rough: 0.8, lowColor: 0xb5653a });
  M.buffet = mk(0x4a2f1f, { rough: 0.55, lowColor: 0x6e4a30 });
  M.pratos = Array.from({ length: 6 }, (_, i) => mk(W, { map: hi ? T.prato(i) : null, rough: 0.25, lowColor: 0xf3efe6, envInt: 0.8 }));
  M.esmalte = mk(0xb3221d, { rough: 0.25, envInt: 0.8 });
  M.telaInterfone = mk(0x1b2a3a, { rough: 0.08, metal: 0.2, emissive: hi ? 0x0d1a26 : 0x000000 });
  M.azulejo = mk(hi ? W : 0xdbe3e7, { map: hi && T.azulejos(), rough: 0.22, envInt: 0.7, texSize: 1.2 });
  M.aluminio = mk(0xc7c9cb, { rough: 0.35, metal: 0.85 });
  M.ceramica = mk(0xf1ece2, { rough: 0.3 });
  M.folha = mk(0x4f7a32, { rough: 0.8 });
  M.temperos = [0xb5321e, 0xd99a1c, 0x5b7a2b, 0x2a2420, 0xe9e4da, 0x8a4b22, 0xc9541a].map((c) => mk(c, { rough: 0.9 }));
  M.frutas = [0xe8811a, 0xc0281c, 0xe8cf3a, 0x6c9a2e, 0x7a2340].map((c) => mk(c, { rough: 0.45 }));
  M.tecidos = [0, 1, 2, 3].map((i) => mk(hi ? 0xffffff : [0xe9c2bd, 0xc2d2e2, 0xd3dcc0, 0xe8d2b8][i], { map: hi && T.tecido(i), rough: 0.95, side: THREE.DoubleSide }));
  if (hi) {
    for (const [m, k] of [[M.madeira, 0.6], [M.madeiraV, 0.6], [M.madeiraEscura, 0.8], [M.madeiraClara, 0.8], [M.mesa, 0.5], [M.parede, 2.2]]) { m.bumpMap = m.map; m.bumpScale = k; }
  }
  M.linha = new THREE.LineBasicMaterial({ color: 0x3a2e24, transparent: true, opacity: 0.55 });
  M.sel = new THREE.LineBasicMaterial({ color: 0xd2552b, depthTest: false, transparent: true });
  return M;
}

// ---------------------------------------------------------------- helpers
/** Ajusta UVs de uma BoxGeometry para escala de mundo (texSize em metros). */
function boxUV(geo, w, h, d, ts) {
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v;
    uv.setXY(i, uv.getX(i) * dims[f][0] / ts, uv.getY(i) * dims[f][1] / ts);
  }
  uv.needsUpdate = true;
}
function scaleUV(geo, s) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * s, uv.getY(i) * s); uv.needsUpdate = true; }

function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) {
  const g = new THREE.BoxGeometry(w, h, d);
  const mats = Array.isArray(mat) ? mat : [mat];
  if (mats.some((m) => m.map && !m.userData.noWorldUV)) boxUV(g, w, h, d, mats[0].userData.texSize || 1);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent?.add(m);
  return m;
}
/** Caixa com uma face "foto" (frente = −Z, índice 5) sem UV de mundo. */
function photoBox(w, h, d, side, front, x, y, z, parent) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, [side, side, side, side, side, front]);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent?.add(m); return m;
}
function cyl(rt, rb, h, mat, x, y, z, parent, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent?.add(m); return m;
}
function tube(points, r, mat, parent, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 12), r, 8, closed), mat);
  m.castShadow = true; m.userData.noEdges = true; parent?.add(m); return m;
}
/** Puxador-flor de ferro preto (como na referência). */
function knob(parent, M, x, y, z, r = 0.019) {
  const base = cyl(r * 0.55, r * 0.55, 0.012, M.ferroPreto, x, y, z - 0.012, parent, 12); base.rotation.x = Math.PI / 2;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, p = new THREE.Mesh(new THREE.SphereGeometry(r * 0.38, 8, 6), M.ferroPreto);
    p.scale.set(1, 1, 0.45); p.position.set(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, z - 0.019); p.castShadow = true; parent.add(p);
  }
  const c = new THREE.Mesh(new THREE.SphereGeometry(r * 0.35, 10, 8), M.ferroPreto); c.scale.z = 0.6; c.position.set(x, y, z - 0.022); parent.add(c);
}

/** Desenha frentes (portas, gavetas, painéis fixos) de uma especificação em cm. */
function drawPanels(g, M, panels, z) {
  for (const p of panels) {
    if (!['porta', 'gaveta', 'fixo', 'cego'].includes(p.tipo)) continue;
    const w = cm(p.x1 - p.x0) - 0.006, h = cm(p.y1 - p.y0) - 0.006;
    box(w, h, 0.02, p.tipo === 'fixo' || p.tipo === 'cego' ? M.madeira : M.madeiraV, cm((p.x0 + p.x1) / 2), cm((p.y0 + p.y1) / 2), z, g);
    if (p.knob) knob(g, M, cm(p.knob[0]), cm(p.knob[1]), z - 0.01);
  }
}

function handle(parent, M, x, y, z, vertical = true, len = 0.12) {
  box(vertical ? 0.012 : len, vertical ? len : 0.012, 0.012, M.ferroPreto, x, y, z - 0.016, parent);
}

// ---------------------------------------------------------------- móveis
const B = {};

B.bancada = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  const plinth = 0.10, top = 0.03, carcH = H - plinth - top;
  box(W - 0.01, plinth, D - 0.09, M.escuro, 0, plinth / 2, 0.035, g);
  const hasSink = ctx.items.some((c) => c.kind === 'cuba' && insideLocal(it, c));
  if (!hasSink) box(W, carcH, D - 0.025, M.madeira, 0, plinth + carcH / 2, 0.0125, g);
  else {
    // corpo vazado (sem tampo) para a cuba embutida aparecer por inteiro
    const t = 0.018, cd = D - 0.025, cz = 0.0125, cy = plinth + carcH / 2;
    box(t, carcH, cd, M.madeira, -W / 2 + t / 2, cy, cz, g);
    box(t, carcH, cd, M.madeira, W / 2 - t / 2, cy, cz, g);
    box(W, carcH, t, M.madeira, 0, cy, cz + cd / 2 - t / 2, g);
    box(W, carcH, t, M.madeira, 0, cy, cz - cd / 2 + t / 2, g);
    box(W, t, cd, M.escuro, 0, plinth + t / 2, cz, g);
  }
  if (ctx.hi) {
    // frentes conforme a especificação de marcenaria (mesma usada no projeto em PDF)
    drawPanels(g, M, cabinetSpec(it, ctx.items).panels, -D / 2 + 0.015);
  }
  // tampo em granilite montado por placas retangulares: recorte das cubas e REBAIXO (área molhada mais baixa)
  const tw = W, td = D + 0.02, tz = -0.01;
  const full = { x0: -tw / 2, x1: tw / 2, y0: -td / 2, y1: td / 2 };     // coords do tampo (y = z local − tz)
  let plates = [full];
  const lowered = [];
  for (const c of ctx.items.filter((c) => c.kind === 'cuba')) {
    const rb = c.rebaixo || {};
    const prof = cm(rb.prof || 0);
    const hole = rectInHost(it, c, 0, 0, 0, 0, -2, tz);                    // furo da cuba (2 cm de aba de cada lado)
    const zone = prof > 0 ? rectInHost(it, c, rb.esq || 0, rb.dir || 0, rb.frente || 0, rb.fundo || 0, 0, tz) : hole;
    const zc = clipRect(zone, full);
    if (!zc) continue;
    plates = subtractRects(plates, zc);
    if (prof > 0) lowered.push(...subtractRects([zc], hole).map((r) => ({ ...r, prof })));
  }
  const slab = (r, thick, yTop) => box(r.x1 - r.x0, thick, r.y1 - r.y0, M.granilite, (r.x0 + r.x1) / 2, yTop - thick / 2, (r.y0 + r.y1) / 2 + tz, g);
  for (const r of plates) slab(r, top, H);
  for (const r of lowered) {
    slab(r, top - r.prof, H - r.prof);
  }
  // rodabanca (10 cm) em todo lado do tampo que encosta numa parede
  if (ctx.hi && it.rodabanca !== false) {             // it.rodabanca = false desliga (ex.: bancada sob o janelão)
    const walls = sidesOnWall(it), rh = 0.10, t = 0.02;
    if (walls.back) box(W, rh, t, M.granilite, 0, H + rh / 2, D / 2 - t / 2, g);
    const z0 = -D / 2 - 0.02, z1 = D / 2 - (walls.back ? t : 0);
    for (const [side, sx] of [['left', -1], ['right', 1]]) {
      if (walls[side]) box(t, rh, z1 - z0, M.granilite, sx * (W / 2 - t / 2), H + rh / 2, (z0 + z1) / 2, g);
    }
  }
  return g;
};

/** Distância (cm) do centro do item até a parede logo atrás dele (eixo local +Z), conforme a rotação. */
function wallDistBehind(it) {
  const r = (((it.rot % 360) + 360) % 360);
  if (r === 0) return ROOM.D - it.y;
  if (r === 180) return it.y - ROOM.frontInner;
  if (r === 90) return it.x;
  if (r === 270) return ROOM.innerRight - it.x;
  return it.d / 2 + 12;
}

/** Quais lados (local) do móvel encostam numa parede do ambiente (tolerância 2 cm). */
function sidesOnWall(it) {
  const T = 3;
  const lines = [(p) => Math.abs(p.x) < T, (p) => Math.abs(p.x - ROOM.innerRight) < T, (p) => Math.abs(p.y - ROOM.D) < T, (p) => Math.abs(p.y - ROOM.frontInner) < T];
  const onWall = (pts) => lines.some((f) => pts.every(f));
  const hw = it.w / 2, hd = it.d / 2, P = (lx, ly) => localToPlan(it, lx, ly);
  return {
    back: onWall([P(-hw, hd), P(hw, hd)]),
    left: onWall([P(-hw, -hd), P(-hw, hd)]),
    right: onWall([P(hw, -hd), P(hw, hd)]),
  };
}

/** Retângulo (m, coords do tampo do host) de uma cuba ampliado pelas margens em cm (esq/dir/frente/fundo no eixo local da cuba). */
function rectInHost(host, c, esq, dir, frente, fundo, grow, tz) {
  const hw = c.w / 2 + grow, hd = c.d / 2 + grow;
  const pts = [[-hw - esq, -hd - frente], [hw + dir, -hd - frente], [hw + dir, hd + fundo], [-hw - esq, hd + fundo]]
    .map(([lx, ly]) => toLocal(host, localToPlan(c, lx, ly)));
  const xs = pts.map((p) => cm(p.x)), ys = pts.map((p) => cm(p.y) - tz);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
function clipRect(a, b) {
  const r = { x0: Math.max(a.x0, b.x0), x1: Math.min(a.x1, b.x1), y0: Math.max(a.y0, b.y0), y1: Math.min(a.y1, b.y1) };
  return r.x1 - r.x0 > 0.001 && r.y1 - r.y0 > 0.001 ? r : null;
}
/** Subtrai o retângulo r de uma lista de retângulos (decomposição em até 4 peças por retângulo). */
function subtractRects(list, r) {
  const out = [];
  for (const a of list) {
    const i = clipRect(a, r);
    if (!i) { out.push(a); continue; }
    const add = (x0, x1, y0, y1) => { if (x1 - x0 > 0.001 && y1 - y0 > 0.001) out.push({ x0, x1, y0, y1 }); };
    add(a.x0, i.x0, a.y0, a.y1); add(i.x1, a.x1, a.y0, a.y1);
    add(i.x0, i.x1, a.y0, i.y0); add(i.x0, i.x1, i.y1, a.y1);
  }
  return out;
}

function toLocal(host, it) {
  const r = (-host.rot * Math.PI) / 180, dx = it.x - host.x, dy = it.y - host.y;
  return { x: dx * Math.cos(r) - dy * Math.sin(r), y: dx * Math.sin(r) + dy * Math.cos(r) };
}
function insideLocal(host, it) { const l = toLocal(host, it); return Math.abs(l.x) < host.w / 2 && Math.abs(l.y) < host.d / 2; }

B.cuba = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), top = 0.90 - cm(it.rebaixo?.prof || 0) - cm(it.elev || 0);
  const depth = 0.22;
  const basin = new THREE.Mesh(new THREE.BoxGeometry(W - 0.04, depth, D - 0.04), M.inoxEscuro);
  basin.position.set(0, top - depth / 2 + 0.001, 0); basin.receiveShadow = true; g.add(basin);
  // aro
  const s = new THREE.Shape(); s.moveTo(-W / 2, -D / 2); s.lineTo(W / 2, -D / 2); s.lineTo(W / 2, D / 2); s.lineTo(-W / 2, D / 2); s.closePath();
  const h = new THREE.Path(); const iw = W / 2 - 0.02, id = D / 2 - 0.02;
  h.moveTo(-iw, -id); h.lineTo(-iw, id); h.lineTo(iw, id); h.lineTo(iw, -id); h.closePath(); s.holes.push(h);
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: false }), M.inox);
  rim.rotation.x = -Math.PI / 2; rim.position.y = top + 0.0005; g.add(rim);
  cyl(0.025, 0.025, 0.004, M.escuro, 0, top - depth + 0.004, 0.0, g);
  // torneira de PAREDE (latão): sai da parede atrás da cuba, a ~20 cm acima da bancada (abaixo do peitoril da janela)
  const zw = cm(wallDistBehind(it));            // distância do centro da cuba até a parede de trás (eixo local +Z)
  const fy = top + 0.20, spout = Math.max(0.18, zw - 0.02);
  const flange = cyl(0.032, 0.032, 0.012, M.latao, 0, fy, zw - 0.006, g, 24); flange.rotation.x = Math.PI / 2;
  const body = cyl(0.016, 0.016, 0.07, M.latao, 0, fy, zw - 0.045, g, 16); body.rotation.x = Math.PI / 2;
  cyl(0.02, 0.02, 0.03, M.latao, 0, fy, zw - 0.075, g, 16).rotation.x = Math.PI / 2;
  // registro em cruzeta
  cyl(0.008, 0.008, 0.035, M.latao, 0, fy + 0.03, zw - 0.075, g, 10);
  for (const ry of [0, Math.PI / 2]) { const c = box(0.07, 0.008, 0.008, M.latao, 0, fy + 0.05, zw - 0.075, g); c.rotation.y = ry + Math.PI / 4; }
  if (ctx.hi) cyl(0.011, 0.011, 0.006, M.branco, 0, fy + 0.057, zw - 0.075, g, 12);
  // bica: avança até o centro da cuba e curva para baixo
  tube([[0, fy, zw - 0.085], [0, fy + 0.005, zw - 0.085 - spout * 0.6], [0, fy - 0.01, zw - 0.085 - spout * 0.92], [0, fy - 0.05, zw - 0.085 - spout]], 0.011, M.latao, g);
  return g;
};

B.fogao = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  const bodyH = 0.89;
  photoBox(W, bodyH, D, M.inox, M.fogaoFrente, 0, bodyH / 2, 0, g);
  box(W, 0.01, D, M.vidroPreto, 0, bodyH + 0.005, 0, g);
  const pos = [[-0.24, -0.13], [0, -0.13], [0.24, -0.13], [-0.24, 0.13], [0, 0.13], [0.24, 0.13]];
  for (const [bx, bz] of pos) {
    const r = bx === 0 ? 0.05 : 0.04;
    cyl(r, r, 0.02, M.ferroPreto, bx * W / 0.76, bodyH + 0.02, bz * D / 0.66, g, 20);
    cyl(r * 0.6, r * 0.6, 0.012, M.latao, bx * W / 0.76, bodyH + 0.035, bz * D / 0.66, g, 16);
  }
  if (ctx.hi) {
    // trempes (grelhas)
    for (const gx of [-W / 3, 0, W / 3]) {
      const gw = W / 3 - 0.01, gy = H - 0.04;
      for (const dz of [-D / 2 + 0.04, D / 2 - 0.04]) box(gw, 0.012, 0.012, M.ferroPreto, gx, gy, dz, g);
      for (const dx of [-gw / 2, gw / 2, 0]) box(0.012, 0.012, D - 0.08, M.ferroPreto, gx + dx, gy, 0, g);
    }
    // botões
    for (let i = 0; i < 6; i++) cyl(0.018, 0.018, 0.025, M.ferroPreto, -W / 2 + 0.08 + i * (W - 0.16) / 5, bodyH - 0.035, -D / 2 - 0.012, g, 16).rotation.x = Math.PI / 2;
    if (it.acessorios !== false) { kettle(g, M, -0.24 * W / 0.76, H - 0.03, 0.13 * D / 0.66, M.esmalte, 0.85); pot(g, M, 0.24 * W / 0.76, H - 0.03, -0.13 * D / 0.66, 0.1, M.aluminio); }
    // tampa de vidro levantada
    const lid = box(W - 0.02, 0.5, 0.006, M.vidro, 0, bodyH + 0.26, D / 2 - 0.01, g); lid.castShadow = false;
  }
  return g;
};

/** Porta de ferro fundido com moldura, almofada em relevo, dobradiças e puxador de mola. */
function ironDoor(parent, M, x, y, z, w, h, { hinge = 'esq', grade = false } = {}) {
  const d = new THREE.Group(); d.position.set(x, y, z); parent.add(d);
  box(w + 0.03, h + 0.03, 0.01, M.escuro, 0, 0, 0.004, d);                       // batente/fresta
  box(w, h, 0.014, M.ferroFundido, 0, 0, -0.006, d);
  const t = 0.014;                                                                 // moldura em relevo
  box(w, t, 0.008, M.ferroFundido, 0, h / 2 - t / 2, -0.016, d); box(w, t, 0.008, M.ferroFundido, 0, -h / 2 + t / 2, -0.016, d);
  box(t, h, 0.008, M.ferroFundido, -w / 2 + t / 2, 0, -0.016, d); box(t, h, 0.008, M.ferroFundido, w / 2 - t / 2, 0, -0.016, d);
  box(w * 0.62, h * 0.5, 0.005, M.ferroFundido, 0, 0, -0.015, d);                // almofada central
  if (grade) for (let k = -2; k <= 2; k++) box(0.012, h * 0.35, 0.006, M.escuro, k * 0.03, 0, -0.019, d); // registro de ar
  const hx = hinge === 'esq' ? -w / 2 - 0.006 : w / 2 + 0.006;
  for (const sy of [-1, 1]) cyl(0.007, 0.007, 0.035, M.ferroPreto, hx, sy * (h / 2 - 0.03), -0.012, d, 10);
  // trinco com puxador de mola (cromado), típico de fogão a lenha
  const lx = -Math.sign(hx) * (w / 2 - 0.035), L = 0.075, pts = [];
  for (let i = 0; i <= 90; i++) { const u = i / 90, a = u * Math.PI * 2 * 9; pts.push(new THREE.Vector3(lx - Math.sign(lx) * u * L * 0 + Math.cos(a) * 0.008, -L / 2 + u * L, -0.04 + Math.sin(a) * 0.008)); }
  const sp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 360, 0.0018, 5), M.cromado); sp.castShadow = true; sp.userData.noEdges = true; d.add(sp);
  box(0.008, 0.008, 0.03, M.cromado, lx, -L / 2 - 0.004, -0.026, d); box(0.008, 0.008, 0.03, M.cromado, lx, L / 2 + 0.004, -0.026, d);
  return d;
}
function tora(parent, M, x, y, z, r, len, rotY = 0) {
  const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, len, 12), [M.casca, M.topoTora, M.topoTora]);
  t.rotation.set(Math.PI / 2, 0, 0); t.position.set(x, y, z);
  const g = new THREE.Group(); g.rotation.y = rotY; g.add(t); t.castShadow = t.receiveShadow = true; parent.add(g); return g;
}

B.fogaoLenha = (it, M, ctx) => {
  // Layout (croqui do usuário): sobre o corpo, do lado da chaminé, o bloco do FORNO elevado com a chaminé
  // saindo de cima; do outro lado, a chapa de ferro com UMA trempe, com a fornalha (alimentador) logo abaixo;
  // a lenha fica guardada sob o forno.
  const root = new THREE.Group();
  const ch = lenhaChimney(it);
  const g = new THREE.Group(); if (ch.mirrored) g.scale.x = -1; root.add(g);   // no grupo g o forno fica sempre em −x
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  const chxL = (ch.mirrored ? -1 : 1) * cm(ch.lx);                               // chaminé em coordenadas de g
  const ovW = Math.min(W - 0.4, Math.max(W * 0.45, chxL + W / 2 + 0.19));        // bloco do forno cobre a chaminé
  const ovH = 0.5, ovX0 = -W / 2, ovX1 = ovX0 + ovW, ovCx = (ovX0 + ovX1) / 2;
  const capH = 0.035, bodyH = H - capH;
  // bloco do forno (alvenaria) com tampo de tijolo
  // alvenaria contínua: coluna do forno (do piso ao topo, mesmas fiadas) + corpo da fornalha sob a chapa
  box(ovW, H + ovH, D, M.tijolo, ovCx, (H + ovH) / 2, 0, g);
  box(W - ovW, bodyH, D, M.tijolo, ovX1 + (W - ovW) / 2, bodyH / 2, 0, g);
  box(ovW + 0.02, 0.03, D + 0.02, M.tijolo, ovCx, H + ovH + 0.015, 0, g);
  // chapa de ferro (lado livre) com cantoneira e UMA trempe
  const cpW = W - ovW, cpCx = ovX1 + cpW / 2;
  box(cpW, capH, D, M.ferroChapa, cpCx, H - capH / 2, 0, g);
  for (const sz of [-1, 1]) box(cpW, 0.012, 0.012, M.ferroFundido, cpCx, H + 0.004, sz * (D / 2 - 0.006), g);
  box(0.012, 0.012, D, M.ferroFundido, W / 2 - 0.006, H + 0.004, 0, g);
  const tx = cpCx, tz = -0.03;
  for (const [r0, r1] of [[0, 0.05], [0.053, 0.095], [0.098, 0.14]]) {                // anéis concêntricos removíveis
    const geo = r0 ? new THREE.RingGeometry(r0, r1, 48) : new THREE.CircleGeometry(r1, 48);
    const ring = new THREE.Mesh(geo, M.ferroChapa); ring.rotation.x = -Math.PI / 2; ring.position.set(tx, H + 0.0015, tz); ring.receiveShadow = true; g.add(ring);
  }
  const groove = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.147, 48), M.escuro); groove.rotation.x = -Math.PI / 2; groove.position.set(tx, H + 0.001, tz); g.add(groove);
  if (ctx.hi && it.acessorios !== false) pot(g, M, tx, H, tz, 0.1);
  // Fluxo do calor (tiragem natural): a FORNALHA fica logo abaixo da trempe — a chama bate direto na chapa.
  // Os gases quentes seguem por um canal sob a chapa até o lado do forno, entram no bloco do forno por baixo
  // (aquecem o piso do forno), sobem pelo fundo e passam por cima da câmara (aquecem o teto), saindo na chaminé
  // no alto do bloco. Um REGISTRO na frente do bloco desvia os gases direto para a chaminé quando o forno não
  // está em uso (mais calor na chapa). A LENHA fica guardada sob o forno, longe da fornalha.
  const fz = -D / 2;
  // alimentador (porta da fornalha) centrado sob a trempe + cinzeiro (entrada de ar) logo abaixo
  const aW = Math.min(0.34, cpW - 0.08), aH = 0.17, aX = tx, aY = H - 0.165;
  ironDoor(g, M, aX, aY, fz, aW, aH, { hinge: 'esq' });
  ironDoor(g, M, aX, aY - aH / 2 - 0.085, fz, aW * 0.8, 0.08, { hinge: 'esq', grade: true });
  // nicho da lenha sob o forno
  const lW = Math.min(0.44, ovW - 0.12), lH = 0.3, lX = ovCx, lY = 0.13 + lH / 2;
  box(lW, lH, 0.004, M.escuro, lX, lY, fz - 0.002, g);                           // fundo escuro do nicho da lenha
  for (const sy of [-1, 1]) box(lW + 0.03, 0.015, 0.03, M.ferroFundido, lX, lY + sy * (lH / 2 + 0.007), fz - 0.012, g); // cantoneiras
  for (const sx of [-1, 1]) box(0.015, lH + 0.044, 0.03, M.ferroFundido, lX + sx * (lW / 2 + 0.007), lY, fz - 0.012, g);
  if (ctx.hi) {                                                                    // toras empilhadas, pontas aparentes
    const r0 = 0.032, n = Math.max(2, Math.floor((lW - 0.01) / (2 * r0 + 0.008)));
    for (let row = 0, yy = lY - lH / 2 + r0 + 0.002; yy < lY + lH / 2 - r0 && row < 5; row++, yy += r0 * 1.8) {
      const m = row % 2 ? n - 1 : n, x0 = lX - ((m - 1) * (2 * r0 + 0.008)) / 2;
      for (let i = 0; i < m; i++) tora(g, M, x0 + i * (2 * r0 + 0.008), yy, fz - 0.03 + ((i + row) % 2) * 0.015, r0 - 0.004 + ((i * 7 + row) % 3) * 0.003, 0.08, ((i + row) % 3 - 1) * 0.06);
    }
  }
  // bloco do forno: porta da câmara (com termômetro), porta de limpeza do canal de fumaça sob o forno e registro
  const oW = Math.min(0.36, ovW - 0.1), oH = 0.26, oY = H + 0.265;
  ironDoor(g, M, ovCx, oY, fz, oW, oH, { hinge: 'esq' });
  if (ctx.hi) {
    const tm = cyl(0.03, 0.03, 0.012, M.termometro, ovCx, oY + 0.07, fz - 0.026, g, 32); tm.rotation.x = -Math.PI / 2;
    tm.material = [M.cromado, M.termometro, M.cromado];
  }
  ironDoor(g, M, ovCx, H + 0.06, fz, Math.min(0.2, oW * 0.55), 0.06, { hinge: 'esq' });   // limpeza da fuligem
  const rgX = Math.min(ovX1 - 0.05, ovCx + oW / 2 + 0.06), rgY = H + ovH - 0.06;           // registro (abafador)
  box(0.05, 0.05, 0.006, M.ferroFundido, rgX, rgY, fz - 0.003, g);
  cyl(0.005, 0.005, 0.07, M.ferroFundido, rgX, rgY, fz - 0.035, g, 8).rotation.x = Math.PI / 2;
  const kb = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 8), M.latao); kb.position.set(rgX, rgY, fz - 0.072); kb.castShadow = true; g.add(kb);
  // varão de pano na frente da chapa
  tube([[ovX1 + 0.03, H - 0.05, fz - 0.05], [W / 2 - 0.03, H - 0.05, fz - 0.05]], 0.007, M.latao, g);
  for (const x of [ovX1 + 0.03, W / 2 - 0.03]) box(0.012, 0.012, 0.05, M.latao, x, H - 0.05, fz - 0.025, g);
  // chaminé de tijolo saindo de cima do forno até acima do telhado — alinhada ao pilar quando houver um atrás
  const chx = cm(ch.lx), chz = D / 2 - 0.15, base = H + ovH + 0.03;
  const world = localToPlan(it, chx * 100, chz * 100);
  const topH = cm(roofZ(world.x)) + 0.7, chH = topH - base;
  box(0.30, chH, 0.30, M.tijolo, chx, base + chH / 2, chz, root);
  box(0.36, 0.04, 0.36, M.tijolo, chx, topH - 0.02, chz, root);
  box(0.40, 0.03, 0.40, M.ferroFundido, chx, topH + 0.14, chz, root);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.02, 0.12, 0.02, M.ferroFundido, chx + sx * 0.13, topH + 0.06, chz + sz * 0.13, root);
  return root;
};
function localToPlan(it, lx, ly) {
  const r = (it.rot * Math.PI) / 180;
  return { x: it.x + lx * Math.cos(r) - ly * Math.sin(r), y: it.y + lx * Math.sin(r) + ly * Math.cos(r) };
}

B.geladeira = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  photoBox(W, H - 0.03, D, M.branco, M.geladeiraFrente, 0, (H - 0.03) / 2 + 0.03, 0, g);
  box(W - 0.06, 0.03, D - 0.06, M.escuro, 0, 0.015, 0, g);
  if (!ctx.hi) box(W, 0.008, 0.01, M.escuro, 0, H * 0.67, -D / 2, g);
  return g;
};

B.freezer = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  box(W, H - 0.03, D - 0.04, M.branco, 0, (H - 0.03) / 2 + 0.03, 0.02, g);
  box(W - 0.004, H - 0.04, 0.04, M.branco, 0, (H - 0.04) / 2 + 0.035, -D / 2 + 0.02, g);
  box(0.02, 0.6, 0.03, M.inox, W / 2 - 0.05, H * 0.62, -D / 2 - 0.02, g);
  box(0.12, 0.025, 0.003, M.inox, 0, H - 0.1, -D / 2 - 0.002, g);
  box(W - 0.06, 0.03, D - 0.06, M.escuro, 0, 0.015, 0, g);
  void ctx; return g;
};

B.filtro = (it, M, ctx) => {
  // Filtro de pedra antigo (foto): suporte de ferro ~125 cm, bloco de pedra "DA SILVA" 15 cm,
  // bacia de pedra pendurada sob o bloco, tampa metálica com argola, talha de barro sobre prato a 43 cm.
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  const k = H / 1.5;                       // escala vertical relativa à foto (150 cm)
  const standH = 1.25 * k, s = W / 2 - 0.015, bar = 0.016;
  const iron = M.ferroVelho;
  // pés (barras quadradas) com rodízios
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(bar, standH - 0.03, bar, iron, sx * s, 0.03 + (standH - 0.03) / 2, sz * s, g);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), iron); foot.position.set(sx * s, 0.015, sz * s); g.add(foot);
  }
  // quadro superior e travessas baixas
  for (const y of [standH - 0.01, 0.34 * k]) {
    for (const sz of [-1, 1]) box(2 * s + bar, 0.014, 0.012, iron, 0, y, sz * s, g);
    for (const sx of [-1, 1]) box(0.012, 0.014, 2 * s + bar, iron, sx * s, y, 0, g);
  }
  // braços que sustentam o prato da talha
  const platY = 0.43 * k, platR = 0.15;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    tube([[sx * s, 0.34 * k, sz * s], [sx * platR * 0.75, platY - 0.015, sz * platR * 0.75]], 0.006, iron, g);
  }
  cyl(platR, platR, 0.012, M.ferroPreto, 0, platY, 0, g, 40);
  if (ctx.hi) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(platR, 0.006, 6, 40), iron); rim.rotation.x = Math.PI / 2; rim.position.y = platY + 0.006; g.add(rim);
    // cruzetas em X nas 4 faces + arabescos em "S"
    const y0 = 0.42 * k, y1 = standH - 0.03;
    for (let f = 0; f < 4; f++) {
      const face = new THREE.Group(); face.rotation.y = (f * Math.PI) / 2; g.add(face);
      tube([[-s, y1, -s], [s, y0, -s]], 0.005, iron, face);
      tube([[s, y1, -s], [-s, y0, -s]], 0.005, iron, face);
      const yc = (y0 + y1) / 2;
      for (const sx of [-1, 1]) {
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const t = i / 24, a = t * Math.PI * 2.2;
          const r = 0.035 * (1 - 0.55 * Math.abs(t - 0.5) * 2);
          pts.push([sx * (s * 0.55 + Math.sin(a) * r * 0.6), yc + (t - 0.5) * 0.22 + Math.cos(a) * r * 0.3, -s]);
        }
        tube(pts, 0.004, iron, face);
        const curl = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.004, 6, 20, Math.PI * 1.6), iron);
        curl.position.set(sx * s * 0.55, yc + 0.13, -s); curl.rotation.z = sx > 0 ? 0.6 : 2.5; face.add(curl);
      }
    }
    // copinho de vidro no suporte lateral
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.004, 6, 24), iron); ring.rotation.x = Math.PI / 2; ring.position.set(-s - 0.035, 0.78 * k, -s * 0.4); g.add(ring);
    const copo = cyl(0.032, 0.026, 0.1, M.vidro, -s - 0.035, 0.75 * k, -s * 0.4, g, 16); copo.castShadow = false;
  }
  // talha de barro (perfil torneado medido na foto)
  const prof = [[0, 0], [0.095, 0], [0.1, 0.012], [0.098, 0.04], [0.085, 0.06], [0.07, 0.08], [0.075, 0.095], [0.105, 0.115],
    [0.122, 0.15], [0.13, 0.2], [0.132, 0.3], [0.13, 0.4], [0.126, 0.47], [0.118, 0.51], [0.104, 0.535], [0.095, 0.545], [0.09, 0.55]]
    .map(([r, y]) => new THREE.Vector2(r, y * k));
  const talha = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), M.barroT);
  talha.position.y = platY + 0.006; talha.castShadow = talha.receiveShadow = true; g.add(talha);
  const tY = platY + 0.006;
  for (const [y, r] of [[0.02, 0.1], [0.05, 0.09], [0.125, 0.115], [0.29, 0.133], [0.315, 0.133], [0.44, 0.13], [0.5, 0.12]]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(r + 0.001, 0.004, 6, 40), M.barroFaixa);
    band.rotation.x = Math.PI / 2; band.position.y = tY + y * k; g.add(band);
  }
  // tampa plástica branca + concha
  cyl(0.1, 0.1, 0.03, M.branco, 0, tY + 0.555 * k + 0.012, 0, g, 32);
  if (ctx.hi) { const h2 = box(0.14, 0.012, 0.025, M.branco, -0.1, tY + 0.555 * k + 0.035, -0.02, g); h2.rotation.y = 0.5; }
  // torneirinha
  const tap = cyl(0.009, 0.009, 0.045, M.torneiraLaranja, 0, tY + 0.12 * k, -0.12, g, 10); tap.rotation.x = Math.PI / 2;
  cyl(0.006, 0.006, 0.03, M.torneiraLaranja, 0, tY + 0.105 * k, -0.14, g, 8);
  // bacia de pedra pendurada sob o bloco
  const blockH = 0.15 * k, blockY = standH;  // base do bloco apoiada no quadro
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.215, 32, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.pedraBacia);
  bowl.scale.set(1, 0.92, 1); bowl.position.y = blockY; bowl.castShadow = true; g.add(bowl);
  // bloco de pedra com quinas arredondadas (frente = foto "DA SILVA")
  const bw = W + 0.02, bd = D + 0.02;
  const blk = new THREE.Mesh(roundedBox(bw, blockH, bd, 0.025), [M.pedraLado, M.pedraLado, M.pedraLado, M.pedraLado, M.pedraLado, M.pedra]);
  blk.position.y = blockY + blockH / 2; blk.castShadow = blk.receiveShadow = true; g.add(blk);
  // tampa metálica com argola
  const topY = blockY + blockH;
  cyl(0.2, 0.21, 0.012, M.metalVelho, 0, topY + 0.006, 0, g, 40);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.metalVelho);
  dome.scale.set(1, 0.32, 1); dome.position.y = topY + 0.012; dome.castShadow = true; g.add(dome);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.005, 8, 24), M.metalVelho);
  handle.position.y = topY + 0.012 + 0.17 * 0.32 + 0.03; g.add(handle);
  return g;
};

/** Caixa com cantos arredondados no plano XZ (bloco de pedra); grupos de material como BoxGeometry. */
function roundedBox(w, h, d, r) {
  const g = new THREE.BoxGeometry(w, h, d, 6, 1, 6);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const ax = Math.abs(v.x) - (w / 2 - r), az = Math.abs(v.z) - (d / 2 - r);
    if (ax > 0 && az > 0) {
      const len = Math.hypot(ax, az), f = r / len;
      v.x = Math.sign(v.x) * (w / 2 - r + ax * f); v.z = Math.sign(v.z) * (d / 2 - r + az * f);
    }
    if (v.y > 0) { v.x *= 0.995; v.z *= 0.995; }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

B.torreLL = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  const e = cm(it.llElev ?? 50);
  box(W, H - 0.1, D - 0.02, M.madeira, 0, (H - 0.1) / 2 + 0.1, 0.01, g);
  box(W - 0.02, 0.1, D - 0.08, M.escuro, 0, 0.05, 0.03, g);
  photoBox(0.59, 0.85, 0.03, M.branco, M.llFrente, 0, e + 0.425, -D / 2 - 0.005, g);
  if (ctx.hi) {
    box(W - 0.01, e - 0.11, 0.02, M.madeiraV, 0, 0.1 + (e - 0.1) / 2, -D / 2 + 0.005, g);
    knob(g, M, 0, (0.105 + e - 0.005) / 2, -D / 2);   // puxador centralizado na gaveta
    const upH = H - (e + 0.86), nUp = upH > 0.75 ? 2 : 1, dh = upH / nUp;
    for (let i = 0; i < nUp; i++) {
      const y0 = e + 0.86 + dh * i;
      box(W - 0.01, dh - 0.01, 0.02, M.madeiraV, 0, y0 + dh / 2, -D / 2 + 0.005, g);
      knob(g, M, W / 2 - 0.06, i === 0 ? y0 + dh - 0.1 : y0 + 0.1, -D / 2);
    }
  }
  return g;
};

B.suspenso = (it, M, ctx) => {
  // Armário suspenso; it.nichos = índices dos vãos que ficam abertos (nicho com prateleira)
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h), t = 0.02;
  const n = it.portas || Math.max(1, Math.round(W / 0.45)), dw = W / n;   // it.portas fixa a quantidade de vãos
  const open = new Set(it.nichos || []);
  if (!open.size) box(W, H, D - 0.02, M.madeira, 0, H / 2, 0.01, g);
  else {
    box(W, t, D, M.madeira, 0, t / 2, 0, g); box(W, t, D, M.madeira, 0, H - t / 2, 0, g);
    box(W, H, 0.015, M.madeiraEscura, 0, H / 2, D / 2 - 0.0075, g);
    for (let i = 0; i <= n; i++) box(t, H, D, M.madeira, -W / 2 + dw * i + (i === 0 ? t / 2 : i === n ? -t / 2 : 0), H / 2, 0, g);
    for (let i = 0; i < n; i++) if (!open.has(i)) box(dw - t, H - 2 * t, D - 0.04, M.madeira, -W / 2 + dw * (i + 0.5), H / 2, 0.01, g);
  }
  for (let i = 0; i < n; i++) {
    const cx = -W / 2 + dw * (i + 0.5);
    if (open.has(i)) {
      box(dw - t, 0.018, D - 0.03, M.madeiraEscura, cx, H / 2, 0.005, g);
      if (ctx.hi) {
        for (const [lvl, y0] of [[0, t], [1, H / 2 + 0.009]]) {
          const k = Math.floor((dw - 0.06) / 0.075);
          for (let j = 0; j < k; j++) jar(g, M, cx - (k - 1) * 0.0375 + j * 0.075, y0, 0, 0.028, lvl ? 0.11 : 0.14, M.temperos[(i * 3 + j + lvl) % M.temperos.length]);
        }
      }
    } else if (ctx.hi) {
      box(dw - 0.008, H - 0.01, 0.02, M.madeiraV, cx, H / 2, -D / 2 + 0.01, g);
      knob(g, M, cx + (i % 2 ? -1 : 1) * (dw / 2 - 0.045), 0.08, -D / 2 + 0.005);
    }
  }
  return g;
};

/** Escorredor de louça com cesto de talheres (inox + bandeja). Medidas reais: 42 × 32 × 16,5 cm. */
B.escorredor = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h), r = 0.0025;
  // bandeja coletora
  box(W, 0.02, D, M.ceramica, 0, 0.01, 0, g);
  box(W - 0.02, 0.004, D - 0.02, M.aluminio, 0, 0.021, 0, g);
  // aramado: base, aro superior e montantes
  const y0 = 0.03, y1 = H - 0.005, hw = W / 2 - 0.01, hd = D / 2 - 0.01;
  const ring = (y, s = 1) => tube([[-hw * s, y, -hd * s], [hw * s, y, -hd * s], [hw * s, y, hd * s], [-hw * s, y, hd * s]], r, M.inox, g, true);
  ring(y0); ring(y1 * 0.62); ring(y1, 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(r, r, y1 - y0, M.inox, sx * hw, (y0 + y1) / 2, sz * hd, g, 6);
  // grade de pratos (arcos ao longo da largura, na metade de trás)
  const nSlots = 9;
  for (let i = 0; i < nSlots; i++) {
    const x = -hw + 0.11 + i * ((W - 0.13) / nSlots);
    tube([[x, y0, -0.02], [x, y0 + 0.1, 0.0], [x, y0, 0.06]], r, M.inox, g);
  }
  for (let i = 0; i < 8; i++) { const z = -hd + 0.02 + i * 0.03; cyl(r, r, W - 0.02, M.inox, 0, y0, z, g, 6).rotation.z = Math.PI / 2; }
  // cesto de talheres (canto esquerdo da frente)
  const cx = -hw + 0.055, cz = -hd + 0.05;
  box(0.09, 0.11, 0.07, M.aluminio, cx, y0 + 0.055, cz, g).material = M.aluminio;
  if (ctx.hi) {
    for (let i = 0; i < 7; i++) {
      const tx = cx - 0.03 + (i % 4) * 0.02, tz = cz - 0.02 + Math.floor(i / 4) * 0.03;
      const t = cyl(0.003, 0.003, 0.18, i % 3 ? M.inox : M.madeiraClara, tx, y0 + 0.12, tz, g, 6); t.rotation.z = (i - 3) * 0.05;
    }
    // pratos em pé e um copo/caneca
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.012, 32), [M.ceramica, M.pratos[i % 6], M.ceramica]);
      p.rotation.z = Math.PI / 2; p.rotation.y = 0.08; p.position.set(-hw + 0.13 + i * 0.045, y0 + 0.11, 0.03); p.castShadow = true; g.add(p);
    }
    const cup = cyl(0.04, 0.035, 0.09, M.esmalte, hw - 0.06, y0 + 0.045, -hd + 0.06, g, 18); cup.rotation.x = Math.PI;
  }
  return g;
};

/** Armário baixo em madeira de demolição (copa): portas + gavetas, tampo de madeira escura. */
B.armarioBaixo = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  const plinth = 0.08, top = 0.035, carcH = H - plinth - top;
  box(W - 0.04, plinth, D - 0.08, M.escuro, 0, plinth / 2, 0.03, g);
  box(W - 0.02, carcH, D - 0.03, M.madeira, 0, plinth + carcH / 2, 0.01, g);
  box(W, top, D, M.madeiraEscura, 0, H - top / 2, 0, g);
  if (ctx.hi) {
    drawPanels(g, M, cabinetSpec(it, ctx.items).panels, -D / 2 + 0.012);
  }
  return g;
};

// ---------- pequenos objetos ----------
function jar(parent, M, x, y, z, r, h, content) {
  const glass = cyl(r, r, h, M.vidro, x, y + h / 2, z, parent, 16); glass.castShadow = false;
  cyl(r * 0.88, r * 0.88, h * 0.72, content, x, y + h * 0.37, z, parent, 14);
  cyl(r * 1.04, r * 1.04, 0.018, M.madeiraClara, x, y + h + 0.009, z, parent, 16);
}
function kettle(parent, M, x, y, z, mat = M.esmalte, s = 1) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.085 * s, 24, 16), mat); b.scale.y = 0.8; b.position.set(x, y + 0.068 * s, z); b.castShadow = true; parent.add(b);
  cyl(0.012 * s, 0.02 * s, 0.02 * s, M.ferroPreto, x, y + 0.14 * s, z, parent, 12);
  tube([[x - 0.07 * s, y + 0.06 * s, z], [x - 0.12 * s, y + 0.1 * s, z], [x - 0.15 * s, y + 0.13 * s, z]], 0.01 * s, mat, parent);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.06 * s, 0.006 * s, 6, 20, Math.PI), M.ferroPreto); h.position.set(x, y + 0.13 * s, z); parent.add(h);
}
function pot(parent, M, x, y, z, r = 0.1, mat = M.ferroPreto) {
  cyl(r, r * 0.95, 0.1, mat, x, y + 0.05, z, parent, 24);
  cyl(r * 1.02, r * 1.02, 0.01, mat, x, y + 0.105, z, parent, 24);
  cyl(0.012, 0.012, 0.02, M.madeiraClara, x, y + 0.12, z, parent, 10);
  for (const sx of [-1, 1]) box(0.04, 0.012, 0.02, mat, x + sx * (r + 0.015), y + 0.08, z, parent);
}
function fruitBowl(parent, M, x, y, z, r = 0.13, mat = M.madeiraEscura) {
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat);
  bowl.scale.y = 0.45; bowl.position.set(x, y + r * 0.45, z); bowl.material.side = THREE.DoubleSide; bowl.castShadow = true; parent.add(bowl);
  const fr = [[0, 0.03, 0, 0.04], [0.05, 0.03, 0.03, 0.035], [-0.05, 0.03, 0.02, 0.037], [0.02, 0.07, -0.03, 0.033], [-0.03, 0.065, -0.04, 0.03], [0.06, 0.06, -0.04, 0.03]];
  fr.forEach(([dx, dy, dz, rr], i) => { const f = new THREE.Mesh(new THREE.SphereGeometry(rr, 14, 10), M.frutas[i % M.frutas.length]); f.position.set(x + dx, y + dy + 0.02, z + dz); f.castShadow = true; parent.add(f); });
}
function herbs(parent, M, x, y, z, k = 1) {
  cyl(0.055 * k, 0.04 * k, 0.09 * k, M.barro, x, y + 0.045 * k, z, parent, 16);
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry((0.035 + (i % 3) * 0.008) * k, 0), M.folha);
    l.position.set(x + Math.cos(i * 1.7) * 0.03 * k, y + (0.11 + (i % 3) * 0.025) * k, z + Math.sin(i * 1.7) * 0.03 * k); l.castShadow = true; parent.add(l);
  }
}

/** Nichos abertos apoiados na bancada (temperos e itens "à mão"). */
B.nicho = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h), t = 0.02;
  box(W, H, 0.012, M.madeiraEscura, 0, H / 2, D / 2 - 0.006, g);
  box(W, t, D, M.madeira, 0, H - t / 2, 0, g);
  box(W, t, D, M.madeira, 0, t / 2, 0, g);
  const n = Math.max(1, Math.round(W / 0.35)), dw = W / n;
  for (let i = 0; i <= n; i++) box(t, H, D, M.madeira, -W / 2 + dw * i + (i === 0 ? t / 2 : i === n ? -t / 2 : 0), H / 2, 0, g);
  const one = (it.niveis ?? 2) === 1;            // 1 nível = só uma fileira de nichos, sem prateleira do meio
  const sh = H * 0.48;
  if (!one) box(W - 2 * t, 0.018, D - 0.015, M.madeira, 0, sh, 0.0075, g);
  if (ctx.hi) {
    const levels = one ? [[0, t, Math.min(0.16, H - 2 * t - 0.03)]] : [[0, t, Math.min(0.16, sh - t - 0.04)], [1, sh + 0.009, Math.min(0.13, H - sh - t - 0.04)]];
    for (let i = 0; i < n; i++) {
      const cx = -W / 2 + dw * (i + 0.5), k = Math.max(1, Math.floor((dw - 0.05) / 0.07));
      for (const [lvl, y0, hh] of levels) {
        if (hh < 0.05) continue;
        for (let j = 0; j < k; j++) jar(g, M, cx - (k - 1) * 0.035 + j * 0.07, y0, 0, 0.026, hh, M.temperos[(i * 5 + j * 2 + lvl) % M.temperos.length]);
      }
    }
  }
  return g;
};

B.interfone = (it, M, ctx) => {
  // vídeo-porteiro: monitor com tela, alto-falante e botões
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h), z = D / 2 - 0.015;
  box(W, H, 0.03, M.branco, 0, H / 2, z, g);
  const tela = box(W * 0.62, H * 0.6, 0.004, M.vidroPreto, -W * 0.12, H * 0.58, z - 0.016, g);
  if (ctx.hi) {
    tela.material = M.telaInterfone;
    for (let i = 0; i < 4; i++) box(0.014, 0.01, 0.005, M.escuro, W * 0.33, H * 0.78 - i * 0.03, z - 0.017, g);
    for (let i = 0; i < 5; i++) box(W * 0.5, 0.002, 0.004, M.escuro, -W * 0.12, H * 0.13 + i * 0.006, z - 0.016, g);
  }
  return g;
};

/** Tomada dupla padrão brasileiro (placa 4×2 vertical, dois módulos NBR 14136). */
B.tomada = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h), z = D / 2 - 0.004;
  box(W, H, 0.008, M.branco, 0, H / 2, z, g);
  if (ctx.hi) {
    for (const dy of [-H * 0.22, H * 0.22]) {
      const rec = cyl(0.019, 0.019, 0.004, M.ceramica, 0, H / 2 + dy, z - 0.005, g, 6); rec.rotation.x = Math.PI / 2; rec.rotation.y = Math.PI / 6;
      for (const [hx, hy] of [[-0.006, 0.003], [0.006, 0.003], [0, -0.007]]) { const h = cyl(0.0022, 0.0022, 0.003, M.escuro, hx, H / 2 + dy + hy, z - 0.0075, g, 8); h.rotation.x = Math.PI / 2; }
    }
  }
  return g;
};

B.ganchos = (it, M, ctx) => {
  // barra com ganchos: variante 'panos' (pano de prato/toalha) ou 'utensilios' (colheres, concha, espátula)
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h), z = D / 2 - 0.035, top = H - 0.02;
  const rail = cyl(0.008, 0.008, W, M.ferroPreto, 0, top, z, g, 10); rail.rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) box(0.015, 0.03, 0.04, M.ferroPreto, sx * (W / 2 - 0.02), top, z + 0.015, g);
  const n = Math.max(2, Math.round(W / (it.variante === 'panos' ? 0.15 : 0.11)));
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + (W / n) * (i + 0.5);
    tube([[x, top, z], [x, top - 0.035, z - 0.005], [x, top - 0.045, z - 0.02], [x, top - 0.03, z - 0.028]], 0.003, M.latao, g);
    if (!ctx.hi && it.variante !== 'panos') continue;
    if (it.variante === 'panos') {
      const len = i % 2 ? 0.4 : 0.32, pano = box(0.2, len, 0.006, M.tecidos[i % M.tecidos.length], x, top - 0.045 - len / 2, z - 0.015, g);
      pano.rotation.x = 0.04; pano.rotation.z = (i % 2 ? 1 : -1) * 0.03;
    } else {
      const kind = i % 4, y0 = top - 0.045;
      if (kind === 0 || kind === 2) { // colher de pau
        cyl(0.007, 0.007, 0.24, M.madeiraClara, x, y0 - 0.12, z - 0.02, g, 8);
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), M.madeiraClara); b.scale.set(0.8, 1.2, 0.3); b.position.set(x, y0 - 0.27, z - 0.02); g.add(b);
      } else if (kind === 1) { // concha
        cyl(0.005, 0.005, 0.24, M.inox, x, y0 - 0.12, z - 0.02, g, 8);
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.inox); b.position.set(x, y0 - 0.235, z - 0.035); b.rotation.x = -0.4; b.material.side = THREE.DoubleSide; g.add(b);
      } else { // espátula
        cyl(0.007, 0.007, 0.2, M.madeiraEscura, x, y0 - 0.1, z - 0.02, g, 8);
        box(0.06, 0.08, 0.006, M.madeiraClara, x, y0 - 0.24, z - 0.02, g);
      }
    }
  }
  return g;
};

B.acessorios = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d);
  const v = it.variante || 'bancada';
  if (v === 'bancada') {
    const tb = box(0.36, 0.26, 0.02, M.madeiraClara, -W / 2 + 0.19, 0.13, D / 2 - 0.04, g); tb.rotation.x = -0.15;
    cyl(0.055, 0.05, 0.15, M.barro, -W / 2 + 0.12, 0.075, -D / 2 + 0.08, g, 18);
    for (let i = 0; i < 4; i++) { const c = cyl(0.006, 0.006, 0.3, M.madeiraClara, -W / 2 + 0.12 + (i - 1.5) * 0.015, 0.2, -D / 2 + 0.08 + (i % 2) * 0.012, g, 6); c.rotation.z = (i - 1.5) * 0.12; }
    if (ctx.hi) [0.16, 0.12, 0.2].forEach((h, i) => jar(g, M, 0.02 + i * 0.075, 0, 0.0, 0.032, h, M.temperos[(i + 4) % M.temperos.length]));
    fruitBowl(g, M, W / 2 - 0.13, 0, -0.01);
  } else if (v === 'ervas') {
    // no peitoril do janelão: vasos centrados na faixa livre entre a borda interna e o caixilho
    const onSill = (it.elev || 0) >= 100, zoff = onSill ? cm(wallDistBehind(it)) + 0.04 : 0;
    const n = Math.max(1, Math.round(W / 0.2));
    for (let i = 0; i < n; i++) herbs(g, M, -W / 2 + (W / n) * (i + 0.5), 0, zoff, onSill ? 0.8 : 1);
  } else if (v === 'mesa') {
    fruitBowl(g, M, -0.06, 0, 0, 0.14, M.madeiraClara);
    cyl(0.045, 0.06, 0.2, M.barro, 0.12, 0.1, 0, g, 18);
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26; tube([[0.12, 0.18, 0], [0.12 + Math.cos(a) * 0.04, 0.3, Math.sin(a) * 0.04]], 0.003, M.folha, g);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), M.frutas[i % 3 === 0 ? 2 : 1]); fl.position.set(0.12 + Math.cos(a) * 0.045, 0.31, Math.sin(a) * 0.045); g.add(fl);
    }
  }
  return g;
};

/** Cabo do eletroportátil até a tomada mais próxima na parede de trás (mesmo plano), com plugue. */
function caboTomada(g, it, M, ctx, y0, socket = 0) {
  const outs = (ctx.items || []).filter((o) => o.kind === 'tomada' && o.rot === it.rot)
    .map((o) => ({ o, l: toLocal(it, o) })).filter(({ l }) => l.y > 0 && l.y < it.d / 2 + 60 && Math.abs(l.x) < 90)
    .sort((a, b) => Math.abs(a.l.x) - Math.abs(b.l.x));
  if (!outs.length) return;
  const { o, l } = outs[0];
  const px = cm(l.x), pz = cm(l.y) - 0.012, py = cm((o.elev || 0) + o.h / 2 - (it.elev || 0)) + (socket ? -0.026 : 0.026);
  const D = cm(it.d);
  tube([[0, y0, D / 2 - 0.01], [0, 0.008, D / 2 + 0.03], [px * 0.5, 0.006, (D / 2 + pz) / 2 + 0.01], [px, 0.008, pz - 0.03], [px, Math.max(0.02, py - 0.04), pz - 0.012], [px, py - 0.012, pz - 0.008]], 0.0028, M.cabo, g);
  box(0.022, 0.03, 0.026, M.cabo, px, py, pz - 0.006, g);
}

B.eletroportatil = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  if (it.variante === 'liquidificador') {
    // base de inox escovado com seletor; copo de vidro quadrado-arredondado com alça, tampa e lâminas
    const bh = 0.13;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, bh, 4, 1), M.inoxEscovado);
    base.rotation.y = Math.PI / 4; base.position.y = bh / 2; base.scale.set(W / 0.2, 1, D / 0.2); base.castShadow = base.receiveShadow = true; g.add(base);
    const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.093, 0.093, 0.012, 4, 1), M.plasticoFosco); pe.rotation.y = Math.PI / 4; pe.position.y = 0.006; pe.scale.copy(base.scale); g.add(pe);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.012, 4, 1), M.plasticoPreto); top.rotation.y = Math.PI / 4; top.position.y = bh + 0.006; top.scale.copy(base.scale); g.add(top);
    // painel frontal com seletor e botões
    const fz = -0.064 * (D / 0.2);
    const pn = box(0.09, 0.06, 0.004, M.plasticoPreto, 0, 0.07, fz, g); pn.rotation.x = -0.12;
    const kn = cyl(0.018, 0.02, 0.018, M.inoxEscovado, 0, 0.072, fz - 0.012, g, 24); kn.rotation.x = Math.PI / 2 - 0.12;
    box(0.004, 0.014, 0.004, M.plasticoPreto, 0, 0.082, fz - 0.022, g);
    for (const sx of [-1, 1]) { const b = cyl(0.007, 0.007, 0.006, M.plasticoFosco, sx * 0.034, 0.06, fz - 0.004, g, 12); b.rotation.x = Math.PI / 2; }
    cyl(0.003, 0.003, 0.002, M.ledVerde, 0.03, 0.09, fz - 0.003, g, 8).rotation.x = Math.PI / 2;
    // copo: perfil afunilado, seção quadrada arredondada (superelipse)
    const jh = H - bh - 0.06, j0 = bh + 0.012;
    const jg = new THREE.CylinderGeometry(0.068, 0.052, jh, 48, 8, true);
    const jp = jg.attributes.position;
    for (let i = 0; i < jp.count; i++) {
      const x = jp.getX(i), z = jp.getZ(i), a = Math.atan2(z, x), n = 4;
      const k = 1 / Math.pow(Math.pow(Math.abs(Math.cos(a)), n) + Math.pow(Math.abs(Math.sin(a)), n), 1 / n);
      jp.setXYZ(i, x * k, jp.getY(i), z * k);
    }
    jg.computeVertexNormals();
    const jar = new THREE.Mesh(jg, M.copo); jar.position.y = j0 + jh / 2; jar.renderOrder = 2; g.add(jar);
    const fundo = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.025, 4, 1), M.plasticoPreto); fundo.rotation.y = Math.PI / 4; fundo.position.y = j0 + 0.012; g.add(fundo);
    for (let k = 0; k < 4; k++) { const lam = box(0.07, 0.002, 0.012, M.inoxEscovado, 0, j0 + 0.032 + (k % 2) * 0.006, 0, g); lam.rotation.set(k % 2 ? 0.3 : -0.3, (k * Math.PI) / 4, 0); }
    // tampa e sobretampa dosadora
    const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.072, 0.025, 4, 1), M.plasticoPreto); tp.rotation.y = Math.PI / 4; tp.position.y = j0 + jh + 0.012; tp.castShadow = true; g.add(tp);
    cyl(0.022, 0.022, 0.02, M.plasticoPreto, 0, j0 + jh + 0.034, 0, g, 20);
    // alça lateral (lado direito de quem olha) e marcações de medida no copo
    tube([[0.06, j0 + jh - 0.02, 0], [0.105, j0 + jh - 0.035, 0], [0.11, j0 + jh * 0.5, 0], [0.1, j0 + 0.05, 0], [0.055, j0 + 0.035, 0]], 0.009, M.plasticoPreto, g);
    for (let k = 1; k <= 5; k++) { const yy = j0 + 0.03 + k * (jh - 0.05) / 6, r = 0.052 + (0.068 - 0.052) * ((yy - j0) / jh); box(0.012 + (k % 2) * 0.008, 0.0015, 0.001, M.cabo, -r * 0.35, yy, -r - 0.001, g); }
    // um pouco de suco de laranja no copo
    if (ctx.hi) { const sj = new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.053, 0.07, 32), M.frutas[0]); sj.position.y = j0 + 0.04 + 0.035; sj.material = sj.material.clone(); sj.material.transparent = true; sj.material.opacity = 0.75; g.add(sj); }
    caboTomada(g, it, M, ctx, 0.03, 0);
  } else {
    // sanduicheira/grill: base e tampa de plástico preto com placa de inox, dobradiça atrás, alça na frente, luzes
    const hb = H * 0.48, ht = H * 0.42;
    const base = new THREE.Mesh(roundedBox(W, hb, D, 0.035), M.plasticoPreto); base.position.y = hb / 2; base.castShadow = base.receiveShadow = true; g.add(base);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.008, 0.008, 0.008, M.plasticoFosco, sx * (W / 2 - 0.04), 0.004, sz * (D / 2 - 0.04), g, 10);
    box(W - 0.02, 0.006, D - 0.02, M.antiaderente, 0, hb + 0.003, 0, g);                       // fresta entre as placas
    const lid = new THREE.Group(); lid.position.set(0, hb + 0.006, D / 2 - 0.02); g.add(lid);    // articulada na dobradiça de trás
    const tg = roundedBox(W, ht, D, 0.035), tpos = tg.attributes.position;
    for (let i = 0; i < tpos.count; i++) if (tpos.getY(i) > 0) { const x = tpos.getX(i) / (W / 2), z = tpos.getZ(i) / (D / 2); tpos.setY(i, tpos.getY(i) + 0.012 * (1 - x * x) * (1 - z * z)); } // tampa abaulada
    tg.computeVertexNormals();
    const tm = new THREE.Mesh(tg, M.plasticoPreto); tm.position.set(0, ht / 2, -D / 2 + 0.02); tm.castShadow = true; lid.add(tm);
    const plate = new THREE.Mesh(roundedBox(W * 0.7, 0.004, D * 0.62, 0.025), M.inoxEscovado); plate.position.set(0, ht + 0.012, -D / 2 + 0.03); lid.add(plate);
    const hd = box(0.1, 0.022, 0.05, M.plasticoPreto, 0, ht * 0.55, -D - 0.005, lid); hd.rotation.x = 0.1;      // alça/trava frontal
    box(0.1, 0.012, 0.02, M.plasticoFosco, 0, ht * 0.25, -D - 0.022, lid);
    for (const [sx, m] of [[-0.022, M.ledVermelho], [0.022, M.ledVerde]]) cyl(0.004, 0.004, 0.003, m, sx, ht + 0.012, -D / 2 - D * 0.36, lid, 10);
    for (const sx of [-1, 1]) cyl(0.012, 0.012, 0.03, M.plasticoFosco, sx * (W / 2 - 0.05), 0, 0.004, lid, 12).rotation.z = Math.PI / 2; // dobradiças
    caboTomada(g, it, M, ctx, 0.02, 1);
  }
  return g;
};

B.cristaleira = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h), t = 0.025;
  box(W, t, D, M.madeira, 0, t / 2, 0, g);
  box(W + 0.04, t + 0.01, D + 0.02, M.madeiraEscura, 0, H - (t + 0.01) / 2, 0, g);
  box(t, H, D, M.madeira, -W / 2 + t / 2, H / 2, 0, g);
  box(t, H, D, M.madeira, W / 2 - t / 2, H / 2, 0, g);
  box(W, H, 0.012, M.madeira, 0, H / 2, D / 2 - 0.006, g);
  box(W - 2 * t, 0.015, D - 0.03, M.vidro, 0, H / 2, 0.005, g);
  const n = Math.max(2, Math.round(W / 0.45)), dw = (W - 2 * t) / n;
  for (let i = 0; i < n; i++) {
    const cx = -W / 2 + t + dw * (i + 0.5);
    const fr = new THREE.Group(); g.add(fr);
    box(dw - 0.004, H - 2 * t, 0.008, M.vidro, cx, H / 2, -D / 2 + 0.01, fr);
    for (const yy of [t + 0.012, H - t - 0.012]) box(dw - 0.004, 0.024, 0.02, M.madeira, cx, yy, -D / 2 + 0.01, fr);
    for (const xx of [cx - dw / 2 + 0.014, cx + dw / 2 - 0.014]) box(0.024, H - 2 * t, 0.02, M.madeira, xx, H / 2, -D / 2 + 0.01, fr);
    if (ctx.hi) knob(g, M, cx + (i % 2 ? -1 : 1) * (dw / 2 - 0.035), H / 2 - 0.08, -D / 2 + 0.002, 0.014);
  }
  if (ctx.hi) {
    // louças e taças dentro
    for (let i = 0; i < Math.floor(W / 0.12); i++) {
      const x = -W / 2 + 0.08 + i * 0.12;
      const p = cyl(0.09, 0.09, 0.012, M.pratos[i % 6], x, t + 0.1, D / 2 - 0.05, g, 28); p.rotation.x = -Math.PI / 2 + 0.15;
      const glass = cyl(0.03, 0.02, 0.12, M.vidro, x + 0.03, H / 2 + 0.07, -0.01, g, 12); glass.castShadow = false;
    }
  }
  return g;
};

B.prateleira = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  box(W, H, D, M.madeiraEscura, 0, H / 2, 0, g);
  for (const sx of [-1, 1]) {
    box(0.025, 0.18, 0.02, M.ferroPreto, sx * (W / 2 - 0.12), -0.09, D / 2 - 0.01, g);
    box(0.025, 0.02, D - 0.02, M.ferroPreto, sx * (W / 2 - 0.12), -0.01, 0, g);
  }
  if (ctx.hi) {
    const mats = [M.barro, M.vidro, M.branco, M.barro, M.latao];
    for (let i = 0; i < Math.floor(W / 0.2); i++) {
      const r = 0.04 + (i % 3) * 0.01, hh = 0.1 + (i % 4) * 0.04;
      cyl(r, r, hh, mats[i % mats.length], -W / 2 + 0.12 + i * 0.2, H + hh / 2, 0, g, 16);
    }
  }
  return g;
};

B.coifa = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  const band = 0.12;
  box(W + 0.04, band, D + 0.02, M.madeiraEscura, 0, band / 2, -0.01, g);
  const fr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, Math.SQRT1_2, 1, 4, 1, false), M.reboco);
  fr.rotation.y = Math.PI / 4; fr.scale.set(W * 0.98, H - band, D * 0.98); fr.position.y = band + (H - band) / 2; fr.castShadow = true; g.add(fr);
  const world = localToPlan(it, 0, 0);
  const ductH = cm(roofZ(world.x)) - cm(it.elev) - H;
  if (ductH > 0) cyl(0.08, 0.08, ductH, M.inox, 0, H + ductH / 2, 0.05, g, 16);
  void ctx; return g;
};

function legBetween(parent, mat, a, b, rTop, rBot) {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), len = A.distanceTo(Bv);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, 14), mat);
  m.position.copy(A).add(Bv).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), A.clone().sub(Bv).normalize());
  m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
function roundedRectShape(w0, w1, d, r) { // trapézio arredondado: frente (y+) largura w0, fundo largura w1
  const s = new THREE.Shape(), hf = w0 / 2, hb = w1 / 2, hd = d / 2;
  s.moveTo(-hb + r, -hd); s.lineTo(hb - r, -hd); s.quadraticCurveTo(hb, -hd, hb, -hd + r);
  s.lineTo(hf, hd - r); s.quadraticCurveTo(hf, hd, hf - r, hd); s.lineTo(-hf + r, hd);
  s.quadraticCurveTo(-hf, hd, -hf, hd - r); s.lineTo(-hb, -hd + r); s.quadraticCurveTo(-hb, -hd, -hb + r, -hd);
  return s;
}
function chairProto(M) {
  const c = new THREE.Group(), wood = M.cadeira, seatY = 0.45;
  // Assento de compensado moldado, grosso (~3 cm), sem saia; relevo ergonômico: duas cavidades para as coxas
  // com uma crista no meio (frente) e o fundo rebaixado para o quadril.
  const sT = 0.032, sY0 = seatY - 0.022;                                            // espessura, face de baixo
  const dish = (x, y) => {                                                        // y > 0 = frente
    const g = (dx, dy, sx2, sy2) => Math.exp(-(dx * dx) / sx2 - (dy * dy) / sy2);
    return 0.016 * (g(x - 0.085, y - 0.03, 0.0042, 0.018) + g(x + 0.085, y - 0.03, 0.0042, 0.018)) + 0.012 * g(x, y + 0.07, 0.018, 0.007);
  };
  const sg = new TessellateModifier(0.02, 10).modify(new THREE.ExtrudeGeometry(roundedRectShape(0.43, 0.38, 0.41, 0.07), { depth: sT, bevelEnabled: false, curveSegments: 12 }));
  {
    const pos = sg.attributes.position, nor = sg.attributes.normal, uv = sg.attributes.uv, zt = new Float32Array(pos.count), e = 0.002;
    for (let i = 0; i < pos.count; i++) { zt[i] = pos.getZ(i); if (zt[i] > sT - 1e-5) pos.setZ(i, sT - dish(pos.getX(i), pos.getY(i))); }
    const n = new THREE.Vector3(), va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 3) {
      const cap = Math.abs(zt[i] - zt[i + 1]) < 1e-5 && Math.abs(zt[i] - zt[i + 2]) < 1e-5;
      if (cap) {
        const sgn = zt[i] > sT / 2 ? 1 : -1, ax = pos.getX(i), ay = pos.getY(i);
        const cz = (pos.getX(i + 1) - ax) * (pos.getY(i + 2) - ay) - (pos.getY(i + 1) - ay) * (pos.getX(i + 2) - ax);
        if (Math.sign(cz) !== sgn) for (const at of [pos, uv, nor]) for (let c2 = 0; c2 < at.itemSize; c2++) {
          const t = at.array[(i + 1) * at.itemSize + c2]; at.array[(i + 1) * at.itemSize + c2] = at.array[(i + 2) * at.itemSize + c2]; at.array[(i + 2) * at.itemSize + c2] = t;
        }
        for (let k = 0; k < 3; k++) {
          const x = pos.getX(i + k), y = pos.getY(i + k);
          if (sgn > 0) n.set((dish(x + e, y) - dish(x - e, y)) / (2 * e), (dish(x, y + e) - dish(x, y - e)) / (2 * e), 1).normalize(); else n.set(0, 0, -1);
          nor.setXYZ(i + k, n.x, n.y, n.z);
        }
      } else {
        va.fromBufferAttribute(pos, i); vb.fromBufferAttribute(pos, i + 1); vc.fromBufferAttribute(pos, i + 2);
        n.subVectors(vc, vb).cross(va.clone().sub(vb)).normalize();
        for (let k = 0; k < 3; k++) nor.setXYZ(i + k, n.x, n.y, n.z);
      }
    }
    nor.needsUpdate = true;
  }
  const seat = new THREE.Mesh(sg, wood);
  seat.rotation.x = -Math.PI / 2; seat.position.y = sY0; seat.castShadow = seat.receiveShadow = true; c.add(seat);
  // pernas dianteiras cônicas (grossas em cima, finas embaixo), abertas para frente e para os lados
  const FL = (sx, y) => { const t = 1 - y / sY0; return [sx * (0.172 + 0.026 * t), y, -0.16 - 0.045 * t]; };
  for (const sx of [-1, 1]) legBetween(c, wood, FL(sx, sY0 + 0.005), FL(sx, 0), 0.016, 0.0105);
  // montantes traseiros: do chão (abertos para trás) até o alto do encosto, inclinados para trás acima do assento
  const tilt = 0.155, PX = 0.165;
  const RL = (sx, y) => { const t = 1 - y / sY0; return [sx * (PX + 0.022 * t), y, 0.17 + 0.075 * t]; };
  for (const sx of [-1, 1]) {
    legBetween(c, wood, RL(sx, sY0 + 0.005), RL(sx, 0), 0.016, 0.0105);
    tube([[sx * PX, sY0 - 0.01, 0.168], [sx * PX, 0.62, 0.17 + 0.17 * Math.tan(tilt)], [sx * PX, 0.765, 0.17 + 0.315 * Math.tan(tilt)]], 0.016, wood, c);
  }
  // arcos de madeira curvada (como nas cadeiras reais): um na frente, entre as pernas dianteiras, e um de cada
  // lado, da perna dianteira à traseira, passando logo abaixo do assento
  const fa = FL(1, 0.25), fb = FL(1, 0.3), rb = RL(1, 0.17);
  tube([[-fa[0] + 0.004, 0.25, fa[2] + 0.013], [-0.15, 0.36, fa[2] + 0.02], [0, 0.405, fa[2] + 0.028], [0.15, 0.36, fa[2] + 0.02], [fa[0] - 0.004, 0.25, fa[2] + 0.013]], 0.0105, wood, c);
  for (const sx of [-1, 1]) {
    const xi = sx * (fb[0] - 0.012);
    tube([[xi, 0.3, fb[2] + 0.012], [xi, 0.385, -0.1], [sx * (PX - 0.002), 0.41, 0.0], [sx * (PX - 0.004), 0.37, 0.1], [sx * (rb[0] - 0.013), 0.17, rb[2] - 0.008]], 0.0105, wood, c);
  }
  // ponteiras (sapatas de feltro/metal) nos pés
  for (const p of [FL(-1, 0), FL(1, 0), RL(-1, 0), RL(1, 0)]) cyl(0.0105, 0.0105, 0.006, M.aluminio, p[0], 0.003, p[2], c, 12);
  // Encosto (fotos das cadeiras reais): lâmina de compensado bem curvada em planta, mais larga que os montantes
  // na faixa de cima (cantos arredondados, topo levemente em arco), parafusada na frente dos montantes;
  // recorte central em "feijão" (alça) e dois recortes laterais grandes, por onde os montantes aparecem.
  const sh = new THREE.Shape(), hw = 0.18, tw = 0.228, H0 = 0.3;
  sh.moveTo(-hw, 0); sh.lineTo(hw, 0);
  sh.lineTo(hw, 0.17); sh.bezierCurveTo(hw, 0.2, tw, 0.2, tw, 0.225);            // ombro: alarga para a faixa de cima
  sh.lineTo(tw, H0 - 0.045); sh.quadraticCurveTo(tw, H0 - 0.006, tw - 0.045, H0 - 0.004);
  sh.quadraticCurveTo(0, H0 + 0.012, -(tw - 0.045), H0 - 0.004);
  sh.quadraticCurveTo(-tw, H0 - 0.006, -tw, H0 - 0.045); sh.lineTo(-tw, 0.225);
  sh.bezierCurveTo(-tw, 0.2, -hw, 0.2, -hw, 0.17); sh.lineTo(-hw, 0);
  // recorte central em feijão: fundo arredondado, borda de cima com uma "dobra" para baixo no meio
  const bean = new THREE.Path(), by = 0.245;
  bean.moveTo(-0.036, by + 0.012);
  bean.quadraticCurveTo(-0.018, by + 0.022, 0, by + 0.008); bean.quadraticCurveTo(0.018, by + 0.022, 0.036, by + 0.012);
  bean.bezierCurveTo(0.05, by - 0.004, 0.03, by - 0.03, 0, by - 0.03); bean.bezierCurveTo(-0.03, by - 0.03, -0.05, by - 0.004, -0.036, by + 0.012);
  sh.holes.push(bean);
  for (const sx of [-1, 1]) {                                                      // recortes laterais (rim)
    const x0 = sx * 0.088, x1 = sx * 0.172, y0 = 0.045, y1 = 0.175, r = 0.028, side = new THREE.Path();
    const L = Math.min(x0, x1), R = Math.max(x0, x1);
    side.moveTo(L + r, y0); side.lineTo(R - r * 0.6, y0); side.quadraticCurveTo(R, y0, R, y0 + r);
    side.lineTo(R, y1 - r); side.quadraticCurveTo(R, y1, R - r * 0.6, y1); side.lineTo(L + r, y1);
    side.quadraticCurveTo(L + 0.008, y1, L + 0.012, (y0 + y1) / 2 + 0.02); side.quadraticCurveTo(L + 0.016, y0, L + r, y0);
    sh.holes.push(side);
  }
  const bend = 1.6, thick = 0.011;
  // extrusão subdividida (triângulos ≤ 2,2 cm) para a curvatura ficar lisa; normais analíticas nas faces
  const bg = new TessellateModifier(0.022, 10).modify(new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 20 }));
  const pos = bg.attributes.position, nor = bg.attributes.normal, z0 = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); z0[i] = pos.getZ(i); pos.setZ(i, z0[i] - bend * x * x); } // curva côncava para quem senta
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    if (Math.abs(z0[i] - z0[i + 1]) < 1e-5 && Math.abs(z0[i] - z0[i + 2]) < 1e-5) {          // face (frente/trás)
      const sg = z0[i] < thick / 2 ? -1 : 1;
      // a subdivisão inverte a ordem de alguns triângulos: reorienta para a face apontar para fora
      const ax = pos.getX(i), ay = pos.getY(i), cz = (pos.getX(i + 1) - ax) * (pos.getY(i + 2) - ay) - (pos.getY(i + 1) - ay) * (pos.getX(i + 2) - ax);
      if (Math.sign(cz) !== sg) for (const at of [pos, bg.attributes.uv, nor]) for (let c = 0; c < at.itemSize; c++) {
        const t = at.array[(i + 1) * at.itemSize + c]; at.array[(i + 1) * at.itemSize + c] = at.array[(i + 2) * at.itemSize + c]; at.array[(i + 2) * at.itemSize + c] = t;
      }
      for (let k = 0; k < 3; k++) { n.set(2 * bend * pos.getX(i + k), 0, 1).normalize().multiplyScalar(sg); nor.setXYZ(i + k, n.x, n.y, n.z); }
    } else {                                                                                   // borda da lâmina
      va.fromBufferAttribute(pos, i); vb.fromBufferAttribute(pos, i + 1); vc.fromBufferAttribute(pos, i + 2);
      n.subVectors(vc, vb).cross(va.clone().sub(vb)).normalize();
      for (let k = 0; k < 3; k++) nor.setXYZ(i + k, n.x, n.y, n.z);
    }
  }
  nor.needsUpdate = true;
  const backG = new THREE.Group(); backG.position.set(0, 0.54, 0); backG.rotation.x = tilt; c.add(backG);
  // face de trás da lâmina encostada na frente dos montantes (montante em z = 0.17 + y·tan(tilt) no plano inclinado)
  const zFront = 0.17 / Math.cos(tilt) - 0.016 - thick - 0.002 + bend * PX * PX;
  const back = new THREE.Mesh(bg, wood); back.position.z = zFront; back.castShadow = back.receiveShadow = true; backG.add(back);
  for (const sx of [-1, 1]) for (const y of [0.205, 0.275]) {                     // parafusos de fixação
    const sc = cyl(0.0045, 0.0045, 0.003, M.latao, sx * PX, y, zFront - bend * PX * PX - 0.002, backG, 10); sc.rotation.x = Math.PI / 2;
  }
  c.traverse((o) => { if (o.isMesh) o.userData.noEdges = true; });
  return c;
}
function chair(M, hi) {
  if (!hi) {
    const c = new THREE.Group(), seatY = 0.46;
    box(0.42, 0.04, 0.42, M.cadeira, 0, seatY, 0, c);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.03, seatY, 0.03, M.cadeira, sx * 0.17, seatY / 2, sz * 0.17, c);
    box(0.42, 0.25, 0.03, M.cadeira, 0, seatY + 0.28, 0.2, c);
    return c;
  }
  if (!M._chair) M._chair = chairProto(M);
  return M._chair.clone();
}

B.mesa = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  box(W, 0.045, D, M.mesa, 0, H - 0.0225, 0, g);
  if (ctx.hi) box(W - 0.06, 0.008, D - 0.06, M.vidro, 0, H + 0.004, 0, g);
  box(W - 0.16, 0.10, 0.025, M.mesa, 0, H - 0.095, -D / 2 + 0.06, g);
  box(W - 0.16, 0.10, 0.025, M.mesa, 0, H - 0.095, D / 2 - 0.06, g);
  box(0.025, 0.10, D - 0.16, M.mesa, -W / 2 + 0.06, H - 0.095, 0, g);
  box(0.025, 0.10, D - 0.16, M.mesa, W / 2 - 0.06, H - 0.095, 0, g);
  const legPts = ctx.hi
    ? [[0.03, 0], [0.035, 0.04], [0.025, 0.08], [0.03, 0.18], [0.04, 0.3], [0.028, 0.42], [0.032, 0.5], [0.024, 0.6], [0.035, 0.66], [0.035, H - 0.045]]
    : [[0.03, 0], [0.03, H - 0.045]];
  const legGeo = new THREE.LatheGeometry(legPts.map(([r, y]) => new THREE.Vector2(r, y)), ctx.hi ? 16 : 6);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const l = new THREE.Mesh(legGeo, M.mesa); l.position.set(sx * (W / 2 - 0.07), 0, sz * (D / 2 - 0.07)); l.castShadow = true; g.add(l);
  }
  // cadeiras
  const n = it.lugares ?? 8, perSide = Math.max(1, Math.floor((n - 2) / 2));
  const seats = [];
  for (let i = 0; i < perSide; i++) {
    const x = -W / 2 + (W / perSide) * (i + 0.5);
    seats.push([x, -D / 2 - 0.12, Math.PI], [x, D / 2 + 0.12, 0]);
  }
  seats.push([-W / 2 - 0.12, 0, -Math.PI / 2], [W / 2 + 0.12, 0, Math.PI / 2]);
  for (const [x, z, ry] of seats.slice(0, n)) {
    const c = chair(M, ctx.hi); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c);
  }
  return g;
};

B.buffet = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), D = cm(it.d), H = cm(it.h);
  const bodyY0 = 0.10, bodyH = H - bodyY0 - 0.035;
  photoBox(W - 0.06, bodyH, D - 0.05, M.buffet, M.buffetFrente, 0, bodyY0 + bodyH / 2, 0.01, g);
  box(W, 0.035, D, M.buffet, 0, H - 0.0175, 0, g);
  if (ctx.hi) box(W - 0.08, 0.006, D - 0.06, M.vidro, 0, H + 0.003, 0, g);
  box(W - 0.02, 0.045, D - 0.02, M.buffet, 0, bodyY0 - 0.0225 + 0.01, 0.005, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), M.buffet); f.scale.y = 0.9; f.position.set(sx * (W / 2 - 0.12), 0.04, sz * (D / 2 - 0.08)); f.castShadow = true; g.add(f);
  }
  return g;
};

B.cadeiraBalanco = (it, M, ctx) => {
  // Cadeira de balanço Thonet (madeira curvada + palhinha). Perfil lateral (z, y) com frente em −z.
  const g = new THREE.Group();
  const sx = cm(it.w) / 0.55, sz = cm(it.d) / 1.0, sy = cm(it.h) / 1.05;
  const P = (x, y, z) => [x * sx, y * sy, z * sz];
  const wood = M.balanco, R = 0.0135;
  const side = (x, pts, r = R) => tube(pts.map(([z, y, xx]) => P(xx ?? x, y, z)), r, wood, g);
  for (const s of [-1, 1]) {
    // peça contínua: voluta traseira → balancim → curva dianteira → laço → braço → encontra o montante
    side(0, [[0.37, 0.22, s * 0.255], [0.45, 0.29, s * 0.262], [0.52, 0.2, s * 0.265], [0.49, 0.09, s * 0.265], [0.34, 0.025, s * 0.265],
      [0.1, 0.004, s * 0.265], [-0.2, 0.004, s * 0.265], [-0.42, 0.03, s * 0.266], [-0.5, 0.11, s * 0.268], [-0.47, 0.22, s * 0.27],
      [-0.4, 0.34, s * 0.272], [-0.38, 0.5, s * 0.275], [-0.29, 0.63, s * 0.275], [-0.1, 0.705, s * 0.265], [0.1, 0.71, s * 0.24], [0.2, 0.67, s * 0.21]]);
    // montante traseiro: apoiado no balancim, passa atrás do assento e sobe até o encosto oval
    side(0, [[0.37, 0.22, s * 0.255], [0.3, 0.26, s * 0.245], [0.23, 0.35, s * 0.228], [0.19, 0.48, s * 0.21], [0.21, 0.62, s * 0.2], [0.245, 0.78, s * 0.195], [0.27, 0.92, s * 0.19]]);
    // laço dianteiro sob o assento
    side(0, [[-0.19, 0.43, s * 0.215], [-0.27, 0.32, s * 0.225], [-0.26, 0.17, s * 0.24], [-0.15, 0.06, s * 0.255], [-0.02, 0.012, s * 0.264], [0.08, 0.006, s * 0.265]], 0.012);
    // laço traseiro (sustenta o fundo do assento)
    side(0, [[0.16, 0.42, s * 0.21], [0.08, 0.3, s * 0.22], [0.1, 0.18, s * 0.235], [0.2, 0.12, s * 0.245], [0.27, 0.14, s * 0.25]], 0.011);
  }
  // travessas
  tube([P(-0.265, 0.022, -0.33), P(0.265, 0.022, -0.33)], 0.011, wood, g);
  tube([P(-0.262, 0.255, 0.42), P(0.262, 0.255, 0.42)], 0.011, wood, g);
  // aro decorativo entre assento e encosto
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.01, 8, 40), wood);
  ring.scale.set(sx * 1.55, sy * 0.8, 1); ring.position.set(0, 0.56 * sy, 0.19 * sz); ring.rotation.x = -0.25; ring.castShadow = true; g.add(ring);
  // assento: contorno arredondado (superelipse) com palhinha vazada e aro de madeira
  const seat = new THREE.Group(); seat.position.set(0, 0.45 * sy, -0.02 * sz); seat.rotation.x = 0.07; g.add(seat);
  const outline = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2, c = Math.cos(a), si = Math.sin(a);
    const e = 2 / 3.2; // superelipse n=3.2
    const fx = 0.225 * sx * Math.sign(c) * Math.pow(Math.abs(c), e), fz = 0.205 * sz * Math.sign(si) * Math.pow(Math.abs(si), e) * (si < 0 ? 1.05 : 0.95);
    outline.push(new THREE.Vector2(fx, fz));
  }
  addCanePanel(seat, outline, M, ctx, 'xz');
  // encosto oval alto inclinado para trás
  const back = new THREE.Group(); back.position.set(0, 0.8 * sy, 0.265 * sz); back.rotation.x = -0.2; g.add(back);
  const oval = [];
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; oval.push(new THREE.Vector2(Math.cos(a) * 0.2 * sx, Math.sin(a) * 0.27 * sy * (Math.sin(a) > 0 ? 1.0 : 0.95))); }
  addCanePanel(back, oval, M, ctx, 'xy');
  return g;
};

/** Painel de palhinha (vazada no 3D detalhado) com aro de madeira curvada. plane 'xz' (assento) ou 'xy' (encosto). */
function addCanePanel(parent, outline, M, ctx, plane) {
  const shape = new THREE.Shape(outline);
  const geo = new THREE.ShapeGeometry(shape, 24);
  const cane = new THREE.Mesh(geo, ctx.hi ? M.palhinhaVazada : M.palhinha);
  if (plane === 'xz') cane.rotation.x = -Math.PI / 2;
  cane.castShadow = true; cane.receiveShadow = true; cane.userData.noEdges = true;
  parent.add(cane);
  const to3 = (v, dy = 0) => (plane === 'xz' ? new THREE.Vector3(v.x, dy, -v.y) : new THREE.Vector3(v.x, v.y, dy));
  const rim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outline.map((v) => to3(v)), true), 96, 0.016, 8, true), M.balanco);
  rim.castShadow = true; rim.userData.noEdges = true; parent.add(rim);
  if (plane === 'xz') {
    const band = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outline.map((v) => to3(v.clone().multiplyScalar(0.97), -0.03)), true), 96, 0.012, 6, true), M.balanco);
    band.userData.noEdges = true; parent.add(band);
  }
}

// Arranjo copiado da foto da parede de pratos do usuário: [cx, cy, raio] em px da foto (área 745 × 490 a partir
// de (520, 15)), estilo de pintura e formato da peça.
const PRATOS_FOTO = [
  [583, 77, 58, 'ornamento', 'raso'], [687, 106, 42, 'passaro', 'raso'], [560, 174, 33, 'terracota', 'raso'],
  [643, 199, 53, 'vidro', 'raso'], [734, 267, 40, 'vidro', 'fundo'], [611, 298, 45, 'foto', 'raso'],
  [868, 95, 53, 'casas', 'raso'], [1003, 95, 53, 'casas', 'raso'], [1212, 92, 48, 'floralMarrom', 'ondulado'],
  [934, 243, 50, 'gato', 'raso'], [1086, 207, 42, 'aluminio', 'canelado'], [1201, 206, 42, 'bordaCinza', 'raso'],
  [1014, 307, 50, 'cachorro', 'raso'], [1197, 305, 42, 'bordaCinza', 'raso'], [775, 367, 48, 'creme', 'fundo'],
  [911, 381, 41, 'paisagem', 'raso'], [589, 431, 68, 'floralCinza', 'raso'], [723, 455, 48, 'esmaltado', 'fundo'],
  [834, 459, 50, 'creme', 'recortado'], [1025, 446, 50, 'carro', 'raso'], [1195, 403, 40, 'bordaCinza', 'raso'],
];
const plateGeoCache = new Map();
/** Prato por revolução (perfil real: pé, fundo, aba subindo, borda arredondada), UV planar frontal. Unidade: R = 1. */
function plateGeometry(forma) {
  if (plateGeoCache.has(forma)) return plateGeoCache.get(forma);
  const deep = forma === 'fundo', well = deep ? 0.55 : 0.6;
  const top = deep
    ? [[0, 0.03], [0.4, 0.03], [0.5, 0.06], [well, 0.14], [0.66, 0.2], [0.95, 0.24], [1, 0.245]]
    : [[0, 0.035], [0.5, 0.035], [well, 0.06], [0.66, 0.11], [0.95, 0.16], [1, 0.165]];
  const e = top[top.length - 1][1];
  const prof = [...top, [1.012, e - 0.012], [0.995, e - 0.03], [0.93, e - 0.04], [0.66, deep ? 0.12 : 0.075], [0.45, 0.025], [0.42, 0], [0.37, 0], [0.35, 0.018], [0, 0.018]];
  const geo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 72);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.hypot(x, z), ph = Math.atan2(x, z);
    if (forma === 'ondulado' && r > 0.85) { const k = 1 + 0.035 * Math.sin(ph * 14) * (r - 0.85) / 0.15; x *= k; z *= k; }
    if (forma === 'recortado' && r > 0.88) { const k = 1 - 0.03 * Math.abs(Math.sin(ph * 9)) * (r - 0.88) / 0.12; x *= k; z *= k; }
    if (forma === 'canelado' && r > 0.3) y += 0.035 * Math.cos(ph * 16) * Math.min(1, (r - 0.3) / 0.3);
    pos.setXYZ(i, x, y, z);
    uv.setXY(i, 0.5 - x / 2, 0.5 + z / 2);
  }
  geo.computeVertexNormals();
  plateGeoCache.set(forma, geo);
  return geo;
}
function plateMaterial(M, estilo, hi) {
  M._prato ||= {};
  if (M._prato[estilo]) return M._prato[estilo];
  let m;
  if (!hi) m = new THREE.MeshLambertMaterial({ color: { casas: 0xc3252c, aluminio: 0xc9ccce, vidro: 0xdfe6e8, paisagem: 0x7a8a52, terracota: 0xd9a35f }[estilo] ?? 0xf3efe6 });
  else if (estilo === 'aluminio') m = new THREE.MeshStandardMaterial({ color: 0xd9dbdd, metalness: 1, roughness: 0.3 });
  else if (estilo === 'vidro') m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: T.pratoArte('vidro'), roughness: 0.08, transparent: true, opacity: 0.55, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 });
  else m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: T.pratoArte(estilo), roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9 }); // louça esmaltada
  m.side = THREE.DoubleSide;
  M._prato[estilo] = m; return m;
}
B.pratos = (it, M, ctx) => {
  const g = new THREE.Group();
  const W = cm(it.w), H = cm(it.h), wallZ = cm(it.d) / 2;
  const sx = W / 745, sy = H / 490, sr = Math.min(sx, sy);
  const wire = M.ferroPreto;
  for (const [px, py, pr, estilo, forma] of PRATOS_FOTO) {
    const R = pr * sr * 0.97, x = W / 2 - (px - 520) * sx,   // eixo local X aponta para a esquerda de quem olha a parede
      y = H - (py - 15) * sy;
    const p = new THREE.Mesh(plateGeometry(forma), plateMaterial(M, estilo, ctx.hi));
    p.scale.setScalar(R); p.rotation.x = -Math.PI / 2; p.position.set(x, y, wallZ - 0.002);
    p.castShadow = true; p.receiveShadow = true; p.userData.noEdges = true; g.add(p);
    if (!ctx.hi) continue;
    // suporte de arame: 4 garras na borda + arame até o prego
    const rimZ = wallZ - 0.002 - R * (forma === 'fundo' ? 0.245 : 0.165);
    const claws = [Math.PI / 7, -Math.PI / 7, Math.PI - Math.PI / 5, Math.PI + Math.PI / 5];
    for (const a of claws) {
      const dx = Math.sin(a), dy = Math.cos(a);
      tube([[x + dx * R * 0.8, y + dy * R * 0.8, wallZ - 0.001], [x + dx * R * 1.04, y + dy * R * 1.04, wallZ - 0.008], [x + dx * R * 1.04, y + dy * R * 1.04, rimZ - 0.003], [x + dx * R * 0.93, y + dy * R * 0.93, rimZ - 0.001]], 0.0011, wire, g);
    }
    const nail = [x, y + R * 1.12, wallZ - 0.002];
    for (const a of claws.slice(0, 2)) tube([[x + Math.sin(a) * R * 1.03, y + Math.cos(a) * R * 1.03, wallZ - 0.005], nail], 0.001, wire, g);
    cyl(0.003, 0.003, 0.012, M.ferroPreto, nail[0], nail[1], wallZ - 0.006, g, 8).rotation.x = Math.PI / 2;
  }
  return g;
};

/** Constrói o grupo 3D de um item, posicionado/rotacionado em coordenadas de mundo. */
export function buildItem(it, M, ctx) {
  const fn = B[it.kind];
  const inner = fn ? fn(it, M, ctx) : box(cm(it.w), cm(it.h), cm(it.d), M.madeira, 0, cm(it.h) / 2, 0);
  const g = new THREE.Group();
  g.add(inner);
  g.position.set(cm(it.x), cm(it.elev || 0), cm(it.y));
  g.rotation.y = (-it.rot * Math.PI) / 180;
  g.userData.itemId = it.id;
  g.traverse((o) => { o.userData.itemId = it.id; });
  return g;
}

// ---------------------------------------------------------------- ambiente
export function buildRoom(M, hi) {
  const R = ROOM, root = new THREE.Group();
  const groups = { estrutura: new THREE.Group(), frente: new THREE.Group(), telhado: new THREE.Group(), externo: new THREE.Group(), luzes: new THREE.Group() };
  Object.values(groups).forEach((g) => root.add(g));
  const S = groups.estrutura, F = groups.frente, RF = groups.telhado, EX = groups.externo;
  const W = cm(R.W), D = cm(R.D);

  // piso + laje
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M.piso);
  floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0.001, D / 2); floor.receiveShadow = true;
  scaleUVPlane(floor.geometry, W, D, M.piso.userData.texSize); S.add(floor);
  box(W + 0.02, 0.15, D, M.calcada, W / 2, -0.075, D / 2, S);

  // parede da suíte (esquerda) — até o telhado
  box(0.2, cm(R.roofHigh) + 0.02, D + 0.2, M.parede, -0.1, cm(R.roofHigh) / 2, D / 2 + 0.1, S);

  // parede do fundo com porta e janela
  const bw = new THREE.Shape();
  bw.moveTo(-0.2, 0); bw.lineTo(W, 0); bw.lineTo(W, cm(R.roofLow)); bw.lineTo(-0.2, cm(roofZ(-20)) + 0.02); bw.closePath();
  const dr = R.door, wn = R.window;
  const hole = (x0, y0, x1, y1) => { const p = new THREE.Path(); p.moveTo(cm(x0), cm(y0)); p.lineTo(cm(x0), cm(y1)); p.lineTo(cm(x1), cm(y1)); p.lineTo(cm(x1), cm(y0)); p.closePath(); return p; };
  bw.holes.push(hole(dr.x0, 0.1, dr.x1, dr.h), hole(wn.x0, wn.sill, wn.x1, wn.top));
  const bwGeo = new THREE.ExtrudeGeometry(bw, { depth: 0.2, bevelEnabled: false });
  scaleUV(bwGeo, 1 / M.parede.userData.texSize);
  const bwm = new THREE.Mesh(bwGeo, M.parede); bwm.position.z = D; bwm.castShadow = bwm.receiveShadow = true; S.add(bwm);
  // porta (moldura de madeira + folha com vidro)
  const dx0 = cm(dr.x0), dx1 = cm(dr.x1), dh = cm(dr.h);
  box(0.06, dh, 0.22, M.madeiraEscura, dx0 + 0.03, dh / 2, D + 0.1, S);
  box(0.06, dh, 0.22, M.madeiraEscura, dx1 - 0.03, dh / 2, D + 0.1, S);
  box(dx1 - dx0, 0.06, 0.22, M.madeiraEscura, (dx0 + dx1) / 2, dh - 0.03, D + 0.1, S);
  box(dx1 - dx0 - 0.12, dh - 0.06, 0.04, M.madeiraEscura, (dx0 + dx1) / 2, (dh - 0.06) / 2, D + 0.15, S);
  box(dx1 - dx0 - 0.3, dh - 0.5, 0.045, M.vidro, (dx0 + dx1) / 2, dh / 2 + 0.05, D + 0.15, S);
  // janela existente (moldura escura)
  const wx0 = cm(wn.x0), wx1 = cm(wn.x1), wy0 = cm(wn.sill), wy1 = cm(wn.top);
  for (const x of [wx0 + 0.04, wx1 - 0.04]) box(0.08, wy1 - wy0, 0.24, M.madeiraEscura, x, (wy0 + wy1) / 2, D + 0.1, S);
  for (const y of [wy0 + 0.03, wy1 - 0.04]) box(wx1 - wx0, y === wy0 + 0.03 ? 0.06 : 0.08, 0.26, M.madeiraEscura, (wx0 + wx1) / 2, y, D + 0.1, S);
  box(wx1 - wx0 - 0.1, wy1 - wy0 - 0.1, 0.01, M.vidro, (wx0 + wx1) / 2, (wy0 + wy1) / 2, D + 0.12, S);
  box(0.03, wy1 - wy0 - 0.1, 0.04, M.madeiraEscura, (wx0 + wx1) / 2, (wy0 + wy1) / 2, D + 0.12, S);

  // azulejos antigos na parede da pia (contornando a janela), alinhados a partir do canto inferior esquerdo
  if (R.azulejos) {
    const A = R.azulejos, rep = cm(A.peca || 15) * 8;            // textura = 8 × 8 peças
    const area = { x0: cm(A.x0), x1: cm(A.x1), y0: cm(A.y0), y1: cm(A.y1) };
    const win = { x0: wx0, x1: wx1, y0: wy0, y1: wy1 };
    for (const r of subtractRects([area], win)) {
      const pg = new THREE.PlaneGeometry(r.x1 - r.x0, r.y1 - r.y0);
      pg.rotateY(Math.PI); pg.translate((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, D - 0.004);
      const pos = pg.attributes.position, uv = pg.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - area.x0) / rep, (pos.getY(i) - area.y0) / rep);
      const tm = new THREE.Mesh(pg, M.azulejo); tm.receiveShadow = true; S.add(tm);
    }
  }

  // lado direito
  const xr0 = cm(R.innerRight), xr1 = W, xw = xr1 - xr0, xc = (xr0 + xr1) / 2;
  const beamB = cm(R.beamBottom), wallH = cm(R.wallH);
  for (const seg of R.right) {
    const z0 = cm(seg.y0), z1 = cm(seg.y1), zl = z1 - z0, zc = (z0 + z1) / 2;
    if (seg.tipo === 'parede') {
      // a parede completa vai até a base da viga; a viga de madeira cobre a faixa superior (evita faces coplanares / z-fighting)
      box(xw, beamB, zl, M.parede, xc, beamB / 2, zc, S);
    } else if (seg.tipo === 'meia') {
      const mh = cm(seg.h);
      box(xw, mh, zl, M.parede, xc, mh / 2, zc, S);
      box(xw + 0.06, 0.05, zl, M.madeiraEscura, xc - 0.01, mh + 0.025, zc, S); // peitoril de demolição
      const cs = clearSpan(seg);
      janelao(S, M, xc, mh + 0.05, beamB, cm(cs.y0), cm(cs.y1), xw);
    } else if (seg.tipo === 'persiana') {
      const cs = clearSpan(seg);
      persiana(F, M, 'z', xc, cm(cs.y0), cm(cs.y1), beamB);
    }
  }
  // viga lateral: começa depois da viga frontal (z ≥ 0,20) e sobe até encostar no telhado (≈ +10 cm),
  // sem dividir faces com a viga da frente nem com o topo das paredes
  const sbH = wallH - beamB + 0.1;
  box(xw, sbH, D - 0.2, M.madeiraEscura, xc, beamB + sbH / 2, 0.2 + (D - 0.2) / 2, S);
  for (const p of R.pillars) {
    box(cm(p.x1 - p.x0) + 0.02, beamB, cm(p.y1 - p.y0) + 0.02, M.pilar, cm((p.x0 + p.x1) / 2) - 0.01, beamB / 2, cm((p.y0 + p.y1) / 2), S);
  }

  // frente: persiana de vidro + viga + triângulo em madeira
  persiana(F, M, 'x', cm(R.frontInner) / 2, 0.0, xr0, beamB);
  box(W + 0.2, wallH - beamB, 0.2, M.madeiraEscura, W / 2 - 0.1, (beamB + wallH) / 2, 0.1, F);
  const tri = new THREE.Shape();
  tri.moveTo(-0.2, wallH); tri.lineTo(W, wallH); tri.lineTo(-0.2, cm(roofZ(-20)));
  tri.closePath();
  const triGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: false });
  scaleUV(triGeo, 1 / M.madeiraClara.userData.texSize);
  const triM = new THREE.Mesh(triGeo, M.madeiraClara); triM.position.z = 0.06; triM.castShadow = triM.receiveShadow = true; F.add(triM);

  // telhado
  buildRoof(RF, M, hi);

  // externo
  buildExterior(EX, M, hi);

  // luminárias rústicas
  const pend = [[248, 120], [248, 220], [230, 470]];
  for (const [px, py] of pend) groups.luzes.add(pendente(M, cm(px), cm(roofZ(px)), cm(py), hi));
  return { root, groups };
}

function scaleUVPlane(geo, w, h, ts) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / ts, uv.getY(i) * h / ts); uv.needsUpdate = true; }

function janelao(parent, M, xc, y0, y1, z0, z1, xw) {
  const n = Math.max(2, Math.round((z1 - z0) / 0.95)), pw = (z1 - z0) / n, fr = 0.06;
  box(0.08, fr, z1 - z0, M.madeiraEscura, xc, y0 + fr / 2, (z0 + z1) / 2, parent);
  box(0.08, fr, z1 - z0, M.madeiraEscura, xc, y1 - fr / 2, (z0 + z1) / 2, parent);
  for (let i = 0; i <= n; i++) box(0.08, y1 - y0, fr, M.madeiraEscura, xc, (y0 + y1) / 2, z0 + i * pw, parent);
  for (let i = 0; i < n; i++) {
    const g = box(0.012, y1 - y0 - 2 * fr, pw - fr, M.vidro, xc + (i % 2 ? 0.02 : -0.02), (y0 + y1) / 2, z0 + (i + 0.5) * pw, parent);
    g.castShadow = false;
    box(0.04, 0.03, pw - fr, M.madeiraEscura, xc, y0 + (y1 - y0) * 0.62, z0 + (i + 0.5) * pw, parent);
  }
  void xw;
}

/** Persiana de vidro retrátil: painéis de vidro com perfis superior/inferior escuros. */
function persiana(parent, M, axis, c, a0, a1, h) {
  const len = a1 - a0, n = Math.max(2, Math.round(len / 0.6)), pw = len / n;
  const along = (v) => (axis === 'x' ? [v, 0, c] : [c, 0, v]);
  const dims = (l, hh, t) => (axis === 'x' ? [l, hh, t] : [t, hh, l]);
  const rail = (y) => { const [w, hh, d] = dims(len, 0.05, 0.08); const [x, , z] = along((a0 + a1) / 2); box(w, hh, d, M.ferroPreto, x, y, z, parent); };
  rail(0.025); rail(h - 0.025);
  for (let i = 0; i < n; i++) {
    const [w, hh, d] = dims(pw - 0.01, h - 0.1, 0.01);
    const [x, , z] = along(a0 + (i + 0.5) * pw);
    const off = i % 2 ? 0.015 : -0.015;
    const g = box(w, hh, d, M.vidro, x + (axis === 'z' ? off : 0), h / 2, z + (axis === 'x' ? off : 0), parent); g.castShadow = false;
    const [vw, vh, vd] = dims(0.02, h - 0.1, 0.02);
    box(vw, vh, vd, M.ferroPreto, x + (axis === 'x' ? pw / 2 - 0.01 : 0), h / 2, z + (axis === 'z' ? pw / 2 - 0.01 : 0), parent);
  }
}

function buildRoof(RF, M, hi) {
  const R = ROOM, W = cm(R.W), D = cm(R.D);
  const x0 = -0.2, x1 = W + cm(R.overhangRight), z0 = -cm(R.overhangFront), z1 = D + 0.2;
  const y = (x) => cm(roofZ(x * 100));
  const ang = Math.atan2(cm(R.roofHigh - R.roofLow), W);
  const slopeLen = (x1 - x0) / Math.cos(ang);
  // telhas
  const tilesGeo = new THREE.PlaneGeometry(slopeLen, z1 - z0);
  scaleUVPlane(tilesGeo, slopeLen, z1 - z0, M.telhas.userData.texSize);
  const tiles = new THREE.Mesh(tilesGeo, M.telhas);
  tiles.rotation.order = 'ZXY';
  tiles.rotation.set(-Math.PI / 2, 0, 0);
  const tg = new THREE.Group(); tg.add(tiles); tg.rotation.z = -ang;
  tg.position.set((x0 + x1) / 2, (y(x0) + y(x1)) / 2 + 0.22, (z0 + z1) / 2);
  tiles.receiveShadow = true; tiles.castShadow = true; RF.add(tg);
  // caibros escuros (vigas aparentes), ripas
  const nR = Math.round(D / 1.07);
  for (let i = 0; i <= nR; i++) {
    const z = Math.min(D - 0.05, 0.05 + i * (D - 0.1) / nR);
    const b = box(slopeLen, 0.16, 0.08, M.madeiraEscura, (x0 + x1) / 2, (y(x0) + y(x1)) / 2 + 0.08, z, RF);
    b.rotation.z = -ang;
  }
  if (hi) {
    const step = 0.42, n = Math.floor(slopeLen / step);
    for (let i = 0; i <= n; i++) {
      const s = i * step, xx = x0 + s * Math.cos(ang);
      const r = box(0.05, 0.03, z1 - z0, M.madeira, xx, y(xx) + 0.175, (z0 + z1) / 2, RF);
      r.rotation.z = -ang;
    }
  }
  // testeira da frente e da lateral
  const fr = box(slopeLen, 0.22, 0.04, M.madeiraEscura, (x0 + x1) / 2, (y(x0) + y(x1)) / 2 + 0.12, z0, RF); fr.rotation.z = -ang;
  box(0.04, 0.22, z1 - z0, M.madeiraEscura, x1, y(x1) + 0.12, (z0 + z1) / 2, RF);
  // água do outro lado (sobre as suítes) — só para leitura externa
  const otherLen = 4.8 / Math.cos(ang);
  const og = new THREE.Group(); const om = new THREE.Mesh(new THREE.PlaneGeometry(otherLen, z1 - z0), M.telhas); om.rotation.x = -Math.PI / 2; og.add(om);
  og.rotation.z = ang; og.position.set(-0.2 - 2.4, cm(R.roofHigh) + 0.22 - 2.4 * Math.tan(ang), (z0 + z1) / 2); RF.add(og);
}

function buildExterior(EX, M, hi) {
  const R = ROOM, L = R.lot;
  const sx = cm(L.sideWallX), rz = cm(L.rearWallY), wh = cm(L.wallH);
  const gw = sx + 5.2, gd = cm(R.D) - rz + 0.2;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(gw, -rz + 0.01), M.grama);
  ground.rotation.x = -Math.PI / 2; ground.position.set(sx - gw / 2, -0.15, rz / 2); ground.receiveShadow = true;
  scaleUVPlane(ground.geometry, gw, -rz, M.grama.userData.texSize); EX.add(ground);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(sx - cm(R.W), gd), M.brita);
  side.rotation.x = -Math.PI / 2; side.position.set((sx + cm(R.W)) / 2, -0.149, (rz + cm(R.D)) / 2 + (cm(R.D) - rz) / 2 - gd / 2 + 0.1); side.receiveShadow = true; EX.add(side);
  box(0.13, wh, gd, M.muro, sx + 0.065, wh / 2 - 0.15, rz + gd / 2, EX);
  box(gw, wh, 0.13, M.muro, sx - gw / 2 + 0.13, wh / 2 - 0.15, rz - 0.065, EX);
  // volume das suítes (fachada dos fundos)
  const house = box(4.6, cm(R.wallH) + 0.15, cm(R.D), M.reboco, -0.2 - 2.3, cm(R.wallH) / 2 - 0.075, cm(R.D) / 2, EX);
  house.receiveShadow = true;
  box(2.2, 1.3, 0.02, M.vidroPreto, -0.4 - 2.0, 1.55, -0.011, EX);
  box(2.3, 0.06, 0.06, M.madeiraEscura, -0.4 - 2.0, 0.9, -0.03, EX);
  void hi;
}

function pendente(M, x, ceil, z, hi) {
  const g = new THREE.Group();
  const y = 2.05;
  const cord = cyl(0.004, 0.004, ceil - y - 0.2, M.ferroPreto, x, (ceil + y + 0.2) / 2, z, g, 6); cord.castShadow = false;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), M.lampada); bulb.position.set(x, y + 0.06, z); g.add(bulb);
  if (hi) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      tube([[x, y + 0.2, z], [x + Math.cos(a) * 0.12, y + 0.12, z + Math.sin(a) * 0.12], [x + Math.cos(a) * 0.17, y - 0.02, z + Math.sin(a) * 0.17], [x + Math.cos(a) * 0.15, y - 0.08, z + Math.sin(a) * 0.15]], 0.003, M.ferroPreto, g).castShadow = false;
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.004, 6, 40), M.ferroPreto); ring.rotation.x = Math.PI / 2; ring.position.set(x, y - 0.08, z); g.add(ring);
    const light = new THREE.PointLight(0xffc98a, 1.2, 6, 2); light.position.set(x, y, z); light.castShadow = false; g.add(light);
  } else {
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 12, 1, true), M.ferroPreto); shade.position.set(x, y + 0.04, z); g.add(shade);
  }
  g.userData.pendant = true;
  return g;
}
