import { getTimeEntries, saveTimeEntry, deleteTimeEntry, calculateHours } from './supabaseClient.js';

const employeeId = localStorage.getItem('employeeId');
const employeeName = localStorage.getItem('employeeName');

if (!employeeId) {
  window.location.href = './index.html';
}

document.getElementById('employeeName').textContent = employeeName;

const monthSelect = document.getElementById('monthSelect');
const calendarGrid = document.getElementById('calendarGrid');
const message = document.getElementById('message');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const modalDate = document.getElementById('modalDate');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const hoursPreview = document.getElementById('hoursPreview');
const deleteBtn = document.getElementById('deleteBtn');
const cancelBtn = document.getElementById('cancelBtn');
const closeBtn = document.querySelector('.close');
const logoutBtn = document.getElementById('logoutBtn');
const shiftMorningBtn = document.getElementById('shiftMorning');
const shiftAfternoonBtn = document.getElementById('shiftAfternoon');
const presetBtns = document.querySelectorAll('.preset-btn');

let currentMonth, currentYear;
let timeEntriesMap = {};
let selectedDate = null;
let currentEntry = null;

const today = new Date();
monthSelect.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

function initializeMonth() {
  const [year, month] = monthSelect.value.split('-');
  currentYear = parseInt(year);
  currentMonth = parseInt(month);
  loadTimeEntries();
}

async function loadTimeEntries() {
  try {
    const entries = await getTimeEntries(employeeId, currentMonth, currentYear);
    timeEntriesMap = {};
    entries.forEach(entry => {
      timeEntriesMap[entry.date] = {
        hours: entry.hours_worked,
        startTime: entry.start_time,
        endTime: entry.end_time,
        shiftType: entry.shift_type
      };
    });
    renderCalendar();
  } catch (error) {
    message.textContent = 'Erreur lors du chargement des données: ' + error.message;
    message.className = 'error-message';
  }
}

function renderCalendar() {
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();

  calendarGrid.innerHTML = '';

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  weekDays.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    calendarGrid.appendChild(dayHeader);
  });

  const adjustedFirstDay = firstDay === 0 ? 0 : firstDay;

  for (let i = 0; i < adjustedFirstDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyDay);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth - 1, day);
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = date.getDay();

    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    if (dayOfWeek === 0) {
      dayElement.classList.add('sunday');
    } else if (dayOfWeek === 6) {
      dayElement.classList.add('saturday');
    }

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dateStr === todayStr) {
      dayElement.classList.add('today');
    }

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;

    const hoursDisplay = document.createElement('div');
    hoursDisplay.className = 'hours-display';

    if (timeEntriesMap[dateStr]) {
      const entry = timeEntriesMap[dateStr];
      hoursDisplay.textContent = `${entry.hours}h`;
      dayElement.classList.add('has-hours');
    } else {
      hoursDisplay.textContent = '-';
    }

    dayElement.appendChild(dayNumber);
    dayElement.appendChild(hoursDisplay);

    dayElement.addEventListener('click', () => openEditModal(dateStr));

    calendarGrid.appendChild(dayElement);
  }
}

function updateHoursPreview() {
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;

  if (startTime && endTime) {
    const hours = calculateHours(startTime, endTime);
    hoursPreview.textContent = `${hours.toFixed(2)} h`;
  }
}

function openEditModal(date) {
  selectedDate = date;
  currentEntry = timeEntriesMap[date];

  const dateObj = new Date(date + 'T00:00:00');
  modalDate.textContent = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (currentEntry) {
    startTimeInput.value = currentEntry.startTime;
    endTimeInput.value = currentEntry.endTime;
    updateHoursPreview();
  } else {
    startTimeInput.value = '06:00';
    endTimeInput.value = '14:00';
    updateHoursPreview();
  }

  editModal.style.display = 'block';
}

function closeEditModal() {
  editModal.style.display = 'none';
  selectedDate = null;
  currentEntry = null;
}

presetBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const time = btn.dataset.time;
    const parentWrapper = btn.closest('.time-input-wrapper');
    const input = parentWrapper.querySelector('input[type="time"]');
    input.value = time;
    updateHoursPreview();
  });
});

shiftMorningBtn.addEventListener('click', (e) => {
  e.preventDefault();
  startTimeInput.value = '06:00';
  endTimeInput.value = '14:00';
  updateHoursPreview();
});

shiftAfternoonBtn.addEventListener('click', (e) => {
  e.preventDefault();
  startTimeInput.value = '14:00';
  endTimeInput.value = '22:00';
  updateHoursPreview();
});

startTimeInput.addEventListener('change', updateHoursPreview);
endTimeInput.addEventListener('change', updateHoursPreview);

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;

  if (!startTime || !endTime) {
    alert('Veuillez remplir les heures de début et fin');
    return;
  }

  try {
    await saveTimeEntry(employeeId, selectedDate, startTime, endTime);
    message.textContent = 'Heures enregistrées avec succès';
    message.className = 'success-message';
    closeEditModal();
    await loadTimeEntries();
  } catch (error) {
    message.textContent = 'Erreur lors de l\'enregistrement: ' + error.message;
    message.className = 'error-message';
  }
});

deleteBtn.addEventListener('click', async () => {
  if (!confirm('Voulez-vous vraiment supprimer cette entrée ?')) {
    return;
  }

  try {
    await deleteTimeEntry(employeeId, selectedDate);
    message.textContent = 'Entrée supprimée avec succès';
    message.className = 'success-message';
    closeEditModal();
    await loadTimeEntries();
  } catch (error) {
    message.textContent = 'Erreur lors de la suppression: ' + error.message;
    message.className = 'error-message';
  }
});

cancelBtn.addEventListener('click', closeEditModal);
closeBtn.addEventListener('click', closeEditModal);

window.addEventListener('click', (e) => {
  if (e.target === editModal) {
    closeEditModal();
  }
});

monthSelect.addEventListener('change', initializeMonth);

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = './index.html';
});

initializeMonth();
