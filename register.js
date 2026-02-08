import { registerEmployee } from './supabaseClient.js';

const registerForm = document.getElementById('registerForm');
const registerError = document.getElementById('registerError');
const registerSuccess = document.getElementById('registerSuccess');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const matricule = document.getElementById('matricule').value.trim();
  const prenom = document.getElementById('prenom').value.trim();
  const nom = document.getElementById('nom').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  registerError.textContent = '';
  registerSuccess.textContent = '';

  if (password !== confirmPassword) {
    registerError.textContent = 'Les mots de passe ne correspondent pas';
    return;
  }

  if (password.length < 4) {
    registerError.textContent = 'Le mot de passe doit contenir au moins 4 caractères';
    return;
  }

  try {
    await registerEmployee(matricule, password, nom, prenom);

    registerSuccess.textContent = 'Compte créé avec succès ! Redirection...';

    setTimeout(() => {
      window.location.href = './index.html';
    }, 2000);
  } catch (error) {
    registerError.textContent = error.message;
  }
});
