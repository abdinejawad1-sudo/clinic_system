require("dotenv").config();

const pool = require("./db");

async function createTable() {

    try {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS invoices (

                id SERIAL PRIMARY KEY,

                patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

                appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,

                total_amount NUMERIC(10,2) NOT NULL,

                paid_amount NUMERIC(10,2) DEFAULT 0,

                status VARCHAR(30) DEFAULT 'unpaid',

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

            );
        `);

        console.log("✅ تم إنشاء جدول invoices");

    } catch (err) {

        console.error(err);

    } finally {

        process.exit();

    }

}

createTable();