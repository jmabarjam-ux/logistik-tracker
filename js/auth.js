import { supabase } from './supabase-client.js';

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
}

export async function requireAuth(redirectTo = 'index.html') {
    const session = await getSession();
    if (!session) {
        window.location.href = redirectTo;
        return null;
    }
    return session;
}

export function updateUserEmailDisplay() {
    getUser().then(user => {
        const el = document.getElementById('user-email');
        if (el && user) {
            el.textContent = user.email;
        }
    });
}

export function setupLogout() {
    const btn = document.getElementById('logout-btn');
    if (btn) {
        btn.addEventListener('click', async () => {
            try {
                await signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Gagal logout: ' + error.message);
            }
        });
    }
}