const express = require("express");
const router = express.Router();

const pool = require("../db");
const auth = require("../middleware/auth");


// عرض المرضى
router.get("/", auth, async(req,res)=>{

    try{

        const search = req.query.search || "";

        const result = await pool.query(
            `
            SELECT *
            FROM patients

            WHERE name ILIKE $1
            OR phone ILIKE $1

            ORDER BY created_at DESC
            `,
            [
                `%${search}%`
            ]
        );


        res.json(result.rows);


    }catch(err){

        res.status(500).json({
            error:err.message
        });

    }

});


router.get("/:id", auth, async(req,res)=>{

    try{


        const patient = await pool.query(
            `
            SELECT *
            FROM patients
            WHERE id=$1
            `,
            [
                req.params.id
            ]
        );


        const appointments = await pool.query(
            `
            SELECT *
            FROM appointments

            WHERE patient_id=$1

            ORDER BY appt_date DESC, appt_time DESC
            `,
            [
                req.params.id
            ]
        );


        res.json({

            patient: patient.rows[0],

            appointments: appointments.rows

        });


    }catch(err){

        res.status(500).json({
            error:err.message
        });

    }

});

module.exports = router;