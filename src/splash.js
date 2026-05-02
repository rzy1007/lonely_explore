import { store } from './store.js';
import { showScene } from './scene/setup.js';

let canvas, ctx, particles;
let animId;
let phase = 'explode'; // explode -> swirl -> settle
let phaseProgress = 0;
let dismissed = false;

export function initSplash() {
  canvas = document.getElementById('splash-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();

  const overlay = document.getElementById('splash-overlay');

  particles = [];
  const count = 400;

  // Create particles initialized at center for Big Bang
  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      size: 0.5 + Math.random() * 2.5,
      alpha: 0.6 + Math.random() * 0.4,
      color: randomStarColor(),
      life: 0,
      maxLife: 2 + Math.random() * 4,
    });
  }

  // Dismiss on any interaction
  const dismiss = (e) => {
    if (dismissed) return;
    dismissed = true;
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.8s ease';

    // Speed up particles to fly away
    particles.forEach((p) => {
      p.vx *= 3;
      p.vy *= 3;
      p.maxLife = Math.min(p.life + 1.5, 3);
    });

    setTimeout(finishSplash, 800);
  };

  canvas.addEventListener('click', dismiss);
  canvas.addEventListener('wheel', dismiss);
  window.addEventListener('keydown', dismiss);

  window.addEventListener('resize', resizeCanvas);

  // Phase transitions
  setTimeout(() => {
    if (!dismissed) {
      phase = 'swirl';
    }
  }, 1800);

  setTimeout(() => {
    if (!dismissed) {
      phase = 'settle';
    }
  }, 3500);

  // Auto-finish if not dismissed
  setTimeout(() => {
    if (!dismissed) {
      dismiss({});
      finishSplash();
    }
  }, 5000);

  animate(0);
}

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function randomStarColor() {
  const r = Math.random();
  if (r < 0.5) return '#ffffff';
  if (r < 0.7) return '#aaccff';
  if (r < 0.85) return '#ffddaa';
  return '#ffcccc';
}

function animate(timestamp) {
  if (!canvas || !ctx) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  phaseProgress += 0.016;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  particles.forEach((p) => {
    p.life += 0.016;
    const lifeRatio = Math.min(p.life / p.maxLife, 1);

    if (phase === 'explode') {
      // Particles fly outward from center
      p.x += p.vx * (1 + phaseProgress * 0.5);
      p.y += p.vy * (1 + phaseProgress * 0.5);
    } else if (phase === 'swirl') {
      // Particles start rotating around center
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      const angle = Math.atan2(dy, dx) + (0.003 * (dist * 0.02));
      const targetX = cx + Math.cos(angle) * dist * 0.998;
      const targetY = cy + Math.sin(angle) * dist * 0.998;
      p.x += (targetX - p.x + p.vx * 0.3) * 0.05;
      p.y += (targetY - p.y + p.vy * 0.3) * 0.05;
      p.vx *= 0.98;
      p.vy *= 0.98;
    } else {
      // Settle into final positions
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.x += p.vx;
      p.y += p.vy;
    }

    // Fade based on life
    const alpha = p.alpha * (1 - lifeRatio) * (phase === 'settle' ? 0.7 : 1);

    // Draw particle with glow
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(1, 'transparent');

    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;

  if (!dismissed || particles.some((p) => p.life < p.maxLife)) {
    animId = requestAnimationFrame(animate);
  }
}

function finishSplash() {
  cancelAnimationFrame(animId);

  // Fade canvas out
  canvas.style.transition = 'opacity 0.8s ease';
  canvas.style.opacity = '0';

  setTimeout(() => {
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    const overlay = document.getElementById('splash-overlay');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }, 800);

  store.isSplashDone = true;
  store.emit('splashDone');
  showScene();
}
