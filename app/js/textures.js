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

/** Madeira de demolição: tábuas com tons variados, veios, nós, furos de prego. 1 textura ≈ 1 m. */
export function woodDemolicao(variant = 'a', vertical = false) {
  return canvasTex('wood' + variant + vertical, 1024, (g, W, H) => {
    const palettes = {
      a: ['#7a5236', '#8b5e3c', '#6b4429', '#9a6a43', '#5e3b24', '#835a3a', '#a27349'],
      b: ['#5a3a26', '#6a4530', '#4c301f', '#73503a', '#3f2819'], // escura (vigas)
      c: ['#a47b52', '#b58a5f', '#94693f', '#c09468', '#8a6240'], // clara
    };
    const pal = palettes[variant] || palettes.a;
    if (vertical) { g.translate(W, 0); g.rotate(Math.PI / 2); }
    let y = 0;
    while (y < H) {
      const ph = rr(70, 150);
      const base = pick(pal);
      g.fillStyle = base; g.fillRect(0, y, W, ph);
      // tábuas com emendas
      let x = 0;
      while (x < W) {
        const len = rr(300, 900);
        g.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,230,200'},${rr(0.02, 0.1)})`;
        g.fillRect(x, y, len, ph);
        g.fillStyle = 'rgba(20,10,5,0.55)'; g.fillRect(x + len - 2, y, 3, ph);
        // furos de prego
        for (const yy of [y + ph * 0.25, y + ph * 0.75]) {
          if (rnd() < 0.7) { g.fillStyle = 'rgba(25,15,8,0.8)'; g.beginPath(); g.arc(x + len - rr(12, 22), yy, rr(2, 3.5), 0, 7); g.fill(); }
        }
        x += len;
      }
      // veios
      for (let k = 0; k < ph / 3; k++) {
        g.strokeStyle = `rgba(${rnd() < .7 ? '30,15,5' : '255,220,170'},${rr(0.05, 0.22)})`;
        g.lineWidth = rr(0.6, 2.2);
        g.beginPath();
        const yy = y + rr(2, ph - 2); const amp = rr(0.5, 4), f = rr(0.004, 0.02), ph0 = rr(0, 6);
        for (let xx = 0; xx <= W; xx += 16) g.lineTo(xx, yy + Math.sin(xx * f + ph0) * amp);
        g.stroke();
      }
      // nós
      for (let k = 0; k < 2; k++) if (rnd() < 0.45) {
        const kx = rr(40, W - 40), ky = y + ph / 2 + rr(-ph / 5, ph / 5), rx = rr(7, 16);
        for (let r = rx; r > 1; r -= 2.5) { g.strokeStyle = `rgba(35,18,8,${0.25 + (rx - r) / rx * 0.5})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(kx, ky, r * 1.8, r, 0, 0, 7); g.stroke(); }
      }
      // marcas de serra / desgaste
      for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(255,240,220,${rr(0.03, 0.08)})`; g.fillRect(rr(0, W), y + rr(0, ph), rr(20, 120), rr(1, 3)); }
      // junta escura entre tábuas
      g.fillStyle = 'rgba(15,8,4,0.85)'; g.fillRect(0, y + ph - 3, W, 3);
      g.fillStyle = 'rgba(255,230,190,0.08)'; g.fillRect(0, y, W, 2);
      y += ph;
    }
  });
}

/** Granilite avermelhado. 1 textura ≈ 50 cm. */
export function granilite() {
  return canvasTex('granilite', 1024, (g, W, H) => {
    g.fillStyle = '#a4523f'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '90,30,20' : '200,120,95'},${rr(.05, .25)})`; g.fillRect(rr(0, W), rr(0, H), rr(1, 4), rr(1, 4)); }
    const chips = ['#efe4d6', '#f6efe6', '#d9c3ad', '#5b1e16', '#7a2a1d', '#2e2522', '#c98b6b', '#e2b79a', '#8d8d8a'];
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = pick(chips);
      const cx = rr(0, W), cy = rr(0, H), r = Math.pow(rnd(), 2.2) * 14 + 1.5, n = 5 + Math.floor(rnd() * 3);
      g.beginPath();
      for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + rr(-.3, .3), rad = r * rr(.6, 1.2); g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
      g.closePath(); g.fill();
    }
  });
}

/** Porcelanato bege-acinzentado (existente). Uma peça de 80 cm por textura. */
export function porcelanato() {
  return canvasTex('porcelanato', 512, (g, W, H) => {
    const grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, '#bebab3'); grd.addColorStop(1, '#b3aea7');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const r = rr(20, 120); const gr = g.createRadialGradient(rr(0, W), rr(0, H), 0, rr(0, W), rr(0, H), r); g.fillStyle = `rgba(${rnd() < .5 ? '95,92,88' : '228,226,222'},${rr(.03, .1)})`; g.beginPath(); g.arc(rr(0, W), rr(0, H), r, 0, 7); g.fill(); void gr; }
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(70,68,65,${rr(.02, .08)})`; g.fillRect(rr(0, W), rr(0, H), 1.5, 1.5); }
    g.strokeStyle = '#8d8a85'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  });
}

