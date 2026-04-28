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

// ─── CLOUDFLARE FORM HANDLER ───
async function handleFormSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('contactForm');
  const btnSubmit = document.getElementById('btn-submit');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');

  // إظهار حالة التحميل
  btnSubmit.disabled = true;
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline';
  btnSpinner.textContent = currentLang === 'ar' ? '⏳ جاري الإرسال...' : '⏳ Envoi en cours...';

  try {
    const formData = new FormData(form);
    
    // ⚠️ استبدل هذا الرابط برابطك الخاص (سنشرحه في الخطوة 3)
    const response = await fetch('/submit', {
  method: 'POST',
  body: formData
});

    if (response.ok) {
      // نجاح الإرسال
      form.style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
      document.getElementById('form-success').querySelectorAll('[data-lang]').forEach(el => {
        el.style.display = el.getAttribute('data-lang') === currentLang ? 'inline' : 'none';
      });
    } else {
      throw new Error('Network response was not ok');
    }
  } catch (error) {
    // فشل الإرسال
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

// ─── أضف هذا الكود في نهاية ملف script.js ───
 
// ─── DARK MODE ───
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('theme-toggle-btn');
  const isDark = body.classList.toggle('dark-theme');
  btn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
 
// استرجاع خيار المستخدم عند تحميل الصفحة
(function initTheme() {
  const saved = localStorage.getItem('theme');
  const btn = document.getElementById('theme-toggle-btn');
  if (saved === 'dark') {
    document.body.classList.add('dark-theme');
    if (btn) btn.textContent = '☀️';
  }
})();
 
// ─── CHATBOT ───
function toggleChat() {
  const win = document.getElementById('chat-window');
  const fab = document.getElementById('chat-fab');
  const isOpen = win.classList.toggle('open');
  fab.classList.toggle('active', isOpen);
  fab.textContent = isOpen ? '✕' : '💬';
  if (isOpen) document.getElementById('chat-input').focus();
}

function handleChatKey(e) {
  if (e.key === 'Enter') sendChatMessage();
}

const chatResponses = {
  ar: {
    default: 'شكراً على سؤالك! للمزيد من المعلومات تواصل معنا عبر نموذج الاتصال أو على الهاتف.',
    فلك: 'نادي الفلك ينظم جلسات رصد ليلية وورشات علمية. يمكنك الانضمام عبر نموذج الاتصال!',
    انخراط: 'للانخراط في الجمعية، أرسل لنا رسالة عبر قسم "اتصل بنا" أو اتصل بنا على 0556 88 91 45.',
    نادي: 'لدينا 5 نوادٍ متخصصة: الفلك، المسرح، السمعي البصري، الأحياء المائية، والتجميع!',
    مرحبا: 'أهلاً وسهلاً! كيف يمكنني مساعدتك؟',
  },
  fr: {
    default: 'Merci pour votre question! Pour plus d\'infos, contactez-nous via le formulaire ou par téléphone.',
    astronomie: 'Le club d\'astronomie organise des sessions d\'observation et des ateliers. Rejoignez-nous!',
    adhésion: 'Pour adhérer, envoyez-nous un message via la section Contact ou appelez le 0556 88 91 45.',
    club: 'Nous avons 5 clubs: Astronomie, Théâtre, Audiovisuel, Aquariophilie et Collection!',
    bonjour: 'Bienvenue! Comment puis-je vous aider?',
  }
};

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  const text = input.value.trim();
  if (!text) return;

  // رسالة المستخدم
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.textContent = text;
  messages.appendChild(userMsg);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  // رد المساعد
  setTimeout(() => {
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-msg bot';
    const lang = currentLang;
    const responses = chatResponses[lang] || chatResponses.ar;
    const lower = text.toLowerCase();
    let reply = responses.default;
    for (const [key, val] of Object.entries(responses)) {
      if (key !== 'default' && lower.includes(key)) { reply = val; break; }
    }
    botMsg.textContent = reply;
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
  }, 600);
}
