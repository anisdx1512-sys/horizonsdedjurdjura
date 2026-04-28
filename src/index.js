export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/submit") {
      try {
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries());

        // ── 1. التحقق من وجود مفتاح Resend ──
        if (!env.RESEND_API_KEY) {
          return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), { status: 500 });
        }

        // ── 2. التحقق من Cloudflare Turnstile ──
        const turnstileToken = data["cf-turnstile-response"];
        if (!turnstileToken) {
          return new Response(JSON.stringify({ error: "Turnstile token missing" }), { status: 400 });
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
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // ── 3. إرسال الإيميل عبر Resend ──
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
            headers: { "Content-Type": "application/json" },
          });
        } else {
          const errText = await res.text();
          return new Response(JSON.stringify({ error: errText }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // ── الملفات الثابتة ──
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};
