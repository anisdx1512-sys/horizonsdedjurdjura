// 1. ترجمات الموقع
const translations = {
    ar: {
        nav_brand: "آفاق جرجرة",
        nav_about: "من نحن",
        nav_clubs: "نوادينا",
        nav_activities: "أنشطتنا",
        nav_achievements: "إنجازاتنا",
        nav_contact: "اتصل بنا",
        hero_badge: "✦ ولاية تيزي وزو — منذ 2010 ✦",
        hero_title: "جمعية آفاق جرجرة<br><span style='color:#2ecc71'>نحو آفاق بلا حدود</span>",
        hero_sub: "الجمعية الثقافية — ولاية تيزي وزو",
        stat_years: "سنة نشاط",
        stat_clubs: "نوادٍ متخصصة",
        stat_acts: "نشاط موثق",
        btn_explore: "اكتشف نوادينا ←",
        btn_join: "انخرط معنا",
        contact_title: "اتصل بنا",
        form_name: "الاسم واللقب *",
        form_email: "البريد الإلكتروني *",
        form_msg: "رسالتك *",
        btn_send: "إرسال الرسالة ←",
        msg_success: "تم الإرسال بنجاح!",
        msg_error: "حدث خطأ ما، حاول مجدداً."
    },
    fr: {
        nav_brand: "Horizons",
        nav_about: "À Propos",
        nav_clubs: "Clubs",
        nav_activities: "Activités",
        nav_achievements: "Réalisations",
        nav_contact: "Contact",
        hero_badge: "✦ Wilaya de Tizi-Ouzou — Depuis 2010 ✦",
        hero_title: "Association Horizons de Djurdjura<br><span style='color:#2ecc71'>Vers des horizons sans limites</span>",
        hero_sub: "Association Culturelle — Wilaya de Tizi-Ouzou",
        stat_years: "Ans d'activité",
        stat_clubs: "Clubs spécialisés",
        stat_acts: "Activités documentées",
        btn_explore: "Découvrir →",
        btn_join: "Rejoignez-nous",
        contact_title: "Contactez-nous",
        form_name: "Nom et Prénom *",
        form_email: "E-mail *",
        form_msg: "Votre message *",
        btn_send: "Envoyer le message →",
        msg_success: "Envoyé avec succès!",
        msg_error: "Erreur, veuillez réessayer."
    }
};

// 2. وظيفة تبديل اللغة
function switchLang(lang) {
    const isAr = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    
    // تحديث الأزرار
    document.getElementById('btn-ar').classList.toggle('active', isAr);
    document.getElementById('btn-fr').classList.toggle('active', !isAr);

    // تحديث النصوص
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerHTML = translations[lang][key];
    });

    // العنوان الرئيسي (بسبب الـ HTML الداخلي)
    document.getElementById('main_title').innerHTML = translations[lang].hero_title;
    
    localStorage.setItem('pref_lang', lang);
}

// 3. دالة إرسال النموذج (Cloudflare Compatibility)
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit');
    const btnText = document.getElementById('btn-text');
    const loader = document.getElementById('btn-loader');
    const formMsg = document.getElementById('form-message');

    // تفعيل حالة التحميل
    btn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'inline-block';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        // استبدل هذا المسار بمسار (Cloudflare Worker أو Endpoint)
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            formMsg.className = 'msg-success';
            formMsg.innerText = translations[document.documentElement.lang].msg_success;
            e.target.reset();
        } else {
            throw new Error();
        }
    } catch (err) {
        formMsg.className = 'msg-error';
        formMsg.innerText = translations[document.documentElement.lang].msg_error;
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline-block';
        loader.style.display = 'none';
    }
});

// 4. تحميل اللغة المفضلة عند البدء
window.onload = () => {
    const savedLang = localStorage.getItem('pref_lang') || 'ar';
    switchLang(savedLang);
};