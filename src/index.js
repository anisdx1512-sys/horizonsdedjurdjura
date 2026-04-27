export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/submit") {
      try {
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries());

        if (!env.RESEND_API_KEY) {
          return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), { status: 500 });
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
              <h3>تفاصيل الرسالة:</h3>
              <p><strong>الاسم:</strong> ${data.name}</p>
              <p><strong>الهاتف:</strong> ${data.phone || "—"}</p>
              <p><strong>الإيميل:</strong> ${data.email}</p>
              <p><strong>الموضوع:</strong> ${data.subject}</p>
              <p><strong>الرسالة:</strong> ${data.message}</p>
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
          return new Response(JSON.stringify({ error: errText }), { status: 500 });
        }

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};
