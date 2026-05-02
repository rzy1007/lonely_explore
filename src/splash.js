import { store } from './store.js';
import { showScene } from './scene/setup.js';

let animId;
let dismissed = false;
let canvas, ctx;
let particles = [];
let phase = 'explode';
let startTime;

export function initSplash() {
  try {
    canvas = document.getElementById('splash-canvas');
    if (!canvas) {
      console.error('Splash canvas not found');
      skipSplash();
      return;
    }

    ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Cannot get 2d context');
      skipSplash();
      return;
    }

    canvas.width = window.innerWidth || 1920;
    canvas.height = window.innerHeight || 1080;

    // Safety: ensure minimum size
    if (canvas.width < 100 || canvas.height < 100) {
      canvas.width = 1920;
      canvas.height = 1080;
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const count = 500;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 7;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 0.5 + Math.random() * 3,
        alpha: 0.6 + Math.random() * 0.4,
        color: randomStarColor(),
        life: 0,
        maxLife: 2 + Math.random() * 5,
      });
    }

    const overlay = document.getElementById('splash-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }

    // Dismiss handler
    function dismiss() {
      if (dismissed) return;
      dismissed = true;

      if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.6s ease';
      }

      particles.forEach((p) => {
        p.vx *= 4;
        p.vy *= 4;
        p.maxLife = Math.min(p.life + 1, 3);
      });

      setTimeout(finishSplash, 600);
    }

    canvas.addEventListener('click', dismiss);
    canvas.addEventListener('wheel', dismiss);
    document.addEventListener('keydown', dismiss);

    window.addEventListener('resize', () => {
      if (!dismissed && canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    });

    // Phase timing
    setTimeout(() => { if (!dismissed) phase = 'swirl'; }, 2000);
    setTimeout(() => { if (!dismissed) phase = 'settle'; }, 4000);
    setTimeout(() => { if (!dismissed) dismiss(); }, 6000);

    startTime = performance.now();
    animId = requestAnimationFrame(animate);
  } catch (e) {
    console.error('Splash init error:', e);
    skipSplash();
  }
}

function randomStarColor() {
  const r = Math.random();
  if (r < 0.4) return '#ffffff';
  if (r < 0.65) return '#aaccff';
  if (r < 0.8) return '#ffddaa';
  if (r < 0.92) return '#ffcccc';
  return '#ff8888';
}

function animate(now) {
  if (dismissed && particles.every((p) => p.life >= p.maxLife)) {
    animId = null;
    return;
  }

  if (!canvas || !ctx) return;

  // Trail effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const dt = 0.016;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const elapsed = (now - startTime) / 1000;

  for (const p of particles) {
    p.life += dt;
    const lifeRatio = Math.min(p.life / p.maxLife, 1);
    if (lifeRatio >= 1 && dismissed) continue;

    if (phase === 'explode') {
      p.x += p.vx * (1 + elapsed * 0.3);
      p.y += p.vy * (1 + elapsed * 0.3);
    } else if (phase === 'swirl') {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.hypot(dx, dy) + 0.01;
      const angle = Math.atan2(dy, dx) + dt * 2 / dist;
      const r = dist * 0.998;
      p.x += (cx + Math.cos(angle) * r - p.x) * 0.08 + p.vx * 0.2 * dt;
      p.y += (cy + Math.sin(angle) * r - p.y) * 0.08 + p.vy * 0.2 * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
    } else {
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    const alpha = p.alpha * (1 - lifeRatio) * (phase === 'settle' ? 0.65 : 1);
    if (alpha < 0.01) continue;

    // Glow
    const glowRadius = p.size * 3;
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(0.4, p.color + 'cc');
    gradient.addColorStop(1, 'transparent');

    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  animId = requestAnimationFrame(animate);
}

function finishSplash() {
  if (animId) cancelAnimationFrame(animId);

  if (canvas) {
    canvas.style.transition = 'opacity 0.6s ease';
    canvas.style.opacity = '0';
  }

  setTimeout(() => {
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    const overlay = document.getElementById('splash-overlay');
    if (overlay) overlay.style.display = 'none';
  }, 600);

  store.isSplashDone = true;
  store.emit('splashDone');
  showScene();
}

function skipSplash() {
  // Directly go to main scene if splash fails
  store.isSplashDone = true;
  store.emit('splashDone');
  showScene();
  const c = document.getElementById('splash-canvas');
  const o = document.getElementById('splash-overlay');
  if (c) c.style.display = 'none';
  if (o) o.style.display = 'none';
}
