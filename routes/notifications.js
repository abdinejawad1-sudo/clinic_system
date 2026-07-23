const express = require("express");
const router = express.Router();

const pool = require("../db");
const auth = require("../middleware/auth");


// إشعارات المواعيد القريبة للطبيب
router.get("/", auth, async (req, res) => {

    try {

        const result = await pool.query(`
        SELECT
    appointments.id,
    appointments.appt_date,
    appointments.appt_time,
    appointments.service,
    patients.name AS patient_name,
    patients.phone

        FROM appointments

        JOIN patients
        ON patients.id = appointments.patient_id

        WHERE appointments.status = 'confirmed'

        ORDER BY appointments.appt_date, appointments.appt_time

        `);


        const now = new Date();

        const notifications = result.rows.filter(appt => {
const appointmentTime = new Date(
    `${appt.appt_date}T${appt.appt_time}:00+03:00`
);


const diff =
(appointmentTime - now) / (1000 * 60);


            // المواعيد خلال الساعة القادمة
            return diff > 0 && diff <= 60;


        });


        res.json(notifications);


    } catch(err){

        res.status(500).json({
            error: err.message
        });

    }

});

// إرسال تذكير واتساب يدوي
router.post("/send/:appointmentId", auth, async (req,res)=>{

    try {

        const result = await pool.query(
            `
            SELECT
                appointments.appt_date,
                appointments.appt_time,
                patients.name AS patient_name,
                patients.phone

            FROM appointments

            JOIN patients
            ON patients.id = appointments.patient_id

            WHERE appointments.id = $1
            `,
            [
                req.params.appointmentId
            ]
        );


        if(result.rows.length === 0){

            return res.status(404).json({
                error:"الموعد غير موجود"
            });

        }


        const appointment = result.rows[0];


        const { sendWhatsAppReminder } =
        require("../services/whatsapp");


        await sendWhatsAppReminder(appointment);


        res.json({
            message:"تم إرسال تذكير واتساب بنجاح"
        });


    } catch(err){

        res.status(500).json({
            error:err.message
        });

    }

});
module.exports = router;