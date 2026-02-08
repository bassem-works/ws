import { loginEmployee } from './supabaseClient.js';

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const matricule = document.getElementById('matricule').value.trim();
  const password = document.getElementById('password').value;

  loginError.textContent = '';

  try {
    const employee = await loginEmployee(matricule, password);

    localStorage.setItem('employeeId', employee.id);
    localStorage.setItem('employeeMatricule', employee.matricule);
    localStorage.setItem('employeeName', `${employee.prenom} ${employee.nom}`);

    window.location.href = './dashboard.html';
  } catch (error) {
    loginError.textContent = error.message;
  }
});
