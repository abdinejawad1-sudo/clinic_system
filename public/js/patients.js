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

        <td>${patient.phone || ""}</td>

        <td>${patient.created_at || ""}</td>

        </tr>

    `).join("");

}


search.addEventListener(
"input",
loadPatients
);


loadPatients();