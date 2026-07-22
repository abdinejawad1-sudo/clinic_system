const express = require("express");
const router = express.Router();

const pool = require("../db");
const auth = require("../middleware/auth");


// إضافة سجل طبي
router.post("/", auth, async (req, res) => {

    const {
        patient_id,
        diagnosis,
        treatment,
        prescription,
        notes
    } = req.body;

    try {

        const result = await pool.query(
            `
            INSERT INTO medical_records
            (
                patient_id,
                diagnosis,
                treatment,
                prescription,
                notes
            )
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *
            `,
            [
                patient_id,
                diagnosis,
                treatment,
                prescription,
                notes
            ]
        );

        res.json(result.rows[0]);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


// عرض جميع السجلات لمريض
router.get("/:patientId", auth, async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM medical_records

            WHERE patient_id = $1

            ORDER BY created_at DESC
            `,
            [
                req.params.patientId
            ]
        );

        res.json(result.rows);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});
 // تعديل سجل طبي
router.patch("/:id", auth, async (req,res)=>{

    const {
        diagnosis,
        treatment,
        prescription,
        notes
    } = req.body;


    try{

        const result = await pool.query(
            `
            UPDATE medical_records

            SET
            diagnosis=$1,
            treatment=$2,
            prescription=$3,
            notes=$4

            WHERE id=$5

            RETURNING *
            `,
            [
                diagnosis,
                treatment,
                prescription,
                notes,
                req.params.id
            ]
        );


        res.json(result.rows[0]);


    }catch(err){

        res.status(500).json({
            error:err.message
        });

    }

});




// حذف سجل طبي

router.delete("/:id", auth, async(req,res)=>{

    try{

        await pool.query(
            `
            DELETE FROM medical_records
            WHERE id=$1
            `,
            [
                req.params.id
            ]
        );


        res.json({
            message:"تم حذف السجل الطبي"
        });


    }catch(err){

        res.status(500).json({
            error:err.message
        });

    }

});

module.exports = router;