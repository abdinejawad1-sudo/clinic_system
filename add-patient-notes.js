require("dotenv").config();

const pool = require("./db");


async function addColumn(){

    try{

        await pool.query(`
            ALTER TABLE patients
            ADD COLUMN IF NOT EXISTS notes TEXT
        `);


        console.log("✅ تم إضافة notes");

    }catch(err){

        console.log("❌",err.message);

    }

    process.exit();

}


addColumn();