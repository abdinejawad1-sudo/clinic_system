const pool = require("./db");

async function check(){

    const result = await pool.query(`
        SELECT *
        FROM appointments
        ORDER BY id DESC
        LIMIT 10
    `);

    console.log(result.rows);

    process.exit();

}

check();