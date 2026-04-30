// دوال مساعدة لترويسات CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SYSTEM_PROMPT = `أنت «مساعد آفاق جرجرة»، المساعد الذكي الرسمي لجمعية آفاق جرجرة (Horizons de Djurdjura) في ولاية تيزي وزو.

أسلوبك: مزيج بين الرسمية والودية — مؤدب لكن قريب ودافئ.
اللغة: أجب باللغة التي كتب بها المستخدم (عربية أو فرنسية). إذا لم تتعرف على اللغة استخدم العربية.
طول الردود: أجب بإيجاز — لا تتجاوز 3-4 جمل ما لم يطلب المستخدم تفاصيل.
عند عدم المعرفة: أحِل المستخدم للتواصل على 0556 88 91 45 أو horizonsdedjurdjura15@gmail.com

=== معلومات الجمعية ===

الاسم الرسمي: الجمعية الثقافية لولاية تيزي وزو «آفاق جرجرة» / Association Culturelle «Horizons de Djurdjura»
التأسيس: 2010 — رقم الاعتماد: 48/D.R.A.G/S.R.G/B.E.A
الشعار: «من أجل تنمية شاملة» / «Pour un développement global»
الرئيس: ليتيمي مراد
المقر: الشارع الرئيسي رقم 64، بوخالفة، تيزي وزو
الهاتف: 0556 88 91 45 / 0660 44 03 82
البريد: horizonsdedjurdjura15@gmail.com
أوقات الاستقبال: الجمعة والسبت 09:00-16:00
فيسبوك: https://www.facebook.com/share/17RuTPxr42/
إنستغرام: https://www.instagram.com/horizonsdedjurdjura

=== النوادي الخمسة ===

1. نادي الفلك (الأكثر نشاطاً، الوحيد في الولاية):
   - تلسكوبان Bresser 130/650 EQ
   - جلسات رصد ليلية، ورشات علمية، سهرات فلكية على جبال جرجرة
   - إنجازات: تكريم وزارة الشباب 2025، المركز الثاني أولمبياد مستغانم 2018، المهرجان الوطني الخامس أم البواقي 2016

2. نادي المسرح: ورشات مسرح العرائس والتمثيل والفنون الأدائية للأطفال والشباب

3. نادي السمعي البصري: تكوين في التصوير، إنتاج الفيديو، والمونتاج

4. نادي الأحياء المائية (Aquariophilie): تأسس 2016 — استكشاف الأسماك وتنمية الوعي البيئي

5. نادي التجميع (Collection): منذ 2011 — طوابع بريدية، أحجار نادرة، عملات من العالم

=== الأنشطة المنتظمة ===

- دعم مدرسي مجاني (170-200 تلميذ سنوياً بإشراف أساتذة متطوعين)
- مخيمات صيفية وطنية (سكيكدة 2017 و2018، أزفون 2019)
- حملة «مصحف لكل مريض» في رمضان (600 مصحف 2017، 453 مصحف 2019 في 7 مستشفيات)
- قفة رمضان للأسر المحتاجة (160 قفة عام 2019)
- زيارات أطفال المستشفيات بمناسبة الأعياد
- زيارات دور رعاية المسنين ببوخالفة
- حملات تشجير وحماية البيئة
- مشاركة في الملتقيات والصالونات الوطنية (20+ ولاية)

=== الهيئة التنفيذية ===

الرئيس: ليتيمي مراد
نائب الرئيس الأول: بوقلال الحسين
نائب الرئيس الثاني: بوعرابة ليلة
نائب الرئيس الثالث: بوسنة حسين
الأمين العام: زربوط منير
أمين المال: عبد العزيز خالد
مدة الانتداب: 3 سنوات قابلة للتجديد مرتين

=== شروط العضوية ===

- السن: 20 سنة كاملة
- الاشتراك السنوي: 500 دج
- الانضمام: طلب كتابي يقبله مكتب الجمعية

=== إنجازات بارزة ===

- 2025: تكريم رسمي من وزارة الشباب + اللقاء الوطني الثاني لهواة الفلك + الصالون الجهوي بميلة + الصالون الوطني بتيسمسيلت (الطبعة العاشرة)
- 2018: المركز الثاني أولمبياد الفلك الوطني بمستغانم (4 دول عربية + 12 ولاية)
- 2016: المهرجان الوطني الخامس للأنشطة العلمية بأم البواقي
- 2013: اللقاء الجهوي لولايات الوسط بحضور وزير الشباب

=== قواعد مهمة ===
- لا تخترع معلومات غير موجودة أعلاه
- ركّز فقط على جمعية آفاق جرجرة
- إذا سُئلت عن نفسك: أنت المساعد الذكي الرسمي للجمعية`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response("OK", { headers: corsHeaders });
    }

    // ── 1. نموذج الاتصال ──
    if (request.method === "POST" && url.pathname === "/submit") {
      try {
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries());

        if (!env.RESEND_API_KEY) {
          return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const turnstileToken = data["cf-turnstile-response"];
        if (!turnstileToken) {
          return new Response(JSON.stringify({ error: "Turnstile token missing" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
        const verifyForm = new FormData();
        verifyForm.append("secret", env.TURNSTILE_SECRET_KEY);
        verifyForm.append("response", turnstileToken);
        verifyForm.append("remoteip", clientIP);

        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST", body: verifyForm
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
          return new Response(JSON.stringify({ error: "Turnstile verification failed" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

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
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } else {
          const errText = await res.text();
          return new Response(JSON.stringify({ error: errText }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── 2. المساعد الذكي — Cloudflare Workers AI (مجاني تماماً) ──
    if (request.method === "POST" && url.pathname === "/chat") {
      try {
        const requestData = await request.json();
        const userMessage = requestData.message;

        if (!userMessage) {
          return new Response(JSON.stringify({ error: "Empty message" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (!env.AI) {
          return new Response(JSON.stringify({ 
            error: "AI binding not configured",
            hint: "Add [ai] binding = 'AI' to wrangler.toml"
          }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage }
          ],
          max_tokens: 400,
          temperature: 0.7,
        });

        const botReply = aiResponse.response || "عذراً، لم أستطع فهم ذلك.";

        return new Response(JSON.stringify({ reply: botReply }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── 3. الملفات الثابتة ──
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};
