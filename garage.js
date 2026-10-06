/* ============================================================
   86AutoPro — garage.js (same animation system as script.js)
   ============================================================ */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const isMobile = window.matchMedia('(max-width: 700px)').matches;

/* ---------- Lenis smooth scroll ---------- */
if (typeof Lenis !== 'undefined' && !reducedMotion) {
  const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  window.__lenis = lenis;
}
function smoothScrollTo(el) {
  if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.3 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- Preloader -> hero entrance ---------- */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  const preloaderLogo = document.getElementById('preloaderLogo');

  setTimeout(() => preloaderLogo.classList.add('show'), 150);
  setTimeout(() => {
    preloader.classList.add('hide');
    document.body.classList.remove('pre-load');
    ['heroLogo', 'heroSubtitle', 'heroTagline'].forEach((id, i) => {
      setTimeout(() => document.getElementById(id).classList.add('reveal'), i * 180);
    });
  }, 1300);
  setTimeout(() => preloader.remove(), 2000);
});

/* ---------- Navbar ---------- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));

/* ---------- Parallax on hero cars ---------- */
const heroCars = document.getElementById('heroCars');
if (!reducedMotion && !isMobile) {
  window.addEventListener('scroll', () => {
    const y = Math.min(window.scrollY, 600);
    heroCars.style.transform = `translateY(${y * 0.18}px)`;
  }, { passive: true });
}

/* ---------- Cursor glow ---------- */
const cursorGlow = document.getElementById('cursorGlow');
if (isFinePointer) {
  window.addEventListener('mousemove', (e) => {
    cursorGlow.classList.add('active');
    cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
  window.addEventListener('mouseleave', () => cursorGlow.classList.remove('active'));
}

/* ---------- Glow trail on glass cards / CTA button ---------- */
if (isFinePointer) {
  document.querySelectorAll('.glass-card, .btn-cta').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}

/* ---------- Magnetic buttons ---------- */
if (isFinePointer && !reducedMotion) {
  document.querySelectorAll('.magnetic').forEach((btn) => {
    window.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < 100) {
        const strength = (100 - dist) / 100;
        btn.style.transform = `translate(${(e.clientX - cx) * 0.25 * strength}px, ${(e.clientY - cy) * 0.25 * strength}px)`;
      } else {
        btn.style.transform = '';
      }
    });
  });
}

/* ---------- Floating dust ---------- */
if (!reducedMotion && !isMobile) {
  const dustLayer = document.getElementById('dustLayer');
  for (let i = 0; i < 16; i++) {
    const d = document.createElement('span');
    d.className = 'dust';
    d.style.left = `${Math.random() * 100}%`;
    d.style.animationDuration = `${8 + Math.random() * 8}s`;
    d.style.animationDelay = `${Math.random() * 8}s`;
    d.style.opacity = (0.2 + Math.random() * 0.3).toFixed(2);
    dustLayer.appendChild(d);
  }
}

/* ---------- Word-split reveal for section headings ---------- */
document.querySelectorAll('.section-head h2').forEach((h) => {
  h.innerHTML = h.textContent.trim().split(' ').map((w, i) =>
    `<span class="word" style="transition-delay:${i * 70}ms">${w}&nbsp;</span>`
  ).join('');
});

/* ---------- Scroll reveal ---------- */
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.fade-up').forEach((el) => fadeObserver.observe(el));

/* ---------- Stat count-up ---------- */
function animateCount(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    if (el.dataset.static) el.textContent = el.dataset.static;
    else if (el.dataset.target) animateCount(el);
    statObserver.unobserve(el);
  });
}, { threshold: 0.4 });
document.querySelectorAll('.stat-number').forEach((el) => statObserver.observe(el));

/* ---------- Enter Marketplace ---------- */
document.getElementById('enterMarketplaceBtn').addEventListener('click', () => {
  window.location.href = 'index.html#marketplace';
});

/* ============================================================
   Sold Vehicles Grid — Supabase, filtered to status = "sold"
   ⚠️ Set your real SUPABASE_URL / SUPABASE_ANON_KEY below.
   Falls back to demo cards if unset or unreachable (e.g. this
   sandboxed preview) so the page never looks broken.
   ============================================================ */
const GARAGE_CONFIG = {
  SUPABASE_URL: 'https://juwpebbsyeixiaxqhvok.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1d3BlYmJzeWVpeGlheHFodm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1OTkwNTAsImV4cCI6MjEwNDE3NTA1MH0.ucbnOyAsh1Ht2Uql5WHRfsLzzQrdyUBzaBGUwW-h46c',
};
let garageSupabase = null;
try {
  if (window.supabase) garageSupabase = window.supabase.createClient(GARAGE_CONFIG.SUPABASE_URL, GARAGE_CONFIG.SUPABASE_ANON_KEY);
} catch (err) {
  console.warn('86AutoPro: Supabase client could not be created (placeholder URL/key?), using demo data instead:', err);
}

// Demo fallback removed — this account's "cars" table has real data,
// so an empty result now correctly shows the "nothing sold yet" state.
const DEMO_SOLD_CARS = [];

function soldCardHTML(car) {
  const bg = car.image ? `style="background-image:url('${car.image}')"` : '';
  const noImage = car.image ? '' : '<span class="no-image">Car Image</span>';
  return `
    <article class="car-card glass-card fade-up is-sold" data-id="${car.id}">
      <div class="car-card-image" ${bg}>
        ${noImage}
        <span class="status-badge status-sold">Sold</span>
      </div>
      <div class="car-card-body">
        <h3 class="car-card-name">${car.name}</h3>
        <p class="delivered-text">✓ Delivered Successfully</p>
      </div>
    </article>`;
}

async function loadSoldCars() {
  const loading = document.getElementById('soldLoading');
  const errorEl = document.getElementById('soldError');
  const grid = document.getElementById('soldGrid');

  let cars = null;
  if (garageSupabase) {
    try {
      const { data, error } = await garageSupabase.from('cars').select('*').eq('status', 'sold');
      if (error) throw error;
      if (data && data.length) {
        cars = data.map((row) => ({ id: row.id, name: row.name || 'Unnamed Build', image: row.image || null }));
      }
    } catch (err) {
      console.warn('86AutoPro garage.js: could not load sold cars from Supabase, showing demo data instead:', err);
    }
  }
  if (!cars) cars = DEMO_SOLD_CARS;

  loading.hidden = true;
  if (!cars.length) {
    errorEl.hidden = false;
    return;
  }

  grid.innerHTML = cars.map(soldCardHTML).join('');
  grid.querySelectorAll('.fade-up').forEach((el) => fadeObserver.observe(el));
  grid.querySelectorAll('.car-card').forEach((card) => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.location.href = `car.html?id=${encodeURIComponent(card.dataset.id)}`;
    });
  });
  if (isFinePointer) {
    grid.querySelectorAll('.glass-card').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        el.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });
  }
}
loadSoldCars();
