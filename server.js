require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const appointmentsRoutes = require('./routes/appointments');
const { startReminderJob } = require('./services/reminder');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// -------- ملفات الموقع الثابتة (الواجهة الأمامية) --------
app.use(express.static(path.join(__dirname, 'public')));

// -------- مسارات API --------
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);

// فحص صحة الخادم
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🦷 موقع العيادة يعمل الآن على: http://localhost:${PORT}`);
  startReminderJob();
});
