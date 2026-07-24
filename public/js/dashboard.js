const newDate = document.getElementById("new-date");
const newTime = document.getElementById("new-time");


document
    .getElementById("new-date")
    .addEventListener("change", loadAvailableTimesForDoctor);
const filterSearch = document.getElementById('filter-search');
const API_BASE = '/api';
const TOKEN_KEY = 'clinic_doctor_token';
let lastAppointmentsCount = 0;
let firstLoad = true;
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const logoutBtn = document.getElementById('logout-btn');

const filterDate = document.getElementById('filter-date');
const filterStatus = document.getElementById('filter-status');
const refreshBtn = document.getElementById('refresh-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const tbody = document.getElementById('appt-tbody');
const statsBox = document.getElementById('dash-stats');

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function showDashboard() {
  loginScreen.classList.add('hidden');
  dashboardScreen.classList.remove('hidden');
  loadAppointments();
}
function showLogin() {
  dashboardScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
}

// -------- تسجيل الدخول --------
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMessage.textContent = '';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      loginMessage.textContent = data.error || 'فشل تسجيل الدخول';
      return;
    }
if(
    data.length > 0 &&
    data.length !== lastNotificationCount
){

    playNotificationSound();

    lastNotificationCount = data.length;

}

    setToken(data.token);
    loginForm.reset();
    showDashboard();
  } catch (err) {
    loginMessage.textContent = 'تعذّر الاتصال بالخادم';
  }
});

logoutBtn.addEventListener('click', () => {
  clearToken();
  showLogin();
});

// -------- جلب المواعيد --------
async function loadAppointments() {
  const token = getToken();
  if (!token) return showLogin();

  const params = new URLSearchParams();
   if (filterSearch.value) {
  params.set('search', filterSearch.value);
    }
  if (filterDate.value) params.set('date', filterDate.value);
  if (filterStatus.value) params.set('status', filterStatus.value);

  tbody.innerHTML = '<tr><td colspan="8" class="empty-row">جارِ التحميل...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/appointments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      clearToken();
      return showLogin();
    }

    const data = await res.json();
const appointments = data.appointments || [];

if(!firstLoad && appointments.length > lastAppointmentsCount){

    playNotificationSound();

    showNewAppointmentAlert();

}

lastAppointmentsCount = appointments.length;
firstLoad = false;
const count =
document.getElementById("notification-count");


if(count){

  
  if(data.appointments.length > 0){
        count.innerHTML = `(${data.length})`;

    }else{

        count.innerHTML = "";

    }

}
    renderStats(data.appointments || []);
    renderTable(data.appointments || []);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">تعذّر تحميل المواعيد</td></tr>';
  }
}

function renderStats(appointments) {
  const total = appointments.length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const done = appointments.filter(a => a.status === 'done').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;

  statsBox.innerHTML = `
    <div class="stat-card"><strong>${total}</strong><span>إجمالي المواعيد</span></div>
    <div class="stat-card"><strong>${confirmed}</strong><span>مؤكدة</span></div>
    <div class="stat-card"><strong>${done}</strong><span>تم الكشف</span></div>
    <div class="stat-card"><strong>${cancelled}</strong><span>ملغاة</span></div>
  `;
}

const STATUS_LABELS = { confirmed: 'مؤكد', done: 'تم الكشف', cancelled: 'ملغى' };
const STATUS_CLASSES = { confirmed: 'badge-confirmed', done: 'badge-done', cancelled: 'badge-cancelled' };

