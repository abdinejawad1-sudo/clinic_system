const twilio = require('twilio');

let client = null;

function getClient() {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
      throw new Error('بيانات Twilio غير موجودة');
    }

    client = twilio(sid, token);
  }

  return client;
}


function toWhatsAppNumber(phone) {
  const cleaned = phone.replace(/[\s-]/g, '');
  return cleaned.startsWith('+')
    ? `whatsapp:${cleaned}`
    : `whatsapp:+${cleaned}`;
}


async function sendWhatsAppReminder(appt) {

  const message = [
    `مرحباً ${appt.patient_name} 👋`,
    `هذا تذكير بموعدك في عيادة الأسنان`,
    `📅 التاريخ: ${appt.appt_date}`,
    `⏰ الوقت: ${appt.appt_time}`,
    `نتمنى لك يوماً سعيداً`
  ].join('\n');


  const c = getClient();


  return c.messages.create({

    from: process.env.TWILIO_WHATSAPP_FROM,

    to: toWhatsAppNumber(appt.phone),

    body: message

  });

}


module.exports = { sendWhatsAppReminder };