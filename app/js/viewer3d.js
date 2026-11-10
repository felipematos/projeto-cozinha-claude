// Visualizador 3D (baixa fidelidade ou detalhado), sincronizado com o estado da planta.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { makeMaterials, buildRoom, buildItem, allMaterials } from './models.js';
import { setAnisotropy, whenTexturesLoaded, nuvens } from './textures.js';
import { ROOM } from './data.js';

const cm = (v) => v / 100;

// ---- ajustes de "fotografia" do 3D detalhado ----
const LOOK = {
  exposure: 1.0,        // exposição do tone mapping
  ambient: 1.55,        // reforço da luz ambiente dentro do cômodo (como um HDR leve: interior e quintal na mesma foto)
  skyGain: 0.45,        // brilho do céu (fundo + luz ambiente)
  sun: 3.4,             // intensidade do sol direto
  // de onde vem o sol (cm: x, y da planta, altura), relativo ao centro do cômodo. Vem da frente-esquerda, a ~32° de altura,
  // passando pela árvore do quintal (ROOM.lot.arvore): a sombra da copa cai sobre a persiana de vidro da frente e entra no piso.
  sunPos: [-670, -770, 630],
  bloom: 0.1,           // halo suave nas áreas estouradas (céu pelas janelas, lâmpadas)
  grain: 0.022,         // grão de filme
  vignette: 0.16,       // escurecimento dos cantos
};

