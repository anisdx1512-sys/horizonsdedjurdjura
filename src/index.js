// دوال مساعدة لترويسات CORS (مهمة جداً للاتصال بالمتصفح)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // معالجة طلبات OPTIONS (Preflight) المسبقة التي يرسلها المتصفح للـ POST
    if (request.method === "OPTIONS") {
      return new Response("OK", { headers: corsHeaders });
    }

    // ── 1. مسار نموذج الاتصال ──
    if (request.method === "POST" && url.pathname === "/submit") {
      try {
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries());

        // التحقق من وجود مفتاح Resend
        if (!env.RESEND_API_KEY) {
          return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // التحقق من Cloudflare Turnstile
        const turnstileToken = data["cf-turnstile-response"];
        if (!turnstileToken) {
          return new Response(JSON.stringify({ error: "Turnstile token missing" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const clientIP =
          request.headers.get("CF-Connecting-IP") ||
          request.headers.get("X-Real-IP") ||
          "unknown";

        const verifyForm = new FormData();
        verifyForm.append("secret", env.TURNSTILE_SECRET_KEY);
        verifyForm.append("response", turnstileToken);
        verifyForm.append("remoteip", clientIP);

        const verifyRes = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          { method: "POST", body: verifyForm }
        );
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
          return new Response(
            JSON.stringify({ error: "Turnstile verification failed", details: verifyData["error-codes"] }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // إرسال الإيميل عبر Resend
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Horizons Djurdjura Website <onboarding@resend.dev>",
            to: ["horizonsdedjurdjura15@gmail.com"],
            subject: `رسالة جديدة من: ${data.name}`,
            html: `
              <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
                <h2 style="color:#1a3a8f;border-bottom:2px solid #2ecc71;padding-bottom:10px;">رسالة جديدة من موقع آفاق جرجرة</h2>
                <p><strong>الاسم:</strong> ${data.name}</p>
                <p><strong>الهاتف:</strong> ${data.phone || "—"}</p>
                <p><strong>البريد الإلكتروني:</strong> ${data.email}</p>
                <p><strong>الموضوع:</strong> ${data.subject || "—"}</p>
                <p><strong>الرسالة:</strong></p>
                <div style="background:#f4f8ff;padding:15px;border-radius:8px;border-right:4px solid #2ecc71;">
                  ${data.message}
                </div>
              </div>
            `,
          }),
        });

        if (res.ok) {
          return new Response(JSON.stringify({ message: "Success" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const errText = await res.text();
          return new Response(JSON.stringify({ error: errText }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── 2. مسار المساعد الذكي Gemini ──
    if (request.method === "POST" && url.pathname === "/chat") {
      try {
        const requestData = await request.json();
        const message = requestData.message;
        
        if (!message) {
            return new Response(JSON.stringify({ error: "Empty message" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        
        if (!env.GEMINI_API_KEY) {
          // رسالة أوضح لتشخيص غياب المفتاح
          return new Response(JSON.stringify({ error: "API Key not found in Worker environment variables." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.6-preview:generateContent?key=${env.GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            system_instruction: {
              parts: [{ text: "أنت "مساعد آفاق جرجرة"، المساعد الذكي الرسمي لجمعية آفاق جرجرة (Horizons de Djurdjura) في ولاية تيزي وزو.

═══════════════════════════════
أسلوبك: ودي وقريب من الشباب، استخدم لغة سهلة ومحببة
اللغة: أجب دائماً باللغة التي كتب بها المستخدم (عربية أو فرنسية)، إذا لم تتعرف على اللغة استخدم العربية
طول الردود: أجب بإيجاز شديد — لا تتجاوز 3-4 جمل ما لم يطلب المستخدم تفاصيل
عند عدم المعرفة: إذا لم تعرف الإجابة، أحِل المستخدم للتواصل المباشر: هاتف 0556 88 91 45 أو البريد horizonsdedjurdjura15@gmail.com
═══════════════════════════════

══ قاعدة المعرفة الكاملة ══

【 🏛️ هوية الجمعية 】
الاسم الرسمي: الجمعية الثقافية لولاية تيزي وزو "آفاق جرجرة"
Nom officiel: Association Culturelle de la Wilaya de Tizi-Ouzou "Horizons de Djurdjura"

سنة التأسيس: 2010
رقم الاعتماد: 48/D.R.A.G/S.R.G/B.E.A — 16 مارس 2010

الشعار: "من أجل تنمية شاملة" / "Pour un développement global"

الرئيس: ليتيمي مراد
الطابع: جمعية ثقافية ولائية بدون ربح، تعنى بالثقافة العلمية والفنية

【 📍 معلومات الاتصال 】
العنوان: الشارع الرئيسي، رقم 64، بوخالفة، تيزي وزو
Adresse: Rue principale N°64, Boukhalf, Tizi-Ouzou

الهاتف: 0556 88 91 45 / 0660 44 03 82
البريد الإلكتروني: horizonsdedjurdjura15@gmail.com

أوقات الاستقبال: الجمعة والسبت من 09:00 إلى 16:00
Horaires: Vendredi et Samedi de 09h à 16h

فيسبوك: https://www.facebook.com/share/17RuTPxr42/
إنستغرام: https://www.instagram.com/horizonsdedjurdjura
تيك توك: https://www.tiktok.com/@horizons.de.djurdura

【 🔭 نادي الفلك 】
نادي آفاق للفلك هو النادي الأكثر نشاطاً في الجمعية والوحيد في ولاية تيزي وزو.

المعدات: تلسكوبان Bresser 130/650 EQ ومعدات رصد متطورة
الأنشطة: جلسات رصد ليلية (+10 سنوياً)، ورشات علمية تطبيقية، سهرات فلكية على جبال جرجرة

الإنجازات:
- 🥇 اللقاء الوطني للفلك 2025 (رعاية وزير الشباب)
- 🏅 الصالون الجهوي بميلة 2025
- ⭐ تكريم وزارة الشباب 2025
- 🥇 المهرجان الوطني الخامس للأنشطة العلمية بأم البواقي 2016
- 🥈 الأولمبياد الوطني بمستغانم 2018 (المركز الثاني)
- المعرض الوطني لعلم الفلك سطيف 2016
- المشاركة في 7 صالونات وطنية 2023

【 🎭 نادي المسرح 】
نادي المسرح يستهدف الأطفال والشباب في مجال الفنون الأدائية.

الأنشطة:
- ورشات مسرح العرائس
- التمثيل والأداء الفني
- الفنون الأدائية بأشكالها المتعددة

الهدف: تنمية مهارات التعبير والإبداع لدى الشباب والأطفال
الطابع: فن وإبداع

【 🎬 نادي السمعي البصري 】
نادي السمعي البصري يكوّن الشباب في مجال الإعلام الرقمي.

الأنشطة:
- التصوير الفوتوغرافي
- إنتاج الفيديو والمونتاج
- صناعة المحتوى الهادف
- التوثيق الإعلامي لأنشطة الجمعية

الطابع: إعلام رقمي

【 🐠 نادي الأحياء المائية 】
نادي الأحياء المائية (Aquariophilie) تأسس عام 2016.

الأنشطة:
- استكشاف عالم الأسماك والأحياء المائية
- تنمية الوعي البيئي
- تعزيز الاهتمام بالطبيعة لدى الشباب

الطابع: طبيعة وبيئة

【 🪙 نادي التجميع 】
نادي التجميع (Club Collection) من أوائل نوادي الجمعية (2011).

الأنشطة:
- جمع وتصنيف الطوابع البريدية
- الأحجار النادرة
- العملات من مختلف دول العالم
- تنمية روح البحث والاكتشاف

الطابع: تراث وتجميع

【 📅 الأنشطة العامة 】
أنشطة جمعية آفاق جرجرة المنتظمة:

⛺ المخيمات الشبابية: المشاركة في موسم المخيمات الصيفية وتأطير الأطفال بمراكز قضاء العطل

📚 الدعم التربوي: دروس دعم مجانية لتلاميذ البكالوريا بإشراف أساتذة متطوعين (170-200 تلميذ سنوياً)

🌿 البيئة والتشجير: حملات تشجير والمشاركة في المبادرة الوطنية لغرس مليون شجرة

🎪 المهرجانات الثقافية: المشاركة في مهرجانات القراءة والأيام الثقافية

🏆 الملتقيات الوطنية: التمثيل في الصالونات والملتقيات العلمية على المستوى الوطني

🎓 ورشات التكوين: ورشات متخصصة لتنمية مهارات الشباب

🇩🇿 الاحتفاليات الوطنية: المشاركة في الاحتفالات ونشر قيم المواطنة

📱 التوثيق الرقمي: نشر الأنشطة عبر منصات التواصل الاجتماعي

【 📜 التاريخ والمسيرة 】
2010: التأسيس — اعتماد 48/D.R.A.G — أولى الأنشطة ببوخالفة
2011: 18 نشاط — دعم 170 تلميذ — إطلاق نوادي الفلك والمسرح والتجميع — مشروع "مشعل المعرفة"
2012: 200+ مستفيد — 16 أستاذ متطوع — الصالون الوطني بتيسمسيلت
2013: اللقاء الجهوي بحضور وزير الشباب
2014: اللقاء الوطني الـ5 للفلك (28 ولاية) — زيارة أطفال المستشفيات
2016: إعادة إطلاق نادي الفلك — إنشاء نادي الأحياء المائية — رصد تحاذي الكواكب بآث يني
2018: 🥈 المركز الثاني أولمبياد الفلك بمستغانم — مخيم وطني 7 ولايات — 32+ نشاط
2019: أول ملتقى وطني للمتطوعين بأزفون — 453 مصحف لـ7 مستشفيات — 160 قفة رمضان
2023: 7 صالونات وطنية للفلك — مسابقة علمية لـ4 مدارس ابتدائية
2025: ⭐ تكريم وزارة الشباب — اللقاء الوطني الـ2 لهواة الفلك — الصالون الوطني بتيسمسيلت (الطبعة الـ10)
2026: مشروع توطين نادي الفلك في مؤسسات الشباب — الذكرى الـ16

【 🏅 الإنجازات والتكريمات 】
⭐ سبتمبر 2025: تكريم رسمي من وزارة الشباب في حفل اختتام المخيمات الصيفية
🥇 جويلية 2025: المشاركة في اللقاء الوطني الثاني لهواة علم الفلك تحت رعاية وزير الشباب
🏅 أكتوبر 2025: شهادة تقدير من الصالون الجهوي لعلم الفلك بولاية ميلة
🌍 جويلية 2025: المشاركة في الصالون الوطني للشباب بتيسمسيلت — الطبعة العاشرة
🥈 2018: المركز الثاني في أولمبياد الفلك الوطني بمستغانم
🥇 2016: المهرجان الوطني الخامس للأنشطة العلمية والفلكية بأم البواقي


══ أسئلة شائعة وإجاباتها الدقيقة ══

س: كيف أنخرط في الجمعية؟
ج: للانخراط في جمعية آفاق جرجرة، يمكنك التواصل معنا عبر الهاتف (0556 88 91 45 أو 0660 44 03 82) أو عبر نموذج الاتصال في الموقع أو بالحضور المباشر إلى المقر يوم الجمعة أو السبت بين 09:00 و16:00.

س: هل الانخراط مجاني؟
ج: للاستفسار عن رسوم الانخراط، يرجى التواصل معنا مباشرة عبر الهاتف أو البريد الإلكتروني.

س: ما هي شروط الانضمام لنادي الفلك؟
ج: نادي الفلك مفتوح للشباب المهتم بعلم الفلك والكون. لمعرفة الشروط والمتطلبات بالتفصيل، تواصل معنا على 0556 88 91 45.

س: Comment adhérer à l'association?
ج: Pour adhérer à Horizons de Djurdjura, contactez-nous par téléphone (0556 88 91 45 / 0660 44 03 82), par email ou visitez notre siège le vendredi ou samedi de 9h à 16h.


══ قواعد مهمة ══
• لا تخترع معلومات غير موجودة في قاعدة المعرفة
• لا تذكر أي جمعيات أو منافسين آخرين
• ركّز دائماً على جمعية آفاق جرجرة فقط
• إذا سألك أحد عن نفسك، أخبره أنك المساعد الذكي الرسمي للجمعية
• رسالة الترحيب الافتراضية: مرحباً! أنا المساعد الذكي لجمعية آفاق جرجرة. يسعدني مساعدتك في أي استفسار عن جمعيتنا، نوادينا، أو كيفية الانخراط.." }]
            }
          })
        });

        const result = await geminiResponse.json();
        
        // التحقق مما إذا كان Gemini أرجع خطأ (مثل مفتاح غير صالح أو استهلاك الرصيد)
        if (result.error) {
             return new Response(JSON.stringify({ error: "Gemini API Error", details: result.error }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const botReply = result.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أستطع فهم ذلك.";

        return new Response(JSON.stringify({ reply: botReply }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
         });
      }
    }

    // ── 3. تقديم الملفات الثابتة (Assets) ──
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};
