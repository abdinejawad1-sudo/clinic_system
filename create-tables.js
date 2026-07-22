require("dotenv").config();

const pool = require("./database-postgres");


async function createTables(){

    try {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                age INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);


        await pool.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id),
                appt_date TEXT NOT NULL,
                appt_time TEXT NOT NULL,
                service TEXT,
                status TEXT DEFAULT 'confirmed',
                reminder_sent INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);


        console.log("✅ تم إنشاء الجداول في PostgreSQL");

        process.exit();

    } catch(err){

        console.error("❌ خطأ إنشاء الجداول:", err.message);
        process.exit(1);

    }

}


createTables();