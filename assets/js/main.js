/* enesmercan.com · main script (ES module)
   One scroll loop drives everything: the cover's exit, the sky's tone,
   the starfield and the time machine. All content works without JavaScript. */

import { Starfield } from './starfield.js';
import { initReveal } from './reveal.js';
import { initTimeMachine } from './timemachine.js';

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = motionQuery.matches;
motionQuery.addEventListener?.('change', () => window.location.reload());

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

const root = document.documentElement;
const header = $('.site-header');
const cover = $('#cover');
const briefing = $('#briefing');
const tmSection = $('#time-machine');
const ground = $('.tm-ground');
const contact = $('#contact');
const sky = $('.sky');
const canvas = $('.sky__stars');

const stars = canvas ? new Starfield(canvas, { reduceMotion }) : null;
const timeMachine = tmSection ? initTimeMachine(tmSection, { reduceMotion }) : null;
initReveal({ reduceMotion });

/* Portrait ------------------------------------------------------------
   Shown only when assets/img/portrait.jpg exists; otherwise the planet carries the cover. */
const portrait = $('.cover__portrait img');
if (portrait && cover) {
  const show = () => cover.classList.add('has-portrait');
  const drop = () => portrait.closest('.cover__portrait')?.remove();
  if (portrait.complete) {
    portrait.naturalWidth > 0 ? show() : drop();
  } else {
    portrait.addEventListener('load', show, { once: true });
    portrait.addEventListener('error', drop, { once: true });
  }
}

/* Layout ------------------------------------------------------------- */
let viewportHeight = window.innerHeight;
let coverRange = 1;
let skyStops = [];

function pageTop(el) {
  return el ? el.getBoundingClientRect().top + window.scrollY : 0;
}

function measure() {
  viewportHeight = window.innerHeight;
  coverRange = Math.max(1, (cover ? cover.offsetHeight : viewportHeight) - viewportHeight);

  const briefingTop = pageTop(briefing);
  const tmTop = pageTop(tmSection);
  const groundTop = pageTop(ground);
  const contactTop = pageTop(contact);
  const vh = viewportHeight;

  // The sky's colour script, keyed to the reading line (middle of the screen).
  // l = lightness in %, s = star opacity, h = horizon glow.
  skyStops = [
    { y: 0, l: 0, s: 1, h: 0 },                                   // deep space
    { y: briefingTop + vh * 0.2, l: 1.6, s: 0.8, h: 0 },           // briefing
    { y: tmTop + vh * 0.35, l: 0, s: 1, h: 0 },                    // present day: in orbit
    { y: lerp(tmTop, groundTop, 0.5), l: 2.6, s: 0.6, h: 0.04 },   // re-entry
    { y: groundTop - vh * 0.9, l: 5.5, s: 0.28, h: 0.35 },         // atmosphere
    { y: groundTop + vh * 0.1, l: 9, s: 0.08, h: 1 },              // on the ground, 2018
    { y: contactTop + vh * 0.45, l: 0, s: 0.9, h: 0 },             // next mission: back to space
  ].sort((a, b) => a.y - b.y);

  timeMachine?.measure();
  update(true);
}

function sampleSky(y) {
  if (!skyStops.length) return { l: 0, s: 1, h: 0 };
  if (y <= skyStops[0].y) return skyStops[0];
  for (let i = 0; i < skyStops.length - 1; i++) {
    const a = skyStops[i];
    const b = skyStops[i + 1];
    if (y <= b.y) {
      const t = smooth(clamp((y - a.y) / Math.max(1, b.y - a.y), 0, 1));
      return { l: lerp(a.l, b.l, t), s: lerp(a.s, b.s, t), h: lerp(a.h, b.h, t) };
    }
  }
  return skyStops[skyStops.length - 1];
}

/* Scroll loop -------------------------------------------------------- */
let lastY = -1;
let ticking = false;

function update(force = false) {
  ticking = false;
  const y = window.scrollY;
  if (!force && y === lastY) return;
  lastY = y;

  header?.classList.toggle('is-scrolled', y > 24);

  if (cover && !reduceMotion) {
    cover.style.setProperty('--cover-progress', clamp(y / coverRange, 0, 1).toFixed(4));
  }

  const tone = sampleSky(y + viewportHeight * 0.5);
  const v = Math.round(tone.l * 2.55);
  if (sky) {
    sky.style.backgroundColor = `rgb(${v}, ${v}, ${Math.min(255, v + 2)})`;
    sky.style.setProperty('--stars', tone.s.toFixed(3));
    sky.style.setProperty('--horizon', tone.h.toFixed(3));
  }
  stars?.setScroll(y, tone.s);
  timeMachine?.update(y, viewportHeight);
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => update());
}

let measureTimer = 0;
function scheduleMeasure() {
  clearTimeout(measureTimer);
  measureTimer = setTimeout(measure, 120);
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', scheduleMeasure);
window.addEventListener('load', measure);
document.fonts?.ready.then(measure);
if ('ResizeObserver' in window) new ResizeObserver(scheduleMeasure).observe(document.body);
measure();

/* Mobile menu -------------------------------------------------------- */
const toggle = $('.nav-toggle');
function setMenu(open) {
  if (!header || !toggle) return;
  header.classList.toggle('nav-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('no-scroll', open);
}
toggle?.addEventListener('click', () => setMenu(!header.classList.contains('nav-open')));
$$('.site-nav__list a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* Analytics milestones (only if a GoatCounter snippet is installed) ---- */
function track(name) {
  try { window.goatcounter?.count?.({ path: name, title: name, event: true }); } catch { /* ignore */ }
}
if ('IntersectionObserver' in window) {
  const milestoneIo = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      track(entry.target.dataset.milestone);
      milestoneIo.unobserve(entry.target);
    }
  }, { threshold: 0.15 });
  $$('[data-milestone]').forEach((el) => milestoneIo.observe(el));
}
$$('a[href$=".pdf"]').forEach((a) => a.addEventListener('click', () => track('cv-download')));
$$('a[href^="mailto:"]').forEach((a) => a.addEventListener('click', () => track('email-click')));

/* Footer year -------------------------------------------------------- */
$$('[data-current-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

/* Preview helper: ?y=1200 or ?to=time-machine&dy=300 jumps to a scroll position (used for screenshots). */
const params = new URLSearchParams(window.location.search);
if (params.has('y') || params.has('to')) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      let target = Number(params.get('y')) || 0;
      const id = params.get('to');
      if (id && document.getElementById(id)) target = pageTop(document.getElementById(id)) + (Number(params.get('dy')) || 0);
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, target);
      update(true);
    }, 60);
  });
}
