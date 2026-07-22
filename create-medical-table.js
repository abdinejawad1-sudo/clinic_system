require("dotenv").config();

const pool = require("./db");

async function createTable() {

    try {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS medical_records (

                id SERIAL PRIMARY KEY,

                patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

                diagnosis TEXT,

                treatment TEXT,

                prescription TEXT,

                notes TEXT,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

            );
        `);

        console.log("✅ تم إنشاء جدول medical_records");

    } catch (err) {

        console.error(err);

    } finally {

        process.exit();

    }

}

createTable();