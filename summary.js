import { getTimeEntries } from './supabaseClient.js';

const employeeId = localStorage.getItem('employeeId');
const employeeName = localStorage.getItem('employeeName');

if (!employeeId) {
  window.location.href = './index.html';
}

document.getElementById('employeeName').textContent = employeeName;

const monthSelect = document.getElementById('monthSelect');
const baseRate = document.getElementById('baseRate');
const logoutBtn = document.getElementById('logoutBtn');

const normalHoursEl = document.getElementById('normalHours');
const overtimeRegularEl = document.getElementById('overtimeRegular');
const overtimeSundayEl = document.getElementById('overtimeSunday');
const totalHoursEl = document.getElementById('totalHours');

const normalPayEl = document.getElementById('normalPay');
const overtimeRegularPayEl = document.getElementById('overtimeRegularPay');
const overtimeSundayPayEl = document.getElementById('overtimeSundayPay');
const totalPayEl = document.getElementById('totalPay');

const agendaGridEl = document.getElementById('agendaGrid');
const dailyDetailsEl = document.getElementById('dailyDetails');

let currentMonth, currentYear;
let entriesData = [];

const today = new Date();
monthSelect.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

const savedRate = localStorage.getItem('baseRate');
if (savedRate) {
  baseRate.value = savedRate;
}

function initializeMonth() {
  const [year, month] = monthSelect.value.split('-');
  currentYear = parseInt(year);
  currentMonth = parseInt(month);
  calculateSummary();
}

function getDayOfWeek(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.getDay();
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return `${parseInt(h)}:${m}`;
}

function calculateHours(entries) {
  let normalHours = 0;
  let overtimeRegular = 0;
  let overtimeSunday = 0;

  const details = [];

  entries.forEach(entry => {
    const dayOfWeek = getDayOfWeek(entry.date);
    const hours = parseFloat(entry.hours_worked);
    const startTime = entry.start_time || '06:00';
    const endTime = entry.end_time || '14:00';

    let normal = 0;
    let otRegular = 0;
    let otSunday = 0;
    let type = '';

    if (dayOfWeek === 0) {
      otSunday = hours;
      type = 'Dimanche (×2.0)';
    } else if (dayOfWeek === 6) {
      otRegular = hours;
      type = 'Samedi (×1.25)';
    } else {
      if (hours <= 8) {
        normal = hours;
        type = 'Jour normal';
      } else {
        normal = 8;
        otRegular = hours - 8;
        type = 'Jour normal + heures sup';
      }
    }

    normalHours += normal;
    overtimeRegular += otRegular;
    overtimeSunday += otSunday;

    details.push({
      date: entry.date,
      hours,
      startTime,
      endTime,
      normal,
      otRegular,
      otSunday,
      type,
      dayOfWeek
    });
  });

  return { normalHours, overtimeRegular, overtimeSunday, details };
}

async function calculateSummary() {
  try {
    const entries = await getTimeEntries(employeeId, currentMonth, currentYear);

    entriesData = entries;

    const { normalHours, overtimeRegular, overtimeSunday, details } = calculateHours(entries);

    const totalHours = normalHours + overtimeRegular + overtimeSunday;

    normalHoursEl.textContent = `${normalHours.toFixed(2)} h`;
    overtimeRegularEl.textContent = `${overtimeRegular.toFixed(2)} h`;
    overtimeSundayEl.textContent = `${overtimeSunday.toFixed(2)} h`;
    totalHoursEl.textContent = `${totalHours.toFixed(2)} h`;

    const rate = parseFloat(baseRate.value) || 0;

    const normalPay = normalHours * rate;
    const overtimeRegularPay = overtimeRegular * rate * 1.25;
    const overtimeSundayPay = overtimeSunday * rate * 2.0;
    const totalPay = normalPay + overtimeRegularPay + overtimeSundayPay;

    normalPayEl.textContent = `${normalPay.toFixed(2)} DT`;
    overtimeRegularPayEl.textContent = `${overtimeRegularPay.toFixed(2)} DT`;
    overtimeSundayPayEl.textContent = `${overtimeSundayPay.toFixed(2)} DT`;
    totalPayEl.textContent = `${totalPay.toFixed(2)} DT`;

    renderAgendaGrid(entries, details);
    renderDailyDetails(details);

  } catch (error) {
    console.error('Erreur lors du calcul:', error);
  }
}

function renderAgendaGrid(entries, details) {
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();

  agendaGridEl.innerHTML = '';

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  weekDays.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'agenda-day-header';
    dayHeader.textContent = day;
    agendaGridEl.appendChild(dayHeader);
  });

  const adjustedFirstDay = firstDay === 0 ? 0 : firstDay;

  for (let i = 0; i < adjustedFirstDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'agenda-day empty';
    agendaGridEl.appendChild(emptyDay);
  }

  const entriesMap = {};
  entries.forEach(entry => {
    entriesMap[entry.date] = entry;
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(currentYear, currentMonth - 1, day);
    const dayOfWeek = date.getDay();

    const dayCard = document.createElement('div');
    dayCard.className = 'agenda-day';

    if (dayOfWeek === 0) {
      dayCard.classList.add('sunday');
    } else if (dayOfWeek === 6) {
      dayCard.classList.add('saturday');
    }

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dateStr === todayStr) {
      dayCard.classList.add('today');
    }

    const dayNum = document.createElement('div');
    dayNum.className = 'agenda-day-num';
    dayNum.textContent = day;
    dayCard.appendChild(dayNum);

    if (entriesMap[dateStr]) {
      const entry = entriesMap[dateStr];
      const timeSlot = document.createElement('div');
      timeSlot.className = 'agenda-time-slot';
      timeSlot.textContent = `${formatTime(entry.start_time)} ⇒ ${formatTime(entry.end_time)}`;
      dayCard.appendChild(timeSlot);

      const hoursInfo = document.createElement('div');
      hoursInfo.className = 'agenda-hours';
      hoursInfo.textContent = `${entry.hours_worked}h`;
      dayCard.appendChild(hoursInfo);

      dayCard.classList.add('has-work');
    }

    agendaGridEl.appendChild(dayCard);
  }
}

function renderDailyDetails(details) {
  if (details.length === 0) {
    dailyDetailsEl.innerHTML = '<p class="no-data">Aucune donnée pour ce mois</p>';
    return;
  }

  details.sort((a, b) => new Date(a.date) - new Date(b.date));

  dailyDetailsEl.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'details-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Date</th>
      <th>Horaires</th>
      <th>Total heures</th>
      <th>Heures normales</th>
      <th>Heures sup (×1.25)</th>
      <th>Heures dim (×2.0)</th>
      <th>Type</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  details.forEach(detail => {
    const dateObj = new Date(detail.date + 'T00:00:00');
    const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${dateFormatted}</td>
      <td>${formatTime(detail.startTime)} ⇒ ${formatTime(detail.endTime)}</td>
      <td>${detail.hours.toFixed(2)}h</td>
      <td>${detail.normal.toFixed(2)}h</td>
      <td>${detail.otRegular.toFixed(2)}h</td>
      <td>${detail.otSunday.toFixed(2)}h</td>
      <td>${detail.type}</td>
    `;

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  dailyDetailsEl.appendChild(table);
}

monthSelect.addEventListener('change', initializeMonth);

baseRate.addEventListener('change', () => {
  localStorage.setItem('baseRate', baseRate.value);
  calculateSummary();
});

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = './index.html';
});

initializeMonth();