function renderTable(appointments) {
  if (!appointments.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">لا توجد مواعيد مطابقة</td></tr>';
    return;
  }

  tbody.innerHTML = appointments.map(appt => `
    <tr data-id="${appt.id}">
      <td>
<a href="patient.html?id=${appt.patient_id}">
${escapeHtml(appt.patient_name)}
</a>
</td>
      <td>${escapeHtml(appt.phone)}</td>
      <td>${appt.appt_date}</td>
      <td>${appt.appt_time}</td>
      <td>${escapeHtml(appt.service)}</td>
      <td><span class="badge ${STATUS_CLASSES[appt.status] || ''}">${STATUS_LABELS[appt.status] || appt.status}</span></td>
      <td>${appt.reminder_sent ? '✅ أُرسل' : '⏳ لم يُرسل بعد'}</td>
      <td>
        <div class="row-actions">
          ${appt.status !== 'done' ? `<button data-action="done">تم الكشف</button>` : ''}
          ${appt.status !== 'cancelled' ? `<button data-action="cancelled">إلغاء</button>` : ''}
          <button data-action="delete" class="danger">حذف</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// -------- تفويض الأحداث لأزرار الإجراءات داخل الجدول --------
tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const row = btn.closest('tr');
  const id = row.dataset.id;
  const action = btn.dataset.action;
  const token = getToken();

  try {
    if (action === 'delete') {
      if (!confirm('هل أنت متأكد من حذف هذا الموعد نهائياً؟')) return;
      await fetch(`${API_BASE}/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } else {
      await fetch(`${API_BASE}/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: action })
      });
    }
    loadAppointments();
  } catch (err) {
    alert('تعذّر تنفيذ الإجراء، الرجاء المحاولة مجدداً');
  }
});

refreshBtn.addEventListener('click', loadAppointments);
clearFiltersBtn.addEventListener('click', () => {
  filterDate.value = '';
  filterStatus.value = '';
  loadAppointments();
});
filterDate.addEventListener('change', loadAppointments);
filterStatus.addEventListener('change', loadAppointments);
filterSearch.addEventListener('input', loadAppointments);
// -------- التحقق من الجلسة عند فتح الصفحة --------
if (getToken()) {
  showDashboard();
} else {
  showLogin();
}
const patientsBtn = document.getElementById("patients-btn");

if (patientsBtn) {
    patientsBtn.addEventListener("click", () => {
        window.location.href = "/patients.html";
    });
}
async function loadNotifications(){

    const token = localStorage.getItem("clinic_doctor_token");

const list = document.getElementById("notifications-list");
list.innerHTML = "جارٍ التحميل...";
    const res = await fetch(
        "/api/notifications",
        {
            headers:{
                Authorization:`Bearer ${token}`
            }
        }
    );


    const data = await res.json();

     console.log(data);

  

    if(data.length === 0){

        list.innerHTML =
        "لا توجد مواعيد قريبة";

        return;
    }

window.notifications = data;
  list.innerHTML = data.map(n=>`

<div style="
    padding:10px;
    border-bottom:1px solid #ddd;
">

🔔 موعد قريب

<br>

👤 ${n.patient_name}

<br>

📅 ${n.appt_date}

<br>

⏰ ${n.appt_time}

<br><br>

<button onclick="sendReminder(${n.id})">
📱 إرسال تذكير واتساب
</button>

</div>

`).join("");

}


// فتح وإغلاق القائمة
document.getElementById("notification-btn").addEventListener("click", async () => {

    const box = document.getElementById("notifications-list");

    if (box.style.display === "block") {
        box.style.display = "none";
        return;
    }

    box.innerHTML = "جارٍ تحميل الإشعارات...";

    box.style.display = "block";

    await loadNotifications();

});


// تحديث كل دقيقة

loadNotifications();

setInterval(
    loadNotifications,
    60000
);
function sendReminder(id){

    const appointment = 
    window.notifications.find(n => n.id == id);


    if(!appointment){
        alert("الموعد غير موجود");
        return;
    }

let phone = appointment.phone.toString().replace(/\D/g, "");

if (phone.startsWith("0")) {
    phone = "961" + phone.substring(1);
}


    let message = 
`مرحباً ${appointment.patient_name} 👋
هذا تذكير بموعدك في عيادة الأسنان 🦷

📅 التاريخ: ${appointment.appt_date}
⏰ الوقت: ${appointment.appt_time}

شكراً لزيارتكم.`;


   const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`; window.open(url, "_blank");

    window.open(url,"_blank");


}
function playNotificationSound(){

    const AudioContext =
    window.AudioContext || window.webkitAudioContext;


    const context = new AudioContext();


    const oscillator = context.createOscillator();

    const gain = context.createGain();


    oscillator.type = "sine";

    oscillator.frequency.value = 900;


    gain.gain.value = 0.3;


    oscillator.connect(gain);

    gain.connect(context.destination);


    oscillator.start();


    setTimeout(()=>{

        oscillator.stop();

    },700);

}
// تحميل أول مرة
loadAppointments();

// تحديث تلقائي كل 10 ثوانٍ
setInterval(() => {
    loadAppointments();
    loadNotifications();
}, 60000);
function showNewAppointmentAlert(){

    const alertBox = document.createElement("div");

    alertBox.innerHTML = `
    🔔 تم حجز موعد جديد
    `;


    alertBox.style.position="fixed";
    alertBox.style.top="20px";
    alertBox.style.right="20px";
    alertBox.style.background="#1976d2";
    alertBox.style.color="white";
    alertBox.style.padding="15px 25px";
    alertBox.style.borderRadius="15px";
    alertBox.style.zIndex="9999";
    alertBox.style.fontSize="18px";


    alertBox.classList.add("new-alert");


    document.body.appendChild(alertBox);


    setTimeout(()=>{

        alertBox.remove();

    },5000);

}

// ================= حفظ الحجز الجديد =================

const saveAppointmentBtn = document.getElementById("save-appointment");


if(saveAppointmentBtn){

saveAppointmentBtn.addEventListener("click", async ()=>{


    const patientName =
    document.getElementById("new-name").value.trim();


    const phone =
    document.getElementById("new-phone").value.trim();


    const date =
    document.getElementById("new-date").value;


    const time =
    document.getElementById("new-time").value;


    const service =
    document.getElementById("new-service").value;



    if(!patientName || !phone || !date || !time){

        alert("يرجى تعبئة جميع البيانات");
        return;

    }


    try{


        const token = localStorage.getItem("clinic_doctor_token");


        const res = await fetch("/api/appointments",{

            method:"POST",

            headers:{
                "Content-Type":"application/json",
                Authorization:`Bearer ${token}`
            },


            body:JSON.stringify({

                patientName,
                phone,
                date,
                time,
                service

            })

        });



        const data = await res.json();



        if(!res.ok){

            alert(data.error || "حدث خطأ");

            return;

        }



        alert("✅ تم إضافة الحجز بنجاح");



        document.getElementById("appointment-modal")
        .classList.add("hidden");



        document.getElementById("new-name").value="";
        document.getElementById("new-phone").value="";
        document.getElementById("new-date").value="";
        document.getElementById("new-time").value="";
        document.getElementById("new-service").value="";


        loadAppointments();



    }catch(err){

        console.log(err);

        alert("خطأ في الاتصال بالسيرفر");

    }


});


}
// ================= فتح نافذة حجز جديد =================

const appointmentModal = document.getElementById("appointment-modal");
const newAppointmentBtn = document.getElementById("new-appointment-btn");
const closeModalBtn = document.getElementById("close-modal");


if (newAppointmentBtn && appointmentModal) {

    newAppointmentBtn.addEventListener("click", function(){

        appointmentModal.classList.remove("hidden");

    });

}


if (closeModalBtn && appointmentModal) {

    closeModalBtn.addEventListener("click", function(){

        appointmentModal.classList.add("hidden");

    });

}


if (appointmentModal) {

    appointmentModal.addEventListener("click", function(e){

        if(e.target === appointmentModal){

            appointmentModal.classList.add("hidden");

        }

    });

}
async function loadAvailableTimesForDoctor() {

    const date = document.getElementById("new-date").value;
    if (!date) return;

    const res = await fetch(`/api/appointments/available-times?date=${date}`);
    const times = await res.json();

    const select = document.getElementById("new-time");
    select.innerHTML = "";

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    times.forEach(time => {

        if (date === today) {

            const [hour, minute] = time.split(":");

            const appointmentTime = new Date();
            appointmentTime.setHours(hour, minute, 0, 0);

            if (appointmentTime <= now) {
                return;
            }
        }

        select.innerHTML += `
            <option value="${time}">
                ${time}
            </option>
        `;
    });

    if (select.options.length === 0) {
        select.innerHTML = `<option value="">لا توجد أوقات متاحة</option>`;
    }
}
