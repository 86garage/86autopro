/* ============================================================
   86AutoPro — car.js
   ------------------------------------------------------------
   ⚠️ CHECK THIS BLOCK against your real cart / checkout code
   before deploying — I don't have visibility into your existing
   implementation, so these are best-guess hooks, not confirmed
   integrations.
   ============================================================ */
const CONFIG = {
  SUPABASE_URL: 'https://juwpebbsyeixiaxqhvok.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1d3BlYmJzeWVpeGlheHFodm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1OTkwNTAsImV4cCI6MjEwNDE3NTA1MH0.ucbnOyAsh1Ht2Uql5WHRfsLzzQrdyUBzaBGUwW-h46c',

  // Key your existing cart uses in localStorage. If your cart.js
  // uses a different key, change this to match it exactly.
  CART_STORAGE_KEY: '86autopro_cart',

  // If your site already exposes a global function that handles
  // "Buy Now" (e.g. window.startCheckout), name it here and it
  // will be called directly instead of the fallback redirect.
  BUY_NOW_GLOBAL_FN: 'startCheckout',

  // Fallback if BUY_NOW_GLOBAL_FN doesn't exist on the page.
  CHECKOUT_FALLBACK_URL: (car) => `order.html?id=${encodeURIComponent(car.id)}`,

  // Shared with order.js — key used to pass Name/Price/Image forward
  // without relying solely on a fresh Supabase fetch on the next page.
  ORDER_STORAGE_KEY: '86autopro_pending_order',
};

let supabase = null;
try {
  if (window.supabase) supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
} catch (err) {
  console.warn('86AutoPro: Supabase client could not be created (placeholder URL/key?), demo fallback will be used instead:', err);
}

const OWNER_LABELS = { r3y: 'R3Y', ferox: 'FEROX' };

// Demo fallback removed — this account's "cars" table has real data,
// so an unknown id now correctly shows the "vehicle not found" state
// instead of fake demo cars.
const DEMO_CARS = {};

/* ---------- Preloader ---------- */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  setTimeout(() => document.getElementById('preloaderLogo').classList.add('show'), 150);
  setTimeout(() => {
    preloader.classList.add('hide');
    document.body.classList.remove('pre-load');
  }, 1300);
  setTimeout(() => preloader.remove(), 2000);
});

/* ---------- Floating dust ---------- */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 700px)').matches;
if (!reducedMotion && !isMobile) {
  const dustLayer = document.getElementById('dustLayer');
  for (let i = 0; i < 12; i++) {
    const d = document.createElement('span');
    d.className = 'dust';
    d.style.left = `${Math.random() * 100}%`;
    d.style.animationDuration = `${8 + Math.random() * 8}s`;
    d.style.animationDelay = `${Math.random() * 8}s`;
    dustLayer.appendChild(d);
  }
}

/* ---------- Shared UI (navbar / cursor glow / magnetic) ---------- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));

const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const cursorGlow = document.getElementById('cursorGlow');
if (isFinePointer) {
  window.addEventListener('mousemove', (e) => {
    cursorGlow.classList.add('active');
    cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
}

function enableMagnetic() {
  if (!isFinePointer) return;
  document.querySelectorAll('.magnetic').forEach((btn) => {
    window.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
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

function enableScrollReveal(root = document) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  root.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
}

/* ---------- Data helpers ---------- */
function normalizeCar(row) {
  return {
    id: row.id,
    name: row.name || 'Unnamed Build',
    price: row.price != null ? formatPrice(row.price) : 'Price on request',
    rawPrice: row.price,
    images: row.images && Array.isArray(row.images) && row.images.length ? row.images : [row.image].filter(Boolean),
    status: row.status === 'sold' ? 'sold' : 'available',
    owner: OWNER_LABELS[row.owner] || row.owner || 'Unknown',
  };
}
function formatPrice(price) {
  return typeof price === 'number' ? `$${price.toLocaleString()}` : price;
}

/* ---------- Render ---------- */
function renderCar(car) {
  document.title = `${car.name} — 86AutoPro`;

  const mainImage = car.images[0] || '';
  document.getElementById('heroImage').style.backgroundImage = mainImage ? `url('${mainImage}')` : 'none';

  const statusBadge = document.getElementById('statusBadge');
  statusBadge.textContent = car.status === 'sold' ? 'Sold' : 'Available';
  statusBadge.className = `status-badge ${car.status === 'sold' ? 'status-sold' : 'status-available'}`;

  document.getElementById('carName').textContent = car.name;
  document.getElementById('carPrice').textContent = car.price;
  document.getElementById('carOwner').textContent = car.owner;

  document.getElementById('infoName').textContent = car.name;
  document.getElementById('infoPrice').textContent = car.price;
  document.getElementById('infoStatus').textContent = car.status === 'sold' ? 'Sold' : 'Available';
  document.getElementById('infoOwner').textContent = car.owner;

  renderGallery(car.images);

  const buyBtn = document.getElementById('buyNowBtn');
  if (car.status === 'sold') {
    buyBtn.disabled = true;
    buyBtn.textContent = 'Sold';
    buyBtn.style.opacity = '0.4';
    buyBtn.style.pointerEvents = 'none';
  }

  document.getElementById('carLoading').hidden = true;
  document.getElementById('carContent').hidden = false;
  enableScrollReveal();
  enableMagnetic();
}

