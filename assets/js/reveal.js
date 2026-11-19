/* Reveal-on-scroll and count-up numbers.
   Content is fully visible without JavaScript; these only add motion. */

export function initReveal({ reduceMotion = false } = {}) {
  const items = [...document.querySelectorAll('[data-reveal]')];
  const counters = [...document.querySelectorAll('[data-count]')];

  // Stagger children of a group: 0ms, 90ms, 180ms...
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    [...group.querySelectorAll('[data-reveal]')].forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${Math.min(i, 8) * 90}ms`);
    });
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  items.forEach((el) => io.observe(el));

  const countIo = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      countUp(entry.target);
      countIo.unobserve(entry.target);
    }
  }, { threshold: 0.6 });
  counters.forEach((el) => {
    el.textContent = '0';
    countIo.observe(el);
  });
}

function countUp(el) {
  const target = Number(el.dataset.count) || 0;
  const duration = 1500;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
