/* ============================================================
   86AutoPro — success.js
   ============================================================ */
const ORDER_STORAGE_KEY = '86autopro_pending_order'; // must match car.js / order.js

// Requirement: clear temporary order data now that the flow is complete.
try {
  sessionStorage.removeItem(ORDER_STORAGE_KEY);
} catch (err) {
  console.warn('86AutoPro success.js: could not clear pending order data:', err);
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Magnetic buttons ---------- */
if (isFinePointer && !reducedMotion) {
  document.querySelectorAll('.magnetic').forEach((btn) => {
    window.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < 100) {
        const s = (100 - dist) / 100;
        btn.style.transform = `translate(${(e.clientX - cx) * 0.25 * s}px, ${(e.clientY - cy) * 0.25 * s}px)`;
      } else {
        btn.style.transform = '';
      }
    });
  });
}

/* ---------- Cinematic reveal ---------- */
requestAnimationFrame(() => {
  setTimeout(() => document.getElementById('stepSuccess').classList.add('show'), 100);
});

/* ---------- Subtle confetti ---------- */
if (!reducedMotion) {
  const canvas = document.getElementById('confettiCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#00FF88', '#007BFF', '#FF7A1A', '#FFFFFF'];
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 200,
    r: 3 + Math.random() * 4,
    vy: 1.5 + Math.random() * 2.5,
    vx: (Math.random() - 0.5) * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1,
  }));
  let frame = 0;
  function tick() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.004;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    });
    ctx.globalAlpha = 1;
    if (frame < 260) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  setTimeout(tick, 900);
}
