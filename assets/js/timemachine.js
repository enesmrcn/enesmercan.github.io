/* The linear vertical time machine.
   Entries are spaced by their content. The dial interpolates the date between
   entries, so it rolls back month by month as you scroll. Ticks are drawn on the
   spine for every month (or only every year where time is compressed), and
   stretches where many months pass in a short distance are marked "time warp". */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function initTimeMachine(section, { reduceMotion = false } = {}) {
  const track = section.querySelector('.tm__track');
  const list = section.querySelector('.tm__list');
  const ticksEl = section.querySelector('.tm__ticks');
  const readout = section.querySelector('.tm__readout');
  const monthEl = section.querySelector('[data-dial-month]');
  const yearEl = section.querySelector('[data-dial-year]');
  const relEl = section.querySelector('[data-dial-rel]');
  const yearLinks = [...section.querySelectorAll('[data-year-link]')];
  const entries = [...list.querySelectorAll(':scope > .tm-entry[data-date]')].filter((el) => !el.hidden);
  if (!track || !list || !entries.length) return null;

  const narrow = window.matchMedia('(max-width: 760px)');
  const today = new Date();
  const nowIndex = today.getFullYear() * 12 + today.getMonth();
  const toIndex = (value) => {
    if (value === 'now') return nowIndex;
    const [y, m = '7'] = value.split('-');
    return Number(y) * 12 + (Number(m) - 1);
  };

  let anchors = [];   // { y: px from the top of the track, m: month index, el }
  let trackTop = 0;
  let trackHeight = 1;
  let shown = null;
  let current = null;

  const readFraction = () => (narrow.matches ? 0.36 : 0.5);

  function measure() {
    trackTop = track.getBoundingClientRect().top + window.scrollY;
    trackHeight = Math.max(1, track.offsetHeight);
    // offsetTop ignores CSS transforms, so entries that haven't been revealed yet measure correctly.
    anchors = entries.map((el) => {
      const marker = el.querySelector('.tm-entry__marker');
      const markerMid = marker ? marker.offsetTop + marker.offsetHeight / 2 : 0;
      return { y: list.offsetTop + el.offsetTop + markerMid, m: toIndex(el.dataset.date), el };
    });
    for (let i = 1; i < anchors.length; i++) {
      if (anchors[i].m > anchors[i - 1].m) anchors[i].m = anchors[i - 1].m; // keep time running backwards
    }
    buildTicks();
  }

  function buildTicks() {
    const frag = document.createDocumentFragment();
    const segments = [];
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      const months = a.m - b.m;
      const dy = b.y - a.y;
      if (months > 0 && dy > 0) segments.push({ a, b, months, dy, ppm: dy / months });
    }
    const sorted = segments.map((s) => s.ppm).sort((x, y) => x - y);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

    for (const s of segments) {
      const showMonths = s.ppm >= 9;
      if (median > 0 && s.months >= 18 && s.ppm < median / 3) {
        const warp = document.createElement('div');
        warp.className = 'tm-warp';
        warp.style.top = `${s.a.y + 16}px`;
        warp.style.height = `${Math.max(0, s.dy - 32)}px`;
        frag.append(warp);
      }
      for (let m = s.a.m - 1; m > s.b.m; m--) {
        const isYear = m % 12 === 11; // December: the first month you meet of that year when travelling back
        if (!isYear && !showMonths) continue;
        const tick = document.createElement('div');
        tick.className = isYear ? 'tm-tick tm-tick--year' : 'tm-tick';
        tick.style.top = `${(s.a.y + (s.a.m - m) * s.ppm).toFixed(1)}px`;
        if (isYear) tick.dataset.year = String(Math.floor(m / 12));
        frag.append(tick);
      }
    }
    ticksEl.replaceChildren(frag);
  }

  function relative(diff) {
    if (diff <= 0) return 'Present day';
    if (diff < 12) return `${diff} month${diff === 1 ? '' : 's'} ago`;
    const y = Math.floor(diff / 12);
    const m = diff % 12;
    if (m === 0) return `${y} year${y === 1 ? '' : 's'} ago`;
    return `${y} yr${y === 1 ? '' : 's'} ${m} mo ago`;
  }

  function setDial(index) {
    if (index === shown) return;
    const direction = shown === null ? 0 : index < shown ? 1 : -1; // 1 = travelling back
    shown = index;
    const year = Math.floor(index / 12);
    monthEl.textContent = MONTHS[index % 12];
    yearEl.textContent = String(year);
    relEl.textContent = relative(nowIndex - index);
    yearLinks.forEach((a) => a.classList.toggle('is-active', Number(a.dataset.yearLink) === year));
    if (!reduceMotion && direction !== 0 && readout) {
      readout.classList.remove('tick-back', 'tick-forward');
      void readout.offsetWidth; // restart the animation
      readout.classList.add(direction > 0 ? 'tick-back' : 'tick-forward');
    }
  }

  function setCurrent(el) {
    if (el === current) return;
    current?.classList.remove('is-current');
    el?.classList.add('is-current');
    current = el;
  }

  function update(scrollY, viewportHeight) {
    if (!anchors.length) return;
    const readY = scrollY + viewportHeight * readFraction() - trackTop;
    const first = anchors[0];
    const last = anchors[anchors.length - 1];
    const cursor = clamp(readY, first.y, last.y);

    track.style.setProperty('--spine-fill', (cursor / trackHeight).toFixed(4));
    track.style.setProperty('--cursor-y', `${cursor.toFixed(1)}px`);

    let index = first.m;
    let currentAnchor = first;
    if (readY >= last.y) {
      index = last.m;
      currentAnchor = last;
    } else if (readY > first.y) {
      for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i];
        const b = anchors[i + 1];
        if (readY >= a.y && readY < b.y) {
          const t = (readY - a.y) / Math.max(1, b.y - a.y);
          index = Math.ceil(a.m - t * (a.m - b.m) - 1e-6);
          currentAnchor = a;
          break;
        }
      }
    }
    setDial(index);
    setCurrent(readY >= first.y - viewportHeight * 0.25 ? currentAnchor.el : null);
  }

  // Year links: centre the chosen entry on the reading line so the dial shows its exact date.
  yearLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);
      const anchor = anchors.find((a) => a.el.id === id);
      if (!anchor) return;
      event.preventDefault();
      window.scrollTo({
        top: trackTop + anchor.y - window.innerHeight * readFraction() + 1,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
      history.replaceState(null, '', `#${id}`);
    });
  });

  return { measure, update };
}
