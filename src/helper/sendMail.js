// utils/sendMail.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ to, subject, html, text }) {
  await resend.emails.send({
    from: 'Visit Hà Tĩnh <no-reply@ecompro.id.vn>', // domain đã verify
    to,
    subject,
    html,
    text,
  });
}

module.exports = sendMail;
