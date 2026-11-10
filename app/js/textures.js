// Texturas procedurais (canvas) + texturas recortadas das fotos.
import * as THREE from 'three';

let seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rr = (a, b) => a + (b - a) * rnd();
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const cache = new Map();
let anisotropy = 4;
export function setAnisotropy(a) { anisotropy = a; }

function canvasTex(key, size, draw, { repeat = [1, 1], srgb = true } = {}) {
  const ck = key + repeat.join('x');
  if (cache.has(ck)) return cache.get(ck);
  const c = document.createElement('canvas');
  c.width = Array.isArray(size) ? size[0] : size; c.height = Array.isArray(size) ? size[1] : size;
  const g = c.getContext('2d');
  seed = [...key].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 2147483646 + 1;
  draw(g, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = anisotropy;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(ck, t);
  return t;
}

/** Palhinha (cadeira de balanço). */
export function palhinha() {
  return canvasTex('palhinha', 256, (g, W, H) => {
    g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#e6d3a8'; g.lineWidth = 3;
    for (let i = -W; i < 2 * W; i += 16) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, H); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(W, i); g.stroke();
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + H, H); g.stroke();
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i - H, H); g.stroke();
    }
  }, { repeat: [3, 3] });
}

/** Palhinha indiana vazada (trama octogonal com furos). 1 textura = 4 cm (UV em metros → repeat 25). */
export function palhinhaVazada() {
  return canvasTex('palhinhaVazada', 256, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const cell = W / 2;
    g.lineCap = 'round';
    const strand = (x1, y1, x2, y2, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
    for (let i = -2; i <= 4; i++) {
      const o = i * cell;
      // pares verticais / horizontais
      for (const d of [-9, 9]) {
        strand(o + cell / 2 + d, 0, o + cell / 2 + d, H, 9, '#d9c49a');
        strand(0, o + cell / 2 + d, W, o + cell / 2 + d, 9, '#e4d2aa');
      }
      // diagonais
      strand(o, 0, o + H, H, 8, '#cdb586');
      strand(o + H, 0, o, H, 8, '#cdb586');
    }
    // sombreado dos cruzamentos
    for (let x = 0; x <= 2; x++) for (let y = 0; y <= 2; y++) {
      g.fillStyle = 'rgba(120,90,50,0.35)'; g.beginPath(); g.arc(x * cell, y * cell, 7, 0, 7); g.fill();
    }
  }, { repeat: [25, 25] });
}

/** Pedra-sabão/arenito claro do bloco do filtro. */
export function pedraClara() {
  return canvasTex('pedraClara', 512, (g, W, H) => {
    g.fillStyle = '#a39582'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '70,60,50' : '220,210,195'},${rr(.04, .14)})`; g.beginPath(); g.arc(rr(0, W), rr(0, H), rr(10, 70), 0, 7); g.fill(); }
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '40,35,30' : '240,235,225'},${rr(.05, .25)})`; g.fillRect(rr(0, W), rr(0, H), rr(1, 3), rr(1, 3)); }
  });
}

