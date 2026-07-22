require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});


async function test(){

    try {

        const patients = await pool.query(
            "SELECT * FROM patients"
        );

        const appointments = await pool.query(
            "SELECT * FROM appointments"
        );


        console.log("Patients:");
        console.log(patients.rows);

        console.log("Appointments:");
        console.log(appointments.rows);


    } catch(err){
        console.log(err.message);
    }

    process.exit();

}


test();