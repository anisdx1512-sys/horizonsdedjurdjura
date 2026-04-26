export async function onRequestPost(context) {
  try {
    const input = await context.request.formData();
    const data = Object.fromEntries(input.entries());

    // إرسال البيانات إلى خدمة Resend البريدية
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Afaq Website <onboarding@resend.dev>",
        to: ["horizonsdedjurdjura15@gmail.com"],
        subject: `رسالة جديدة من: ${data.name}`,
        html: `
          <h3>تفاصيل الرسالة الجديدة:</h3>
          <p><strong>الاسم:</strong> ${data.name}</p>
          <p><strong>الهاتف:</strong> ${data.phone}</p>
          <p><strong>الإيميل:</strong> ${data.email}</p>
          <p><strong>الموضوع:</strong> ${data.subject}</p>
          <p><strong>الرسالة:</strong></p>
          <p>${data.message}</p>
        `,
      }),
    });

    if (res.ok) {
      return new Response(JSON.stringify({ message: "Success" }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ message: "Error" }), { status: 500 });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
