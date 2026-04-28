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

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            system_instruction: {
              parts: [{ text: "أنت مساعد ذكي يمثل جمعية آفاق جرجرة (Horizons de Djurdjura) في تيزي وزو. مهمتك الإجابة باختصار شديد، بلباقة، وباللغة التي يتحدث بها المستخدم (العربية أو الفرنسية). معلوماتك الأساسية: تأسست 2010، رئيسها ليتيمي مراد، نواديها: الفلك، المسرح، السمعي البصري، الأحياء المائية، والتجميع. هدفنا: التنمية الشاملة." }]
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
