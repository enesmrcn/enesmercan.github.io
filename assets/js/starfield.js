/* Starfield: a full-screen canvas of stars with depth.
   - Parallax: near stars drift faster than far ones as the page scrolls.
   - Speed streaks: fast scrolling stretches stars into short light trails.
   - Pauses when the tab is hidden or the stars are faded out.
   - With reduced motion it draws a single static frame. */

export class Starfield {
  constructor(canvas, { reduceMotion = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reduceMotion = reduceMotion;
    this.stars = [];
    this.w = 0;
    this.h = 0;
    this.fieldH = 0;
    this.scrollY = window.scrollY;
    this.lastScrollY = this.scrollY;
    this.vel = 0;
    this.visible = true;
    this.running = false;
    this.lastDraw = 0;
    this.sprite = makeGlowSprite();

    this.frame = this.frame.bind(this);
    this.resize = this.resize.bind(this);

    this.resize();
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', () => this.kick());
    this.kick();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const widthChanged = Math.abs(w - this.w) > 60;
    this.w = w;
    this.h = h;
    // Seed a field at least as tall as the screen so mobile URL-bar resizes don't reseed.
    this.fieldH = Math.max(h, (window.screen && window.screen.height) || h);
    if (!this.stars.length || widthChanged) this.seed();
    this.draw(performance.now());
  }

  seed() {
    const area = this.w * this.fieldH;
    const count = Math.round(Math.min(440, Math.max(110, area / 4400)));
    this.stars = Array.from({ length: count }, () => {
      const z = Math.pow(Math.random(), 1.8); // most stars are far away
      return {
        x: Math.random() * this.w,
        y: Math.random() * this.fieldH,
        z,
        r: 0.45 + z * 1.25,
        a: 0.22 + z * 0.68 + Math.random() * 0.1,
        twinkle: Math.random() < 0.35 ? Math.random() * Math.PI * 2 : -1,
        speed: 0.4 + Math.random() * 1.2,
        glow: z > 0.82 && Math.random() < 0.55,
      };
    });
  }

  /** Called by the page on every scroll frame. opacity = the stars' current CSS opacity. */
  setScroll(y, opacity = 1) {
    this.scrollY = y;
    this.visible = opacity > 0.02;
    if (this.reduceMotion) return;
    this.kick();
  }

  kick() {
    if (this.reduceMotion || this.running || !this.visible || document.hidden) return;
    this.running = true;
    requestAnimationFrame(this.frame);
  }

  frame(t) {
    if (!this.visible || document.hidden) {
      this.running = false;
      return;
    }
    const dy = this.scrollY - this.lastScrollY;
    this.lastScrollY = this.scrollY;
    this.vel += (dy - this.vel) * 0.22;
    if (Math.abs(this.vel) < 0.01) this.vel = 0;

    // Full frame rate while moving, ~20 fps while only twinkling.
    if (this.vel !== 0 || t - this.lastDraw > 50) {
      this.draw(t);
      this.lastDraw = t;
    }
    requestAnimationFrame(this.frame);
  }

  draw(t) {
    const { ctx, w, h, fieldH } = this;
    ctx.clearRect(0, 0, w, h);
    const still = this.reduceMotion;
    const vel = still ? 0 : this.vel;
    const sy = still ? 0 : this.scrollY;

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';

    for (const s of this.stars) {
      const depth = 0.06 + s.z * 0.45;
      let y = (s.y - sy * depth) % fieldH;
      if (y < 0) y += fieldH;
      if (y > h + 4) continue;

      let a = s.a;
      if (!still && s.twinkle >= 0) a *= 0.62 + 0.38 * Math.sin(t * 0.0011 * s.speed + s.twinkle);

      const streak = Math.min(150, Math.abs(vel) * (0.12 + s.z * 1.5));
      ctx.globalAlpha = a;
      if (streak > 1.5) {
        ctx.lineWidth = Math.max(0.6, s.r * 0.9);
        ctx.globalAlpha = a * 0.8;
        ctx.beginPath();
        ctx.moveTo(s.x, y);
        ctx.lineTo(s.x, y + Math.sign(vel) * streak);
        ctx.stroke();
      } else {
        ctx.fillRect(s.x - s.r / 2, y - s.r / 2, s.r, s.r);
      }
      if (s.glow) {
        ctx.globalAlpha = a * 0.55;
        const g = 6 + s.z * 6;
        ctx.drawImage(this.sprite, s.x - g / 2, y - g / 2, g, g);
      }
    }
    ctx.globalAlpha = 1;
  }
}

function makeGlowSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 32);
  return c;
}