/** Telhas vistas por baixo (cinza claro, onduladas). 1 textura ≈ 1 m. */
export function telhas() {
  return canvasTex('telhas', 512, (g, W, H) => {
    g.fillStyle = '#b9b9b4'; g.fillRect(0, 0, W, H);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x0 = (i / n) * W, w = W / n;
      const grd = g.createLinearGradient(x0, 0, x0 + w, 0);
      grd.addColorStop(0, '#8f908c'); grd.addColorStop(0.5, '#d7d7d2'); grd.addColorStop(1, '#8f908c');
      g.fillStyle = grd; g.fillRect(x0, 0, w, H);
    }
    for (let j = 0; j < 3; j++) { g.fillStyle = 'rgba(40,40,40,.35)'; g.fillRect(0, (j / 3) * H, W, 4); }
    for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(60,60,55,${rr(.03, .1)})`; g.fillRect(rr(0, W), rr(0, H), 2, 2); }
  });
}

export function grama() {
  return canvasTex('grama', 512, (g, W, H) => {
    g.fillStyle = '#5f7f3a'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 16000; i++) { g.strokeStyle = pick(['#4d6c2c', '#759a47', '#86a957', '#3f5d24', '#6a8c3e']); g.lineWidth = 1; const x = rr(0, W), y = rr(0, H); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-2, 2), y - rr(3, 8)); g.stroke(); }
  });
}

/** Tijolinho maciço aparente (fogão a lenha). 1 textura ≈ 50 cm. */
export function tijolo() {
  return canvasTex('tijolo', 512, (g, W, H) => {
    g.fillStyle = '#cfc0ab'; g.fillRect(0, 0, W, H);
    const bh = H / 8, bw = W / 2.2;
    for (let r = 0; r < 8; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let x = -bw; x < W + bw; x += bw) {
        g.fillStyle = pick(['#a4502f', '#b45d38', '#9a4528', '#bf6a43', '#8d3e24', '#ad5a3a']);
        g.fillRect(x + off + 3, r * bh + 3, bw - 6, bh - 6);
        for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '60,20,10' : '230,160,120'},${rr(.05, .18)})`; g.fillRect(x + off + rr(3, bw - 6), r * bh + rr(3, bh - 6), 3, 2); }
      }
    }
  });
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
 * Azulejos antigos sortidos 15 × 15 cm: 8 × 8 peças por textura (= 1,20 m), desenhos variados,
 * rotação aleatória, rejunte e marcas de uso (craquelê, desgaste, variação de esmalte).
 */