/** Bacia de pedra escura com crosta mineral branca. */
export function pedraBacia() {
  return canvasTex('pedraBacia', 512, (g, W, H) => {
    g.fillStyle = '#3d3c3a'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2500; i++) {
      const y = Math.pow(rnd(), 1.6) * H; // mais crosta perto da borda (v baixo = topo)
      g.fillStyle = `rgba(225,222,212,${rr(.08, .45)})`;
      g.beginPath(); g.ellipse(rr(0, W), H - y, rr(2, 14), rr(1, 6), rr(0, 3), 0, 7); g.fill();
    }
    for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(0,0,0,${rr(.05, .2)})`; g.fillRect(rr(0, W), rr(0, H), 2, 2); }
  });
}

/** Barro cozido (talha). */
export function barroTex() {
  return canvasTex('barro', 512, (g, W, H) => {
    g.fillStyle = '#b4643a'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '120,55,25' : '215,140,95'},${rr(.05, .14)})`; g.beginPath(); g.ellipse(rr(0, W), rr(0, H), rr(20, 90), rr(6, 20), 0, 0, 7); g.fill(); }
    for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(80,35,15,${rr(.04, .15)})`; g.fillRect(rr(0, W), rr(0, H), 1.5, 1.5); }
  });
}

/**
 * Ladrilhos hidráulicos antigos sortidos 15 × 15 cm: 8 × 8 peças por textura (= 1,20 m). Cimento pigmentado fosco,
 * paleta terrosa e escurecida, desenhos geométricos típicos, rotação aleatória, pigmento gasto, manchas e cantos lascados.
 */
export function azulejos() {
  return canvasTex('ladrilhosHidraulicos', 1024, (g, W) => {
    const N = 8, S = W / N, gr = 3;
    g.fillStyle = '#8f887b'; g.fillRect(0, 0, W, W);                    // rejunte de cimento
    const OFF = '#cbc0aa', OFF2 = '#bdb29c', CHAR = '#34312e', PETROL = '#2e4c5e', BLUE2 = '#4c6b7a', TERRA = '#8c4530', MUST = '#b0863a', OLIVE = '#5c6646', GREY = '#827c71', WINE = '#6a2e29';
    const bg = (c, col) => { c.fillStyle = col; c.fillRect(-1, -1, 2, 2); };
    const poly = (c, col, pts) => { c.fillStyle = col; c.beginPath(); for (const [x, y] of pts) c.lineTo(x, y); c.closePath(); c.fill(); };
    const disc = (c, col, x, y, r) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const designs = [
      (c) => { // estrela de 8 pontas
        bg(c, OFF); for (const [x, y] of corners) disc(c, TERRA, x, y, 0.42);
        c.fillStyle = PETROL; c.beginPath(); for (let k = 0; k < 16; k++) { const r = k % 2 ? 0.36 : 0.86, a = (k / 16) * Math.PI * 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
        disc(c, MUST, 0, 0, 0.2);
      },
      (c) => { // quartos de círculo nos cantos (formam círculos entre as peças) + losango
        bg(c, OFF2); c.strokeStyle = CHAR; c.lineWidth = 0.16; for (const [x, y] of corners) { c.beginPath(); c.arc(x, y, 0.62, 0, 7); c.stroke(); }
        poly(c, OLIVE, [[0, -0.42], [0.42, 0], [0, 0.42], [-0.42, 0]]); disc(c, OFF2, 0, 0, 0.12);
      },
      (c) => { // flor de 4 pétalas
        bg(c, PETROL); c.fillStyle = OFF; for (let k = 0; k < 4; k++) { c.save(); c.rotate(k * Math.PI / 2 + Math.PI / 4); c.beginPath(); c.ellipse(0, -0.52, 0.24, 0.46, 0, 0, 7); c.fill(); c.restore(); }
        disc(c, TERRA, 0, 0, 0.2); for (const [x, y] of corners) poly(c, MUST, [[x, y], [x * 0.55, y], [x, y * 0.55]]);
      },
      (c) => { // losangos concêntricos
        bg(c, MUST); poly(c, CHAR, [[0, -0.95], [0.95, 0], [0, 0.95], [-0.95, 0]]); poly(c, OFF, [[0, -0.66], [0.66, 0], [0, 0.66], [-0.66, 0]]);
        poly(c, WINE, [[0, -0.36], [0.36, 0], [0, 0.36], [-0.36, 0]]);
      },
      (c) => { // cata-vento
        bg(c, OFF); for (let k = 0; k < 4; k++) { c.save(); c.rotate(k * Math.PI / 2); poly(c, k % 2 ? TERRA : PETROL, [[0, 0], [1, -1], [0, -1]]); c.restore(); }
        disc(c, OFF, 0, 0, 0.16);
      },
      (c) => { // xadrez com círculo
        bg(c, OFF2); c.fillStyle = GREY; c.fillRect(-1, -1, 1, 1); c.fillRect(0, 0, 1, 1);
        disc(c, CHAR, 0, 0, 0.5); disc(c, OFF2, 0, 0, 0.3); disc(c, WINE, 0, 0, 0.12);
      },
      (c) => { // cruz com pétalas nos cantos
        bg(c, OLIVE); c.fillStyle = OFF; c.fillRect(-0.2, -1, 0.4, 2); c.fillRect(-1, -0.2, 2, 0.4);
        for (const [x, y] of corners) disc(c, MUST, x * 0.62, y * 0.62, 0.2); disc(c, TERRA, 0, 0, 0.2);
      },
      (c) => { // liso com friso
        bg(c, OFF2); c.strokeStyle = WINE; c.lineWidth = 0.1; c.strokeRect(-0.78, -0.78, 1.56, 1.56);
        poly(c, PETROL, [[0, -0.3], [0.3, 0], [0, 0.3], [-0.3, 0]]);
      },
      (c) => { // diagonal com quarto de círculo
        bg(c, OFF); poly(c, TERRA, [[-1, -1], [1, -1], [-1, 1]]); disc(c, BLUE2, -1, -1, 0.8); disc(c, OFF, -1, -1, 0.42);
        c.save(); c.beginPath(); c.rect(-1, -1, 2, 2); c.clip(); disc(c, CHAR, 1, 1, 0.5); c.restore();
      },
      (c) => { // liso terroso (peça de reposição)
        bg(c, pick([TERRA, GREY, OFF2, OLIVE]));
      },
    ];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = i * S + gr / 2, y = j * S + gr / 2, sz = S - gr;
      g.save(); g.beginPath(); g.rect(x, y, sz, sz); g.clip();
      g.translate(x + sz / 2, y + sz / 2); g.scale(sz / 2, sz / 2); g.rotate(Math.floor(rnd() * 4) * Math.PI / 2);
      designs[Math.floor(rnd() * designs.length)](g);
      g.restore();
      // cada peça com um tom (lotes diferentes), pigmento gasto no meio e sujeira nas bordas
      g.fillStyle = `rgba(${rnd() < .45 ? '235,225,205' : '45,38,30'},${rr(.04, .16)})`; g.fillRect(x, y, sz, sz);
      for (let k = 0; k < 5; k++) { const cx = x + rr(sz * .15, sz * .85), cy = y + rr(sz * .15, sz * .85), r = rr(sz * .12, sz * .38), gd = g.createRadialGradient(cx, cy, 0, cx, cy, r); gd.addColorStop(0, `rgba(200,190,170,${rr(.08, .22)})`); gd.addColorStop(1, 'rgba(200,190,170,0)'); g.fillStyle = gd; g.fillRect(x, y, sz, sz); }
      const eg = g.createLinearGradient(x, y, x + sz, y + sz); eg.addColorStop(0, 'rgba(40,32,24,0.16)'); eg.addColorStop(0.18, 'rgba(40,32,24,0)'); eg.addColorStop(0.82, 'rgba(40,32,24,0)'); eg.addColorStop(1, 'rgba(40,32,24,0.2)');
      g.fillStyle = eg; g.fillRect(x, y, sz, sz);
      for (let k = 0; k < 26; k++) { g.fillStyle = `rgba(${rnd() < .6 ? '50,40,30' : '215,205,185'},${rr(.06, .2)})`; g.beginPath(); g.arc(x + rr(0, sz), y + rr(0, sz), rr(0.8, 3.5), 0, 7); g.fill(); }
      if (rnd() < 0.22) { g.strokeStyle = 'rgba(45,38,30,0.35)'; g.lineWidth = 0.8; g.beginPath(); let px = x + rr(0, sz), py = y; g.moveTo(px, py); for (let m = 0; m < 5; m++) { px += rr(-14, 14); py += sz / 5; g.lineTo(Math.min(x + sz, Math.max(x, px)), py); } g.stroke(); }   // trinca
      if (rnd() < 0.16) { g.fillStyle = '#8f887b'; g.beginPath(); const cx = rnd() < .5 ? x : x + sz, cy = rnd() < .5 ? y : y + sz, r = rr(5, 13); g.moveTo(cx, cy); g.arc(cx, cy, r, 0, 7); g.fill(); }   // canto lascado
    }
    stamp(g, noiseCanvas('lh1', 256, 5, 5), W, 0.34);                  // manchas do cimento
    stamp(g, noiseCanvas('lh2', 512, 40, 2), W, 0.14);
    stamp(g, grainCanvas('lhg'), W, 0.16, 'soft-light', 4);            // grão da superfície
    g.fillStyle = 'rgba(52,42,30,0.10)'; g.fillRect(0, 0, W, W);       // pátina geral
  });
}

/** Frente da lava-louças de embutir (59 × 85 cm): painel branco, faixa de comandos, barra de inox. */
export function lavaLoucasFrente() {
  return canvasTex('llFrente', [512, 738], (g, W, H) => {
    const grd = g.createLinearGradient(0, 0, W, 0); grd.addColorStop(0, '#e9eaea'); grd.addColorStop(0.5, '#f6f6f5'); grd.addColorStop(1, '#e4e5e5');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // faixa de comandos
    g.fillStyle = '#dcdedf'; g.fillRect(0, 0, W, 78); g.fillStyle = '#c9cccd'; g.fillRect(0, 76, W, 3);
    g.fillStyle = '#1e2226'; g.fillRect(W * 0.62, 22, 92, 32);                       // display
    g.fillStyle = '#5fd0e8'; g.font = 'bold 22px monospace'; g.fillText('1:45', W * 0.62 + 18, 46);
    for (let i = 0; i < 6; i++) { g.fillStyle = '#9aa0a4'; g.beginPath(); g.arc(40 + i * 46, 39, 11, 0, 7); g.fill(); g.fillStyle = '#eef0f1'; g.beginPath(); g.arc(40 + i * 46, 39, 8, 0, 7); g.fill(); }
    g.fillStyle = '#7a8084'; g.beginPath(); g.arc(W - 34, 39, 13, 0, 7); g.fill();     // botão liga
    // barra/puxador de inox
    const bar = g.createLinearGradient(0, 92, 0, 128); bar.addColorStop(0, '#f4f5f6'); bar.addColorStop(0.5, '#a9adb1'); bar.addColorStop(1, '#d9dcde');
    g.fillStyle = bar; g.fillRect(14, 94, W - 28, 30); g.strokeStyle = '#8d9296'; g.lineWidth = 1.5; g.strokeRect(14, 94, W - 28, 30);
    // reflexo suave da porta
    const rf = g.createLinearGradient(0, 140, W, H); rf.addColorStop(0, 'rgba(255,255,255,0.0)'); rf.addColorStop(0.45, 'rgba(255,255,255,0.35)'); rf.addColorStop(0.55, 'rgba(255,255,255,0.0)');
    g.fillStyle = rf; g.fillRect(0, 140, W, H - 230);
    // logotipo genérico
    g.fillStyle = '#9aa0a4'; g.font = '600 18px sans-serif'; g.textAlign = 'center'; g.fillText('LAVA-LOUÇAS', W / 2, H - 150);
    // rodapé/fresta da porta
    g.fillStyle = '#c3c6c8'; g.fillRect(0, H - 92, W, 3);
    g.fillStyle = '#d4d6d7'; g.fillRect(0, H - 89, W, 89);
    g.strokeStyle = '#b5b8ba'; g.lineWidth = 2; g.strokeRect(1, 1, W - 2, H - 2);
  });
}

/** Tecidos de pano de prato / toalha. */
export function tecido(v = 0) {
  return canvasTex('tecido' + v, 256, (g, W, H) => {
    const sets = [['#f4efe6', '#b8322a'], ['#f2f0ea', '#2f5f8a'], ['#efe6d2', '#6b8e3a'], ['#f7f3ea', '#c9792e']];
    const [bg, c] = sets[v % sets.length];
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    if (v % 2 === 0) { // xadrez
      g.globalAlpha = 0.55; g.fillStyle = c;
      for (let i = 0; i < W; i += 32) { g.fillRect(i, 0, 16, H); g.fillRect(0, i, W, 16); }
      g.globalAlpha = 1;
    } else { // listras + barra
      g.fillStyle = c; for (let y = 20; y < H; y += 46) g.fillRect(0, y, W, 6);
      g.fillRect(0, H - 34, W, 14);
    }
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${rr(.02, .06)})`; g.fillRect(rr(0, W), rr(0, H), 1, 2); }
  });
}

/** Pratos decorativos (estilos portugueses / mineiros). */
export function prato(i) {
  return canvasTex('prato' + i, 256, (g, W) => {
    const c = W / 2;
    const styles = [
      ['#f4f0e6', '#1d4f91', '#2f6db5'], ['#f6efe0', '#a0302a', '#d38b2c'], ['#eef3f4', '#1f6b5c', '#e2b33c'],
      ['#f8f4ea', '#3b3b8f', '#9c2f3a'], ['#fbf6ec', '#6b8e23', '#c0392b'], ['#efe8da', '#7a4a2a', '#2e6b8f'],
    ];
    const [bg, a, b] = styles[i % styles.length];
    g.fillStyle = bg; g.beginPath(); g.arc(c, c, c - 1, 0, 7); g.fill();
    g.strokeStyle = a; g.lineWidth = 8; g.beginPath(); g.arc(c, c, c - 10, 0, 7); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(c, c, c - 22, 0, 7); g.stroke();
    const petals = 6 + (i % 4) * 2;
    for (let k = 0; k < petals; k++) {
      const ang = (k / petals) * Math.PI * 2;
      g.save(); g.translate(c + Math.cos(ang) * (c * 0.62), c + Math.sin(ang) * (c * 0.62)); g.rotate(ang);
      g.fillStyle = k % 2 ? a : b; g.beginPath(); g.ellipse(0, 0, 13, 6, 0, 0, 7); g.fill(); g.restore();
    }
    g.fillStyle = b; g.beginPath(); g.arc(c, c, c * 0.22, 0, 7); g.fill();
    for (let k = 0; k < 8; k++) { const ang = (k / 8) * Math.PI * 2; g.fillStyle = a; g.beginPath(); g.ellipse(c + Math.cos(ang) * c * .34, c + Math.sin(ang) * c * .34, 9, 4, ang, 0, 7); g.fill(); }
    g.fillStyle = bg; g.beginPath(); g.arc(c, c, c * 0.1, 0, 7); g.fill();
  }, { repeat: [1, 1] });
}

