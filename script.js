// ─── LANGUAGE SYSTEM ───
const translations = {
  ar: {
    placeholders: {
      name: 'اسمك الكامل',
      phone: '05XXXXXXXX',
      email: 'example@email.com',
      message: 'اكتب رسالتك هنا...'
    },
    sending: 'جاري الإرسال...',
    sent: '✓ تم الإرسال'
  },
  fr: {
    placeholders: {
      name: 'Votre nom complet',
      phone: '05XXXXXXXX',
      email: 'example@email.com',
      message: 'Écrivez votre message ici...'
    },
    sending: 'Envoi en cours...',
    sent: '✓ Message envoyé'
  }
};

let currentLang = 'ar';

function setLang(lang) {
  currentLang = lang;
  const body = document.body;

  if (lang === 'fr') {
    body.classList.add('lang-fr');
    body.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'fr');
    document.documentElement.setAttribute('dir', 'ltr');
  } else {
    body.classList.remove('lang-fr');
    body.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    document.documentElement.setAttribute('dir', 'rtl');
  }

  // Update btn states
  document.getElementById('btn-ar').classList.toggle('active', lang === 'ar');
  document.getElementById('btn-fr').classList.toggle('active', lang === 'fr');

  // Update placeholders
  const t = translations[lang];
  const inputs = document.querySelectorAll('input[type="text"]');
  if (inputs[0]) inputs[0].placeholder = t.placeholders.name;
  const tel = document.querySelector('input[type="tel"]');
  if (tel) tel.placeholder = t.placeholders.phone;
  const email = document.querySelector('input[type="email"]');
  if (email) email.placeholder = t.placeholders.email;
  const textarea = document.querySelector('textarea');
  if (textarea) textarea.placeholder = t.placeholders.message;

  // Update select options
  document.querySelectorAll('select option').forEach(opt => {
    const val = opt.getAttribute('data-' + lang);
    if (val) opt.textContent = val;
  });

  // Update form success/error boxes language visibility
  ['form-success', 'form-error'].forEach(id => {
    const box = document.getElementById(id);
    if (box) {
      box.querySelectorAll('[data-lang]').forEach(el => {
        el.style.display = el.getAttribute('data-lang') === lang ? 'inline' : 'none';
      });
    }
  });
}

// ─── SCROLL REVEAL ───
const els = document.querySelectorAll('.reveal');
const obs = new IntersectionObserver(entries => {
  entries.forEach((e,i) => {
    if(e.isIntersecting) setTimeout(() => e.target.classList.add('in'), i * 70);
  });
}, { threshold: 0.08 });
els.forEach(e => obs.observe(e));

// ─── NETLIFY FORM HANDLER ───
async function handleNetlifySubmit(e) {
  e.preventDefault();
  const form = document.getElementById('contactForm');
  const btnSubmit = document.getElementById('btn-submit');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');

  // Show loading
  btnSubmit.disabled = true;
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline';
  btnSpinner.textContent = currentLang === 'ar' ? '⏳ جاري الإرسال...' : '⏳ Envoi en cours...';

  try {
    const formData = new FormData(form);
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    });

    if (response.ok) {
      // Success
      form.style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
      // Apply current language to success box
      document.getElementById('form-success').querySelectorAll('[data-lang]').forEach(el => {
        el.style.display = el.getAttribute('data-lang') === currentLang ? 'inline' : 'none';
      });
    } else {
      throw new Error('Network response was not ok');
    }
  } catch (error) {
    // Error
    btnSubmit.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    document.getElementById('form-error').style.display = 'block';
  }
}

function resetForm() {
  const form = document.getElementById('contactForm');
  form.reset();
  form.style.display = 'block';
  document.getElementById('form-success').style.display = 'none';
  document.getElementById('form-error').style.display = 'none';
  const btnSubmit = document.getElementById('btn-submit');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');
  btnSubmit.disabled = false;
  btnText.style.display = 'inline';
  btnSpinner.style.display = 'none';
}

// Legacy sendForm (kept for compatibility)
function sendForm() {}

// ─── ACTIVE NAV ───
window.addEventListener('scroll', () => {
  const secs = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-menu a');
  let cur = '';
  secs.forEach(s => { if(scrollY >= s.offsetTop - 90) cur = s.id; });
  links.forEach(l => {
    if(l.classList.contains('nav-cta')) return;
    l.style.color = l.getAttribute('href') === '#'+cur ? '#7fffb2' : '';
  });
});
