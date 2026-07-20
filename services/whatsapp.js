const twilio = require('twilio');

let client = null;

function getClient() {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token || sid.startsWith('ACxxxx')) {
      throw new Error('بيانات Twilio غير مُعدّة بعد في ملف .env');
    }
    client = twilio(sid, token);
  }
  return client;
}

// يحوّل رقم الهاتف المحلي إلى صيغة دولية بسيطة تناسب واتساب
function toWhatsAppNumber(phone) {
  const cleaned = phone.replace(/[\s-]/g, '');
  return cleaned.startsWith('+') ? `whatsapp:${cleaned}` : `whatsapp:+${cleaned}`;
}

/**
 * يرسل رسالة تذكير واتساب لمريض
 * @param {{phone: string, patientName: string, date: string, time: string}} appt
 */
async function sendWhatsAppReminder(appt) {
  const message = [
    `مرحباً ${appt.patientName} 👋`,
    `هذا تذكير بموعدك في عيادة الأسنان`,
    `📅 التاريخ: ${appt.appt_date}`,
    `⏰ الوقت: ${appt.appt_time}`,
    `في حال رغبتك بإلغاء أو تعديل الموعد، الرجاء الاتصال بالعيادة.`
  ].join('\n');

  const c = getClient();
  return c.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: toWhatsAppNumber(appt.phone),
    body: message
  });
}

module.exports = { sendWhatsAppReminder };
