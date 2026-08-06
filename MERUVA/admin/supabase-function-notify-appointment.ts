// ═══════════════════════════════════════════════════════════
// MERUVA · Edge Function: notify-appointment
// Gửi email báo khi có lịch hẹn mới. KHÔNG deploy bằng CLI —
// copy toàn bộ nội dung file này, dán vào Supabase Dashboard →
// Edge Functions → tạo function tên "notify-appointment".
// ═══════════════════════════════════════════════════════════

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const NOTIFY_TO = Deno.env.get('NOTIFY_TO')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const r = payload.record ?? payload; // Supabase Database Webhook gửi dạng {record: {...}}

    const html = `
      <div style="font-family:sans-serif;max-width:480px">
        <h2 style="color:#A07820">Lịch hẹn mới — MERUVA</h2>
        <p><b>Khách:</b> ${r.name}</p>
        <p><b>SĐT / Zalo:</b> ${r.phone}</p>
        <p><b>Nhu cầu:</b> ${r.service}</p>
        <p><b>Ngày giờ:</b> ${r.appt_date} · ${r.appt_time}</p>
        ${r.note ? `<p><b>Ghi chú:</b> ${r.note}</p>` : ''}
        <p style="color:#888;font-size:12px;margin-top:1.5rem">
          Gửi tự động từ hệ thống admin MERUVA — vào admin.html để duyệt lịch hẹn.
        </p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFY_TO,
        subject: `Lịch hẹn mới: ${r.name} — ${r.appt_date}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ ok: false, error: errText }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