/** Ferro fundido da chapa do fogão a lenha. */
export function ferro() {
  return canvasTex('ferro', 256, (g, W, H) => {
    g.fillStyle = '#26221f'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '120,100,90'},${rr(.05, .2)})`; g.fillRect(rr(0, W), rr(0, H), 2, 2); }
  });
}

// ---------- Pares cor + relevo (bump) desenhados com a mesma semente ----------
function pairTex(key, size, draw) {
  if (cache.has(key)) return cache.get(key);
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = size; return c; };
  const cc = mk(), cb = mk();
  seed = [...key].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 2147483646 + 1;
  draw(cc.getContext('2d'), cb.getContext('2d'), size, size);
  const out = [cc, cb].map((c, i) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = anisotropy;
    if (i === 0) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
  cache.set(key, out);
  return out;
}
const noise = (g, W, H, n, cols, a0, a1, s0 = 1, s1 = 3) => {
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${pick(cols)},${rr(a0, a1)})`; const s = rr(s0, s1); g.fillRect(rr(0, W), rr(0, H), s, s); }
};

/** Ferro fundido (portas e chapa do fogão a lenha): [cor, relevo]. */
export function ferroFundidoPar() {
  return pairTex('ferroFundidoPar', 512, (g, b, W, H) => {
    g.fillStyle = '#2b2a29'; g.fillRect(0, 0, W, H);
    b.fillStyle = '#808080'; b.fillRect(0, 0, W, H);
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(${pick(['15,14,13', '70,66,62', '60,45,35'])},${rr(.1, .3)})`; g.beginPath(); g.ellipse(rr(0, W), rr(0, H), rr(20, 90), rr(10, 50), rr(0, 3), 0, 7); g.fill(); }
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(110,62,32,${rr(.08, .2)})`; g.beginPath(); g.ellipse(rr(0, W), rr(0, H), rr(5, 25), rr(4, 16), 0, 0, 7); g.fill(); } // ferrugem leve
    noise(g, W, H, 14000, ['0,0,0', '95,92,88'], 0.1, 0.35, 1, 2);
    noise(b, W, H, 16000, ['20,20,20', '230,230,230'], 0.1, 0.4, 1, 2.5); // superfície areada do ferro fundido
  });
}

