require('dotenv').config();
const invoicesRoutes = require("./routes/invoices");
const medicalRoutes = require("./routes/medicalRecords");
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require('./routes/auth');
const patientsRoutes = require('./routes/patients');
const appointmentsRoutes = require('./routes/appointments');

const { startReminderJob } = require('./services/reminder');

require('./database-postgres');

const app = express();

const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


// الواجهة
app.use(express.static(path.join(__dirname,'public')));
app.use("/api/medical-records", medicalRoutes);

// API

app.use('/api/auth', authRoutes);

app.use('/api/patients', patientsRoutes);

app.use('/api/appointments', appointmentsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use(errorHandler);

app.get('/api/health',(req,res)=>{
    res.json({
        status:"ok"
    });
});


app.listen(PORT,()=>{

console.log(
`🦷 موقع العيادة يعمل الآن:
http://localhost:${PORT}`
);


startReminderJob();

});