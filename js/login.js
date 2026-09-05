import { signIn } from './auth.js';

const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');

        authMessage.textContent = 'Memproses...';
        authMessage.className = 'form-message';

        try {
            await signIn(email, password);
            window.location.href = 'input.html';
        } catch (error) {
            console.error('Login error:', error);
            authMessage.textContent = 'Gagal login: ' + error.message;
            authMessage.className = 'form-message error';
        }
    });
}
