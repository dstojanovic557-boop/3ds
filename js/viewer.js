import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/addons/OrbitControls.js';
import { GLTFLoader } from './vendor/addons/GLTFLoader.js';
import { RoomEnvironment } from './vendor/addons/RoomEnvironment.js';

const box = document.getElementById('viewer'), canvas = document.getElementById('c3d');
let started = false;
const go0 = () => { if (started) return; started = true; init(); };
new IntersectionObserver(es => es.forEach(e => e.isIntersecting && go0()), { rootMargin: '600px' }).observe(box);
// model se učitava odmah posle stranice, ne čeka skrol
if (document.readyState === 'complete') setTimeout(go0, 300); else addEventListener('load', () => setTimeout(go0, 300));

function fail() { const l = document.getElementById('v-load'); l.querySelector('span').textContent = 'Model nije mogao da se učita. Osveži stranicu.'; }
function init() {
  try { if (!window.WebGLRenderingContext) return fail(); } catch (e) { return fail(); }
  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 800 ? 1.5 : 2));
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe9e4dc);
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9a70, 0.6));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.3); sun.position.set(-30, 40, -25); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 150 }); sun.shadow.bias = -0.0004;
  scene.add(sun);
  const cam = new THREE.PerspectiveCamera(45, 1, 0.05, 2000);
  const ctl = new OrbitControls(cam, canvas); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * 0.495; ctl.enabled = false; ctl.enableZoom = false;
  const P = (x, y, z) => new THREE.Vector3(x, z, -y);   // SketchUp metri -> glTF
  const V = {
    air: [P(-9, 15, 15), P(7, 31, 1)], garden: [P(3, 17.5, 1.7), P(6, 30, 2.3)],
    terrace: [P(-1.2, 23, 2.6), P(4.8, 30.5, 2.0)], inside: [P(8.6, 27.75, 2.25), P(2.2, 32.9, 1.7)]
  };
  const size = () => { const w = box.clientWidth, h = box.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);
  const go = (k, anim = true) => {
    const [e, t] = V[k];
    document.querySelectorAll('.v-btns button').forEach(b => b.classList.toggle('on', b.dataset.v === k));
    if (!anim) { cam.position.copy(e); ctl.target.copy(t); ctl.update(); return; }
    const e0 = cam.position.clone(), t0 = ctl.target.clone(); let a = 0;
    const st = () => { a = Math.min(1, a + 0.022); const s = a * a * (3 - 2 * a); cam.position.lerpVectors(e0, e, s); ctl.target.lerpVectors(t0, t, s); ctl.update(); if (a < 1) requestAnimationFrame(st); };
    st();
  };
  document.querySelectorAll('.v-btns button').forEach(b => b.onclick = () => go(b.dataset.v));
  document.getElementById('v-start').onclick = () => { box.classList.add('active'); ctl.enabled = true; ctl.enableZoom = true; };
  new GLTFLoader().load('assets/model/vikendica-lite.glb', g => {
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material) o.material.side = THREE.DoubleSide; } });
    scene.add(g.scene); go('air', false);
    document.getElementById('v-load').classList.add('done');
  }, x => { const t = x.total || 3385492; document.getElementById('v-bar').style.width = Math.min(100, x.loaded / t * 100) + '%'; }, () => fail());
  let vis = true;
  new IntersectionObserver(es => es.forEach(e => vis = e.isIntersecting)).observe(box);
  r.setAnimationLoop(() => { if (!vis) return; ctl.update(); r.render(scene, cam); });
}