function renderGallery(images) {
  const main = document.getElementById('galleryMain');
  const thumbs = document.getElementById('galleryThumbs');
  if (!images.length) return;

  main.style.backgroundImage = `url('${images[0]}')`;

  if (images.length < 2) {
    thumbs.hidden = true;
    return;
  }

  thumbs.innerHTML = images.map((src, i) =>
    `<div class="gallery-thumb ${i === 0 ? 'active' : ''}" style="background-image:url('${src}')" data-index="${i}"></div>`
  ).join('');

  thumbs.querySelectorAll('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      main.style.opacity = '0';
      setTimeout(() => {
        main.style.backgroundImage = `url('${images[thumb.dataset.index]}')`;
        main.style.opacity = '1';
      }, 200);
      thumbs.querySelectorAll('.gallery-thumb').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
  main.style.transition = 'opacity 0.2s ease, transform 0.5s var(--ease)';
}

function renderRelated(cars) {
  const grid = document.getElementById('relatedGrid');
  grid.innerHTML = cars.map((car) => `
    <a href="car.html?id=${encodeURIComponent(car.id)}" class="car-card glass-card fade-up" style="text-decoration:none;">
      <div class="car-card-image" style="${car.images[0] ? `background-image:url('${car.images[0]}')` : ''}">
        ${car.images[0] ? '' : '<span class="no-image">Car Image</span>'}
        <span class="status-badge ${car.status === 'sold' ? 'status-sold' : 'status-available'}">${car.status === 'sold' ? 'Sold' : 'Available'}</span>
      </div>
      <div class="car-card-body">
        <h3 class="car-card-name">${car.name}</h3>
        <p class="car-card-price">${car.price}</p>
      </div>
    </a>
  `).join('');
  enableScrollReveal(grid);
}

/* ---------- Cart / Buy Now (verify against your real system) ---------- */
function addToCart(car) {
  try {
    const raw = localStorage.getItem(CONFIG.CART_STORAGE_KEY);
    const cart = raw ? JSON.parse(raw) : [];
    const existing = cart.find((item) => item.id === car.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({ id: car.id, name: car.name, price: car.rawPrice, image: car.images[0] || null, qty: 1 });
    }
    localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    return true;
  } catch (err) {
    console.error('Could not add to cart:', err);
    return false;
  }
}

function buyNow(car) {
  try {
    sessionStorage.setItem(CONFIG.ORDER_STORAGE_KEY, JSON.stringify({
      id: car.id,
      name: car.name,
      price: car.price,
      rawPrice: car.rawPrice,
      image: car.images[0] || null,
    }));
  } catch (err) {
    console.warn('86AutoPro: could not save order data to sessionStorage:', err);
  }

  const globalFn = window[CONFIG.BUY_NOW_GLOBAL_FN];
  if (typeof globalFn === 'function') {
    globalFn(car);
  } else {
    window.location.href = CONFIG.CHECKOUT_FALLBACK_URL(car);
  }
}

/* ---------- Load ---------- */
async function loadCar() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    console.error('86AutoPro: no ?id= found in the URL. Example: car.html?id=123');
    showError();
    return;
  }

  // Offline/demo fallback — skips Supabase entirely if this id is known locally.
  if (DEMO_CARS[id]) {
    const demo = DEMO_CARS[id];
    const car = {
      id,
      name: demo.name,
      images: demo.images,
      status: demo.status,
      rawPrice: demo.price,
      price: typeof demo.price === 'number' ? `$${demo.price.toLocaleString()}` : demo.price,
      owner: OWNER_LABELS[demo.owner] || demo.owner,
    };
    renderCar(car);
    setupButtons(car);
    const relatedIds = Object.keys(DEMO_CARS).filter((k) => k !== id).slice(0, 3);
    renderRelated(relatedIds.map((rid) => {
      const r = DEMO_CARS[rid];
      return { id: rid, name: r.name, price: typeof r.price === 'number' ? `$${r.price.toLocaleString()}` : r.price, images: r.images, status: r.status };
    }));
    return;
  }

  if (!supabase) {
    console.error('86AutoPro: Supabase client not initialized. Check that the supabase-js <script> tag loaded and CONFIG.SUPABASE_URL / SUPABASE_ANON_KEY are set.');
    showError();
    return;
  }

  let data, error;
  try {
    ({ data, error } = await supabase.from('cars').select('*').eq('id', id).single());
  } catch (err) {
    console.error('86AutoPro: Supabase request threw an error (often an invalid SUPABASE_URL/ANON_KEY, or the anon key lacking SELECT permission on "cars"):', err);
    showError();
    return;
  }

  if (error) {
    console.error('86AutoPro: Supabase returned an error fetching the car:', error);
    showError();
    return;
  }
  if (!data) {
    console.error(`86AutoPro: no row in "cars" matched id="${id}".`);
    showError();
    return;
  }

  const car = normalizeCar(data);
  renderCar(car);
  setupButtons(car);

  try {
    const { data: relatedRows, error: relatedError } = await supabase.from('cars').select('*').neq('id', id).limit(3);
    if (relatedError) console.error('86AutoPro: could not load related vehicles:', relatedError);
    else if (relatedRows) renderRelated(relatedRows.map(normalizeCar));
  } catch (err) {
    console.error('86AutoPro: related vehicles request threw an error:', err);
  }
}

function setupButtons(car) {
  document.getElementById('addToCartBtn').addEventListener('click', (e) => {
    const ok = addToCart(car);
    if (ok) {
      e.target.textContent = 'Added ✓';
      e.target.classList.add('added');
      setTimeout(() => {
        e.target.textContent = 'Add to Cart';
        e.target.classList.remove('added');
      }, 1800);
    }
  });
  document.getElementById('buyNowBtn').addEventListener('click', () => buyNow(car));
}

function showError() {
  document.getElementById('carLoading').hidden = true;
  document.getElementById('carError').hidden = false;
}

loadCar();
