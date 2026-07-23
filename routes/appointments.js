const express = require("express");
const router = express.Router();

const pool = require("../db");
const auth = require("../middleware/auth");


// ================= إضافة موعد =================

router.post("/", async (req,res)=>{

    const {
        patientName,
        phone,
        date,
        time,
        service
    } = req.body;


    if(!patientName || !phone || !date || !time){
        return res.status(400).json({
            error:"البيانات ناقصة"
        });
    }


    try {

        const patient = await pool.query(
            `
            INSERT INTO patients(name, phone)
            VALUES($1,$2)
            RETURNING id
            `,
            [
                patientName,
                phone
            ]
        );


        const patientId = patient.rows[0].id;


        const appointment = await pool.query(
            `
            INSERT INTO appointments
            (patient_id, appt_date, appt_time, service)
            VALUES($1,$2,$3,$4)
            RETURNING id
            `,
            [
                patientId,
                date,
                time,
                service
            ]
        );


        res.json({
            message:"تم حجز الموعد بنجاح",
            id: appointment.rows[0].id
        });


    }catch(err){

        res.status(500).json({
            error:err.message
        });

    }

});



// ================= عرض المواعيد =================

// ================= عرض المواعيد =================

router.get("/", auth, async (req, res) => {

    try {

        const search = req.query.search || "";
        const date = req.query.date || "";
        const status = req.query.status || "";

        let sql = `
            SELECT
                appointments.*,
                patients.name AS patient_name,
                patients.phone
            FROM appointments
            JOIN patients
                ON patients.id = appointments.patient_id
            WHERE
                (
                    patients.name ILIKE $1
                    OR patients.phone ILIKE $1
                )
              
        `;

        const values = [`%${search}%`];

        if (date) {
            values.push(date);
            sql += ` AND appointments.appt_date = $${values.length}`;
        }

        if (status) {

    values.push(status);
    sql += ` AND appointments.status = $${values.length}`;

} else {

    sql += ` AND appointments.status <> 'done'`;

}

        sql += `
            ORDER BY appointments.appt_date,
                     appointments.appt_time
        `;

        const result = await pool.query(sql, values);

        res.json({
            appointments: result.rows
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});



// ================= الأوقات المتاحة =================

router.get("/available", async(req,res)=>{

    const date = req.query.date;


    if(!date){
        return res.status(400).json({
            error:"التاريخ مطلوب"
        });
    }


    try{

        const result = await pool.query(
            `
            SELECT appt_time
            FROM appointments
            WHERE appt_date=$1
            `,
            [
                date
            ]
        );


        res.json({
            bookedTimes:
            result.rows.map(row => row.appt_time)
        });


    }catch(err){

        res.status(500).json({
            error:err.message
        });

    }

});



// ================= تحديث الحالة =================

router.patch("/:id", auth, async(req,res)=>{

    const {status} = req.body;


    try{

        await pool.query(
            `
            UPDATE appointments
            SET status=$1
            WHERE id=$2
            `,
            [
                status,
                req.params.id
            ]
        );


        res.json({
            message:"تم تحديث الحالة"
        });


    }catch(err){

        res.status(500).json({
            error:err.message
        });

    }

});



// ================= حذف موعد =================

router.delete("/:id", auth, async(req,res)=>{

    try{

        await pool.query(
            `
            DELETE FROM appointments
            WHERE id=$1
            `,
            [
                req.params.id
            ]
        );


        res.json({
            message:"تم حذف الموعد"
        });


    }catch(err){

        res.status(500).json({
            error:err.message
        });

    }

});


module.exports = router;