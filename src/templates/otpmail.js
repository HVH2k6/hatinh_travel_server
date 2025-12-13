// templates/otpEmail.js
// Template email OTP mang phong cách du lịch (Travel) – hiện đại & tương thích client email

/**
 * Tạo subject, html & text cho email OTP
 * @param {Object} params
 * @param {string} params.brand         - Tên thương hiệu (vd: "Visit Hà Tĩnh")
 * @param {string} params.code          - Mã OTP 6 số
 * @param {number} params.minutes       - Số phút hiệu lực (vd: 5)
 * @param {string} [params.heroUrl]     - Ảnh hero (URL tuyệt đối). Vd: https://your-cdn/hatinh-hero.jpg
 * @param {string} [params.appUrl]      - Link mở ứng dụng / website
 * @param {string} [params.supportEmail] - Email hỗ trợ
 * @param {number} [params.year]        - Năm hiển thị footer
 */
function otpEmailTemplate({
  brand = 'Visit Hà Tĩnh',
  code = '123456',
  minutes = 5,
  heroUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80&auto=format&fit=crop', // biển
  appUrl = 'https://hatinhtravel.net',
  telesp = 'devtheworld',
  year = new Date().getFullYear(),
} = {}) {
  const subject = `[${brand}] Mã OTP của bạn: ${code}`;
  const preheader = `Mã xác thực ${code} có hiệu lực trong ${minutes} phút.`;

  const html = `
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>
    /* Reset cơ bản cho email client */
    body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; display:block; }
    body { margin:0; padding:0; width:100% !important; }
    /* Container */
    .wrapper { width:100%; background: #f5fbff; }
    .container { width:100%; max-width: 640px; margin:0 auto; }
    .card { background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 24px rgba(19, 72, 120, 0.08); }
    /* Header / Brand */
    .brand { font:600 18px/1.2, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0ea5e9; }
    .muted { color:#64748b; }
    .title { font:700 24px/1.25, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; margin:0; }
    .text { font:400 14px/1.6, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#334155; margin:0; }
    .center { text-align:center; }
    /* OTP badge */
    .otp { letter-spacing:6px; font:700 32px/1, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#0ea5e9; background:#e0f2fe; padding:16px 24px; border-radius:12px; display:inline-block; }
    /* Button */
    .btn { background:#0ea5e9; color:#ffffff !important; text-decoration:none; display:inline-block; padding:12px 20px; border-radius:10px; font:600 14px/1, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .btn:hover { opacity:0.96; }
    /* Chips */
    .chip { background:rgba(255,255,255,0.7); border:1px solid rgba(14,165,233,0.2); color:#0369a1; padding:6px 10px; border-radius:999px; font:500 12px/1, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display:inline-block; margin-right:8px; }
    /* Footer */
    .footer { font:400 12px/1.6, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#64748b; }
    /* Mobile */
    @media (max-width: 480px) {
      .title { font-size:21px !important; }
      .otp { font-size:28px !important; letter-spacing:5px !important; }
    }
  </style>
</head>
<body style="background:#e8f6ff;">
  <!-- Preheader (ẩn) -->
  <div style="display:none;opacity:0;visibility:hidden;overflow:hidden;height:0;width:0;font-size:1px;line-height:1px;">
    ${preheader}
  </div>

  <table role="presentation" class="wrapper" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" class="container" cellpadding="0" cellspacing="0">
        <tr><td height="28"></td></tr>

        <tr><td align="center" class="brand">
          ${brand}
        </td></tr>

        <tr><td height="12"></td></tr>

        <tr><td class="card">
          <!-- Hero -->
          <img src="${heroUrl}" width="640" alt="Khám phá biển xanh – rừng núi & di tích" style="max-width:100%; height:auto;">

          <!-- Nội dung -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
            <tr><td>
              
              <p class="text" style="margin-top:8px;">
                Đây là mã OTP để xác nhận email của bạn. Mã có hiệu lực trong <b>${minutes} phút</b>.
              </p>
            </td></tr>

            <tr><td class="center" style="padding:18px 0 8px;">
              <span class="otp" aria-label="Mã OTP">${code}</span>
            </td></tr>

            <tr><td class="center" style="padding:8px 0 16px;">
              <a href="${appUrl}" class="btn">Mở ứng dụng</a>
            </td></tr>

            <tr><td style="padding-top:8px;">
              <p class="text">
                Vì lý do an toàn, <b>không chia sẻ</b> mã này cho bất kỳ ai. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ hỗ trợ.
              </p>
            </td></tr>

            <!-- chips gợi ý điểm đến -->
            <tr><td class="center" style="padding-top:16px;">
              <span class="chip">Thiên Cầm</span>
              <span class="chip">Đồng Lộc</span>
              <span class="chip">Hương Tích</span>
              <span class="chip">Hồ Kẻ Gỗ</span>
            </td></tr>
          </table>
        </td></tr>

        <tr><td height="16"></td></tr>

        <tr><td class="center footer">
          © ${year} ${brand}. Cần hỗ trợ? <a href="https://t.me/${telesp}" style="color:#0ea5e9;text-decoration:none;">${telesp}</a>
        </td></tr>

        <tr><td height="28"></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  const text = `${brand} - Ma OTP cua ban: ${code}
Ma co hieu luc ${minutes} phut. Khong chia se ma nay cho bat ky ai.
Mo ung dung: ${appUrl}
Ho tro: ${supportEmail}
`;

  return { subject, html, text };
}

module.exports = otpEmailTemplate;