/** Madeira curvada clara (compensado moldado das cadeiras), veio fino. 1 textura ≈ 50 cm. */
export function madeiraCurvada() {
  return canvasTex('madeiraCurvada', 1024, (g, W, H) => {
    g.fillStyle = '#b8874f'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '150,95,45' : '215,170,110'},${rr(.15, .3)})`; g.fillRect(0, rr(0, H), W, rr(60, 220)); }
    for (let k = 0; k < 520; k++) {
      g.strokeStyle = `rgba(${rnd() < .75 ? '110,62,25' : '235,195,140'},${rr(0.06, 0.24)})`; g.lineWidth = rr(0.6, 2.4);
      g.beginPath(); const y = rr(-20, H + 20), a = rr(1, 9), f = rr(0.002, 0.008), p = rr(0, 6);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, y + Math.sin(x * f * Math.PI * 2 / (f * W) * f * W / W + p) * a + Math.sin(x * 0.02 + p) * 1.2);
      g.stroke();
    }
    noise(g, W, H, 5000, ['90,50,20', '240,210,160'], 0.05, 0.15, 1, 2);
  });
}

/** Casca de tora (lenha) e topo com anéis. */
export function casca() {
  return canvasTex('casca', 256, (g, W, H) => {
    g.fillStyle = '#4a3828'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 220; k++) { g.strokeStyle = `rgba(${pick(['25,18,12', '110,92,70', '80,64,46'])},${rr(.3, .8)})`; g.lineWidth = rr(1, 4); const x = rr(0, W), y = rr(0, H); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-3, 3), y + rr(15, 50)); g.stroke(); }
    noise(g, W, H, 3000, ['20,15,10', '150,130,100'], 0.1, 0.4, 1, 3);
  });
}
export function topoTora() {
  return canvasTex('topoTora', 256, (g, W) => {
    const c = W / 2; g.fillStyle = '#c9a477'; g.fillRect(0, 0, W, W);
    for (let r = c; r > 2; r -= rr(4, 9)) { g.strokeStyle = `rgba(120,80,40,${rr(.25, .6)})`; g.lineWidth = rr(1, 2.5); g.beginPath(); g.ellipse(c + rr(-3, 3), c + rr(-3, 3), r, r * rr(.92, 1), 0, 0, 7); g.stroke(); }
    for (let k = 0; k < 5; k++) { const a = rr(0, 6.3); g.strokeStyle = 'rgba(70,40,20,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * c * rr(.4, .9), c + Math.sin(a) * c * rr(.4, .9)); g.stroke(); }
    g.strokeStyle = '#3d2c1e'; g.lineWidth = 14; g.beginPath(); g.arc(c, c, c - 7, 0, 7); g.stroke();
  });
}

/** Mostrador do termômetro do forno. */
export function termometro() {
  return canvasTex('termometro', 256, (g, W) => {
    const c = W / 2; g.fillStyle = '#f3efe4'; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill();
    g.strokeStyle = '#222'; g.fillStyle = '#222';
    for (let k = 0; k <= 30; k++) { const a = Math.PI * 0.75 + (k / 30) * Math.PI * 1.5; const r0 = k % 5 ? c * .78 : c * .7; g.lineWidth = k % 5 ? 2 : 4; g.beginPath(); g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); g.lineTo(c + Math.cos(a) * c * .88, c + Math.sin(a) * c * .88); g.stroke(); }
    g.strokeStyle = '#b3221d'; g.lineWidth = 5; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(-0.6) * c * .66, c + Math.sin(-0.6) * c * .66); g.stroke();
    g.beginPath(); g.arc(c, c, 9, 0, 7); g.fill();
    g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('°C', c, c + c * .45);
  });
}

// ---------- Pratos decorativos (referência: foto da parede de pratos do usuário) ----------
// O centro da textura é o centro do prato; o raio da textura (W/2) é a borda. Aba começa em ~0,62 R.
const silhueta = {
  gato(g, c) { // gato preto andando
    g.save(); g.translate(c * 1.05, c * 1.02); g.fillStyle = '#111';
    g.beginPath(); g.ellipse(0, 0, c * .3, c * .14, -0.15, 0, 7); g.fill();
    g.beginPath(); g.ellipse(c * .3, -c * .12, c * .1, c * .085, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(c * .25, -c * .18); g.lineTo(c * .28, -c * .29); g.lineTo(c * .33, -c * .19); g.moveTo(c * .34, -c * .19); g.lineTo(c * .39, -c * .28); g.lineTo(c * .4, -c * .15); g.fill();
    g.lineWidth = c * .05; g.strokeStyle = '#111'; g.lineCap = 'round';
    for (const [x, d] of [[-0.2, -0.04], [-0.1, 0.05], [0.12, -0.03], [0.2, 0.04]]) { g.beginPath(); g.moveTo(c * x, 0); g.lineTo(c * (x + d), c * .28); g.stroke(); }
    g.beginPath(); g.moveTo(-c * .28, -c * .03); g.quadraticCurveTo(-c * .5, -c * .1, -c * .45, -c * .35); g.stroke();
    g.fillStyle = '#e8e2d0'; g.beginPath(); g.arc(c * .33, -c * .13, c * .015, 0, 7); g.fill();
    g.restore();
  },
  cachorro(g, c) { // cachorro preto com sapato
    g.save(); g.translate(c * .95, c * 1.05); g.fillStyle = '#121212'; g.strokeStyle = '#121212'; g.lineCap = 'round';
    g.beginPath(); g.ellipse(0, 0, c * .26, c * .13, 0.35, 0, 7); g.fill();
    g.beginPath(); g.ellipse(-c * .26, -c * .16, c * .11, c * .09, 0.3, 0, 7); g.fill();
    g.beginPath(); g.ellipse(-c * .34, -c * .1, c * .06, c * .035, 0.5, 0, 7); g.fill();
    g.beginPath(); g.ellipse(-c * .2, -c * .26, c * .04, c * .08, -0.6, 0, 7); g.fill();
    g.lineWidth = c * .05; for (const [x, y, dx] of [[-0.14, 0.02, -0.06], [-0.04, 0.07, 0.02], [0.14, 0.1, -0.02], [0.22, 0.06, 0.07]]) { g.beginPath(); g.moveTo(c * x, c * y); g.lineTo(c * (x + dx), c * (y + 0.24)); g.stroke(); }
    g.beginPath(); g.moveTo(c * .24, -c * .05); g.lineTo(c * .38, -c * .2); g.stroke();
    g.fillStyle = '#1b1b1b'; g.beginPath(); g.ellipse(c * .2, c * .4, c * .18, c * .06, 0, 0, 7); g.fill();
    g.restore();
  },
  carro(g, c) { // desenho a traço de um carro antigo com aguada amarela
    g.save(); g.translate(c, c * 1.05);
    g.fillStyle = 'rgba(226,186,70,0.55)'; g.beginPath(); g.ellipse(c * .05, c * .2, c * .42, c * .13, 0, 0, 7); g.fill();
    g.strokeStyle = '#222'; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(-c * .45, c * .12); g.bezierCurveTo(-c * .45, -c * .1, -c * .25, -c * .32, c * .02, -c * .32); g.bezierCurveTo(c * .28, -c * .32, c * .42, -c * .1, c * .45, c * .12); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(-c * .22, -c * .05); g.quadraticCurveTo(-c * .12, -c * .26, c * .02, -c * .26); g.lineTo(c * .02, -c * .05); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(c * .07, -c * .05); g.lineTo(c * .07, -c * .26); g.quadraticCurveTo(c * .22, -c * .24, c * .28, -c * .05); g.closePath(); g.stroke();
    for (const x of [-0.27, 0.27]) { g.beginPath(); g.arc(c * x, c * .13, c * .1, 0, 7); g.stroke(); g.beginPath(); g.arc(c * x, c * .13, c * .04, 0, 7); g.stroke(); }
    g.beginPath(); g.arc(-c * .4, -c * .0, c * .04, 0, 7); g.stroke();
    g.font = `italic ${c * .07}px serif`; g.fillStyle = '#333'; g.fillText('~', c * .3, c * .38);
    g.restore();
  },
};
function glaze(g, c, base, rimCol) {
  const gr = g.createRadialGradient(c, c, c * .1, c, c, c);
  gr.addColorStop(0, base); gr.addColorStop(0.6, base); gr.addColorStop(0.62, rimCol || base); gr.addColorStop(1, rimCol || base);
  g.fillStyle = gr; g.fillRect(0, 0, 2 * c, 2 * c);
  noise(g, 2 * c, 2 * c, 2500, ['120,110,100', '255,255,255'], 0.02, 0.07, 1, 2);
}
function ringBand(g, c, r0, r1, col) { g.strokeStyle = col; g.lineWidth = (r1 - r0) * c; g.beginPath(); g.arc(c, c, ((r0 + r1) / 2) * c, 0, 7); g.stroke(); }
function sprig(g, x, y, s, a, col) { // raminho floral (folhas + flor)
  g.save(); g.translate(x, y); g.rotate(a); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = s * .06;
  g.beginPath(); g.moveTo(-s * .5, 0); g.quadraticCurveTo(0, -s * .15, s * .5, 0); g.stroke();
  for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(k * s * .18, (k % 2 ? -1 : 1) * s * .1, s * .1, s * .04, k * .5, 0, 7); g.fill(); }
  for (let k = 0; k < 5; k++) { const a2 = k * 1.256; g.beginPath(); g.ellipse(s * .5 + Math.cos(a2) * s * .07, Math.sin(a2) * s * .07, s * .06, s * .035, a2, 0, 7); g.fill(); }
  g.restore();
}
export const PRATO_ESTILOS = {
  ornamento(g, c) { // fundo branco, ornamento denso preto e verde-petróleo, figuras no centro
    glaze(g, c, '#f2efe8');
    for (let k = 0; k < 260; k++) { const a = rr(0, 6.3), r = Math.sqrt(rnd()) * c * .95; g.fillStyle = pick(['#151515', '#151515', '#1f4d4f', '#2b2b2b']); g.beginPath(); g.ellipse(c + Math.cos(a) * r, c + Math.sin(a) * r, rr(4, 14), rr(2, 5), rr(0, 3), 0, 7); g.fill(); }
    g.fillStyle = '#f2efe8'; g.beginPath(); g.ellipse(c, c * 1.05, c * .3, c * .38, 0, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(c * .9, c * 1.1, c * .09, c * .22, 0.1, 0, 7); g.ellipse(c * 1.1, c * 1.1, c * .09, c * .22, -0.1, 0, 7); g.fill();
    g.beginPath(); g.arc(c * .9, c * .82, c * .07, 0, 7); g.arc(c * 1.1, c * .82, c * .07, 0, 7); g.fill();
    g.fillStyle = '#c63a2a'; g.fillRect(c * .82, c * 1.22, c * .36, c * .05);
    ringBand(g, c, .965, 1, '#d9d6cf');
  },
  passaro(g, c) { // ilustração vermelha e preta (pássaros e folhas)
    glaze(g, c, '#f4f1ea'); ringBand(g, c, .93, 1, '#9a9890');
    for (let k = 0; k < 70; k++) { const a = rr(0, 6.3), r = rr(.15, .6) * c; g.fillStyle = pick(['#b0221b', '#141414', '#3a3a3a']); g.beginPath(); g.ellipse(c + Math.cos(a) * r, c + Math.sin(a) * r, rr(5, 16), rr(2, 6), a, 0, 7); g.fill(); }
    g.fillStyle = '#b0221b'; g.beginPath(); g.ellipse(c * .9, c, c * .2, c * .12, -0.4, 0, 7); g.fill();
    g.fillStyle = '#141414'; g.beginPath(); g.ellipse(c * 1.12, c * .92, c * .18, c * .1, 0.5, 0, 7); g.fill();
  },
  terracota(g, c) { glaze(g, c, '#d9a35f', '#b8783a'); g.strokeStyle = '#f3e3c4'; g.lineWidth = 6; g.beginPath(); g.moveTo(c * .7, c * 1.15); g.quadraticCurveTo(c, c * .7, c * 1.35, c * .9); g.stroke(); ringBand(g, c, .95, 1, '#8a5527'); },
  vidro(g, c) { // vidro prensado: frisos radiais e pontos (usado com material translúcido)
    g.fillStyle = '#c9cfd0'; g.fillRect(0, 0, 2 * c, 2 * c);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3;
    for (let k = 0; k < 48; k++) { const a = (k / 48) * 6.283; g.beginPath(); g.moveTo(c + Math.cos(a) * c * .62, c + Math.sin(a) * c * .62); g.lineTo(c + Math.cos(a) * c * .98, c + Math.sin(a) * c * .98); g.stroke(); }
    for (let k = 0; k < 120; k++) { const a = rr(0, 6.3), r = rr(.1, .55) * c; g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, rr(2, 5), 0, 7); g.fill(); }
    ringBand(g, c, .6, .63, 'rgba(255,255,255,.9)');
  },
  foto(g, c) { // prato comemorativo com estampa fotográfica e aba prateada
    const gr = g.createLinearGradient(0, 0, 2 * c, 2 * c); gr.addColorStop(0, '#d6d8da'); gr.addColorStop(.5, '#9ea2a6'); gr.addColorStop(1, '#e2e4e6');
    g.fillStyle = gr; g.fillRect(0, 0, 2 * c, 2 * c);
    g.save(); g.beginPath(); g.arc(c, c, c * .6, 0, 7); g.clip();
    const sky = g.createLinearGradient(0, c * .4, 0, c * 1.6); sky.addColorStop(0, '#6f8fae'); sky.addColorStop(1, '#2e3d52'); g.fillStyle = sky; g.fillRect(0, 0, 2 * c, 2 * c);
    for (const [x, s] of [[.72, 1], [1.05, 1.1], [1.32, .95]]) { g.fillStyle = '#16181c'; g.beginPath(); g.ellipse(c * x, c * 1.35, c * .17 * s, c * .32 * s, 0, 0, 7); g.fill(); g.fillStyle = '#c9a487'; g.beginPath(); g.arc(c * x, c * (.95 - .03 * s), c * .085 * s, 0, 7); g.fill(); g.fillStyle = '#e8e8e8'; g.fillRect(c * (x - .03), c * 1.07, c * .06, c * .12); }
    g.restore();
  },
  casas(g, c) { // vermelho com casinhas em traço branco
    glaze(g, c, '#c3252c', '#b81f27');
    g.strokeStyle = 'rgba(255,240,240,.85)'; g.lineWidth = 2.2;
    for (let row = 0; row < 7; row++) for (let col = 0; col < 7; col++) {
      const x = c * .25 + col * c * .23 + (row % 2) * c * .1, y = c * .3 + row * c * .22;
      if (Math.hypot(x - c, y - c) > c * .9) continue;
      const w = c * rr(.12, .17), h = c * rr(.08, .13);
      g.strokeRect(x, y, w, h); g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + w / 2, y - h * .6); g.lineTo(x + w + 3, y); g.stroke();
      g.strokeRect(x + w * .2, y + h * .3, w * .2, h * .25); g.strokeRect(x + w * .6, y + h * .45, w * .2, h * .55);
    }
    ringBand(g, c, .97, 1, '#f1e7e2');
  },
  floralMarrom(g, c) { glaze(g, c, '#f3efe6'); for (let k = 0; k < 8; k++) sprig(g, c + rr(-.15, .15) * c, c + rr(-.15, .15) * c, c * .32, k * .8, pick(['#5b3a22', '#7a4a2a', '#3e2a1a'])); g.fillStyle = '#6a4027'; g.beginPath(); g.arc(c, c, c * .07, 0, 7); g.fill(); ringBand(g, c, .9, .92, '#b9a58c'); },
  gato(g, c) { glaze(g, c, '#f5f3ee'); silhueta.gato(g, c); ringBand(g, c, .975, 1, '#cfcac0'); },
  cachorro(g, c) { glaze(g, c, '#f5f3ee'); silhueta.cachorro(g, c); ringBand(g, c, .975, 1, '#cfcac0'); },
  carro(g, c) { glaze(g, c, '#f6f4ef'); silhueta.carro(g, c); g.font = `${c * .06}px serif`; g.fillStyle = '#555'; g.fillText('assinado', c * 1.15, c * 1.55); },
  bordaCinza(g, c) { // branco com faixa cinza de motivos na aba
    glaze(g, c, '#f4f2ec'); ringBand(g, c, .7, .9, '#f4f2ec');
    g.fillStyle = '#4d5560'; g.strokeStyle = '#4d5560'; g.lineWidth = 2;
    for (let k = 0; k < 36; k++) { const a = (k / 36) * 6.283, r = c * .8; g.save(); g.translate(c + Math.cos(a) * r, c + Math.sin(a) * r); g.rotate(a); g.beginPath(); g.ellipse(0, 0, c * .06, c * .025, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-c * .02, -c * .07); g.lineTo(c * .02, c * .07); g.stroke(); g.restore(); }
    ringBand(g, c, .69, .705, '#4d5560'); ringBand(g, c, .9, .915, '#4d5560');
  },
  creme(g, c) { glaze(g, c, '#efe6d2', '#ebe0c8'); ringBand(g, c, .6, .62, 'rgba(160,140,110,.35)'); },
  paisagem(g, c) { // paisagem pintada à mão, aba escura
    glaze(g, c, '#e9dfc6', '#4c3e2c');
    g.save(); g.beginPath(); g.arc(c, c, c * .62, 0, 7); g.clip();
    const sky = g.createLinearGradient(0, c * .4, 0, c * 1.1); sky.addColorStop(0, '#b9c7c4'); sky.addColorStop(1, '#e8dcb6'); g.fillStyle = sky; g.fillRect(0, 0, 2 * c, 2 * c);
    g.fillStyle = '#8a9a52'; g.fillRect(0, c * 1.12, 2 * c, c); g.fillStyle = '#a67f4f'; g.beginPath(); g.moveTo(c * .7, 2 * c); g.lineTo(c * 1.05, c * 1.12); g.lineTo(c * 1.12, c * 1.12); g.lineTo(c * 1.5, 2 * c); g.fill();
    for (let k = 0; k < 14; k++) { const x = rr(.4, 1.6) * c, y = rr(.75, 1.1) * c, s = rr(.06, .16) * c; g.fillStyle = pick(['#3f5a2a', '#55702f', '#2f4524', '#6f8a3c']); g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); g.fillStyle = '#4a3423'; g.fillRect(x - 2, y, 4, s * 1.2); }
    g.restore();
    ringBand(g, c, .6, .64, '#c9a96a');
  },
  floralCinza(g, c) { glaze(g, c, '#f5f4f0'); for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; sprig(g, c + Math.cos(a) * c * .8, c + Math.sin(a) * c * .8, c * .26, a + 1.57, '#5f6670'); } ringBand(g, c, .6, .61, '#c9c6c0'); },
  esmaltado(g, c) { glaze(g, c, '#f6f6f3'); ringBand(g, c, .94, 1, '#141414'); for (let k = 0; k < 6; k++) { const a = rr(0, 6.3); g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(c + Math.cos(a) * c * .92, c + Math.sin(a) * c * .92, rr(2, 6), 0, 7); g.fill(); } },
};
export function pratoArte(estilo) {
  return canvasTex('prato_' + estilo, 512, (g, W) => PRATO_ESTILOS[estilo](g, W / 2));
}

// ---------- Texturas das fotos ----------
let pending = 0; const waiters = [];
const loader = new THREE.TextureLoader();
const done = () => { if (--pending <= 0) { pending = 0; waiters.splice(0).forEach((r) => r()); } };
/** Resolve quando todas as texturas de foto terminaram de carregar. */
export function whenTexturesLoaded() { return pending ? new Promise((r) => waiters.push(r)) : Promise.resolve(); }
/**
 * Textura de foto em assets/tex. `mirror` espelha nos dois eixos; `wrap` escolhe por eixo (S, T): 'm' espelha, 'r' repete
 * (ex.: 'mr' para tábuas e tijolos, que só repetem sem emenda na vertical). `data` = mapa de relevo/rugosidade (sem sRGB).
 */
export function photo(name, { repeat = [1, 1], mirror = false, wrap = '', data = false } = {}) {
  const key = 'photo:' + name + repeat.join('x') + mirror + wrap + data;
  if (cache.has(key)) return cache.get(key);
  pending++;
  const t = loader.load(`assets/tex/${name}.jpg`, (tx) => { (tx.userData.onLoad || []).forEach((f) => f(tx.image)); done(); }, undefined, done);
  if (!data) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  if (wrap) {
    t.wrapS = wrap[0] === 'm' ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    t.wrapT = wrap[1] === 'm' ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  } else if (repeat[0] !== 1 || repeat[1] !== 1 || mirror) {
    t.wrapS = t.wrapT = mirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  cache.set(key, t);
  return t;
}

// =====================================================================================
// Conjuntos PBR (cor + normal + rugosidade) — tiram o aspecto "liso/plástico" do 3D detalhado.
// Tudo é gerado em canvas, ladrilhável, e fica em cache.
// =====================================================================================
const mkCanvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function toTex(c, srgb = false) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = anisotropy;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const keySeed = (key) => [...key].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 2147483646, 7) + 1;

/** Ruído fractal ladrilhável (value noise) em tons de cinza: canvas n × n. `base` = células na 1ª oitava. */
function noiseCanvas(key, n = 256, base = 4, oct = 4, gain = 0.5) {
  const ck = `noise:${key}:${n}:${base}:${oct}:${gain}`;
  if (cache.has(ck)) return cache.get(ck);
  let s = keySeed(ck);
  const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const f = new Float32Array(n * n); let amp = 1;
  for (let o = 0; o < oct; o++) {
    const F = Math.min(n, base << o), lat = new Float32Array(F * F);
    for (let i = 0; i < lat.length; i++) lat[i] = r();
    for (let y = 0; y < n; y++) {
      const fy = (y / n) * F, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), ya = (y0 % F) * F, yb = ((y0 + 1) % F) * F;
      for (let x = 0; x < n; x++) {
        const fx = (x / n) * F, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), xa = x0 % F, xb = (x0 + 1) % F;
        const a = lat[ya + xa] + (lat[ya + xb] - lat[ya + xa]) * sx, b = lat[yb + xa] + (lat[yb + xb] - lat[yb + xa]) * sx;
        f[y * n + x] += (a + (b - a) * sy) * amp;
      }
    }
    amp *= gain;
  }
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < f.length; i++) { if (f[i] < mn) mn = f[i]; if (f[i] > mx) mx = f[i]; }
  const c = mkCanvas(n), g = c.getContext('2d'), img = g.createImageData(n, n), d = img.data;
  for (let i = 0; i < f.length; i++) { const v = ((f[i] - mn) / (mx - mn)) * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  cache.set(ck, c);
  return c;
}
/** Grão fino (ruído branco por pixel), ladrilhável. */
function grainCanvas(key, n = 256) {
  const ck = `grain:${key}:${n}`;
  if (cache.has(ck)) return cache.get(ck);
  let s = keySeed(ck);
  const c = mkCanvas(n), g = c.getContext('2d'), img = g.createImageData(n, n), d = img.data;
  for (let i = 0; i < n * n; i++) { s = (s * 16807) % 2147483647; const v = (s / 2147483647) * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  cache.set(ck, c);
  return c;
}
/** Aplica um canvas (ruído) sobre todo o destino com opacidade e modo de mistura; `tiles` = repetições. */
function stamp(g, src, S, alpha, op = 'soft-light', tiles = 1) {
  g.save(); g.globalAlpha = alpha; g.globalCompositeOperation = op;
  if (tiles === 1) g.drawImage(src, 0, 0, S, S);
  else { const k = S / tiles / src.width; g.scale(k, k); g.fillStyle = g.createPattern(src, 'repeat'); g.fillRect(0, 0, S / k, S / k); }
  g.restore();
}
/** Chama fn(x, y) também nas cópias que atravessam a borda (para a textura continuar ladrilhável). */
function wrapDraw(S, x, y, R, fn) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
    const px = x + dx, py = y + dy;
    if (px > -R && px < S + R && py > -R && py < S + R) fn(px, py);
  }
}
/** Mapa de normais (convenção OpenGL) a partir de um canvas de altura em tons de cinza. */
function normalFromHeight(hc, strength = 2) {
  const W = hc.width, H = hc.height;
  const src = hc.getContext('2d').getImageData(0, 0, W, H).data;
  const out = mkCanvas(W, H), g = out.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  const k = strength / 255;
  for (let y = 0; y < H; y++) {
    const yu = ((y + H - 1) % H) * W, yd = ((y + 1) % H) * W, yc = y * W;
    for (let x = 0; x < W; x++) {
      const xl = (x + W - 1) % W, xr = (x + 1) % W;
      const dx = (src[(yc + xr) * 4] - src[(yc + xl) * 4]) * k, dy = (src[(yd + x) * 4] - src[(yu + x) * 4]) * k;
      const l = 1 / Math.sqrt(dx * dx + dy * dy + 1), i = (yc + x) * 4;
      d[i] = (-dx * l * 0.5 + 0.5) * 255; d[i + 1] = (dy * l * 0.5 + 0.5) * 255; d[i + 2] = (l * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return out;
}
/** draw(cor, altura, rugosidade, S) → { map, normalMap, roughnessMap }. A rugosidade vai no tom de cinza (0 = espelho). */
function pbrSet(key, size, draw, { normal = 2 } = {}) {
  if (cache.has(key)) return cache.get(key);
  const c = mkCanvas(size), h = mkCanvas(size), r = mkCanvas(size);
  seed = keySeed(key);
  draw(c.getContext('2d'), h.getContext('2d', { willReadFrequently: true }), r.getContext('2d'), size);
  const out = { map: toTex(c, true), normalMap: toTex(normalFromHeight(h, normal)), roughnessMap: toTex(r) };
  cache.set(key, out);
  return out;
}
const gray = (v) => { const k = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${k},${k},${k})`; };