export function azulejos() {
  return canvasTex('azulejos', 1024, (g, W) => {
    const N = 8, S = W / N, gr = 3;
    g.fillStyle = '#d9d3c4'; g.fillRect(0, 0, W, W);                    // rejunte
    const BLUE = '#1f4f8f', BLUE2 = '#3d6fb0', CREAM = '#f3ecdc', WHITE = '#f6f3ea';
    const designs = [
      (c) => { // floral português azul
        c.fillStyle = WHITE; c.fillRect(-1, -1, 2, 2);
        c.fillStyle = BLUE; for (let k = 0; k < 4; k++) { c.save(); c.rotate(k * Math.PI / 2); c.beginPath(); c.ellipse(0, -0.38, 0.16, 0.3, 0, 0, 7); c.fill(); c.restore(); }
        c.fillStyle = WHITE; c.beginPath(); c.arc(0, 0, 0.16, 0, 7); c.fill();
        c.fillStyle = BLUE2; c.beginPath(); c.arc(0, 0, 0.08, 0, 7); c.fill();
        c.strokeStyle = BLUE; c.lineWidth = 0.07; for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.beginPath(); c.arc(x, y, 0.42, 0, 7); c.stroke(); }
      },
      (c) => { // estrela azul
        c.fillStyle = CREAM; c.fillRect(-1, -1, 2, 2);
        c.fillStyle = BLUE; c.beginPath(); for (let k = 0; k < 16; k++) { const r = k % 2 ? 0.32 : 0.8, a = (k / 16) * Math.PI * 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
        c.fillStyle = CREAM; c.beginPath(); c.arc(0, 0, 0.2, 0, 7); c.fill();
      },
      (c) => { // hidráulico verde/amarelo
        c.fillStyle = '#e6c75a'; c.fillRect(-1, -1, 2, 2);
        c.fillStyle = '#3f7a54'; c.beginPath(); c.moveTo(0, -0.9); c.lineTo(0.9, 0); c.lineTo(0, 0.9); c.lineTo(-0.9, 0); c.closePath(); c.fill();
        c.fillStyle = CREAM; c.beginPath(); c.arc(0, 0, 0.38, 0, 7); c.fill();
        c.fillStyle = '#b5532f'; c.beginPath(); c.arc(0, 0, 0.16, 0, 7); c.fill();
      },
      (c) => { // terracota e creme (cruz)
        c.fillStyle = CREAM; c.fillRect(-1, -1, 2, 2);
        c.fillStyle = '#a9472a'; c.fillRect(-0.2, -1, 0.4, 2); c.fillRect(-1, -0.2, 2, 0.4);
        c.fillStyle = '#5b6b3a'; for (const [x, y] of [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]]) { c.beginPath(); c.arc(x, y, 0.16, 0, 7); c.fill(); }
      },
      (c) => { // liso creme envelhecido
        c.fillStyle = '#efe5cf'; c.fillRect(-1, -1, 2, 2);
      },
      (c) => { // andaluz amarelo/azul (losango em canto)
        c.fillStyle = '#f0d27a'; c.fillRect(-1, -1, 2, 2);
        c.fillStyle = BLUE; c.beginPath(); c.moveTo(-1, -1); c.lineTo(0.1, -1); c.lineTo(-1, 0.1); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(1, 1); c.lineTo(-0.1, 1); c.lineTo(1, -0.1); c.closePath(); c.fill();
        c.fillStyle = '#2f7d6d'; c.beginPath(); c.arc(0, 0, 0.3, 0, 7); c.fill();
      },
      (c) => { // branco com friso azul
        c.fillStyle = WHITE; c.fillRect(-1, -1, 2, 2);
        c.strokeStyle = BLUE; c.lineWidth = 0.12; c.strokeRect(-0.78, -0.78, 1.56, 1.56);
        c.lineWidth = 0.05; c.strokeRect(-0.5, -0.5, 1, 1);
        c.fillStyle = BLUE2; c.beginPath(); c.arc(0, 0, 0.14, 0, 7); c.fill();
      },
      (c) => { // folhas verdes em diagonal
        c.fillStyle = CREAM; c.fillRect(-1, -1, 2, 2);
        c.fillStyle = '#4e7d3b'; for (let k = -1; k <= 1; k++) { c.save(); c.translate(k * 0.55, -k * 0.55); c.rotate(Math.PI / 4); c.beginPath(); c.ellipse(0, 0, 0.18, 0.45, 0, 0, 7); c.fill(); c.restore(); }
        c.fillStyle = '#b5532f'; c.beginPath(); c.arc(0.55, 0.55, 0.12, 0, 7); c.arc(-0.55, -0.55, 0.12, 0, 7); c.fill();
      },
    ];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = i * S + gr / 2, y = j * S + gr / 2, sz = S - gr;
      g.save(); g.beginPath(); g.rect(x, y, sz, sz); g.clip();
      g.translate(x + sz / 2, y + sz / 2); g.scale(sz / 2, sz / 2); g.rotate(Math.floor(rnd() * 4) * Math.PI / 2);
      designs[Math.floor(rnd() * designs.length)](g);
      g.restore();
      // esmalte irregular, desgaste e craquelê
      g.fillStyle = `rgba(${rnd() < .5 ? '255,250,235' : '120,100,70'},${rr(.03, .12)})`; g.fillRect(x, y, sz, sz);
      for (let k = 0; k < 18; k++) { g.fillStyle = `rgba(90,70,50,${rr(.04, .14)})`; g.beginPath(); g.arc(x + rr(0, sz), y + rr(0, sz), rr(1, 4), 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(80,70,60,0.18)'; g.lineWidth = 0.7;
      for (let k = 0; k < 3; k++) { g.beginPath(); let px = x + rr(0, sz), py = y + rr(0, sz); g.moveTo(px, py); for (let m = 0; m < 4; m++) { px += rr(-18, 18); py += rr(-18, 18); g.lineTo(Math.min(x + sz, Math.max(x, px)), Math.min(y + sz, Math.max(y, py))); } g.stroke(); }
      if (rnd() < 0.08) { g.fillStyle = 'rgba(200,190,170,0.9)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(6, 14), y); g.lineTo(x, y + rr(6, 14)); g.fill(); } // canto lascado
    }
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

/** Tijolinho maciço: [cor, relevo]. 1 textura ≈ 46 cm (2 tijolos × 8 fiadas). */
export function tijoloPar() {
  return pairTex('tijoloPar', 1024, (g, b, W, H) => {
    g.fillStyle = '#b9ab98'; g.fillRect(0, 0, W, H); noise(g, W, H, 9000, ['90,80,70', '230,220,205'], 0.08, 0.3, 1, 3);
    b.fillStyle = '#3a3a3a'; b.fillRect(0, 0, W, H); noise(b, W, H, 6000, ['0,0,0', '110,110,110'], 0.2, 0.5, 1, 3);
    const rows = 8, bh = H / rows, bw = W / 2, j = 7;
    const tones = [[168, 82, 48], [180, 94, 58], [150, 70, 40], [190, 108, 70], [138, 62, 36], [172, 90, 60], [160, 96, 66]];
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let x = -bw; x < W + bw; x += bw) {
        const x0 = x + off + j / 2 + rr(-1, 1), y0 = r * bh + j / 2 + rr(-1, 1), w = bw - j, h = bh - j;
        const [cr, cg, cb] = pick(tones), d = rr(-12, 12);
        const gr = g.createLinearGradient(x0, y0, x0 + w, y0 + h);
        gr.addColorStop(0, `rgb(${cr + d + 10},${cg + d + 6},${cb + d + 4})`); gr.addColorStop(1, `rgb(${cr + d - 14},${cg + d - 10},${cb + d - 8})`);
        g.fillStyle = gr; g.beginPath(); g.roundRect(x0, y0, w, h, 5); g.fill();
        // manchas de queima, poros e lascas
        for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '70,25,10' : '220,150,110'},${rr(.06, .16)})`; g.beginPath(); g.ellipse(x0 + rr(0, w), y0 + rr(0, h), rr(15, 60), rr(6, 18), 0, 0, 7); g.fill(); }
        for (let k = 0; k < 160; k++) { g.fillStyle = `rgba(${rnd() < .6 ? '55,20,8' : '235,175,130'},${rr(.08, .3)})`; const s = rr(1, 2.6); g.fillRect(x0 + rr(2, w - 2), y0 + rr(2, h - 2), s, s); }
        b.fillStyle = '#c8c8c8'; b.beginPath(); b.roundRect(x0, y0, w, h, 6); b.fill();
        for (let k = 0; k < 140; k++) { b.fillStyle = `rgba(${rnd() < .6 ? '60,60,60' : '255,255,255'},${rr(.15, .45)})`; const s = rr(1, 3); b.fillRect(x0 + rr(2, w - 2), y0 + rr(2, h - 2), s, s); }
        for (let k = 0; k < 2; k++) if (rnd() < 0.5) { // lasca na aresta
          const ex = x0 + rr(0, w), ey = rnd() < .5 ? y0 : y0 + h, rr2 = rr(4, 10);
          b.fillStyle = '#4a4a4a'; b.beginPath(); b.arc(ex, ey, rr2, 0, 7); b.fill();
          g.fillStyle = 'rgba(120,100,85,0.8)'; g.beginPath(); g.arc(ex, ey, rr2 * 0.8, 0, 7); g.fill();
        }
      }
    }
  });
}

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
export function photo(name, { repeat = [1, 1], mirror = false } = {}) {
  const key = 'photo:' + name + repeat.join('x') + mirror;
  if (cache.has(key)) return cache.get(key);
  pending++;
  const t = loader.load(`assets/tex/${name}.jpg`, done, undefined, done);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  if (repeat[0] !== 1 || repeat[1] !== 1 || mirror) {
    t.wrapS = t.wrapT = mirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  cache.set(key, t);
  return t;
}
