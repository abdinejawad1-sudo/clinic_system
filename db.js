require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
.then(() => {
    console.log("✅ PostgreSQL جاهز");
})
.catch(err => {
    console.log("❌ PostgreSQL Error:", err.message);
});

module.exports = pool;