/** Porcelanato acetinado cinza levemente bege: 2 × 2 peças de 80 cm por textura (= 1,60 m), rejunte rebaixado, manchas de uso no brilho. */
export function porcelanatoPBR() {
  return pbrSet('porcelanatoPBR', 2048, (g, h, r, S) => {
    const T = S / 2, j = 5;
    g.fillStyle = '#b1b1af'; g.fillRect(0, 0, S, S);
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { g.fillStyle = `rgba(${rnd() < .5 ? '250,250,248' : '56,56,55'},${rr(.015, .045)})`; g.fillRect(a * T, b * T, T, T); }
    stamp(g, noiseCanvas('pc1', 256, 3, 5), S, 0.22);
    stamp(g, noiseCanvas('pc2', 512, 24, 3), S, 0.10);
    stamp(g, grainCanvas('pc'), S, 0.05, 'soft-light', 8);
    h.fillStyle = gray(0.8); h.fillRect(0, 0, S, S);
    stamp(h, noiseCanvas('pc3', 256, 5, 4), S, 0.10);
    stamp(h, grainCanvas('pch'), S, 0.035, 'soft-light', 8);
    r.fillStyle = gray(0.34); r.fillRect(0, 0, S, S);
    stamp(r, noiseCanvas('pc4', 512, 6, 5), S, 0.55);           // áreas mais gastas / mais polidas
    stamp(r, noiseCanvas('pc5', 512, 40, 2), S, 0.22);
    stamp(r, grainCanvas('pcr'), S, 0.08, 'soft-light', 8);
    const lines = (ctx, w, style) => { ctx.fillStyle = style; for (let k = 0; k <= 2; k++) { ctx.fillRect(k * T - w / 2, 0, w, S); ctx.fillRect(0, k * T - w / 2, S, w); } };
    for (let b = 5; b >= 1; b--) lines(h, j + 2 * b, 'rgba(70,70,70,0.10)');   // borda levemente boleada
    lines(h, j, gray(0.42));
    lines(g, j + 2, 'rgba(100,99,97,0.25)');
    lines(g, j, '#858481');
    lines(r, j, gray(0.92));
  }, { normal: 1.5 });
}

