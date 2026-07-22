const token = localStorage.getItem("clinic_doctor_token");

const medicalDiv = document.getElementById("medical-records");
const medicalForm = document.getElementById("medical-form");
const invoicesDiv = document.getElementById("invoices");
const invoiceForm = document.getElementById("invoice-form");

const params = new URLSearchParams(
    window.location.search
);

const id = params.get("id");

const info = document.getElementById("patient-info");
const appointments = document.getElementById("appointments");



// ================= السجل الطبي =================

async function loadMedicalRecords() {

    if(!medicalDiv) return;

    try {

        const res = await fetch(
            `/api/medical-records/${id}`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );


        const data = await res.json();


        if(data.length === 0){

            medicalDiv.innerHTML = "لا توجد سجلات طبية";

            return;
        }


        medicalDiv.innerHTML = data.map(r => `

        <div style="
            border:1px solid #ccc;
            padding:15px;
            margin-bottom:15px;
            border-radius:8px;
        ">

            <strong>التاريخ:</strong>
            ${new Date(r.created_at).toLocaleString()}

            <br><br>

            <strong>التشخيص:</strong>
            ${r.diagnosis || ""}

            <br>

            <strong>العلاج:</strong>
            ${r.treatment || ""}

            <br>

            <strong>الدواء:</strong>
            ${r.prescription || ""}

            <br>

            <strong>ملاحظات:</strong>
            ${r.notes || ""}

            <br><br>

            <button onclick="editRecord(${r.id})">
            ✏️ تعديل
            </button>

            <button onclick="deleteRecord(${r.id})">
            🗑️ حذف
            </button>

        </div>

        `).join("");


    }catch(err){

        medicalDiv.innerHTML="تعذر تحميل السجل الطبي";

        console.log(err);

    }

}



// إضافة سجل طبي

if(medicalForm){

medicalForm.addEventListener("submit", async(e)=>{

    e.preventDefault();


    await fetch("/api/medical-records",{

        method:"POST",

        headers:{
            "Content-Type":"application/json",
            Authorization:`Bearer ${token}`
        },

        body:JSON.stringify({

            patient_id:id,

            diagnosis:document.getElementById("diagnosis").value,

            treatment:document.getElementById("treatment").value,

            prescription:document.getElementById("prescription").value,

            notes:document.getElementById("notes").value

        })

    });


    medicalForm.reset();

    loadMedicalRecords();


});

}



// ================= بيانات المريض =================

async function loadPatient(){

    if(!info) return;


    try{

        const res = await fetch(
            `/api/patients/${id}`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );


        const data = await res.json();


        if(data.error){

            info.innerHTML=data.error;

            return;
        }



        info.innerHTML = `

        <h2>${data.patient.name}</h2>

        <p>
        📞 الهاتف:
        ${data.patient.phone || ""}
        </p>

        <p>
        📝 الملاحظات:
        ${data.patient.notes || "لا يوجد"}
        </p>

        `;



        appointments.innerHTML =
        data.appointments.map(a=>`

        <tr>

        <td>${a.appt_date}</td>

        <td>${a.appt_time}</td>

        <td>${a.service || ""}</td>

        <td>${a.status}</td>

        </tr>

        `).join("");



    }catch(err){

        info.innerHTML="تعذر تحميل بيانات المريض";

        console.log(err);

    }

}



// ================= الفواتير =================


async function loadInvoices(){

    if(!invoicesDiv) return;


    try{

        const res = await fetch(
            `/api/invoices/${id}`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );


        const data = await res.json();


        if(data.length===0){

            invoicesDiv.innerHTML="لا توجد فواتير";

            return;
        }


        invoicesDiv.innerHTML=data.map(inv=>`

        <div style="
            border:1px solid #ccc;
            padding:15px;
            margin-bottom:15px;
            border-radius:8px;
        ">

        <strong>الإجمالي:</strong>
        ${inv.total_amount}$

        <br>

        <strong>المدفوع:</strong>
        ${inv.paid_amount}$

        <br>

        <strong>المتبقي:</strong>
        ${(Number(inv.total_amount)-Number(inv.paid_amount)).toFixed(2)}$

        <br>

       <strong>الحالة:</strong>
${inv.status}

<br><br>

<button onclick="addPayment(${inv.id})">
💳 تسجيل دفعة
</button>

</div>

        `).join("");


    }catch(err){

        invoicesDiv.innerHTML="تعذر تحميل الفواتير";

        console.log(err);

    }

}



// إنشاء فاتورة

if(invoiceForm){

invoiceForm.addEventListener("submit",async(e)=>{

    e.preventDefault();


    await fetch("/api/invoices",{

        method:"POST",

        headers:{
            "Content-Type":"application/json",
            Authorization:`Bearer ${token}`
        },


        body:JSON.stringify({

            patient_id:id,

            total_amount:
            document.getElementById("total_amount").value

        })

    });


    invoiceForm.reset();

    loadInvoices();


});

}



// ================= تعديل وحذف السجل =================


async function deleteRecord(id){

    if(!confirm("هل تريد حذف السجل؟"))
        return;


    await fetch(
        `/api/medical-records/${id}`,
        {
            method:"DELETE",

            headers:{
                Authorization:`Bearer ${token}`
            }
        }
    );


    loadMedicalRecords();

}



async function editRecord(id){

    const diagnosis = prompt("التشخيص الجديد:");

    const treatment = prompt("العلاج الجديد:");

    const prescription = prompt("الدواء الجديد:");

    const notes = prompt("الملاحظات:");



    await fetch(
        `/api/medical-records/${id}`,
        {

            method:"PATCH",

            headers:{
                "Content-Type":"application/json",
                Authorization:`Bearer ${token}`
            },


            body:JSON.stringify({

                diagnosis,
                treatment,
                prescription,
                notes

            })

        }
    );


    loadMedicalRecords();

}
async function addPayment(id){

    const amount = prompt("أدخل قيمة الدفعة:");

    if(!amount){
        return;
    }


    const res = await fetch(
        `/api/invoices/${id}/payment`,
        {
            method:"PATCH",

            headers:{
                "Content-Type":"application/json",
                Authorization:`Bearer ${token}`
            },

            body:JSON.stringify({
                amount:Number(amount)
            })
        }
    );


    const data = await res.json();


    if(data.error){

        alert(data.error);

        return;
    }


    alert("تم تسجيل الدفعة بنجاح");

    loadInvoices();

}



// تشغيل

loadPatient();

loadMedicalRecords();

loadInvoices();