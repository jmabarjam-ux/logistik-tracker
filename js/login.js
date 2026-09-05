import { signIn } from './auth.js';

const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const loginButton = document.getElementById('login-submit');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('toggle-password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.textContent = isPassword ? 'Sembunyikan' : 'Lihat';
        togglePassword.setAttribute('aria-label', isPassword ? 'Sembunyikan password' : 'Tampilkan password');
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');

        authMessage.textContent = 'Memeriksa akun...';
        authMessage.className = 'form-message';
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Memeriksa...';
        }

        try {
            await signIn(email, password);
            window.location.href = 'input.html';
        } catch (error) {
            console.error('Login error:', error);
            authMessage.textContent = 'Gagal login: ' + error.message;
            authMessage.className = 'form-message error';
        } finally {
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Masuk';
            }
        }
    });
}