/** Reboco rústico desempenado à colher (parede da suíte): marcas de colher em relevo, areia aparente. 1 textura = 2,40 m. */
export function paredeRusticaPBR() {
  return pbrSet('paredeRusticaPBR', 2048, (g, h, r, S) => {
    h.fillStyle = gray(0.5); h.fillRect(0, 0, S, S);
    stamp(h, noiseCanvas('pr1', 256, 4, 4), S, 0.55);
    stamp(h, noiseCanvas('pr2', 512, 20, 3), S, 0.35);
    // marcas de colher: crista clara de um lado + sulco escuro do outro
    const blob = (ctx, x, y, R, sq, ang, col, a) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1, sq);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.55, `rgba(${col},${a * 0.5})`); gr.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.restore();
    };
    // marcas esparsas e irregulares, em grupos (onde a colher passou), com áreas mais lisas entre elas
    const dens = noiseCanvas('pr6', 64, 3, 3).getContext('2d').getImageData(0, 0, 64, 64).data;
    for (let i = 0; i < 900; i++) {
      const x = rr(0, S), y = rr(0, S);
      if (dens[(Math.floor((y / S) * 64) * 64 + Math.floor((x / S) * 64)) * 4] / 255 < rr(0.35, 0.75)) continue;
      const big = rnd() < 0.18, R = (big ? rr(60, 130) : rr(16, 58)), ang = rr(0.3, 1.5) + (rnd() < 0.3 ? rr(-1.6, 1.6) : 0), sq = rr(0.16, 0.5), a = rr(0.3, 0.85) * (big ? 0.7 : 1);
      const ox = -Math.sin(ang) * R * sq * 0.9, oy = Math.cos(ang) * R * sq * 0.9;
      wrapDraw(S, x, y, R * 2, (px, py) => {
        blob(h, px + ox, py + oy, R * 1.05, sq, ang, '0,0,0', a * 0.75);
        blob(h, px, py, R, sq * 0.8, ang, '255,255,255', a);
      });
    }
    stamp(h, grainCanvas('prh'), S, 0.20, 'soft-light', 6);
    stamp(h, grainCanvas('prh2', 128), S, 0.10, 'soft-light', 3);
    g.fillStyle = '#c3b29c'; g.fillRect(0, 0, S, S);
    stamp(g, noiseCanvas('pr3', 256, 3, 5), S, 0.30);            // manchas largas (umidade, poeira)
    stamp(g, noiseCanvas('pr4', 512, 14, 3), S, 0.14);
    g.save(); g.globalAlpha = 0.42; g.globalCompositeOperation = 'soft-light'; g.drawImage(h.canvas, 0, 0); g.restore();   // cavidades mais escuras
    stamp(g, grainCanvas('prc'), S, 0.10, 'soft-light', 6);
    r.fillStyle = gray(0.9); r.fillRect(0, 0, S, S);
    stamp(r, noiseCanvas('pr5', 256, 8, 3), S, 0.25);
  }, { normal: 3.8 });
}

/** Pintura sobre reboco liso (pilares, muro, fachada): quase branca — a cor vem do material. 1 textura = 1,50 m. */
export function pinturaPBR() {
  return pbrSet('pinturaPBR', 1024, (g, h, r, S) => {
    g.fillStyle = '#f4f3f0'; g.fillRect(0, 0, S, S);
    stamp(g, noiseCanvas('pt1', 256, 3, 5), S, 0.30);
    stamp(g, noiseCanvas('pt2', 256, 2, 3), S, 0.16, 'multiply');
    stamp(g, grainCanvas('ptc'), S, 0.05, 'soft-light', 4);
    h.fillStyle = gray(0.5); h.fillRect(0, 0, S, S);
    stamp(h, noiseCanvas('pt3', 512, 48, 2), S, 0.45);          // casca do rolo de lã
    stamp(h, noiseCanvas('pt4', 256, 5, 3), S, 0.30);
    stamp(h, grainCanvas('pth'), S, 0.12, 'soft-light', 4);
    r.fillStyle = gray(0.86); r.fillRect(0, 0, S, S);
    stamp(r, noiseCanvas('pt5', 256, 6, 4), S, 0.3);
  }, { normal: 1.6 });
}

