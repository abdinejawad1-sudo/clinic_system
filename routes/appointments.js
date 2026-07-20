const express = require('express');
const { getDatabase } = require('../db/database'); // تغيير طريقة الاستيراد
const { requireDoctorAuth } = require('../middleware/auth');

const router = express.Router();

// ------------------------------------------
// أدوات مساعدة للتحقق من صحة البيانات
// ------------------------------------------
const PHONE_REGEX = /^[+0-9][0-9\s-]{6,15}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isWithinClinicHours(time) {
  const [h] = time.split(':').map(Number);
  const open = Number(process.env.CLINIC_OPEN_HOUR || 9);
  const close = Number(process.env.CLINIC_CLOSE_HOUR || 21);
  return h >= open && h < close;
}

function isPastDateTime(date, time) {
  const target = new Date(`${date}T${time}:00`);
  return target.getTime() < Date.now();
}

// ==========================================
// GET /api/appointments/available?date=YYYY-MM-DD
// عام - يُستخدم في نموذج الحجز لتعطيل الأوقات المحجوزة مسبقاً
// ==========================================
router.get('/available', async (req, res) => {  // ✅ إضافة async
  const { date } = req.query;
  if (!date || !DATE_REGEX.test(date)) {
    return res.status(400).json({ error: 'تاريخ غير صالح' });
  }

  try {
    const db = getDatabase();
    const result = await db.query(  // ✅ استخدام query بدلاً من prepare
      `SELECT appt_time FROM appointments
       WHERE appt_date = $1 AND (status != 'cancelled' OR status IS NULL)`,
      [date]
    );
    res.json({ bookedTimes: result.rows.map(r => r.appt_time) });
  } catch (error) {
    console.error('Error fetching available times:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// ==========================================
// POST /api/appointments
// عام - يُستخدم من نموذج الحجز في الموقع
// ==========================================
router.post('/', async (req, res) => {  // ✅ إضافة async
  const { patientName, phone, date, time, service, notes } = req.body || {};

  // -------- التحقق من الحقول --------
  if (!patientName || patientName.trim().length < 2) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم صحيح' });
  }
  if (!phone || !PHONE_REGEX.test(phone.trim())) {
    return res.status(400).json({ error: 'الرجاء إدخال رقم هاتف صحيح' });
  }
  if (!date || !DATE_REGEX.test(date)) {
    return res.status(400).json({ error: 'الرجاء اختيار تاريخ صحيح' });
  }
  if (!time || !TIME_REGEX.test(time)) {
    return res.status(400).json({ error: 'الرجاء اختيار وقت صحيح' });
  }
  if (isPastDateTime(date, time)) {
    return res.status(400).json({ error: 'لا يمكن الحجز في تاريخ أو وقت قد مضى' });
  }
  if (!isWithinClinicHours(time)) {
    return res.status(400).json({
      error: `الرجاء اختيار وقت ضمن ساعات عمل العيادة (${process.env.CLINIC_OPEN_HOUR}:00 - ${process.env.CLINIC_CLOSE_HOUR}:00)`
    });
  }

  try {
    const db = getDatabase();

    // -------- منع تكرار الحجز لنفس التاريخ والوقت --------
    const existing = await db.query(
      `SELECT id FROM appointments
       WHERE appt_date = $1 AND appt_time = $2 AND (status != 'cancelled' OR status IS NULL)`,
      [date, time]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'هذا الموعد محجوز مسبقاً، الرجاء اختيار وقت آخر' });
    }

    // -------- إدراج الحجز الجديد --------
    const result = await db.query(
      `INSERT INTO appointments (patient_name, phone, appt_date, appt_time, service, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        patientName.trim(),
        phone.trim(),
        date,
        time,
        (service || 'كشف عام').trim(),
        (notes || '').trim()
      ]
    );

    const appointmentId = result.rows[0].id;

    res.status(201).json({
      message: 'تم تأكيد حجز موعدك بنجاح، سيصلك تذكير على واتساب قبل الموعد',
      appointmentId: appointmentId
    });

  } catch (err) {
    // في حال حصل تعارض بسبب طلبين وصلا بنفس اللحظة (UNIQUE constraint)
    if (err.message && err.message.includes('duplicate key')) {
      return res.status(409).json({ error: 'هذا الموعد حُجز للتو من مريض آخر، الرجاء اختيار وقت آخر' });
    }
    console.error('Error booking appointment:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم، الرجاء المحاولة لاحقاً' });
  }
});

// ==========================================
// كل ما يلي مخصص للطبيب فقط (يتطلب تسجيل دخول)
// ==========================================
router.use(requireDoctorAuth);

// GET /api/appointments?date=YYYY-MM-DD&status=confirmed
router.get('/', async (req, res) => {  // ✅ إضافة async
  const { date, status } = req.query;

  try {
    const db = getDatabase();
    let query = 'SELECT * FROM appointments WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (date && DATE_REGEX.test(date)) {
      query += ` AND appt_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY appt_date ASC, appt_time ASC';

    const result = await db.query(query, params);
    res.json({ appointments: result.rows });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// PATCH /api/appointments/:id  body: { status }  status: confirmed | cancelled | done
router.patch('/:id', async (req, res) => {  // ✅ إضافة async
  const { id } = req.params;
  const { status } = req.body || {};

  const allowed = ['confirmed', 'cancelled', 'done'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }

  try {
    const db = getDatabase();
    const result = await db.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING id',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الموعد غير موجود' });
    }

    res.json({ message: 'تم تحديث حالة الموعد بنجاح' });

  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {  // ✅ إضافة async
  const { id } = req.params;

  try {
    const db = getDatabase();
    const result = await db.query(
      'DELETE FROM appointments WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الموعد غير موجود' });
    }

    res.json({ message: 'تم حذف الموعد بنجاح' });

  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

module.exports = router;