/* ============================================================
   86AutoPro — script.js (visual design only, no backend)
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
    setTimeout(() => document.getElementById('browseCarsBtn').classList.add('reveal'), 700);
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

/* ---------- Tilt toward cursor (featured cards) ---------- */
if (isFinePointer && !reducedMotion) {
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-10px) scale(1.015) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
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

/* ---------- Scroll reveal (fade-up / section-head) ---------- */
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

/* ---------- Browse Cars: showroom logo-reveal sequence ---------- */
document.getElementById('browseCarsBtn').addEventListener('click', () => {
  const hero = document.getElementById('hero');
  const reveal = document.getElementById('logoReveal');

  hero.classList.add('hero-exit');

  setTimeout(() => reveal.classList.add('show'), 650);

  setTimeout(() => {
    reveal.classList.remove('show');
  }, 4400);

  setTimeout(() => smoothScrollTo(document.getElementById('featured')), 4700);
  setTimeout(() => smoothScrollTo(document.getElementById('marketplace')), 6100);
});

/* ---------- View Garage CTA ---------- */
document.getElementById('viewGarageBtn').addEventListener('click', () => {
  window.location.href = 'garage.html';
});

document.getElementById('enterMarketplaceBtn').addEventListener('click', () => {
  smoothScrollTo(document.getElementById('marketplace'));
});

/* ============================================================
   Dynamic Featured Vehicles + Marketplace
   ⚠️ Set your real SUPABASE_URL / SUPABASE_ANON_KEY below.
   If unset (or the request fails — e.g. this sandboxed preview,
   which can't reach an external database), the grids fall back
   to demo cards so the page never looks broken.
   ============================================================ */
const HOME_CONFIG = {
  SUPABASE_URL: 'https://juwpebbsyeixiaxqhvok.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1d3BlYmJzeWVpeGlheHFodm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1OTkwNTAsImV4cCI6MjEwNDE3NTA1MH0.ucbnOyAsh1Ht2Uql5WHRfsLzzQrdyUBzaBGUwW-h46c',
};
let homeSupabase = null;
try {
  if (window.supabase) homeSupabase = window.supabase.createClient(HOME_CONFIG.SUPABASE_URL, HOME_CONFIG.SUPABASE_ANON_KEY);
} catch (err) {
  console.warn('86AutoPro: Supabase client could not be created (placeholder URL/key?), using demo data instead:', err);
}

// Demo fallback removed — this account's "cars" table has real data,
// so if a fetch ever fails, the grid now shows the error state instead
// of fake cars.
const DEMO_CARS = [];

function normalizeHomeCar(row) {
  return {
    id: row.id,
    name: row.name || 'Unnamed Build',
    price: typeof row.price === 'number' ? `$${row.price.toLocaleString()}` : (row.price || 'Price on request'),
    image: row.image || null,
    sold: row.status === 'sold',
  };
}
function sortSoldLast(cars) {
  return [...cars].sort((a, b) => (a.sold === b.sold ? 0 : a.sold ? 1 : -1));
}
function homeCardHTML(car, extraClass = '') {
  const bg = car.image ? `style="background-image:url('${car.image}')"` : '';
  const noImage = car.image ? '' : '<span class="no-image">Car Image</span>';
  return `
    <article class="car-card glass-card fade-up ${extraClass} ${car.sold ? 'is-sold' : ''}" data-id="${car.id}">
      <div class="car-card-image" ${bg}>
        ${noImage}
        <span class="status-badge ${car.sold ? 'status-sold' : 'status-available'}">${car.sold ? 'Sold' : 'Available'}</span>
      </div>
      <div class="car-card-body">
        <h3 class="car-card-name">${car.name}</h3>
        <p class="car-card-price">${car.price}</p>
        <button class="car-card-btn" ${car.sold ? 'disabled' : ''}>${car.sold ? 'Sold' : 'View Car'}</button>
      </div>
    </article>`;
}
function renderGrid(containerId, cars, extraClass = '') {
  const container = document.getElementById(containerId);
  container.innerHTML = cars.map((c) => homeCardHTML(c, extraClass)).join('');
  container.querySelectorAll('.fade-up').forEach((el) => fadeObserver.observe(el));
  container.querySelectorAll('.car-card').forEach((card) => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.location.href = `car.html?id=${encodeURIComponent(card.dataset.id)}`;
    });
  });
  if (isFinePointer) {
    container.querySelectorAll('.glass-card').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        el.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });
  }
}

async function loadHomeCars() {
  const featuredLoading = document.getElementById('featuredLoading');
  const featuredError = document.getElementById('featuredError');
  const marketplaceLoading = document.getElementById('marketplaceLoading');
  const marketplaceError = document.getElementById('marketplaceError');

  let cars = null;
  if (homeSupabase) {
    try {
      const { data, error } = await homeSupabase.from('cars').select('*');
      if (error) throw error;
      if (data && data.length) cars = sortSoldLast(data.map(normalizeHomeCar));
    } catch (err) {
      console.warn('86AutoPro: could not load cars from Supabase, showing demo data instead:', err);
    }
  }
  if (!cars) cars = sortSoldLast(DEMO_CARS.map(normalizeHomeCar));

  if (!cars.length) {
    featuredLoading.hidden = true;
    marketplaceLoading.hidden = true;
    featuredError.hidden = false;
    marketplaceError.hidden = false;
    return;
  }

  renderGrid('featuredGrid', cars.slice(0, 3), 'tilt');
  renderGrid('marketplaceGrid', cars.slice(0, 6));
  featuredLoading.hidden = true;
  marketplaceLoading.hidden = true;

  if (isFinePointer && !reducedMotion) {
    document.querySelectorAll('.featured-grid .tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-10px) scale(1.015) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }
}
loadHomeCars();

/* ---------- Homepage Hall of Fame preview (first 3 sold cars) ---------- */
function hallOfFameCardHTML(car) {
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

async function loadHallOfFame() {
  const loading = document.getElementById('hallOfFameLoading');
  const errorEl = document.getElementById('hallOfFameError');
  const grid = document.getElementById('hallOfFameGrid');

  let sold = [];
  if (homeSupabase) {
    try {
      const { data, error } = await homeSupabase.from('cars').select('*').eq('status', 'sold').limit(3);
      if (error) throw error;
      if (data) sold = data.map((row) => ({ id: row.id, name: row.name || 'Unnamed Build', image: row.image || null }));
    } catch (err) {
      console.warn('86AutoPro: could not load sold cars for Hall of Fame:', err);
    }
  }

  loading.hidden = true;
  if (!sold.length) {
    errorEl.hidden = false;
    return;
  }

  grid.innerHTML = sold.map(hallOfFameCardHTML).join('');
  grid.querySelectorAll('.fade-up').forEach((el) => fadeObserver.observe(el));
  grid.querySelectorAll('.car-card').forEach((card) => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.location.href = `car.html?id=${encodeURIComponent(card.dataset.id)}`;
    });
  });
}
loadHallOfFame();
