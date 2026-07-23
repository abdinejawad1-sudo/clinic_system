const token = localStorage.getItem("clinic_doctor_token");

const table = document.getElementById("patients-table");
const search = document.getElementById("search");


async function loadPatients(){

    const res = await fetch(
        `/api/patients?search=${search.value}`,
        {
            headers:{
                Authorization:`Bearer ${token}`
            }
        }
    );


    const data = await res.json();


    table.innerHTML = data.map(patient=>`

        <tr>

        <td>
            <a href="patient.html?id=${patient.id}">
                ${patient.name}
            </a>
        </td>

        <td>
            ${patient.phone || ""}
        </td>

        <td>
            ${patient.created_at || ""}
        </td>

        <td>
            <button 
                onclick="deletePatient(${patient.id})"
                style="
                background:#d32f2f;
                color:white;
                border:none;
                padding:6px 12px;
                border-radius:8px;
                cursor:pointer;">
                
                🗑️ حذف
                
            </button>
        </td>

        </tr>

    `).join("");

}


search.addEventListener(
"input",
loadPatients
);

async function deletePatient(id){

    if(!confirm("هل أنت متأكد من حذف هذا المريض؟")){
        return;
    }


    const res = await fetch(
        `/api/patients/${id}`,
        {
            method:"DELETE",
            headers:{
                Authorization:`Bearer ${token}`
            }
        }
    );


    const data = await res.json();


    if(res.ok){

        alert("✅ تم حذف المريض");

        loadPatients();

    }else{

        alert(data.error || "حدث خطأ أثناء الحذف");

    }

}
loadPatients();