/** Passe final: vinheta e grão — tira o aspecto "limpo demais" de imagem gerada por computador. */
const FilmShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: LOOK.grain }, uVig: { value: LOOK.vignette } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVig; varying vec2 vUv;
    float hash( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * .1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }
    void main() {
      vec4 c = texture2D( tDiffuse, vUv );
      float d = length( ( vUv - 0.5 ) * vec2( 1.0, 0.86 ) );
      c.rgb *= mix( 1.0 - uVig, 1.0, smoothstep( 0.78, 0.28, d ) );
      float l = dot( c.rgb, vec3( 0.299, 0.587, 0.114 ) );
      float n = hash( gl_FragCoord.xy + fract( uTime ) * 97.0 ) + hash( gl_FragCoord.yx * 1.7 + fract( uTime * 1.3 ) * 41.0 ) - 1.0;
      c.rgb += n * uGrain * ( 1.0 - 0.6 * l );
      gl_FragColor = c;
    }`,
};

// Vistas pré-definidas (posição e alvo em cm: [x, y_planta, altura])
export const VIEWS = {
  quintal:  { nome: 'Do quintal (frente)', pos: [300, -430, 175], alvo: [210, 330, 120] },
  entrada:  { nome: 'Do fundo (porta da casa)', pos: [210, 590, 170], alvo: [200, 20, 105] },
  cozinha:  { nome: 'Cozinha', pos: [170, 230, 165], alvo: [330, 600, 100] },
  copa:     { nome: 'Copa', pos: [400, 430, 170], alvo: [80, 120, 110] },
  lenha:    { nome: 'Fogão a lenha', pos: [180, 360, 160], alvo: [420, 480, 110] },
  isometrica: { nome: 'Isométrica (sem telhado)', pos: [980, -330, 900], alvo: [230, 330, 40], semTelhado: true },
  topo:     { nome: 'Superior (sem telhado)', pos: [230, 321, 1250], alvo: [230, 320, 0], semTelhado: true },
};

export class Viewer {
  constructor(container, hi, store) {
    this.container = container; this.hi = hi; this.store = store;
    this.visible = false; this.dirty = true; this.walk = false;
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }));
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    if (hi) {
      r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = LOOK.exposure;
      r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    setAnisotropy(r.capabilities.getMaxAnisotropy());
    container.appendChild(r.domElement);

    const scene = (this.scene = new THREE.Scene());
    scene.background = new THREE.Color(hi ? 0xc9d6e2 : 0xeef0f1);
    if (hi) this.setupSky();
    this.camera = new THREE.PerspectiveCamera(hi ? 55 : 50, 1, 0.05, 200);
    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;

    this.M = makeMaterials(hi);
    if (hi) {
      const ext = new Set(this.M.externos);
      for (const m of allMaterials(this.M)) { if (ext.has(m)) m.envMap = this.skyEnv.texture; else if (m.isMeshStandardMaterial && m !== this.M.casaInterior) m.envMapIntensity *= LOOK.ambient; }
    }
    const room = buildRoom(this.M, hi);
    this.roomGroups = room.groups;
    scene.add(room.root);
    if (!hi) this.addEdges(room.root);
    this.furn = new THREE.Group(); scene.add(this.furn);
    this.selBox = new THREE.Box3Helper(new THREE.Box3(), 0xd2552b); this.selBox.visible = false; this.selBox.material.depthTest = false; this.selBox.renderOrder = 999; scene.add(this.selBox);
    this.setupLights();
    if (hi) this.setupComposer();

    this.setView('quintal', true);
    new ResizeObserver(() => this.resize()).observe(container);
    this.setupWalk();
    this.setupMeasure();
    this.setupPick();
    store.on((reason) => { if (reason === 'select') this.updateSelection(); else this.dirty = true; });
    const loop = () => { requestAnimationFrame(loop); if (this.visible) this.frame(); };
    this.clock = new THREE.Clock();
    loop();
  }

  setupLights() {
    const s = this.scene;
    if (this.hi) {
      // a luz ambiente vem da sonda (céu + rebatimento do próprio cômodo); aqui só o sol direto e um mínimo de preenchimento
      s.add(new THREE.HemisphereLight(0xdde8f5, 0x8c7a5c, 0.06));
      const sun = (this.sun = new THREE.DirectionalLight(0xfff0d8, LOOK.sun));
      sun.target.position.set(cm(230), 0, cm(320));
      sun.position.copy(sun.target.position).addScaledVector(this.sunDir, 22);
      sun.castShadow = true;
      sun.shadow.mapSize.set(4096, 4096);
      const c = sun.shadow.camera; c.left = -10.5; c.right = 10.5; c.top = 10.5; c.bottom = -10.5; c.near = 1; c.far = 48;   // inclui a árvore do quintal
      sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.018;
      s.add(sun, sun.target);
    } else {
      s.add(new THREE.HemisphereLight(0xffffff, 0xb8ab98, 1.6));
      const d = new THREE.DirectionalLight(0xffffff, 1.1); d.position.set(5, 9, -4); s.add(d);
    }
  }

  /**
   * Céu físico (Preetham) como fundo e como fonte da luz ambiente. A luz que chega em cada superfície vem de uma
   * SONDA: um cubemap renderizado de dentro do cômodo (céu pelas aberturas, telhado escuro, paredes, piso iluminado),
   * filtrado em PMREM. Assim o interior fica naturalmente mais escuro que o quintal e os reflexos mostram o próprio ambiente.
   */
  setupSky() {
    const r = this.renderer, scene = this.scene;
    const [sx, sy, sz] = LOOK.sunPos;
    this.sunDir = new THREE.Vector3(cm(sx), cm(sz), cm(sy)).normalize();
    const sky = (this.sky = new Sky());
    sky.material.fragmentShader = sky.material.fragmentShader
      .replace('L0 += ( vSunE * 19000.0 * Fex ) * sundisk;', '')                                  // sem o disco solar (o sol direto é a DirectionalLight)
      .replace('uniform vec3 up;', 'uniform vec3 up;\nuniform float skyGain;')
      .replace('gl_FragColor = vec4( retColor, 1.0 );', 'gl_FragColor = vec4( retColor * skyGain, 1.0 );');
    const u = sky.material.uniforms;
    u.skyGain = { value: LOOK.skyGain };
    u.turbidity.value = 2.4; u.rayleigh.value = 1.7; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.82;
    u.sunPosition.value.copy(this.sunDir);
    sky.scale.setScalar(90); sky.raycast = () => {}; sky.userData.noAO = true;
    scene.add(sky);
    scene.fog = new THREE.Fog(0xc9d6e2, 30, 80);
    // nuvens esparsas: plano alto com textura de ruído (entra no fundo, nos reflexos e na sonda)
    const mkClouds = () => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), new THREE.MeshBasicMaterial({ map: nuvens(), color: new THREE.Color(1.5, 1.5, 1.5), transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }));
      m.rotation.x = Math.PI / 2; m.position.set(2, 34, 3); m.raycast = () => {}; m.userData.noAO = true; m.renderOrder = -1;
      return m;
    };
    scene.add((this.clouds = mkClouds()));
    // ambiente só do céu + chão (usado do lado de fora e como 1ª passada da sonda)
    const es = new THREE.Scene(), sky2 = new THREE.Mesh(sky.geometry, sky.material);
    sky2.scale.setScalar(90); es.add(sky2, mkClouds());
    const chao = new THREE.Mesh(new THREE.CircleGeometry(80, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.2, 0.15) }));
    chao.rotation.x = -Math.PI / 2; chao.position.y = -1.5; es.add(chao);
    this.pmrem = new THREE.PMREMGenerator(r);
    this.skyScene = es;
    this.skyEnv = this.pmrem.fromScene(es, 0, 0.1, 200);
    scene.environment = this.skyEnv.texture;
    this.probeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    this.probeCam = new THREE.CubeCamera(0.05, 150, this.probeRT);
    this.probeCam.position.set(cm(214), 1.4, cm(300));
    this.probeDirty = true;
    whenTexturesLoaded().then(() => { this.probeDirty = true; });
  }

  /** Muda a posição do sol (cm: x, y da planta, altura) e/ou o brilho do céu e refaz o ambiente. */
  setSun(pos = LOOK.sunPos, gain = this.sky.material.uniforms.skyGain.value) {
    this.sunDir.set(cm(pos[0]), cm(pos[2]), cm(pos[1])).normalize();
    const u = this.sky.material.uniforms; u.sunPosition.value.copy(this.sunDir); u.skyGain.value = gain;
    this.sun.position.copy(this.sun.target.position).addScaledVector(this.sunDir, 22);
    const old = this.skyEnv;
    this.skyEnv = this.pmrem.fromScene(this.skyScene, 0, 0.1, 200);
    for (const m of this.M.externos) m.envMap = this.skyEnv.texture;
    old.dispose(); this.probeDirty = true;
  }

  /** Recaptura a sonda de ambiente (2 passadas = luz do céu + um rebatimento). Chamada quando o layout ou a envoltória mudam. */
  updateProbe() {
    this.probeDirty = false;
    const s = this.scene, hid = [this.selBox, this.mGroup, this.mHover].filter((o) => o && o.visible);
    hid.forEach((o) => (o.visible = false));
    const old = this.probeEnv; let rt = null;
    s.environment = this.skyEnv.texture;
    for (let i = 0; i < 2; i++) {
      this.probeCam.update(this.renderer, s);
      const n = this.pmrem.fromCubemap(this.probeRT.texture);
      rt?.dispose(); rt = n; s.environment = rt.texture;
    }
    this.probeEnv = rt; old?.dispose();
    hid.forEach((o) => (o.visible = true));
  }

  /** Pós-processamento do 3D detalhado: oclusão de ambiente (GTAO), halo (bloom) nas altas luzes, tone mapping e grão/vinheta. */
  setupComposer() {
    const r = this.renderer;
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    const c = (this.composer = new EffectComposer(r, rt));
    c.addPass(new RenderPass(this.scene, this.camera));
    const ao = (this.ao = new GTAOPass(this.scene, this.camera, 1, 1));
    ao.blendIntensity = 0.85;
    ao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 1, scale: 1, samples: 16 });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    // vidros e transparências não geram oclusão (senão a persiana "escurece" o que está atrás)
    const render = ao.render.bind(ao);
    ao.render = (...a) => {
      const hidden = [];
      this.scene.traverseVisible((o) => { if (o.isMesh && (o.userData.noAO || (Array.isArray(o.material) ? o.material.some((m) => m.transparent) : o.material?.transparent))) hidden.push(o); });
      hidden.forEach((o) => (o.visible = false)); render(...a); hidden.forEach((o) => (o.visible = true));
    };
    c.addPass(ao);
    c.addPass((this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), LOOK.bloom, 0.75, 1.15)));
    c.addPass(new OutputPass());
    c.addPass((this.film = new ShaderPass(FilmShader)));
  }

  render() {
    if (this.hi && this.probeDirty) this.updateProbe();
    if (this.film) this.film.uniforms.uTime.value = (performance.now() / 1000) % 1000;
    if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
  }

  addEdges(root) {
    root.traverse((o) => {
      if (o.isMesh && !o.userData.noEdges && o.geometry && !(o.material?.transparent)) {
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), this.M.linha);
        e.userData.noEdges = true; e.raycast = () => {};
        o.add(e);
      }
    });
  }

  rebuild() {
    this.furn.traverse((o) => { if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose(); });
    this.furn.clear();
    const ctx = { hi: this.hi, items: this.store.items };
    for (const it of this.store.items) {
      const g = buildItem(it, this.M, ctx);
      if (!this.hi) this.addEdges(g);
      this.furn.add(g);
    }
    this.dirty = false; this.probeDirty = true;
    this.updateSelection();
  }

  updateSelection() {
    const id = this.store.selectedId;
    const g = id && this.furn.children.find((c) => c.userData.itemId === id);
    if (g) { this.selBox.box.setFromObject(g); this.selBox.visible = true; } else this.selBox.visible = false;
  }

  setVisible(v) { this.visible = v; if (v) this.resize(); }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    if (this.composer) { this.composer.setPixelRatio(this.renderer.getPixelRatio()); this.composer.setSize(w, h); }
    this.renderer.domElement.style.width = '100%'; this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  frame() {
    if (this.dirty) this.rebuild();
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.walk) this.walkStep(dt); else { this.orbitKeysStep(dt); this.relaxPolar(); this.controls.update(); }
    this.render();
    this.updateMeasureLabels();
  }

  setRoof(v) { this.roomGroups.telhado.visible = v; this.roomGroups.luzes.visible = v; this.probeDirty = true; }
  setFront(v) { this.roomGroups.frente.visible = v; this.probeDirty = true; }
  setExterior(v) { this.roomGroups.externo.visible = v; this.probeDirty = true; }

  setView(name, instant = false) {
    const v = VIEWS[name]; if (!v) return;
    this.setWalk(false);
    this.setRoof(!v.semTelhado);
    this.onRoofChange?.(!v.semTelhado);
    const to = new THREE.Vector3(cm(v.pos[0]), cm(v.pos[2]), cm(v.pos[1]));
    const tgt = new THREE.Vector3(cm(v.alvo[0]), cm(v.alvo[2]), cm(v.alvo[1]));
    if (instant) { this.camera.position.copy(to); this.controls.target.copy(tgt); this.controls.update(); return; }
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone(), start = performance.now();
    const anim = () => {
      const k = Math.min(1, (performance.now() - start) / 700), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.camera.position.lerpVectors(p0, to, e); this.controls.target.lerpVectors(t0, tgt, e);
      if (k < 1) requestAnimationFrame(anim);
    };
    anim();
  }

  // ---------- modo caminhar (WASD + arrastar para olhar) ----------
  setupWalk() {
    this.keys = {};
    this.yaw = 0; this.pitch = 0;
    const NAV = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyX', 'ShiftLeft', 'ShiftRight']);
    window.addEventListener('keydown', (e) => {
      if (!this.visible || isTyping(e) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('#dlg:not([hidden])')) return;
      if (!NAV.has(e.code)) return;
      this.keys[e.code] = true;
      if (e.code.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    const el = this.renderer.domElement;
    let drag = null;
    el.addEventListener('pointerdown', (e) => { if (this.walk) { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); } });
    el.addEventListener('pointermove', (e) => {
      if (!this.walk || !drag) return;
      this.yaw -= (e.clientX - drag.x) * 0.004; this.pitch -= (e.clientY - drag.y) * 0.004;
      this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch)); drag = { x: e.clientX, y: e.clientY };
    });
    el.addEventListener('pointerup', () => { drag = null; });
  }
  setWalk(on) {
    if (on === this.walk) return;
    this.walk = on; this.controls.enabled = !on;
    if (on) {
      this.setRoof(true); this.onRoofChange?.(true);
      const p = this.camera.position;
      const inside = p.x > 0 && p.x < cm(ROOM.innerRight) && p.z > 0 && p.z < cm(ROOM.D);
      if (!inside) this.camera.position.set(cm(230), 1.6, cm(80));
      this.camera.position.y = 1.6;
      const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
      if (!inside) dir.set(0, 0, 1);
      this.yaw = Math.atan2(-dir.x, -dir.z); this.pitch = 0;
    } else {
      const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
      this.controls.target.copy(this.camera.position).addScaledVector(dir, 2);
    }
    this.onWalkChange?.(on);
  }
  /**
   * Navegação por teclado fora do modo caminhar: ↑↓ anda, ←→ gira, ⇧+setas muda a direção da câmera (←→ gira, ↑↓ inclina),
   * W/S sobe/desce, A/D lateral, Z/⇧Z (X) zoom; ⇧ acelera W/S/A/D.
   */
  orbitKeysStep(dt) {
    const k = this.keys;
    if (!Object.values(k).some(Boolean)) return;
    const shift = k.ShiftLeft || k.ShiftRight;
    const ax = (k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0), ay = (k.ArrowUp ? 1 : 0) - (k.ArrowDown ? 1 : 0);
    const sp = (shift ? 3.2 : 1.4) * dt, cam = this.camera.position, tgt = this.controls.target;
    const look = tgt.clone().sub(cam), fwd = new THREE.Vector3(look.x, 0, look.z);
    if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1); fwd.normalize();
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const move = new THREE.Vector3();
    move.addScaledVector(fwd, (shift ? 0 : ay) * sp);
    move.addScaledVector(right, ((k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0)) * sp);
    move.y += ((k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0)) * sp;
    if (move.lengthSq()) {
      if (cam.y + move.y < 0.15) move.y = 0.15 - cam.y;
      cam.add(move); tgt.add(move);
    }
    // direção da câmera: a câmera fica no lugar e o alvo gira em torno dela (←→), ou sobe/desce (⇧ + ↑↓)
    const yaw = ax * (shift ? 1.2 : 1.0) * dt, pitch = shift ? ay * 0.8 * dt : 0;
    if (yaw || pitch) {
      look.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      if (pitch) {
        const len = look.length() || 1, hl = Math.hypot(look.x, look.z);
        const hx = hl > 1e-6 ? look.x / hl : fwd.x, hz = hl > 1e-6 ? look.z / hl : fwd.z;
        const el = Math.max(-1.45, Math.min(1.45, Math.asin(Math.max(-1, Math.min(1, look.y / len))) + pitch));
        look.set(hx * Math.cos(el) * len, Math.sin(el) * len, hz * Math.cos(el) * len);
      }
      tgt.copy(cam).add(look);
    }
    const zoomIn = k.KeyZ && !shift, zoomOut = k.KeyX || (k.KeyZ && shift);
    if (zoomIn || zoomOut) {
      const off = cam.clone().sub(tgt), dist = off.length();
      if (dist < 1e-3) this.camera.getWorldDirection(off).negate();
      const f = zoomIn ? Math.max(0.3, dist * (1 - 1.6 * dt)) : Math.min(60, Math.max(0.3, dist) * (1 + 1.6 * dt));
      cam.copy(tgt).addScaledVector(off.normalize(), f);
    }
  }
  /** O giro com o mouse não deixa a câmera passar abaixo do alvo; se o teclado apontou a câmera para cima, o limite acompanha. */
  relaxPolar() {
    const o = this.camera.position.clone().sub(this.controls.target), l = o.length();
    if (l < 1e-6) return;
    this.controls.maxPolarAngle = Math.max(Math.PI * 0.495, Math.min(Math.PI - 0.05, Math.acos(Math.max(-1, Math.min(1, o.y / l)))));
  }

  /** Modo caminhar: W/A/S/D ou setas andam; ⇧+setas olham em volta (como arrastar); ⇧ corre. */
  walkStep(dt) {
    const k = this.keys, shift = k.ShiftLeft || k.ShiftRight, sp = (shift ? 2.6 : 1.3) * dt, arrows = !shift;
    const f = (k.KeyW || (arrows && k.ArrowUp) ? 1 : 0) - (k.KeyS || (arrows && k.ArrowDown) ? 1 : 0);
    const s = (k.KeyD || (arrows && k.ArrowRight) ? 1 : 0) - (k.KeyA || (arrows && k.ArrowLeft) ? 1 : 0);
    if (shift) {
      this.yaw += ((k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0)) * 1.2 * dt;
      this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch + ((k.ArrowUp ? 1 : 0) - (k.ArrowDown ? 1 : 0)) * 0.8 * dt));
    }
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const p = this.camera.position;
    p.x += (fx * f - fz * s) * sp; p.z += (fz * f + fx * s) * sp;
    p.x = Math.max(-6, Math.min(5.9, p.x)); p.z = Math.max(-4.6, Math.min(cm(ROOM.D) - 0.2, p.z));
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  // ---------- clique para selecionar ----------
  setupPick() {
    const el = this.renderer.domElement, ray = new THREE.Raycaster(), v = new THREE.Vector2();
    let down = null;
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', (e) => {
      if (this.measureOn) return;
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
      const r = el.getBoundingClientRect();
      v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v, this.camera);
      const hit = ray.intersectObjects(this.furn.children, true).find((h) => h.object.userData.itemId);
      this.store.select(hit ? hit.object.userData.itemId : null);
    });
  }

  /** Renderiza a vista atual em alta resolução e retorna dataURL PNG. */
  snapshot(width = 2400, height = 1500, type = 'image/png', quality = 0.92) {
    if (this.dirty) this.rebuild();
    const r = this.renderer, oldSize = r.getSize(new THREE.Vector2()), oldPR = r.getPixelRatio();
    const selVis = this.selBox.visible; this.selBox.visible = false;
    r.setPixelRatio(1); r.setSize(width, height, false);
    if (this.composer) { this.composer.setPixelRatio(1); this.composer.setSize(width, height); }
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    this.render();
    let url = r.domElement.toDataURL(type, quality);
    if (this.measures.length) url = this.compositeLabels(width, height, type, quality);
    r.setPixelRatio(oldPR); r.setSize(oldSize.x, oldSize.y, false);
    this.selBox.visible = selVis;
    this.resize();
    return url;
  }
}

// ---------------------------------------------------------------- medição 3D
const MCOL = 0x0f7a8a;
const fmtLen = (cmv) => (cmv < 100 ? `${(Math.round(cmv * 10) / 10).toString().replace('.', ',')} cm` : `${(cmv / 100).toFixed(2).replace('.', ',')} m`);
const fmtCm = (cmv) => `${Math.round(cmv)}`;

Object.assign(Viewer.prototype, {
  setupMeasure() {
    this.measureOn = false; this.measures = [];
    this.mLayer = document.createElement('div'); this.mLayer.className = 'measure-layer'; this.container.appendChild(this.mLayer);
    this.mGroup = new THREE.Group(); this.mGroup.renderOrder = 999; this.scene.add(this.mGroup);
    this.mMat = new THREE.LineBasicMaterial({ color: MCOL, depthTest: false, transparent: true, linewidth: 2 });
    this.mDash = new THREE.LineDashedMaterial({ color: MCOL, depthTest: false, transparent: true, opacity: 0.55, dashSize: 0.05, gapSize: 0.035 });
    this.mDotMat = new THREE.MeshBasicMaterial({ color: MCOL, depthTest: false, transparent: true });
    this.mHover = new THREE.Mesh(new THREE.RingGeometry(0.018, 0.028, 24), new THREE.MeshBasicMaterial({ color: MCOL, depthTest: false, transparent: true, side: THREE.DoubleSide }));
    this.mHover.renderOrder = 1000; this.mHover.visible = false; this.scene.add(this.mHover);
    const el = this.renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let cur = null;
    const visible = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
    const hit = (e, from) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      const hits = ray.intersectObjects(this.scene.children, true).filter((h) => h.object.isMesh && h.object !== this.mHover && !isIn(h.object, this.mGroup) && visible(h.object));
      let p, snapped = false;
      if (hits.length) {
        const h = hits[0]; p = h.point.clone();
        if (!e.altKey && h.face) {
          // ímã: vértice mais próximo do triângulo atingido (≤ 14 px na tela)
          const pos = h.object.geometry.attributes.position; let best = 14;
          for (const idx of [h.face.a, h.face.b, h.face.c]) {
            const v = new THREE.Vector3().fromBufferAttribute(pos, idx); h.object.localToWorld(v);
            const sp = v.clone().project(this.camera);
            if (sp.z < -1 || sp.z > 1 || v.distanceTo(h.point) > 0.6) continue; // atrás da câmera ou longe do ponto atingido
            const d = Math.hypot((sp.x - ndc.x) * r.width / 2, (sp.y - ndc.y) * r.height / 2);
            if (d < best) { best = d; p = v; snapped = true; }
          }
        }
      } else if (from) {
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(new THREE.Vector3()).negate(), from);
        p = ray.ray.intersectPlane(plane, new THREE.Vector3());
      }
      if (p && from && e.shiftKey) {
        const d = p.clone().sub(from), ax = ['x', 'y', 'z'].reduce((a, k) => (Math.abs(d[k]) > Math.abs(d[a]) ? k : a), 'x');
        p = from.clone(); p[ax] += d[ax];
      }
      return p ? { p, snapped, normal: hits[0]?.face ? hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld) : null } : null;
    };
    el.addEventListener('pointerdown', (e) => {
      if (!this.measureOn || e.button !== 0) return;
      const h = hit(e); if (!h) return;
      e.stopImmediatePropagation();
      this.controls.enabled = false;
      cur = this.addMeasure(h.p, h.p.clone());
      el.setPointerCapture(e.pointerId);
    }, true);
    const finish = () => {
      if (!cur) return;
      if (cur.a.distanceTo(cur.b) < 0.005) this.removeMeasure(cur); else this.onMeasuresChange?.(this.measures.length);
      cur = null; this.controls.enabled = !this.walk;
    };
    el.addEventListener('pointermove', (e) => {
      if (!this.measureOn) { this.mHover.visible = false; return; }
      if (cur && !(e.buttons & 1)) finish();
      if (cur) { const h = hit(e, cur.a); if (h) { cur.b.copy(h.p); this.updateMeasure(cur); } this.mHover.visible = false; return; }
      const h = hit(e);
      this.mHover.visible = !!h;
      if (h) {
        this.mHover.position.copy(h.p);
        if (h.normal) this.mHover.lookAt(h.p.clone().add(h.normal));
        const sc = this.camera.position.distanceTo(h.p) * (h.snapped ? 0.9 : 0.6); this.mHover.scale.setScalar(sc);
      }
    });
    el.addEventListener('pointerup', finish);
    window.addEventListener('pointerup', finish);
    el.addEventListener('lostpointercapture', finish);
    el.addEventListener('pointerleave', () => { this.mHover.visible = false; });
  },
  setMeasure(on) {
    this.measureOn = on; this.container.classList.toggle('measuring', on);
    if (on && this.walk) this.setWalk(false);
    if (!on) this.mHover.visible = false;
  },
  addMeasure(a, b) {
    const m = { a, b, g: new THREE.Group() };
    m.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), this.mMat);
    m.dash = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, a, a]), this.mDash);
    m.dots = [a, b].map((p) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), this.mDotMat); d.position.copy(p); return d; });
    m.g.add(m.line, m.dash, ...m.dots); m.g.traverse((o) => { o.renderOrder = 999; o.raycast = () => {}; });
    this.mGroup.add(m.g);
    m.label = document.createElement('div'); m.label.className = 'm-label'; this.mLayer.appendChild(m.label);
    this.measures.push(m); this.updateMeasure(m);
    return m;
  },
  updateMeasure(m) {
    m.line.geometry.setFromPoints([m.a, m.b]);
    const corner = new THREE.Vector3(m.b.x, m.a.y, m.b.z);
    m.dash.geometry.setFromPoints([m.a, corner, m.b]); m.dash.computeLineDistances();
    m.dots[0].position.copy(m.a); m.dots[1].position.copy(m.b);
    const d = m.b.clone().sub(m.a), L = d.length() * 100, hz = Math.hypot(d.x, d.z) * 100, vt = Math.abs(d.y) * 100;
    m.dash.visible = hz > 1 && vt > 1;
    m.label.innerHTML = fmtLen(L) + (hz > 1 && vt > 1 ? `<small>↔ ${fmtCm(hz)} · ↕ ${fmtCm(vt)} cm</small>` : '');
    m.text = [fmtLen(L), hz > 1 && vt > 1 ? `↔ ${fmtCm(hz)} · ↕ ${fmtCm(vt)} cm` : ''];
  },
  removeMeasure(m) {
    this.mGroup.remove(m.g); m.g.traverse((o) => o.geometry?.dispose()); m.label.remove();
    this.measures = this.measures.filter((x) => x !== m);
  },
  clearMeasures() { [...this.measures].forEach((m) => this.removeMeasure(m)); this.onMeasuresChange?.(0); },
  undoMeasure() { const m = this.measures.at(-1); if (m) this.removeMeasure(m); this.onMeasuresChange?.(this.measures.length); },
  updateMeasureLabels() {
    if (!this.measures.length) return;
    const w = this.container.clientWidth, h = this.container.clientHeight;
    for (const m of this.measures) {
      const p = m.a.clone().add(m.b).multiplyScalar(0.5).project(this.camera);
      const vis = p.z < 1 && Math.abs(p.x) < 1.2 && Math.abs(p.y) < 1.2;
      m.label.style.display = vis ? '' : 'none';
      if (vis) { m.label.style.left = `${((p.x + 1) / 2) * w}px`; m.label.style.top = `${((1 - p.y) / 2) * h}px`; }
    }
  },
  /** Desenha as etiquetas das medidas sobre a imagem exportada. */
  compositeLabels(W, H, type, quality) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.drawImage(this.renderer.domElement, 0, 0, W, H);
    const s = W / 1200;
    for (const m of this.measures) {
      const p = m.a.clone().add(m.b).multiplyScalar(0.5).project(this.camera);
      if (p.z >= 1) continue;
      const x = ((p.x + 1) / 2) * W, y = ((1 - p.y) / 2) * H;
      g.font = `600 ${13 * s}px Inter, Arial, sans-serif`;
      const w1 = g.measureText(m.text[0]).width; g.font = `500 ${11 * s}px Inter, Arial, sans-serif`; const w2 = m.text[1] ? g.measureText(m.text[1]).width : 0;
      const bw = Math.max(w1, w2) + 16 * s, bh = (m.text[1] ? 36 : 22) * s;
      g.fillStyle = '#0f7a8a'; g.beginPath(); g.roundRect(x - bw / 2, y - bh / 2, bw, bh, 6 * s); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `600 ${13 * s}px Inter, Arial, sans-serif`; g.fillText(m.text[0], x, y - (m.text[1] ? 7 * s : 0));
      if (m.text[1]) { g.font = `500 ${11 * s}px Inter, Arial, sans-serif`; g.fillText(m.text[1], x, y + 9 * s); }
    }
    return c.toDataURL(type, quality);
  },
});
function isIn(o, root) { for (let x = o; x; x = x.parent) if (x === root) return true; return false; }

function isTyping(e) { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'); }
