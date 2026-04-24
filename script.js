/* ==========================================================
   MAISON BEAUSOLEIL — Main JavaScript
   ========================================================== */

/* ----------------------------------------------------------
   1. Navigation — Scroll Effect & Mobile Toggle
   ---------------------------------------------------------- */
(function initNav() {
  const nav    = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const links  = document.querySelector('.nav__links');

  if (!nav) return;

  /* Scroll effect */
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile hamburger */
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });

    /* Close on link click */
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }

  /* Mark active nav link by current page */
  const page = location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('.nav__links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();


/* ----------------------------------------------------------
   2. Cart — Shared State (localStorage)
   ---------------------------------------------------------- */
const Cart = (() => {
  const KEY = 'mb_cart';

  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  };

  const save = (items) => {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadge();
  };

  const getAll = () => load();

  const add = (item) => {
    const items = load();
    const idx   = items.findIndex(i => i.id === item.id);
    if (idx > -1) {
      items[idx].qty += 1;
    } else {
      items.push({ ...item, qty: 1 });
    }
    save(items);
    return items;
  };

  const remove = (id) => {
    const items = load().filter(i => i.id !== id);
    save(items);
    return items;
  };

  const setQty = (id, qty) => {
    if (qty < 1) { return remove(id); }
    const items = load();
    const idx   = items.findIndex(i => i.id === id);
    if (idx > -1) items[idx].qty = qty;
    save(items);
    return items;
  };

  const clear = () => { localStorage.removeItem(KEY); updateBadge(); };

  const count = () => load().reduce((s, i) => s + i.qty, 0);

  const updateBadge = () => {
    document.querySelectorAll('.cart-badge').forEach(b => {
      const c = count();
      b.textContent = c;
      b.style.display = c > 0 ? 'inline-flex' : 'none';
    });
  };

  return { getAll, add, remove, setQty, clear, count, updateBadge };
})();


/* ----------------------------------------------------------
   3. Menu Page — Tabs & Add to Cart
   ---------------------------------------------------------- */
(function initMenuPage() {
  const tabBtns   = document.querySelectorAll('.menu-tab-btn');
  const sections  = document.querySelectorAll('.menu-section');
  if (!tabBtns.length) return;

  /* Tab switching */
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabBtns.forEach(b  => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      const section = document.querySelector(`.menu-section[data-section="${target}"]`);
      if (section) section.classList.add('active');
    });
  });

  /* Add to Order buttons */
  document.querySelectorAll('.add-to-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.id;
      const name  = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);

      Cart.add({ id, name, price });
      showToast(name);
      btn.textContent = '✓ Added';
      btn.classList.add('added');
      setTimeout(() => {
        btn.textContent = 'Add to Order';
        btn.classList.remove('added');
      }, 1800);
    });
  });

  /* Toast Notification */
  const toast = document.querySelector('.cart-toast');
  let toastTimer;

  function showToast(name) {
    if (!toast) return;
    toast.querySelector('.toast-item').textContent = `"${name}" added`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  /* Initialise badge */
  Cart.updateBadge();
})();


/* ----------------------------------------------------------
   4. Order Page — Cart Render & Form Submission
   ---------------------------------------------------------- */
