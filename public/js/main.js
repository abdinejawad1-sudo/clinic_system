const API_BASE = '/api';

const dateInput = document.getElementById('date');
const timeSelect = document.getElementById('time');
const form = document.getElementById('booking-form');
const formMessage = document.getElementById('form-message');

// أوقات العمل الافتراضية للواجهة (يجب أن تطابق CLINIC_OPEN_HOUR/CLOSE_HOUR في السيرفر)
const OPEN_HOUR = 9;
const CLOSE_HOUR = 21;
const SLOT_MINUTES = 30;

// لا تسمح باختيار تاريخ في الماضي
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

function buildAllSlots() {
  const slots = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
}

async function loadAvailableTimes(date) {
  timeSelect.innerHTML = '<option value="">جارِ التحميل...</option>';
  timeSelect.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/appointments/available?date=${date}`);
    const data = await res.json();
    const booked = new Set(data.bookedTimes || []);

    const allSlots = buildAllSlots();
    const isToday = date === today;
    const now = new Date();

    timeSelect.innerHTML = '';
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'اختر الوقت';
    timeSelect.appendChild(emptyOption);

    allSlots.forEach(slot => {
      // إخفاء الأوقات الماضية إذا كان التاريخ المختار هو اليوم
      if (isToday) {
        const [h, m] = slot.split(':').map(Number);
        const slotDate = new Date();
        slotDate.setHours(h, m, 0, 0);
        if (slotDate <= now) return;
      }

      const option = document.createElement('option');
      option.value = slot;
      if (booked.has(slot)) {
        option.textContent = `${slot} (محجوز)`;
        option.disabled = true;
      } else {
        option.textContent = slot;
      }
      timeSelect.appendChild(option);
    });

    timeSelect.disabled = false;
  } catch (err) {
    timeSelect.innerHTML = '<option value="">تعذّر تحميل الأوقات</option>';
  }
}

dateInput.addEventListener('change', () => {
  if (dateInput.value) loadAvailableTimes(dateInput.value);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage.textContent = '';
  formMessage.className = 'form-message';

  const payload = {
    patientName: document.getElementById('patientName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    date: dateInput.value,
    time: timeSelect.value,
    service: document.getElementById('service').value,
    notes: document.getElementById('notes').value.trim()
  };

  if (!payload.patientName || !payload.phone || !payload.date || !payload.time) {
    formMessage.textContent = 'الرجاء تعبئة جميع الحقول المطلوبة';
    formMessage.classList.add('error');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'جارِ التأكيد...';

  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      formMessage.textContent = data.error || 'حدث خطأ، الرجاء المحاولة مجدداً';
      formMessage.classList.add('error');
      // أعد تحميل الأوقات في حال كان الموعد قد حُجز للتو
      if (res.status === 409) loadAvailableTimes(payload.date);
    } else {
      formMessage.textContent = data.message;
      formMessage.classList.add('success');
      form.reset();
      timeSelect.innerHTML = '<option value="">اختر التاريخ أولاً</option>';
    }
  } catch (err) {
    formMessage.textContent = 'تعذّر الاتصال بالخادم، الرجاء المحاولة لاحقاً';
    formMessage.classList.add('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'تأكيد الحجز';
  }
});
