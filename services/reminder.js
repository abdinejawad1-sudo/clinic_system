const cron = require('node-cron');
const db = require('../db/database');
const { sendWhatsAppReminder } = require('./whatsapp');

function startReminderJob() {
  const cronExpr = process.env.REMINDER_CHECK_CRON || '*/15 * * * *';
  const hoursBefore = Number(process.env.REMINDER_HOURS_BEFORE || 24);

  console.log(`⏰ مهمة التذكير التلقائي تعمل حسب الجدول: ${cronExpr} (قبل الموعد بـ ${hoursBefore} ساعة)`);

  cron.schedule(cronExpr, async () => {
    try {
      await checkAndSendReminders(hoursBefore);
    } catch (err) {
      console.error('❌ خطأ أثناء تنفيذ مهمة التذكير:', err.message);
    }
  });
}

async function checkAndSendReminders(hoursBefore) {
  // نافذة زمنية: من الآن وحتى (الآن + hoursBefore ساعة) + هامش نصف ساعة
  // بحيث تلتقط المواعيد التي حان وقت تذكيرها ضمن دورة الفحص
  const now = new Date();
  const windowStart = now;
  const windowEnd = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000 + 30 * 60 * 1000);

  const candidates = db.prepare(`
    SELECT * FROM appointments
    WHERE status = 'confirmed' AND reminder_sent = 0
  `).all();

  for (const appt of candidates) {
    const apptDateTime = new Date(`${appt.appt_date}T${appt.appt_time}:00`);
    if (apptDateTime >= windowStart && apptDateTime <= windowEnd) {
      try {
        await sendWhatsAppReminder(appt);
        db.prepare('UPDATE appointments SET reminder_sent = 1 WHERE id = ?').run(appt.id);
        console.log(`✅ تم إرسال تذكير واتساب للمريض: ${appt.patient_name} (${appt.appt_date} ${appt.appt_time})`);
      } catch (err) {
        console.error(`❌ فشل إرسال تذكير للمريض ${appt.patient_name}:`, err.message);
      }
    }
  }
}

module.exports = { startReminderJob, checkAndSendReminders };
