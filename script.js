(() => {
  const pages = Array.from(document.querySelectorAll('.page'));
  const navLinks = document.getElementById('nav-links');
  const navAnchors = Array.from(navLinks.querySelectorAll('a[data-route]'));
  const menuToggle = document.getElementById('menu-toggle');
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const root = document.documentElement;
  const DEFAULT_ROUTE = 'home';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const routes = new Set(pages.map(p => p.dataset.page));

  /* ---------- Routing ---------- */
  function getRouteFromHash() {
    const route = window.location.hash.replace('#', '').trim();
    return routes.has(route) ? route : DEFAULT_ROUTE;
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function showRoute(route) {
    pages.forEach(page => page.classList.toggle('active', page.dataset.page === route));
    navAnchors.forEach(a => a.classList.toggle('active', a.dataset.route === route));
    document.title = `${capitalize(route)} | Dev Tobbi`;
    navLinks.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (route === 'skills') animateSkills();
    if (route === 'home') startTyping();
  }

  window.addEventListener('hashchange', () => showRoute(getRouteFromHash()));

  /* ---------- Mobile menu ---------- */
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
      navLinks.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeIcon.innerHTML = theme === 'light'
      ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
      : '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>';
  }

  let storedTheme = null;
  try { storedTheme = localStorage.getItem('portfolio-theme'); } catch (_) { /* storage unavailable */ }
  applyTheme(storedTheme || 'dark');

  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('portfolio-theme', next); } catch (_) { /* ignore */ }
  });

  /* ---------- Typewriter hero ---------- */
  const typedEl = document.getElementById('typed');
  const TYPED_TEXT = "Hi, I'm Dev Tobbi. I build things that work.";
  let typingTimer = null;

  function startTyping() {
    clearTimeout(typingTimer);
    if (prefersReducedMotion) {
      typedEl.textContent = TYPED_TEXT;
      return;
    }
    typedEl.textContent = '';
    let i = 0;
    const step = () => {
      typedEl.textContent = TYPED_TEXT.slice(0, i + 1);
      i++;
      if (i < TYPED_TEXT.length) {
        const delay = 55 + Math.random() * 60;
        typingTimer = setTimeout(step, delay);
      }
    };
    typingTimer = setTimeout(step, 300);
  }

  /* ---------- Animated skill bars with percentage counters ---------- */
  function animateSkills() {
    document.querySelectorAll('[data-page="skills"] .skill-list li').forEach(item => {
      const fill = item.querySelector('.fill');
      const label = item.querySelector('.pct');
      const target = Number(fill.dataset.level);

      fill.style.width = '0%';
      label.textContent = '0%';

      if (prefersReducedMotion) {
        fill.style.width = `${target}%`;
        label.textContent = `${target}%`;
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fill.style.width = `${target}%`;
        });
      });

      const duration = 1200;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        label.textContent = `${Math.round(eased * target)}%`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Project flip cards ---------- */
  document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', () => {
      if (window.matchMedia('(hover: none)').matches) {
        card.classList.toggle('flipped');
      }
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('flipped');
      }
    });
  });

  /* ---------- Contact form ---------- */
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const rules = {
    name: v => v.trim().length >= 2 || 'Please enter your name.',
    email: v => EMAIL_RE.test(v.trim()) || 'Please enter a valid email address.',
    subject: v => v.trim().length >= 3 || 'Subject should be at least 3 characters.',
    message: v => v.trim().length >= 10 || 'Message should be at least 10 characters.'
  };

  function validateField(name) {
    const input = form.elements[name];
    const wrapper = input.closest('.field');
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    const result = rules[name](input.value);
    const valid = result === true;
    wrapper.classList.toggle('invalid', !valid);
    input.setAttribute('aria-invalid', String(!valid));
    errorEl.textContent = valid ? '' : result;
    return valid;
  }

  Object.keys(rules).forEach(name => {
    form.elements[name].addEventListener('blur', () => validateField(name));
    form.elements[name].addEventListener('input', () => {
      if (form.elements[name].closest('.field').classList.contains('invalid')) validateField(name);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const allValid = Object.keys(rules).map(validateField).every(Boolean);
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!allValid) {
      status.className = 'form-status';
      status.textContent = 'Please fix the highlighted fields.';
      const firstInvalid = form.querySelector('.field.invalid input, .field.invalid textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    status.className = 'form-status';
    status.textContent = '';

    // Replace with a real endpoint (Formspree, Netlify Forms, or your own API).
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      status.className = 'form-status success';
      status.textContent = 'Thanks! Your message has been sent.';
      form.reset();
      Object.keys(rules).forEach(name => {
        form.elements[name].closest('.field').classList.remove('invalid');
        form.querySelector(`[data-error-for="${name}"]`).textContent = '';
      });
    }, 900);
  });

  /* ---------- Init ---------- */
  showRoute(getRouteFromHash());
})();