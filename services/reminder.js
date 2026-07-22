const cron = require('node-cron');
const pool = require('../db');
const { sendWhatsAppReminder } = require('./whatsapp');


function startReminderJob() {

    const cronExpr = process.env.REMINDER_CHECK_CRON || '*/15 * * * *';
    const hoursBefore = Number(process.env.REMINDER_HOURS_BEFORE || 24);


    console.log(
        `⏰ مهمة التذكير تعمل: ${cronExpr} قبل الموعد بـ ${hoursBefore} ساعة`
    );


    cron.schedule(cronExpr, async()=>{

        try{

            await checkAndSendReminders(hoursBefore);

        }catch(err){

            console.error(
                "❌ خطأ في التذكير:",
                err.message
            );

        }

    });

}



async function checkAndSendReminders(hoursBefore){


    const result = await pool.query(

    `
    SELECT
    appointments.*,
    patients.name AS patient_name,
    patients.phone

    FROM appointments

    JOIN patients
    ON patients.id = appointments.patient_id

    WHERE appointments.status='confirmed'
    AND appointments.reminder_sent=0
    `

);


if(result.rows.length === 0){
    console.log("ℹ️ لا توجد تذكيرات حالياً");
    return;
}


    const now = new Date();

    const limit = new Date(
        now.getTime() + hoursBefore * 60 * 60 * 1000
    );


    for(const appt of result.rows){


        const appointmentDate = new Date(
            `${appt.appt_date}T${appt.appt_time}:00`
        );


        if(
            appointmentDate >= now &&
            appointmentDate <= limit
        ){

            await sendWhatsAppReminder(appt);
console.log(
    "📅 موعد يحتاج تذكير:",
    appt.patient_name,
    appt.appt_date,
    appt.appt_time
);

 
            
         

            console.log(
                `✅ تم إرسال تذكير لـ ${appt.patient_name}`
            );

        }

    }

}



module.exports={
    startReminderJob,
    checkAndSendReminders
};