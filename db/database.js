const { Pool } = require('pg');
require('dotenv').config();

let pool;

// دالة تهيئة قاعدة البيانات
async function initDatabase() {
    try {
        // إنشاء اتصال بقاعدة البيانات
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // مهم لـ Neon
            }
        });

        // اختبار الاتصال
        await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully');

        // إنشاء جدول المواعيد
        await pool.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
                patient_name VARCHAR(100) NOT NULL,
                patient_phone VARCHAR(20) NOT NULL,
                appt_date DATE NOT NULL,
                appt_time TIME NOT NULL,
                reminder_sent INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(appt_date, appt_time)
            )
        `);

        console.log('✅ Database tables created/verified');
        return pool;
    } catch (error) {
        console.error('❌ Database error:', error.message);
        throw error;
    }
}

// دالة للحصول على اتصال قاعدة البيانات
function getDatabase() {
    if (!pool) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return pool;
}

module.exports = {
    initDatabase,
    getDatabase
};