(function initOrderPage() {
  const cartItems   = document.getElementById('cartItems');
  const cartCount   = document.getElementById('cartCount');
  const subtotalEl  = document.getElementById('subtotal');
  const hstEl       = document.getElementById('hst');
  const totalEl     = document.getElementById('total');
  const orderInput  = document.getElementById('orderDetails');
  const orderForm   = document.getElementById('orderForm');
  const successEl   = document.getElementById('orderSuccess');
  const submitBtn   = document.getElementById('submitOrder');

  if (!cartItems) return;

  const HST_RATE = 0.15;

  function fmt(n) { return '$' + n.toFixed(2); }

  function renderCart() {
    const items = Cart.getAll();
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const hst   = total * HST_RATE;
    const grand = total + hst;

    /* Count */
    if (cartCount) cartCount.textContent = Cart.count() + ' item' + (Cart.count() !== 1 ? 's' : '');

    /* Items */
    if (items.length === 0) {
      cartItems.innerHTML = '<p class="cart-empty">Your cart is empty. Visit our <a href="menu.html">Menu</a> to add items.</p>';
    } else {
      cartItems.innerHTML = items.map(i => `
        <div class="cart-line" data-id="${i.id}">
          <div class="cart-line__info">
            <p class="cart-line__name">${i.name}</p>
            <p class="cart-line__unit">${fmt(i.price)} each</p>
          </div>
          <div class="cart-line__controls">
            <button class="qty-btn minus-btn" data-id="${i.id}">−</button>
            <span class="qty-val">${i.qty}</span>
            <button class="qty-btn plus-btn" data-id="${i.id}">+</button>
          </div>
          <span class="cart-line__total">${fmt(i.price * i.qty)}</span>
          <button class="remove-btn" data-id="${i.id}" title="Remove">✕</button>
        </div>
      `).join('');
    }

    /* Totals */
    if (subtotalEl) subtotalEl.textContent = fmt(total);
    if (hstEl)      hstEl.textContent      = fmt(hst);
    if (totalEl)    totalEl.textContent     = fmt(grand);

    /* Build hidden order details string */
    if (orderInput) {
      const lines = items.map(i =>
        `${i.name} x${i.qty} @ ${fmt(i.price)} = ${fmt(i.price * i.qty)}`
      ).join(' | ');
      orderInput.value = `ORDER SUMMARY: ${lines || 'No items'} | Subtotal: ${fmt(total)} | HST (15%): ${fmt(hst)} | TOTAL: ${fmt(grand)}`;
    }

    /* Disable submit if cart empty */
    if (submitBtn) submitBtn.disabled = items.length === 0;

    /* Bind qty and remove buttons */
    cartItems.querySelectorAll('.plus-btn').forEach(b =>
      b.addEventListener('click', () => { Cart.setQty(b.dataset.id, (Cart.getAll().find(i => i.id === b.dataset.id)?.qty || 0) + 1); renderCart(); })
    );
    cartItems.querySelectorAll('.minus-btn').forEach(b =>
      b.addEventListener('click', () => { Cart.setQty(b.dataset.id, (Cart.getAll().find(i => i.id === b.dataset.id)?.qty || 1) - 1); renderCart(); })
    );
    cartItems.querySelectorAll('.remove-btn').forEach(b =>
      b.addEventListener('click', () => { Cart.remove(b.dataset.id); renderCart(); })
    );
  }

  renderCart();

  /* Form submission */
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (Cart.count() === 0) {
        alert('Please add items to your order before submitting.');
        return;
      }

      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      const formData = new FormData(orderForm);
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          if (successEl) { successEl.classList.add('show'); }
          orderForm.reset();
          Cart.clear();
          renderCart();
          successEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          alert('There was an issue submitting your order. Please call us directly.');
          submitBtn.textContent = 'Place Order';
          submitBtn.disabled = false;
        }
      } catch {
        alert('Network error. Please try again or call us at (506) 555-0182.');
        submitBtn.textContent = 'Place Order';
        submitBtn.disabled = false;
      }
    });
  }
})();


/* ----------------------------------------------------------
   5. Contact Page — Form Submission
   ---------------------------------------------------------- */
(function initContactPage() {
  const form      = document.getElementById('contactForm');
  const successEl = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('contactSubmit');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    const formData = new FormData(form);
    try {
      const res  = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        form.style.display = 'none';
        if (successEl) successEl.classList.add('show');
      } else {
        alert('Unable to send your message. Please try again or email us directly.');
        submitBtn.textContent = 'Send Message';
        submitBtn.disabled = false;
      }
    } catch {
      alert('Network error. Please try again.');
      submitBtn.textContent = 'Send Message';
      submitBtn.disabled = false;
    }
  });
})();


/* ----------------------------------------------------------
   6. Fade-in on Scroll (Intersection Observer)
   ---------------------------------------------------------- */
(function initScrollFade() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
})();
