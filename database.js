const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "clinic.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err.message);
    } else {
        console.log("✅ تم الاتصال بقاعدة البيانات SQLite");
    }
});

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            age INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);


    db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            appt_date TEXT NOT NULL,
            appt_time TEXT NOT NULL,
            service TEXT,
            status TEXT DEFAULT 'confirmed',
            reminder_sent INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )
    `);

});

module.exports = db;