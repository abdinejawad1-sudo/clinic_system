const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized:false
    }
});


pool.connect()
.then(client=>{
    console.log("✅ PostgreSQL Neon متصل");
    client.release();
})
.catch(err=>{
    console.log("❌ خطأ:",err.message);
});


module.exports = pool;