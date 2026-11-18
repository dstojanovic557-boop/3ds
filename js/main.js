(() => {
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* radovi — primeri stila */
const W = [
  { t: 'Porodična kuća u ravnici', k: 'Kuća', f: 'house', w: 1 },
  { t: 'Zelena kuhinja', k: 'Kuhinja', f: 'k_green' },
  { t: 'Garderober po meri', k: 'Enterijer', f: 'dressing' },
  { t: 'Dnevna soba sa bibliotekom', k: 'Enterijer', f: 'living', w: 1 },
  { t: 'Mala kuhinja, puno svetla', k: 'Kuhinja', f: 'k_small' },
  { t: 'Dvorište sa pergolom', k: 'Dvorište', f: 'garden' }
];
const src = f => `assets/v3/${f}-1600.webp`;
const srcset = f => `assets/v3/${f}-800.webp 800w, assets/v3/${f}-1600.webp 1600w`;
$('#works').innerHTML = W.map((w, i) => `
  <button class="work ${w.w ? 'wide' : ''} rv" data-i="${i}" aria-label="Uvećaj: ${w.t}">
    <div class="ph"><img src="${src(w.f)}" srcset="${srcset(w.f)}" sizes="(max-width:700px) 100vw, ${w.w ? 100 : 50}vw" alt="${w.t}" loading="lazy" decoding="async"></div>
    <div class="cap2"><div><small>${w.k}</small><h3>${w.t}</h3></div><span class="plus"><svg><use href="#lu_arrow-right"/></svg></span></div>
  </button>`).join('');

/* pojavljivanje */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
$$('.rv').forEach(el => io.observe(el));
const go = () => document.documentElement.classList.add('loaded');
setTimeout(go, 60); addEventListener('load', go); addEventListener('pageshow', go);

/* sta dobijas: kartice */
const CAP = { 'p-model': 'Okreni ga sam, uđi na terasu, pogledaj odozgo.', 'p-crtez': 'Povuci liniju: levo je crtež, desno isti pogled u 3D.',
  'p-video': 'Šetnja od ulice do sale, kao da si već tamo.', 'p-mere': 'Svaki deo na svom listu, sa merama koje majstor odmah razume.' };
const vid = $('#vid');
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.toggle('on', x === t));
  $$('.panel').forEach(p => p.classList.toggle('on', p.id === t.dataset.p));
  $('#cap').textContent = CAP[t.dataset.p];
  if (t.dataset.p === 'p-video') { vid.preload = 'auto'; vid.play().catch(() => {}); } else vid.pause();
  if (t.dataset.p === 'p-crtez') demo();
  dispatchEvent(new Event('resize'));
}));

/* crtez -> 3d */
const cmp = $('#compare'), rng = cmp.querySelector('input'), top = cmp.querySelector('.cmp-top'), line = cmp.querySelector('.cmp-line');
const setC = v => { top.style.clipPath = `inset(0 ${100 - v}% 0 0)`; line.style.left = v + '%'; };
rng.addEventListener('input', () => setC(+rng.value));
let shown = false;
function demo() {
  if (shown || RM) return; shown = true; let t0 = null;
  const anim = t => { t0 ??= t; const k = Math.min(1, (t - t0) / 2400); const v = 50 + Math.sin(k * Math.PI * 2) * 26 * (1 - k); setC(v); rng.value = v; if (k < 1) requestAnimationFrame(anim); };
  setTimeout(() => requestAnimationFrame(anim), 400);
}

/* galerija */
const lb = $('#lb'), li = $('#lb-img'); let cur = 0;
const show = () => { li.src = src(W[cur].f); li.alt = W[cur].t; $('#lb-t').textContent = W[cur].t; };
const open = i => { cur = i; show(); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
const step = d => { cur = (cur + d + W.length) % W.length; show(); };
$('#works').addEventListener('click', e => { const c = e.target.closest('.work'); if (c) open(+c.dataset.i); });
$('#lb-x').onclick = close; $('#lb-prev').onclick = () => step(-1); $('#lb-next').onclick = () => step(1); $('#lb-cta').onclick = close;
lb.addEventListener('click', e => { if (e.target === lb) close(); });
addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
let tx = 0; lb.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 40) step(d < 0 ? 1 : -1); });

/* kako radimo: paralaksa i smena panela */
const sps = $$('.sp');
sps.forEach((sp, i) => {
  const d = document.createElement('div'); d.className = 'sp-dim'; sp.appendChild(d);
  const bar = document.createElement('div'); bar.className = 'sp-bar';
  bar.innerHTML = sps.map((_, j) => `<span class="${j < i ? 'done' : j === i ? 'on' : ''}"></span>`).join('');
  sp.appendChild(bar);
});
let ticking = false;
const para = () => {
  ticking = false; const vh = innerHeight;
  sps.forEach((sp, i) => {
    const top = sp.getBoundingClientRect().top, img = sp.querySelector('.sp-img img');
    img.style.transform = `translateY(${Math.max(-vh, Math.min(vh, -top * .12))}px)`;
    // ulazak: panel ulazi kao uokvirena kartica i širi se do punog ekrana
    const p = i === 0 ? 0 : Math.min(1, Math.max(0, top / vh));
    sp.style.clipPath = p > 0.001 ? `inset(${(p * 9).toFixed(2)}% ${(p * 7).toFixed(2)}% 0 ${(p * 7).toFixed(2)}% round ${(p * 40).toFixed(1)}px)` : 'none';
    // izlazak: prethodni panel se smanjuje i tamni dok ga sledeći prekriva
    const nx = sps[i + 1]; let q = 0;
    if (nx) q = 1 - Math.min(1, Math.max(0, nx.getBoundingClientRect().top / vh));
    sp.querySelector('.sp-img').style.transform = `scale(${1 - q * .12})`;
    sp.querySelector('.sp-dim').style.opacity = (q * .75).toFixed(3);
    const t = sp.querySelector('.sp-t'); t.style.transform = `translateY(${-q * 60}px)`; t.style.opacity = Math.max(0, 1 - q * 1.2).toFixed(3);
  });
};
if (!RM) { addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(para); } }, { passive: true }); addEventListener('resize', para); para(); }

/* sticky kontakt — na telefonu tek posle hero sekcije */
new IntersectionObserver(es => document.documentElement.classList.toggle('past-hero', es[0].intersectionRatio < .3), { threshold: [0, .3, .6, 1] }).observe($('.hero'));
const fab = $('#fab'), fb = $('#fab-btn');
const setF = o => { fab.classList.toggle('open', o); fb.setAttribute('aria-expanded', o); };
fb.addEventListener('click', e => { e.stopPropagation(); setF(!fab.classList.contains('open')); });
document.addEventListener('click', e => { if (!e.target.closest('#fab')) setF(false); });
})();
