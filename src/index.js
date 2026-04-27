export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/submit") {
      try {
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries());

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Afaq Website <onboarding@resend.dev>",
            to: ["horizonsdedjurdjura15@gmail.com"],
            subject: `رسالة جديدة من: ${data.name}`,
            html: `
              <h3>تفاصيل الرسالة:</h3>
              <p><strong>الاسم:</strong> ${data.name}</p>
              <p><strong>الهاتف:</strong> ${data.phone || "—"}</p>
              <p><strong>الإيميل:</strong> ${data.email}</p>
              <p><strong>الموضوع:</strong> ${data.subject}</p>
              <p><strong>الرسالة:</strong></p>
              <p>${data.message}</p>
            `,
          }),
        });

        if (res.ok) {
          return new Response(JSON.stringify({ message: "Success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } else {
          const err = await res.text();
          return new Response(JSON.stringify({ message: "Resend Error", detail: err }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // باقي الطلبات → الملفات الثابتة
    return env.ASSETS.fetch(request);
  }
};
