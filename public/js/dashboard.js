const API_BASE = '/api';
const TOKEN_KEY = 'clinic_doctor_token';

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
      <td>${escapeHtml(appt.patient_name)}</td>
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

// -------- التحقق من الجلسة عند فتح الصفحة --------
if (getToken()) {
  showDashboard();
} else {
  showLogin();
}