/** Concreto desempenado (calçada/laje): manchas, poros. 1 textura = 1,50 m. */
export function concretoPBR() {
  return pbrSet('concretoPBR', 1024, (g, h, r, S) => {
    g.fillStyle = '#b3aca0'; g.fillRect(0, 0, S, S);
    stamp(g, noiseCanvas('cc1', 256, 3, 5), S, 0.5);
    stamp(g, noiseCanvas('cc2', 512, 20, 3), S, 0.25);
    stamp(g, grainCanvas('ccc'), S, 0.14, 'soft-light', 4);
    h.fillStyle = gray(0.55); h.fillRect(0, 0, S, S);
    stamp(h, noiseCanvas('cc3', 512, 30, 3), S, 0.5);
    stamp(h, grainCanvas('cch'), S, 0.25, 'soft-light', 4);
    for (let i = 0; i < 900; i++) { const x = rr(0, S), y = rr(0, S), rad = rr(1, 3.5); h.fillStyle = 'rgba(0,0,0,0.6)'; h.beginPath(); h.arc(x, y, rad, 0, 7); h.fill(); g.fillStyle = 'rgba(40,36,30,0.35)'; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
    r.fillStyle = gray(0.92); r.fillRect(0, 0, S, S);
  }, { normal: 2.5 });
}

/** Granilite avermelhado polido: [cor, relevo sutil, brilho variando entre massa e pedrinhas]. 1 textura ≈ 60 cm. */
export function granilitePBR() {
  return pbrSet('granilitePBR', 1024, (g, h, r, S) => {
    g.fillStyle = '#a4523f'; g.fillRect(0, 0, S, S);
    stamp(g, noiseCanvas('gr1', 256, 4, 4), S, 0.25);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '90,30,20' : '200,120,95'},${rr(.05, .25)})`; g.fillRect(rr(0, S), rr(0, S), rr(1, 4), rr(1, 4)); }
    h.fillStyle = gray(0.5); h.fillRect(0, 0, S, S);
    stamp(h, noiseCanvas('gr2', 256, 6, 3), S, 0.12);
    r.fillStyle = gray(0.36); r.fillRect(0, 0, S, S);
    stamp(r, noiseCanvas('gr3', 512, 8, 5), S, 0.5);
    stamp(r, grainCanvas('grr'), S, 0.2, 'soft-light', 4);
    const chips = ['#efe4d6', '#f6efe6', '#d9c3ad', '#5b1e16', '#7a2a1d', '#2e2522', '#c98b6b', '#e2b79a', '#8d8d8a'];
    for (let i = 0; i < 2600; i++) {
      const col = pick(chips), cx = rr(0, S), cy = rr(0, S), rad = Math.pow(rnd(), 2.2) * 14 + 1.5, n = 5 + Math.floor(rnd() * 3);
      const pts = []; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + rr(-.3, .3), q = rad * rr(.6, 1.2); pts.push([Math.cos(a) * q, Math.sin(a) * q]); }
      const rough = gray(rr(0.14, 0.3)), hh = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},${rr(.05, .22)})`, sh = rr(0, 0.12);
      wrapDraw(S, cx, cy, rad * 1.3, (px, py) => {
        for (const [ctx, style] of [[g, col], [r, rough], [h, hh]]) { ctx.fillStyle = style; ctx.beginPath(); for (const [x, y] of pts) ctx.lineTo(px + x, py + y); ctx.closePath(); ctx.fill(); }
        g.fillStyle = `rgba(0,0,0,${sh})`; g.beginPath(); for (const [x, y] of pts) g.lineTo(px + x, py + y); g.closePath(); g.fill();   // pedrinhas com tom variado
      });
    }
  }, { normal: 0.7 });
}

