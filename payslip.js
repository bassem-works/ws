import { getTimeEntries, calculateHours } from './supabaseClient.js';

const employeeId = localStorage.getItem('employeeId');
const employeeName = localStorage.getItem('employeeName');

if (!employeeId) {
  window.location.href = './index.html';
}

document.getElementById('employeeName').textContent = employeeName;

const monthSelect = document.getElementById('monthSelect');
const baseHourlyRateInput = document.getElementById('baseHourlyRate');
const attendanceBonusInput = document.getElementById('attendanceBonus');
const transportAllowanceInput = document.getElementById('transportAllowance');
const mealAllowanceInput = document.getElementById('mealAllowance');
const cssDeductionInput = document.getElementById('cssDeduction');

const normalHoursPayslip = document.getElementById('normalHoursPayslip');
const overtimeHoursPayslip = document.getElementById('overtimeHoursPayslip');
const sundayHoursPayslip = document.getElementById('sundayHoursPayslip');

const normalPayEl = document.getElementById('normalPay');
const overtimePayEl = document.getElementById('overtimePay');
const sundayPayEl = document.getElementById('sundayPay');

const grossSalaryEl = document.getElementById('grossSalary');
const cnssDeductionEl = document.getElementById('cnssDeduction');
const irppDeductionEl = document.getElementById('irppDeduction');
const totalDeductionsEl = document.getElementById('totalDeductions');
const netSalaryEl = document.getElementById('netSalary');

const logoutBtn = document.getElementById('logoutBtn');
const printBtn = document.getElementById('printBtn');

let currentMonth, currentYear;

const today = new Date();
monthSelect.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

const savedRate = localStorage.getItem('baseHourlyRate');
if (savedRate) {
  baseHourlyRateInput.value = savedRate;
}

function getDayOfWeek(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.getDay();
}

function calculateIRPP(monthlySalary) {
  const CNSS_RATE = 0.0968;
  const taxableSalary = monthlySalary - (monthlySalary * CNSS_RATE);

  const brackets = [
    { limit: 1500, rate: 0 },
    { limit: 3000, rate: 0.2 },
    { limit: 5500, rate: 0.32 },
    { limit: Infinity, rate: 0.42 }
  ];

  let irpp = 0;
  let previousLimit = 0;

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    if (taxableSalary <= previousLimit) break;

    const taxableInBracket = Math.min(taxableSalary, bracket.limit) - previousLimit;
    irpp += taxableInBracket * bracket.rate;
    previousLimit = bracket.limit;
  }

  return irpp;
}

async function calculatePayslip() {
  try {
    const entries = await getTimeEntries(employeeId, currentMonth, currentYear);

    let normalHours = 0;
    let overtimeHours = 0;
    let sundayHours = 0;

    entries.forEach(entry => {
      const dayOfWeek = getDayOfWeek(entry.date);
      const hours = parseFloat(entry.hours_worked);

      if (dayOfWeek === 0) {
        sundayHours += hours;
      } else if (dayOfWeek === 6) {
        overtimeHours += hours;
      } else {
        if (hours <= 8) {
          normalHours += hours;
        } else {
          normalHours += 8;
          overtimeHours += hours - 8;
        }
      }
    });

    const hourlyRate = parseFloat(baseHourlyRateInput.value) || 0;

    const normalPay = normalHours * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * 1.25;
    const sundayPay = sundayHours * hourlyRate * 2.0;

    const attendanceBonus = parseFloat(attendanceBonusInput.value) || 0;
    const transportAllowance = parseFloat(transportAllowanceInput.value) || 0;
    const mealAllowance = parseFloat(mealAllowanceInput.value) || 0;

    const grossSalary = normalPay + overtimePay + sundayPay + attendanceBonus + transportAllowance + mealAllowance;

    const cnssDeduction = grossSalary * 0.0968;
    const irppDeduction = calculateIRPP(grossSalary);
    const cssDeduction = parseFloat(cssDeductionInput.value) || 0;

    const totalDeductions = cnssDeduction + irppDeduction + cssDeduction;
    const netSalary = grossSalary - totalDeductions;

    normalHoursPayslip.textContent = `${normalHours.toFixed(2)} h`;
    overtimeHoursPayslip.textContent = `${overtimeHours.toFixed(2)} h`;
    sundayHoursPayslip.textContent = `${sundayHours.toFixed(2)} h`;

    normalPayEl.textContent = `${normalPay.toFixed(2)} DT`;
    overtimePayEl.textContent = `${overtimePay.toFixed(2)} DT`;
    sundayPayEl.textContent = `${sundayPay.toFixed(2)} DT`;

    grossSalaryEl.textContent = `${grossSalary.toFixed(2)} DT`;
    cnssDeductionEl.textContent = `${cnssDeduction.toFixed(2)} DT`;
    irppDeductionEl.textContent = `${irppDeduction.toFixed(2)} DT`;
    totalDeductionsEl.textContent = `${totalDeductions.toFixed(2)} DT`;
    netSalaryEl.textContent = `${netSalary.toFixed(2)} DT`;

  } catch (error) {
    console.error('Erreur lors du calcul de la fiche de paie:', error);
  }
}

function initializeMonth() {
  const [year, month] = monthSelect.value.split('-');
  currentYear = parseInt(year);
  currentMonth = parseInt(month);
  calculatePayslip();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

printBtn.addEventListener('click', () => {
  window.print();
});

monthSelect.addEventListener('change', initializeMonth);

baseHourlyRateInput.addEventListener('change', () => {
  localStorage.setItem('baseHourlyRate', baseHourlyRateInput.value);
  calculatePayslip();
});

attendanceBonusInput.addEventListener('change', calculatePayslip);
transportAllowanceInput.addEventListener('change', calculatePayslip);
mealAllowanceInput.addEventListener('change', calculatePayslip);
cssDeductionInput.addEventListener('change', calculatePayslip);

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = './index.html';
});

initializeMonth();
