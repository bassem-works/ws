const employeeId = localStorage.getItem('employeeId');

if (employeeId) {
  window.location.href = './dashboard.html';
} else {
  window.location.href = './index.html';
}
