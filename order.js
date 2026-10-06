/* ============================================================
   86AutoPro — order.js
   ------------------------------------------------------------
   ⚠️ CHECK THIS BLOCK before deploying:
   - PAYMENT_QR_VALUE: replace with your real payment link /
     wallet address / handle. Right now it just encodes a
     placeholder string so the QR renders correctly.
   - ORDERS_TABLE / ORDERS_COLUMNS: I don't know if you have an
     "orders" table yet, or what its columns are called. Adjust
     to match your real schema, or tell me and I'll fix it.
   ============================================================ */
const CONFIG = {
  SUPABASE_URL: 'https://juwpebbsyeixiaxqhvok.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1d3BlYmJzeWVpeGlheHFodm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1OTkwNTAsImV4cCI6MjEwNDE3NTA1MH0.ucbnOyAsh1Ht2Uql5WHRfsLzzQrdyUBzaBGUwW-h46c',
  PAYMENT_QR_VALUE: 'https://instagram.com/r3ycpm', // TODO: replace with real payment link/address
  ORDERS_TABLE: 'orders',
  ORDERS_COLUMNS: (car, buyerName, instagram) => ({
    car_id: car.id,
    car_name: car.name,
    price: car.rawPrice,
    buyer_name: buyerName,
    instagram,
    status: 'pending_confirmation',
  }),
};

let supabase = null;
try {
  if (window.supabase) supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
} catch (err) {
  console.warn('86AutoPro: Supabase client could not be created (placeholder URL/key?), demo fallback will be used instead:', err);
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const isMobile = window.matchMedia('(max-width: 700px)').matches;

/* ---------- Shared chrome (same as other pages) ---------- */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  setTimeout(() => document.getElementById('preloaderLogo').classList.add('show'), 150);
  setTimeout(() => {
    preloader.classList.add('hide');
    document.body.classList.remove('pre-load');
  }, 1300);
  setTimeout(() => preloader.remove(), 2000);
});
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));
const cursorGlow = document.getElementById('cursorGlow');
if (isFinePointer) {
  window.addEventListener('mousemove', (e) => {
    cursorGlow.classList.add('active');
    cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
}
if (isFinePointer) {
  document.querySelectorAll('.glass-card').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}
if (isFinePointer && !reducedMotion) {
  document.querySelectorAll('.magnetic').forEach((btn) => {
    window.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < 100) {
        const s = (100 - dist) / 100;
        btn.style.transform = `translate(${(e.clientX - cx) * 0.25 * s}px, ${(e.clientY - cy) * 0.25 * s}px)`;
      } else btn.style.transform = '';
    });
  });
}
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
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); fadeObserver.unobserve(entry.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.fade-up').forEach((el) => fadeObserver.observe(el));

/* ---------- Load car + populate summary ---------- */
const ORDER_STORAGE_KEY = '86autopro_pending_order'; // must match car.js CONFIG.ORDER_STORAGE_KEY
const params = new URLSearchParams(window.location.search);
const carId = params.get('id');
let currentCar = null;

function populateSummary(car) {
  document.getElementById('summaryName').textContent = car.name;
  document.getElementById('summaryPrice').textContent = car.price;
  const img = document.getElementById('summaryImage');
  if (car.image) {
    img.src = car.image;
    img.hidden = false;
  }
}

function showOrderStep() {
  document.getElementById('orderLoading').hidden = true;
  document.getElementById('stepCheckout').hidden = false;
  document.querySelectorAll('#stepCheckout .fade-up').forEach((el) => fadeObserver.observe(el));
}
function showOrderError() {
  document.getElementById('orderLoading').hidden = true;
  document.getElementById('orderError').hidden = false;
}

async function loadCarSummary() {
  // 1. Prefer the data passed forward from car.html (name/price/image, no network needed)
  try {
    const raw = sessionStorage.getItem(ORDER_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (!carId || stored.id === carId) {
        currentCar = stored;
        populateSummary(currentCar);
        showOrderStep();
        return;
      }
    }
  } catch (err) {
    console.warn('86AutoPro order.js: could not read pending order from sessionStorage:', err);
  }

  // 2. Fall back to a fresh Supabase fetch (e.g. direct link / refreshed page)
  if (!carId || !supabase) {
    showOrderError();
    return;
  }
  try {
    const { data, error } = await supabase.from('cars').select('*').eq('id', carId).single();
    if (error || !data) throw error || new Error('No car found');
    currentCar = {
      id: data.id,
      name: data.name || 'Unnamed Build',
      rawPrice: data.price,
      price: typeof data.price === 'number' ? `$${data.price.toLocaleString()}` : (data.price || 'Price on request'),
      image: data.image || null,
    };
    populateSummary(currentCar);
    showOrderStep();
  } catch (err) {
    console.error('86AutoPro order.js: could not load car for checkout:', err);
    showOrderError();
  }
}
loadCarSummary();

/* ---------- Step transitions ---------- */
function goToStep(fromEl, toEl, title) {
  fromEl.style.transition = 'opacity 0.4s ease';
  fromEl.style.opacity = '0';
  setTimeout(() => {
    fromEl.hidden = true;
    toEl.hidden = false;
    toEl.style.opacity = '0';
    requestAnimationFrame(() => {
      toEl.style.transition = 'opacity 0.5s ease';
      toEl.style.opacity = '1';
    });
    toEl.querySelectorAll('.fade-up').forEach((el) => fadeObserver.observe(el));
    document.getElementById('stepTitle').textContent = title;
  }, 400);
}

/* ---------- Step 1 -> 2: Continue ---------- */
document.getElementById('continueBtn').addEventListener('click', () => {
  const name = document.getElementById('inputName').value.trim();
  const instagram = document.getElementById('inputInstagram').value.trim();
  const errorEl = document.getElementById('formError');

  if (!name || !instagram) {
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;

  goToStep(document.getElementById('stepCheckout'), document.getElementById('stepPayment'), 'Scan & Pay');

  setTimeout(() => {
    const qrEl = document.getElementById('qrCode');
    if (typeof QRCode !== 'undefined') {
      qrEl.innerHTML = '';
      new QRCode(qrEl, { text: CONFIG.PAYMENT_QR_VALUE, width: 180, height: 180, colorDark: '#050505', colorLight: '#ffffff' });
    } else {
      qrEl.innerHTML = '<span style="color:#050505;font-size:12px;">QR library failed to load</span>';
    }
  }, 450);
});

/* ---------- Step 2 -> 3: I Have Paid ---------- */
document.getElementById('paidBtn').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  btn.textContent = 'Confirming…';

  const name = document.getElementById('inputName').value.trim();
  const instagram = document.getElementById('inputInstagram').value.trim();

  if (supabase && currentCar) {
    try {
      const { error } = await supabase.from(CONFIG.ORDERS_TABLE).insert([CONFIG.ORDERS_COLUMNS(currentCar, name, instagram)]);
      if (error) console.error('86AutoPro order.js: order insert failed (check ORDERS_TABLE / column names in CONFIG):', error);
    } catch (err) {
      console.error('86AutoPro order.js: order insert threw an error:', err);
    }
  } else {
    console.warn('86AutoPro order.js: skipped saving order — Supabase not configured or car not loaded.');
  }

  // Note: the pending order (sessionStorage) is cleared by success.html,
  // not here — success.html is what confirms the flow actually completed.
  window.location.href = 'success.html';
});