/** Inox/alumínio escovado: riscos finos na direção U (cor quase branca; a cor vem do material). 1 textura ≈ 30 cm. */
export function escovadoPBR() {
  return pbrSet('escovadoPBR', 512, (g, h, r, S) => {
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, S, S);
    h.fillStyle = gray(0.5); h.fillRect(0, 0, S, S);
    r.fillStyle = gray(0.34); r.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) {
      const y = Math.floor(rr(0, S)), x = rr(-S, S), len = rr(S * 0.3, S * 2), w = rnd() < 0.85 ? 1 : 2, d = rnd() < 0.5;
      for (const ox of [0, S]) {   // atravessa a borda
        g.fillStyle = `rgba(${d ? '0,0,0' : '255,255,255'},${rr(.02, .07)})`; g.fillRect(x + ox - S, y, len, w); g.fillRect(x + ox, y, len, w);
        h.fillStyle = `rgba(${d ? '0,0,0' : '255,255,255'},${rr(.06, .22)})`; h.fillRect(x + ox - S, y, len, w); h.fillRect(x + ox, y, len, w);
        r.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},${rr(.03, .1)})`; r.fillRect(x + ox - S, y, len, w); r.fillRect(x + ox, y, len, w);
      }
    }
    stamp(r, noiseCanvas('es1', 256, 4, 4), S, 0.35);           // marcas de dedo / limpeza
    stamp(g, noiseCanvas('es2', 256, 3, 3), S, 0.10);
  }, { normal: 0.9 });
}

/** Chapa pintada / plástico de eletrodoméstico: "casca de laranja" da pintura e manchas leves no brilho. 1 textura ≈ 40 cm. */
export function esmaltePBR() {
  return pbrSet('esmaltePBR', 512, (g, h, r, S) => {
    g.fillStyle = '#f7f7f6'; g.fillRect(0, 0, S, S);
    stamp(g, noiseCanvas('em1', 256, 3, 4), S, 0.10);
    h.fillStyle = gray(0.5); h.fillRect(0, 0, S, S);
    stamp(h, noiseCanvas('em2', 512, 64, 2), S, 0.5);
    stamp(h, noiseCanvas('em3', 256, 6, 3), S, 0.2);
    r.fillStyle = gray(0.3); r.fillRect(0, 0, S, S);
    stamp(r, noiseCanvas('em4', 256, 5, 4), S, 0.45);
    stamp(r, grainCanvas('emr'), S, 0.08, 'soft-light', 2);
  }, { normal: 0.55 });
}

/** Superfície fosca genérica (plásticos, barro, pedra lisa): só micro-relevo e variação de brilho (cor neutra). */
export function foscoPBR() {
  return pbrSet('foscoPBR', 512, (g, h, r, S) => {
    g.fillStyle = '#f3f3f2'; g.fillRect(0, 0, S, S);
    stamp(g, noiseCanvas('fo1', 256, 4, 4), S, 0.22);
    stamp(g, grainCanvas('foc'), S, 0.06, 'soft-light', 2);
    h.fillStyle = gray(0.5); h.fillRect(0, 0, S, S);
    stamp(h, noiseCanvas('fo2', 256, 24, 3), S, 0.4);
    stamp(h, grainCanvas('foh'), S, 0.18, 'soft-light', 2);
    r.fillStyle = gray(0.8); r.fillRect(0, 0, S, S);
    stamp(r, noiseCanvas('fo3', 256, 6, 4), S, 0.4);
  }, { normal: 1.2 });
}

/** Gramado: tufos, falhas amareladas e relevo das folhas. 1 textura = 2 m. */
export function gramaPBR() {
  return pbrSet('gramaPBR', 1024, (g, h, r, S) => {
    g.fillStyle = '#58762f'; g.fillRect(0, 0, S, S);
    h.fillStyle = gray(0.35); h.fillRect(0, 0, S, S);
    stamp(h, noiseCanvas('gm1', 256, 8, 4), S, 0.6);
    const cols = ['#44631f', '#6b8f3a', '#7fa24c', '#39561c', '#5f8233', '#8aa55a', '#4f7026'];
    for (let i = 0; i < 46000; i++) {
      const x = rr(0, S), y = rr(0, S), dx = rr(-4, 4), dy = -rr(4, 13), k = rnd();
      g.strokeStyle = pick(cols); g.lineWidth = rr(0.8, 1.8); g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke();
      if (i % 3 === 0) { h.strokeStyle = `rgba(255,255,255,${0.15 + k * 0.35})`; h.lineWidth = 1.5; h.beginPath(); h.moveTo(x, y); h.lineTo(x + dx, y + dy); h.stroke(); }
    }
    stamp(g, noiseCanvas('gm2', 256, 6, 4), S, 0.3);           // manchas claras/escuras do gramado
    g.save(); g.globalAlpha = 0.16; g.globalCompositeOperation = 'color'; g.fillStyle = g.createPattern(noiseTint('gm3', '#a59a45', '#3f6a25'), 'repeat'); g.scale(4, 4); g.fillRect(0, 0, S / 4, S / 4); g.restore();
    r.fillStyle = gray(0.92); r.fillRect(0, 0, S, S);
  }, { normal: 2.2 });
}
/** Ruído colorido entre duas cores (para variação de matiz). */
function noiseTint(key, c0, c1, n = 256) {
  const ck = `tint:${key}`;
  if (cache.has(ck)) return cache.get(ck);
  const c = mkCanvas(n), g = c.getContext('2d');
  g.fillStyle = c0; g.fillRect(0, 0, n, n);
  const m = mkCanvas(n), mg = m.getContext('2d');
  mg.drawImage(noiseCanvas(key, n, 3, 4), 0, 0);
  const id = mg.getImageData(0, 0, n, n), d = id.data, col = new THREE.Color(c1);
  for (let i = 0; i < n * n; i++) { const a = Math.max(0, Math.min(255, (d[i * 4] - 96) * 3)); d[i * 4] = col.r * 255; d[i * 4 + 1] = col.g * 255; d[i * 4 + 2] = col.b * 255; d[i * 4 + 3] = a; }
  mg.putImageData(id, 0, 0); g.drawImage(m, 0, 0);
  cache.set(ck, c);
  return c;
}

/** Brita cinza (faixa lateral): pedras angulosas com relevo. 1 textura = 1 m. */
export function britaPBR() {
  return pbrSet('britaPBR', 1024, (g, h, r, S) => {
    g.fillStyle = '#4f4d49'; g.fillRect(0, 0, S, S);
    h.fillStyle = gray(0.1); h.fillRect(0, 0, S, S);
    r.fillStyle = gray(0.95); r.fillRect(0, 0, S, S);
    const tones = ['#8d8a85', '#9c9993', '#77746f', '#a9a59e', '#6a6864', '#b5b1aa', '#84807a', '#8f8a80'];
    for (let i = 0; i < 5200; i++) {
      const cx = rr(0, S), cy = rr(0, S), rad = rr(6, 17), n = 5 + Math.floor(rnd() * 3), col = pick(tones), top = rr(0.45, 1);
      const pts = []; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + rr(-.35, .35), q = rad * rr(.6, 1.15); pts.push([Math.cos(a) * q, Math.sin(a) * q]); }
      wrapDraw(S, cx, cy, rad * 1.3, (px, py) => {
        const path = (ctx, k = 1) => { ctx.beginPath(); for (const [x, y] of pts) ctx.lineTo(px + x * k, py + y * k); ctx.closePath(); };
        g.fillStyle = 'rgba(20,18,16,0.55)'; path(g, 1.12); g.fill();
        g.fillStyle = col; path(g); g.fill();
        h.fillStyle = gray(top * 0.6); path(h); h.fill();
        h.fillStyle = gray(top); path(h, 0.6); h.fill();
      });
    }
    stamp(g, grainCanvas('brc'), S, 0.18, 'soft-light', 4);
  }, { normal: 3.2 });
}

/** Telha ondulada vista por baixo: [cor, normal das ondas, rugosidade]. 1 textura ≈ 90 cm (6 ondas). */
export function telhasPBR() {
  return pbrSet('telhasPBR', 1024, (g, h, r, S) => {
    const n = 6, w = S / n;
    g.fillStyle = '#a9a9a4'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < n; i++) {
      const hg = h.createLinearGradient(i * w, 0, (i + 1) * w, 0);
      for (let k = 0; k <= 8; k++) hg.addColorStop(k / 8, gray(0.5 - 0.5 * Math.cos((k / 8) * Math.PI * 2)));
      h.fillStyle = hg; h.fillRect(i * w, 0, w + 1, S);
    }
    stamp(g, noiseCanvas('tl1', 256, 4, 5), S, 0.5);            // manchas de poeira e umidade
    stamp(g, noiseCanvas('tl2', 256, 2, 2), S, 0.22, 'multiply');
    stamp(g, grainCanvas('tlc'), S, 0.12, 'soft-light', 4);
    for (let jj = 0; jj < 3; jj++) { const y = (jj / 3) * S; g.fillStyle = 'rgba(30,30,30,.4)'; g.fillRect(0, y, S, 5); h.fillStyle = 'rgba(0,0,0,.5)'; h.fillRect(0, y, S, 6); }   // sobreposição das telhas
    stamp(h, grainCanvas('tlh'), S, 0.08, 'soft-light', 4);
    r.fillStyle = gray(0.78); r.fillRect(0, 0, S, S);
    stamp(r, noiseCanvas('tl3', 256, 6, 4), S, 0.4);
  }, { normal: 5 });
}

/**
 * Mapa de rugosidade derivado de uma textura de cor (canvas ou foto): partes escuras (frestas, veios) mais ásperas,
 * partes claras (desgaste/polimento) com o brilho base. Para fotos, é preenchido quando a imagem carrega.
 */
export function roughFrom(tex, lo = 0.55, hi = 0.95) {
  const key = `rough:${tex.uuid}:${lo}:${hi}`;
  if (cache.has(key)) return cache.get(key);
  const c = mkCanvas(4), t = toTex(c);
  t.wrapS = tex.wrapS; t.wrapT = tex.wrapT; t.repeat.copy(tex.repeat);
  const fill = (img) => {
    const n = Math.min(512, img.width || 512); c.width = c.height = n;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, n, n);
    const id = g.getImageData(0, 0, n, n), d = id.data;
    let mean = 0; for (let i = 0; i < d.length; i += 4) mean += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; mean /= d.length / 4;
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11 - mean) / 255;      // −: escuro, +: claro
      const v = Math.max(lo, Math.min(hi, (lo + hi) / 2 - l * (hi - lo) * 1.6)) * 255;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    g.putImageData(id, 0, 0); t.needsUpdate = true;
  };
  const img = tex.image;
  if (img && (img.width || img.naturalWidth) && !tex.userData.loading) fill(img);
  else { c.getContext('2d').fillStyle = gray((lo + hi) / 2); c.getContext('2d').fillRect(0, 0, 4, 4); (tex.userData.onLoad ||= []).push(fill); }
  cache.set(key, t);
  return t;
}

/** Relevo e brilho dos ladrilhos hidráulicos 15 × 15 (mesma malha 8 × 8 de `azulejos()`): peças foscas quase planas, bordas gastas, rejunte rebaixado. */
export function azulejosRelevoPBR() {
  return pbrSet('ladrilhosRelevoPBR', 1024, (g, h, r, S) => {
    const N = 8, T = S / N, gr = 3;
    h.fillStyle = gray(0.3); h.fillRect(0, 0, S, S);
    r.fillStyle = gray(0.95); r.fillRect(0, 0, S, S);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = i * T + gr / 2, y = j * T + gr / 2, sz = T - gr, lift = rr(0.64, 0.8);
      for (let b = 0; b < 3; b++) { h.fillStyle = gray(lift * (0.8 + 0.1 * b)); h.fillRect(x + b, y + b, sz - 2 * b, sz - 2 * b); }   // quina gasta
      r.fillStyle = gray(rr(0.5, 0.7)); r.fillRect(x, y, sz, sz);
      if (rnd() < 0.45) { r.fillStyle = `rgba(0,0,0,${rr(.1, .28)})`; r.beginPath(); r.ellipse(x + sz / 2 + rr(-20, 20), y + sz / 2 + rr(-20, 20), rr(18, 46), rr(14, 34), rr(0, 3), 0, 7); r.fill(); }   // miolo polido pelo uso/cera
    }
    stamp(h, noiseCanvas('az1', 512, 36, 3), S, 0.22);          // superfície do cimento prensado
    stamp(h, grainCanvas('azh'), S, 0.12, 'soft-light', 4);
    stamp(r, noiseCanvas('az2', 256, 10, 3), S, 0.3);
    void g;
  }, { normal: 1.6 });
}

/** Nuvens esparsas (RGBA, com esmaecimento radial até a borda) para o plano de nuvens do céu. */
export function nuvens() {
  if (cache.has('nuvens')) return cache.get('nuvens');
  const S = 1024, n = 512, c = mkCanvas(S), g = c.getContext('2d');
  const a = noiseCanvas('nv1', n, 3, 6, 0.55).getContext('2d').getImageData(0, 0, n, n).data;
  const b = noiseCanvas('nv2', n, 5, 5, 0.6).getContext('2d').getImageData(0, 0, n, n).data;
  const m = mkCanvas(n), mg = m.getContext('2d'), id = mg.createImageData(n, n), d = id.data;
  for (let i = 0; i < n * n; i++) {
    const v = (a[i * 4] * 0.65 + b[i * 4] * 0.35) / 255, al = Math.max(0, Math.min(1, (v - 0.56) / 0.2)), sh = 0.86 + 0.14 * Math.min(1, (v - 0.56) / 0.35);
    d[i * 4] = 255 * sh; d[i * 4 + 1] = 255 * sh; d[i * 4 + 2] = 255 * Math.min(1, sh + 0.02); d[i * 4 + 3] = al * al * (3 - 2 * al) * 235;
  }
  mg.putImageData(id, 0, 0);
  g.fillStyle = g.createPattern(m, 'repeat'); g.fillRect(0, 0, S, S);
  const fade = g.createRadialGradient(S / 2, S / 2, S * 0.12, S / 2, S / 2, S * 0.5);
  fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(0.7, 'rgba(0,0,0,0.75)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = fade; g.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  cache.set('nuvens', t);
  return t;
}

/** Raminho com folhas (RGBA) usado nos cartões instanciados da copa da árvore do quintal. */
export function folhagem() {
  if (cache.has('folhagem')) return cache.get('folhagem');
  const S = 256, c = mkCanvas(S), g = c.getContext('2d');
  seed = keySeed('folhagem');
  g.fillStyle = 'rgba(70,105,45,0.012)'; g.fillRect(0, 0, S, S);       // evita franja escura nas bordas das folhas
  g.strokeStyle = '#4a3a22'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(S * 0.5, S * 0.98); g.quadraticCurveTo(S * 0.46, S * 0.55, S * 0.52, S * 0.14); g.stroke();
  const leaf = (x, y, ang, len, w) => {
    g.save(); g.translate(x, y); g.rotate(ang);
    const l = rr(-14, 14), gr = g.createLinearGradient(0, 0, len, 0);
    gr.addColorStop(0, `rgb(${44 + l},${80 + l},${30 + l * 0.5})`); gr.addColorStop(1, `rgb(${80 + l},${122 + l},${46 + l * 0.5})`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.45, -w, len, 0); g.quadraticCurveTo(len * 0.45, w, 0, 0); g.fill();
    g.strokeStyle = 'rgba(150,182,96,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(2, 0); g.lineTo(len * 0.92, 0); g.stroke();
    g.restore();
  };
  for (let i = 0; i < 9; i++) {
    const t = i / 8, side = i % 2 ? 1 : -1;
    leaf(S * (0.5 - 0.03 * Math.sin(t * 3)), S * (0.9 - 0.74 * t), -Math.PI / 2 + side * rr(0.75, 1.2), S * rr(0.3, 0.4), S * rr(0.09, 0.13));
  }
  leaf(S * 0.52, S * 0.15, -Math.PI / 2 + rr(-0.2, 0.2), S * 0.13, S * 0.06);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = anisotropy;
  cache.set('folhagem', t);
  return t;
}
