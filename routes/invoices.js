const express = require("express");
const router = express.Router();

const pool = require("../db");
const auth = require("../middleware/auth");


// إنشاء فاتورة
router.post("/", auth, async (req, res) => {

    const {
        patient_id,
        appointment_id,
        total_amount
    } = req.body;

    try {

        const result = await pool.query(
            `
            INSERT INTO invoices
            (
                patient_id,
                appointment_id,
                total_amount
            )
            VALUES ($1,$2,$3)
            RETURNING *
            `,
            [
                patient_id,
                appointment_id || null,
                total_amount
            ]
        );

        res.json(result.rows[0]);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


// عرض فواتير مريض
router.get("/:patientId", auth, async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM invoices
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
// تسجيل دفعة على الفاتورة

router.patch("/:id/payment", auth, async (req,res)=>{

    const {
        amount
    } = req.body;


    try {


        const invoice = await pool.query(
            `
            SELECT *
            FROM invoices
            WHERE id=$1
            `,
            [
                req.params.id
            ]
        );


        if(invoice.rows.length === 0){

            return res.status(404).json({
                error:"الفاتورة غير موجودة"
            });

        }


        const current = invoice.rows[0];


        const newPaid =
        Number(current.paid_amount) + Number(amount);



        let status = "partial";


        if(newPaid >= Number(current.total_amount)){

            status = "paid";

        }



        const result = await pool.query(
            `
            UPDATE invoices

            SET
            paid_amount=$1,
            status=$2

            WHERE id=$3

            RETURNING *

            `,
            [
                newPaid,
                status,
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

module.exports = router;